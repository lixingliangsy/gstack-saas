import type { NextApiRequest, NextApiResponse } from "next";
import { getUserFromRequest } from "../../../lib/auth";
import { getUserById, toPublic } from "../../../lib/users";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const session = getUserFromRequest(req);
  if (!session) return res.status(401).json({ error: "未登录", code: "NO_SESSION" });
  const user = await getUserById(session.sub);
  if (!user) return res.status(401).json({ error: "用户不存在", code: "NO_USER" });
  return res.status(200).json({ ok: true, user: toPublic(user) });
}
