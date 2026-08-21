/**
 * pages/api/admin/metrics.ts —— 后台指标聚合端点（role-gated，fail-closed）
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminFromRequest } from "../../../lib/auth";
import { getAdminMetrics } from "../../../lib/metrics";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = getAdminFromRequest(req);
  if (!admin) return res.status(403).json({ error: "需要管理员权限", code: "FORBIDDEN" });
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  const metrics = await getAdminMetrics();
  return res.status(200).json({ ok: true, metrics });
}
