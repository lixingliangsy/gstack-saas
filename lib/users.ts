/**
 * lib/users.ts —— 用户 CRUD（经 lib/store.ts 持久化，dev=JSON / prod=CloudBase）
 * 密码以 bcrypt 哈希存储，绝不落明文。
 */
import { getStore, uid, type Entity } from "./store";
import { hashPassword, verifyPassword, isAdminEmail } from "./auth";
import type { Plan } from "./aiGateway";

export interface User extends Entity {
  id: string;
  email: string;
  pwHash: string;
  plan: Plan;
  role: "user" | "admin";
  createdAt?: string;
  updatedAt?: string;
}

const COLL = "users";

function normalizeEmail(email: string): string {
  return String(email || "").trim().toLowerCase();
}

export async function findByEmail(email: string): Promise<User | null> {
  const e = normalizeEmail(email);
  return getStore().findBy<User>(COLL, (u) => u.email === e);
}

export async function getUserById(id: string): Promise<User | null> {
  return getStore().get<User>(COLL, id);
}

export async function createUser(email: string, password: string): Promise<User> {
  const e = normalizeEmail(email);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new Error("INVALID_EMAIL");
  if (String(password || "").length < 8) throw new Error("WEAK_PASSWORD");
  const existing = await findByEmail(e);
  if (existing) throw new Error("EMAIL_TAKEN");
  const role: "user" | "admin" = isAdminEmail(e) ? "admin" : "user";
  const user: User = {
    id: uid("usr"),
    email: e,
    pwHash: hashPassword(password),
    plan: "free",
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return getStore().insert<User>(COLL, user);
}

export async function authenticate(email: string, password: string): Promise<User | null> {
  const u = await findByEmail(email);
  if (!u) return null;
  if (!verifyPassword(password, u.pwHash)) return null;
  return u;
}

export async function setPlan(id: string, plan: Plan): Promise<User | null> {
  return getStore().update<User>(COLL, id, { plan });
}

export interface PublicUser {
  id: string;
  email: string;
  plan: Plan;
  role: "user" | "admin";
}

export function toPublic(u: User): PublicUser {
  return { id: u.id, email: u.email, plan: u.plan, role: u.role };
}
