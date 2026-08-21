/**
 * pages/api/admin/users.ts —— 用户列表 / 搜索端点（role-gated，fail-closed）
 * 仅返回公开字段（id/email/plan/role），不含密码哈希。
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminFromRequest } from "../../../lib/auth";
import { getStore } from "../../../lib/store";
import type { User } from "../../../lib/users";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = getAdminFromRequest(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限", code: "FORBIDDEN" });
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const q = (typeof req.query.q === "string" ? req.query.q : "").trim().toLowerCase();
  const all = await getStore().list<User>("users");
  const filtered = all
    .filter((u) => !q || u.email.toLowerCase().includes(q))
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .map((u) => ({ id: u.id, email: u.email, plan: u.plan, role: u.role, createdAt: u.createdAt }));

  return res.status(200).json({ ok: true, users: filtered });
}
