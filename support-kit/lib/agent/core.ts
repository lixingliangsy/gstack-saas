/**
 * lib/agent/core.ts —— AI 客服智能体核心（借鉴 AIActRadar M7 五步 + G1–G5）
 *
 * 五步：检索(retrieve) → 记忆(memory) → 生成(generate) → 护栏(guardrails) → 升级/答复(report)
 *
 * 红线（沿用 AIActRadar M11）：
 * - 绝不静默 mock：无 LLM 密钥时走「kb-only」诚实模式（仅返回知识库命中，明确标注），
 *   不假装是 AI 生成；KB 也无命中则直接转人工，不编造。
 * - 应答须引用 KB 出处；合规类附「仅供参考」声明。
 * - 无法解答 / 用户要求 → 转人工，并复用 Phase 4 反馈邮件逻辑通知团队。
 * - server-only：本模块（含 nodemailer）绝不 import 到客户端。
 */

import { retrieve, isComplianceRelated, type KbEntry } from "./kb";
import { applyGuardrails, detectUserEscalation } from "./guardrails";
import { getRecent, appendTurn } from "./memory";
import { submitFeedback, dispatchEmail } from "../feedback";
import { SUPPORT } from "../support.config";
import type { SupportConfig } from "../support-kit/types";

export interface AgentTurnInput {
  sessionId: string;
  message: string;
  email?: string;
  /** 企业 BYOK 可选；缺省用服务端 OPENAI_API_KEY */
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  /** 产品级配置（productName / kb / feedbackEmail 等）；缺省用 GStack 实例 */
  config?: SupportConfig;
}

export interface AgentCitation {
  id: string;
  title: string;
  source: string;
}

export interface AgentTurnResult {
  sessionId: string;
  answer: string;
  citations: AgentCitation[];
  escalated: boolean;
  note?: string;
  mode: "llm" | "kb-only" | "escalated";
}

function buildSystemPrompt(productName: string): string {
  return (
    `你是 ${productName} 的官方 AI 客服助手，服务对象是独立开发者与出海团队。\n` +
    "你的职责：基于下方【知识库】回答关于产品、功能、定价、支付、账户、合规扫描的常见问题。\n" +
    "硬性规则：\n" +
    "1. 只依据知识库内容作答，引用时用【来源: <source>】标注；禁止编造产品功能、价格或政策。\n" +
    "2. 合规（GDPR/VAT/消费者保护/应用商店/支付监管）类答复必须说明「仅供参考，不构成法律或专业意见」。\n" +
    "3. 无法在知识库中找到可靠依据、或用户明确要求人工时，直接说你会转接人工，并请对方留邮箱。\n" +
    "4. 简洁、专业、用中文（与用户语言一致）。不要索要或重置用户密码。"
  );
}

function buildContext(entries: KbEntry[]): string {
  if (!entries.length) return "(无相关知识库条目)";
  return entries
    .map((e, i) => `【${i + 1}】${e.title}（来源: ${e.source}）\n${e.body}`)
    .join("\n\n");
}

function toCitations(entries: KbEntry[]): AgentCitation[] {
  return entries.map((e) => ({ id: e.id, title: e.title, source: e.source }));
}

async function callSupportLLM(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { apiKey?: string; baseUrl?: string; model?: string }
): Promise<string | null> {
  const key = opts.apiKey || process.env.OPENAI_API_KEY;
  const base = (opts.baseUrl || process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
  const model = opts.model || process.env.OPENAI_MODEL || "meta/llama-3.1-8b-instruct";
  if (!key) return null; // 无密钥 → 交由 kb-only 模式，绝不静默 mock

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 900,
    }),
  });
  if (!res.ok) return null;
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  return text ? String(text) : null;
}

const ESCALATION_ANSWER =
  "这个问题我暂时无法独立解答，已为你转接人工。我们的团队会尽快通过邮件与你联系——如果方便，请留下你的邮箱以便跟进。你也可以直接在反馈页（/feedback）提交详细诉求。";

/**
 * 执行一轮客服对话。返回结构化结果；转人工时异步发邮件（best-effort，不阻断响应）。
 */
export async function runAgentTurn(input: AgentTurnInput): Promise<AgentTurnResult> {
  const cfg: SupportConfig = input.config ?? SUPPORT;
  const sessionId = input.sessionId;
  const message = String(input.message || "").trim();

  // STEP 1 — 检索（使用 cfg.kb，支持多产品）
  const { entries, topScore } = retrieve(message, 4, cfg.kb);
  const citations = toCitations(entries);
  const complianceRelated = isComplianceRelated(entries);

  // STEP 2 — 记忆（最近上下文）
  const history = await getRecent(sessionId, 6);
  const historyText = history
    .map((t) => `${t.role === "user" ? "用户" : "助手"}: ${t.text}`)
    .join("\n");

  // STEP 3 — 生成
  let answer = "";
  let mode: AgentTurnResult["mode"] = "llm";
  const ctxText = buildContext(entries);

  const userContent =
    (historyText ? `对话历史:\n${historyText}\n\n` : "") +
    `用户当前问题: ${message}\n\n知识库（请仅依据这些作答并标注来源）:\n${ctxText}`;

  const llmText = await callSupportLLM(
    [
      { role: "system", content: buildSystemPrompt(cfg.productName) },
      { role: "user", content: userContent },
    ],
    { apiKey: input.apiKey, baseUrl: input.baseUrl, model: input.model }
  );

  if (llmText && llmText.trim()) {
    answer = llmText.trim();
    mode = "llm";
  } else if (entries.length) {
    // kb-only 诚实模式：直接返回命中条目的正文，明确标注
    answer = `${entries[0].body}\n\n（以上来自知识库自动回复：${entries[0].source}）`;
    mode = "kb-only";
  } else {
    // 无 LLM 且无 KB 命中 → 直接转人工，不编造
    answer = ESCALATION_ANSWER;
    mode = "escalated";
  }

  // STEP 4 — 护栏
  const gr = applyGuardrails({
    citations: entries,
    topScore,
    userMessage: message,
    answer,
    complianceRelated,
  });

  let escalated = gr.escalate || mode === "escalated";
  if (escalated && mode !== "escalated") {
    answer = ESCALATION_ANSWER;
    mode = "escalated";
  }

  // 合规声明（H3）
  if (gr.note && !answer.includes("仅供参考")) {
    answer = `${answer}\n\n${gr.note}`;
  }

  // STEP 5 — 记忆写入 + 升级邮件
  await appendTurn(sessionId, "user", message);
  await appendTurn(sessionId, "assistant", answer);

  if (escalated) {
    // 复用 Phase 4 反馈邮件逻辑（best-effort，非阻塞主响应）
    try {
      const fb = submitFeedback({
        category: "其他",
        body:
          `【${cfg.productName} · AI 客服自动转人工】\n` +
          `会话ID: ${sessionId}\n用户邮箱: ${input.email || "(未提供)"}\n` +
          `回执邮箱: ${cfg.feedbackEmail}\n` +
          `用户问题: ${message}\n合规相关: ${complianceRelated ? "是" : "否"}\n护栏标记: ${gr.violations.join(", ") || "无"}`,
        email: input.email,
      });
      void dispatchEmail(fb, {
        to: cfg.feedbackEmail,
        subjectPrefix: `[${cfg.productName} 反馈]`,
      }).catch(() => {});
    } catch (e) {
      console.warn("[agent:core] escalation email failed (non-fatal):", (e as any)?.message);
    }
  }

  return {
    sessionId,
    answer,
    citations,
    escalated,
    note: gr.note || undefined,
    mode,
  };
}

export { detectUserEscalation };
