import type { NextApiRequest, NextApiResponse } from "next";
import { authenticate, toPublic } from "../../../lib/users";
import { signToken, AUTH_COOKIE, AUTH_COOKIE_OPTS } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "邮箱与密码必填", code: "MISSING_FIELDS" });
  const user = await authenticate(email, password);
  if (!user) return res.status(401).json({ error: "邮箱或密码错误", code: "BAD_CREDENTIALS" });
  const token = signToken({ sub: user.id, email: user.email, role: user.role });
  res.setHeader("Set-Cookie", `${AUTH_COOKIE}=${token}; Path=${AUTH_COOKIE_OPTS.path}; Max-Age=${AUTH_COOKIE_OPTS.maxAge}; HttpOnly; SameSite=${AUTH_COOKIE_OPTS.sameSite}${AUTH_COOKIE_OPTS.secure ? "; Secure" : ""}`);
  return res.status(200).json({ ok: true, user: toPublic(user) });
}
