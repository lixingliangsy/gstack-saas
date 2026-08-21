/**
 * lib/feedback.ts —— 用户反馈存储 + 邮件发送（含失败重试与队列）
 *
 * 红线（沿用 AIActRadar）：
 * - 反馈一律先落库（store），绝不因邮件失败而丢失用户反馈。
 * - 邮件发送失败 → 指数退避重试（5s / 30s）→ 仍失败则入队列（.data/feedback-queue.jsonl），后台可重发。
 * - 发送在后台异步进行，不阻塞用户提交响应。
 *
 * nodemailer 兼容性：模块采用动态 require，未安装的项目里仍可构建并降级到队列兜底。
 * 在生产或邮件需要时：npm install nodemailer@^6.9.0
 */
import path from "path";
import fs from "fs";
import { getStore, uid, type Entity } from "./store";
import { FEEDBACK_CATEGORIES } from "./feedback-constants";

export { FEEDBACK_CATEGORIES };
export type FeedbackStatus = "received" | "emailed" | "queued" | "failed";

export interface Feedback extends Entity {
  id: string;
  category: string;
  body: string;
  email?: string;
  attachmentName?: string;
  attachmentPath?: string;
  status: FeedbackStatus;
  attempts: number;
  createdAt?: string;
  updatedAt?: string;
}

const COLL = "feedback";
const UPLOAD_DIR = path.join(process.cwd(), ".data/uploads");
const QUEUE = path.join(process.cwd(), ".data/feedback-queue.jsonl");

export function validCategory(c: string): boolean {
  return FEEDBACK_CATEGORIES.includes(c);
}

export function submitFeedback(input: {
  category: string;
  body: string;
  email?: string;
  attachment?: { name: string; data: string };
}): Feedback {
  const category = validCategory(input.category) ? input.category : "其他";
  const body = String(input.body || "").trim();
  if (body.length < 5) throw new Error("BODY_TOO_SHORT");
  if (body.length > 5000) throw new Error("BODY_TOO_LONG");

  const fb: Feedback = {
    id: uid("fb"),
    category,
    body,
    email: input.email || undefined,
    status: "received",
    attempts: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  if (input.attachment && input.attachment.name && input.attachment.data) {
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      const safe = input.attachment.name.replace(/[^\w.\-]/g, "_").slice(0, 80);
      const rel = `${fb.id}_${safe}`;
      fs.writeFileSync(path.join(UPLOAD_DIR, rel), Buffer.from(input.attachment.data, "base64"));
      fb.attachmentName = input.attachment.name;
      fb.attachmentPath = rel;
    } catch (e) {
      console.warn("[feedback] attachment save failed (non-fatal):", (e as any)?.message);
    }
  }

  getStore().insert<Feedback>(COLL, fb);
  return fb;
}

export async function listFeedback(): Promise<Feedback[]> {
  const all = await getStore().list<Feedback>(COLL);
  return all.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
}

export async function setStatus(id: string, status: FeedbackStatus): Promise<void> {
  await getStore().update<Feedback>(COLL, id, { status, updatedAt: new Date().toISOString() });
}

// --- 邮件发送（server-only，懒加载 nodemailer） ---
type Transporter = { sendMail: (opts: any) => Promise<any> };
let _nm: any = null;
function loadNodemailer(): any {
  if (_nm !== null) return _nm;
  try {
    _nm = require("nodemailer");
  } catch {
    _nm = false;
  }
  return _nm;
}

let _transporter: Transporter | null = null;
function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;
  const nm = loadNodemailer();
  if (!nm) return null;
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  _transporter = nm.createTransport({
    host,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "1",
    auth: { user, pass },
  });
  return _transporter;
}

export interface SendEmailOptions {
  to?: string;
  subjectPrefix?: string;
}

export async function sendFeedbackEmail(fb: Feedback, opts: SendEmailOptions = {}): Promise<void> {
  const t = getTransporter();
  if (!t) throw new Error("SMTP_NOT_CONFIGURED");
  const to = opts.to || process.env.FEEDBACK_TO_EMAIL || "lixingliangsy@163.com";
  const prefix = opts.subjectPrefix || "[反馈]";
  await t.sendMail({
    from: process.env.SMTP_FROM || to,
    to,
    subject: `${prefix} ${fb.category}`,
    text: `分类: ${fb.category}\n来自: ${fb.email || "(匿名)"}\n附件: ${fb.attachmentName || "无"}\n\n${fb.body}`,
  });
}

const BACKOFF = [0, 5000, 30000];

export async function dispatchEmail(fb: Feedback, opts: SendEmailOptions = {}): Promise<void> {
  for (let attempt = 1; attempt <= 3; attempt++) {
    if (attempt > 1) await new Promise((r) => setTimeout(r, BACKOFF[attempt - 1] || 30000));
    try {
      await sendFeedbackEmail(fb, opts);
      await setStatus(fb.id, "emailed");
      return;
    } catch (e: any) {
      console.warn(`[feedback] send attempt ${attempt} failed:`, e?.message);
      if (attempt === 3) {
        await setStatus(fb.id, "queued");
        enqueue(fb);
      }
    }
  }
}

function enqueue(fb: Feedback) {
  try {
    fs.mkdirSync(path.dirname(QUEUE), { recursive: true });
    fs.appendFileSync(QUEUE, JSON.stringify({ id: fb.id, category: fb.category, ts: Date.now() }) + "\n");
  } catch (e) {
    console.error("[feedback] queue write failed", e);
  }
}
