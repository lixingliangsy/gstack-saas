/**
 * lib/agent/memory.ts —— 会话上下文记忆（按会话 ID 存 store，带 TTL）
 *
 * 设计（沿用 AIActRadar 工程红线）：
 * - 持久层抽象走 lib/store（dev=JSON 文件，prod=CloudBase），不在 Vercel /tmp 长期依赖。
 * - 每条会话有 lastActive；超过 TTL（默认 30 分钟）视为过期，载入时清空历史（不编造旧上下文）。
 * - 非致命：store 异常时降级为内存空会话，不阻断对话主流程。
 */

import { getStore, type Entity } from "../store";

const COLL = "chat_mem";
const TTL_MS = 30 * 60 * 1000; // 30 分钟

export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
  at: string;
}

export interface ChatSession extends Entity {
  id: string;
  turns: ChatTurn[];
  createdAt: string;
  lastActive: string;
}

function emptySession(id: string): ChatSession {
  const now = new Date().toISOString();
  return { id, turns: [], createdAt: now, lastActive: now };
}

async function load(id: string): Promise<ChatSession> {
  try {
    const s = await getStore().get<ChatSession>(COLL, id);
    if (!s) return emptySession(id);
    // TTL 过期 → 视为新会话（不清库，仅本次返回空历史）
    if (Date.now() - new Date(s.lastActive).getTime() > TTL_MS) {
      const fresh = emptySession(id);
      fresh.createdAt = s.createdAt;
      return fresh;
    }
    return s;
  } catch {
    return emptySession(id);
  }
}

async function save(s: ChatSession): Promise<void> {
  try {
    s.lastActive = new Date().toISOString();
    const existing = await getStore().get<ChatSession>(COLL, s.id);
    if (existing) await getStore().update<ChatSession>(COLL, s.id, { turns: s.turns, lastActive: s.lastActive });
    else await getStore().insert<ChatSession>(COLL, s);
  } catch (e) {
    console.warn("[agent:memory] save failed (non-fatal):", (e as any)?.message);
  }
}

/** 取最近 n 条（用于构造 LLM 上下文）。 */
export async function getRecent(id: string, n = 6): Promise<ChatTurn[]> {
  const s = await load(id);
  return s.turns.slice(-n);
}

export async function appendTurn(id: string, role: ChatTurn["role"], text: string): Promise<void> {
  const s = await load(id);
  s.turns.push({ role, text, at: new Date().toISOString() });
  // 防止无限增长：仅保留最近 20 轮
  if (s.turns.length > 20) s.turns = s.turns.slice(-20);
  await save(s);
}

/** 清理过期会话（后台可定时调用；非阻塞）。 */
export async function pruneStaleSessions(): Promise<number> {
  try {
    const all = await getStore().list<ChatSession>(COLL);
    let removed = 0;
    for (const s of all) {
      if (Date.now() - new Date(s.lastActive).getTime() > TTL_MS) {
        await getStore().remove(COLL, s.id);
        removed++;
      }
    }
    return removed;
  } catch {
    return 0;
  }
}
