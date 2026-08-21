import type { NextApiRequest, NextApiResponse } from "next";
import { createUser, toPublic } from "../../../lib/users";
import { signToken, AUTH_COOKIE, AUTH_COOKIE_OPTS } from "../../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "邮箱与密码必填", code: "MISSING_FIELDS" });
    const user = await createUser(email, password);
    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    res.setHeader("Set-Cookie", `${AUTH_COOKIE}=${token}; Path=${AUTH_COOKIE_OPTS.path}; Max-Age=${AUTH_COOKIE_OPTS.maxAge}; HttpOnly; SameSite=${AUTH_COOKIE_OPTS.sameSite}${AUTH_COOKIE_OPTS.secure ? "; Secure" : ""}`);
    return res.status(201).json({ ok: true, user: toPublic(user) });
  } catch (e: any) {
    const map: Record<string, [number, string]> = {
      INVALID_EMAIL: [400, "邮箱格式不正确"],
      WEAK_PASSWORD: [400, "密码至少 8 位"],
      EMAIL_TAKEN: [409, "该邮箱已注册"],
    };
    const [status, message] = map[e?.message] || [500, "注册失败"];
    return res.status(status).json({ error: message, code: e?.message });
  }
}
