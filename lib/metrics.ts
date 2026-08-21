/**
 * lib/metrics.ts —— 后台指标聚合（server-only，经 lib/store 读取各集合）
 *
 * 仅统计计数与分布，不暴露用户明文密码等敏感字段。
 * 失败时降级为空结构（非主流程阻断），由调用方决定如何展示。
 */

import { getStore } from "./store";
import type { User } from "./users";
import type { Feedback } from "./feedback";
import type { SubscriptionRecord } from "./subscriptions";
import type { ChatSession } from "./agent/memory";

function countBy<T>(items: T[], key: (x: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const it of items) {
    const k = key(it);
    out[k] = (out[k] || 0) + 1;
  }
  return out;
}

export interface AdminMetrics {
  users: { total: number; byPlan: Record<string, number>; byRole: Record<string, number> };
  subscriptions: { total: number; byPlan: Record<string, number> };
  feedback: { total: number; byCategory: Record<string, number>; byStatus: Record<string, number> };
  runs: { total: number };
  chats: { sessions: number; turns: number };
}

export async function getAdminMetrics(): Promise<AdminMetrics> {
  try {
    const [users, subs, fbs, runs, chats] = await Promise.all([
      getStore().list<User>("users"),
      getStore().list<SubscriptionRecord>("subscriptions"),
      getStore().list<Feedback>("feedback"),
      getStore().list<any>("runs"),
      getStore().list<ChatSession>("chat_mem"),
    ]);
    const turns = chats.reduce((n, c) => n + (c.turns?.length || 0), 0);
    return {
      users: {
        total: users.length,
        byPlan: countBy(users, (u) => u.plan || "free"),
        byRole: countBy(users, (u) => u.role || "user"),
      },
      subscriptions: {
        total: subs.length,
        byPlan: countBy(subs, (s) => s.plan || "unknown"),
      },
      feedback: {
        total: fbs.length,
        byCategory: countBy(fbs, (f) => f.category || "其他"),
        byStatus: countBy(fbs, (f) => f.status || "received"),
      },
      runs: { total: runs.length },
      chats: { sessions: chats.length, turns },
    };
  } catch (e) {
    console.warn("[metrics] aggregation failed (non-fatal):", (e as any)?.message);
    return {
      users: { total: 0, byPlan: {}, byRole: {} },
      subscriptions: { total: 0, byPlan: {} },
      feedback: { total: 0, byCategory: {}, byStatus: {} },
      runs: { total: 0 },
      chats: { sessions: 0, turns: 0 },
    };
  }
}
