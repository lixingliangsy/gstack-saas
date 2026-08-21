/**
 * chat.ts 模板 —— 几乎无须改动：仅在 catch 里把日志前缀换成产品名。
 * SUPPORT 在 support.config.ts 中定义。
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { randomUUID } from "crypto";
import { runAgentTurn } from "../../lib/agent/core";
import { SUPPORT } from "../../lib/support.config";

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

  try {
    const result = await runAgentTurn({
      sessionId,
      message,
      email,
      config: SUPPORT,
    });
    return res.status(200).json(result);
  } catch (e: any) {
    console.error(`[${SUPPORT.productSlug}:chat] runAgentTurn failed:`, e?.message);
    return res.status(500).json({ error: "Chat service error", code: "CHAT_ERROR" });
  }
}
