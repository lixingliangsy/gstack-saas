/**
 * lib/runs.ts —— 管线运行态持久化（复用 M2 抽象，走 lib/store.ts）
 * dev: JSON 文件；prod: CloudBase。绝不依赖 Vercel /tmp。
 */
import { getStore } from "./store";
import type { RunState } from "./pipeline";

const COLL = "runs";

export async function saveRun(state: RunState): Promise<RunState> {
  await getStore().insert(COLL, { ...state });
  return state;
}

export async function loadRun(runId: string): Promise<RunState | null> {
  return getStore().findBy<RunState>(COLL, (r) => r.runId === runId);
}
