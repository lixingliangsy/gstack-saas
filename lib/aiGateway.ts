/**
 * lib/aiGateway.ts —— LLM 网关 + 公平配额 + 服务端可信 plan（AIActRadar M3 复用）
 *
 * 红线（沿用 AIActRadar）：
 * - plan 绝不取自客户端 body/headers（除 HMAC 签名 x-ai-entitlement）。
 * - 无密钥 → 显式 503 AI_NOT_CONFIGURED，绝不静默 mock。
 * - 配额超限 → 显式 429 QUOTA_EXCEEDED。
 * - server-only：本模块绝不 import 到客户端。
 */

import crypto from "crypto";

export type Plan = "free" | "pro" | "enterprise";

export const AI_QUOTAS: Record<Plan, { daily: number; monthly: number; maxTokens: number }> = {
  free: { daily: 10, monthly: 50, maxTokens: 4000 },
  pro: { daily: 40, monthly: 300, maxTokens: 16000 },
  enterprise: { daily: 200, monthly: 3000, maxTokens: 64000 },
};

const ENTITLEMENT_SECRET = process.env.AI_ENTITLEMENT_SECRET || "";

/**
 * 解析 plan：只信服务端 env 覆盖 或 HMAC 签名；绝不读 body.plan。默认 free。
 */
export function resolvePlan(req: { headers: Record<string, string | string[] | undefined> }): Plan {
  const override = (process.env.AI_PLAN_OVERRIDE || "").toLowerCase();
  if (override === "free" || override === "pro" || override === "enterprise") return override;

  const sig = req.headers["x-ai-entitlement"];
  const sigStr = Array.isArray(sig) ? sig[0] : sig;
  if (sigStr && ENTITLEMENT_SECRET) {
    // 签名格式：<plan>.<expiry>.<hmac>，用 timingSafeEqual 防时序攻击
    const parts = sigStr.split(".");
    if (parts.length === 3) {
      const [plan, expiry, hmac] = parts;
      const expected = crypto
        .createHmac("sha256", ENTITLEMENT_SECRET)
        .update(`${plan}.${expiry}`)
        .digest("hex");
      const a = Buffer.from(hmac);
      const b = Buffer.from(expected);
      if (a.length === b.length && crypto.timingSafeEqual(a, b) && Number(expiry) > Date.now()) {
        if (plan === "free" || plan === "pro" || plan === "enterprise") return plan;
      }
    }
  }
  return "free";
}

// 简单内存配额计数（Vercel 上易失；Phase 7 改用 store 持久化）。
interface QuotaRec { day: string; month: string; daily: number; monthly: number; }
const quotaStore = new Map<string, QuotaRec>();

function todayKey(): { day: string; month: string } {
  const d = new Date();
  return { day: d.toISOString().slice(0, 10), month: d.toISOString().slice(0, 7) };
}

export function checkQuota(key: string, plan: Plan): { ok: true } | { ok: false; code: string } {
  const { day, month } = todayKey();
  const q = quotaStore.get(key) || { day, month, daily: 0, monthly: 0 };
  if (q.day !== day) { q.day = day; q.daily = 0; }
  if (q.month !== month) { q.month = month; q.monthly = 0; }
  const lim = AI_QUOTAS[plan];
  if (q.daily >= lim.daily) return { ok: false, code: "QUOTA_EXCEEDED" };
  if (q.monthly >= lim.monthly) return { ok: false, code: "QUOTA_EXCEEDED" };
  q.daily += 1; q.monthly += 1;
  quotaStore.set(key, q);
  return { ok: true };
}

export class AIError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * 调用 OpenAI 兼容端点（默认 NVIDIA NIM）。无密钥显式抛错，绝不静默降级。
 */
export async function callLLM(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  opts: { maxTokens?: number; temperature?: number } = {}
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  const baseUrl = (process.env.OPENAI_BASE_URL || "https://integrate.api.nvidia.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL || "meta/llama-3.1-8b-instruct";
  if (!apiKey) throw new AIError("AI_NOT_CONFIGURED", "AI 网关未配置（缺少 OPENAI_API_KEY）。", 503);

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: opts.maxTokens ?? 1500,
      temperature: opts.temperature ?? 0.2,
    }),
  });
  if (!res.ok) throw new AIError("AI_UPSTREAM_ERROR", `LLM 上游返回 ${res.status}`, 502);
  const json = await res.json();
  const text = json?.choices?.[0]?.message?.content;
  if (!text) throw new AIError("AI_EMPTY_RESPONSE", "LLM 返回为空。", 502);
  return text as string;
}
