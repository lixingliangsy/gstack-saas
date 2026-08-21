import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "../../lib/auth";
import { getUserById } from "../../lib/users";
import { setByokKey, clearByokKey } from "../../lib/byok";
import { PRODUCT } from "../../lib/product";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "未登录", code: "NO_SESSION" });
  const user = await getUserById(session.sub);
  if (!user) return res.status(401).json({ error: "用户不存在", code: "NO_USER" });
  // BYOK 仅 Enterprise 可用
  if (user.plan !== "enterprise") return res.status(403).json({ error: "BYOK 仅 Enterprise 套餐可用", code: "PLAN_REQUIRED" });

  const slug = String(PRODUCT.slug || "gstack");

  if (req.method === "POST") {
    const { apiKey, baseUrl, model } = req.body || {};
    if (!apiKey || String(apiKey).length < 8) return res.status(400).json({ error: "API Key 无效", code: "BAD_KEY" });
    await setByokKey(slug, user.id, String(apiKey), { baseUrl, model });
    return res.status(200).json({ ok: true, message: "BYOK 已保存（服务端，不落客户端）" });
  }
  if (req.method === "DELETE") {
    await clearByokKey(slug, user.id);
    return res.status(200).json({ ok: true, message: "BYOK 已清除" });
  }
  return res.status(405).json({ error: "Method not allowed" });
}
