/**
 * lib/subscriptions.ts —— 订阅权益解析（复用 M3 思路）
 * webhook 落订阅事件 → 按邮箱匹配用户 → 升级套餐（仅升不降）。
 */
import { getStore, uid, type Entity } from "./store";
import { findByEmail, setPlan } from "./users";
import { PRODUCT } from "./product";
import type { Plan } from "./aiGateway";

export interface SubscriptionRecord extends Entity {
  id: string;
  email?: string;
  productId?: string;
  plan: Plan;
  eventId?: string;
  ts: string;
}

const COLL = "subscriptions";
const ORDER: Plan[] = ["free", "pro", "enterprise"];

/** 将 Waffo productId 映射回我们的套餐档位 */
export function planFromProductId(productId?: string): Plan | null {
  if (!productId) return null;
  for (const t of PRODUCT.pricing) {
    if (t.waffoProductId?.monthly === productId || t.waffoProductId?.yearly === productId) return t.id;
  }
  return null;
}

/** 尽量将购买事件应用到对应用户（best-effort，非主流程阻断） */
export async function applyPurchaseToUser(
  email: string | undefined,
  productId: string | undefined
): Promise<{ ok: boolean; reason?: string }> {
  const plan = planFromProductId(productId);
  if (!plan) return { ok: false, reason: "unknown_product" };
  if (!email) return { ok: false, reason: "no_email" };
  const u = await findByEmail(email);
  if (!u) return { ok: false, reason: "no_user" };
  // 仅升级，绝不因 webhook 降级
  if (ORDER.indexOf(plan) <= ORDER.indexOf(u.plan)) return { ok: true, reason: "no_change" };
  await setPlan(u.id, plan);
  await getStore().insert<SubscriptionRecord>(COLL, {
    id: uid("sub"),
    email,
    productId,
    plan,
    ts: new Date().toISOString(),
  });
  return { ok: true, reason: "upgraded" };
}
