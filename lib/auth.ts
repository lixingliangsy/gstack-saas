/**
 * lib/auth.ts —— 轻量自研鉴权（server-only）
 * bcrypt 密码哈希 + JWT 会话 Cookie。密钥仅服务端、gitignore。
 * 绝不 import 到客户端组件。
 */
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { NextApiRequest } from "next";

const JWT_SECRET = process.env.JWT_SECRET || "dev-insecure-secret-change-me";
const COOKIE = "gstack_token";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const AUTH_COOKIE = COOKIE;
export const AUTH_COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 30 * 24 * 3600,
  secure: process.env.NODE_ENV === "production",
};

export interface SessionPayload {
  sub: string;
  email: string;
  role: "user" | "admin";
}

export function hashPassword(pw: string): string {
  return bcrypt.hashSync(pw, 10);
}

export function verifyPassword(pw: string, hash: string): boolean {
  try {
    return bcrypt.compareSync(pw, hash);
  } catch {
    return false;
  }
}

export function signToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const d = jwt.verify(token, JWT_SECRET) as SessionPayload;
    if (d && d.sub && d.email) return d;
    return null;
  } catch {
    return null;
  }
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes((email || "").toLowerCase());
}

export function getUserFromRequest(req: NextApiRequest): SessionPayload | null {
  const cookieTok = req.cookies?.[COOKIE];
  const headerTok = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const token = cookieTok || headerTok;
  if (!token) return null;
  return verifyToken(token);
}

/** 仅管理员可过；否则返回 null（用于后台路由的 fail-closed 鉴权）。 */
export function getAdminFromRequest(req: NextApiRequest): SessionPayload | null {
  const s = getUserFromRequest(req);
  if (!s || s.role !== "admin") return null;
  return s;
}
