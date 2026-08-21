/**
 * pages/api/chat.ts —— AI 客服对话端点
 *
 * POST { sessionId?, message, email? }
 * 返回 { sessionId, answer, citations, escalated, note, mode }
 *
 * 工程红线（沿用 AIActRadar M3/M11）：
 * - 配额只信服务端 resolvePlan + checkQuota（key=sessionId），绝不读 body.plan。
 * - 无 LLM 密钥 → 走 kb-only 诚实模式（lib/agent/core 内部处理），绝不静默 mock。
 * - 结构化错误：400 BAD_REQUEST / 429 QUOTA_EXCEEDED / 500。
 * - 升级（转人工）由 core 内部复用 Phase 4 反馈邮件逻辑异步通知。
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { resolvePlan, checkQuota } from "@/lib/aiGateway";
import { getUserFromRequest } from "@/lib/auth";
import { runAgentTurn } from "@/lib/agent/core";
import { SUPPORT } from "@/lib/support.config";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed", code: "METHOD_NOT_ALLOWED" });
  }

  const body = req.body || {};
  const message = typeof body.message === "string" ? body.message.trim() : "";
  let sessionId = typeof body.sessionId === "string" && body.sessionId ? body.sessionId : randomUUID();
  const email = typeof body.email === "string" ? body.email.trim() : undefined;

  if (!message) {
    return res.status(400).json({ error: "Missing 'message'", code: "BAD_REQUEST" });
  }

  // 信任边界：plan 只信服务端解析（来自 env 覆盖或 HMAC 签名）
  const plan = resolvePlan(req);
  const quotaKey = sessionId;
  const q = checkQuota(quotaKey, plan);
  if (!q.ok) {
    return res.status(429).json({ error: "Quota exceeded", code: "QUOTA_EXCEEDED" });
  }

  // 登录用户优先用其邮箱作为升级联系；其 plan 已在 resolvePlan 之外单独透传
  const sess = getUserFromRequest(req);
  const contactEmail = email || sess?.email;

  try {
    const result = await runAgentTurn({
      sessionId,
      message,
      email: contactEmail,
      config: SUPPORT,
      // 企业 BYOK：如需可在此从 lib/byok 读取并传入 apiKey
    });
    return res.status(200).json(result);
  } catch (e: any) {
    console.error("[chat] runAgentTurn failed:", e?.message);
    return res.status(500).json({ error: "Chat service error", code: "CHAT_ERROR" });
  }
}
