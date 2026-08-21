/**
 * lib/auditLog.ts —— 轻量审计日志（M8 不可变审计链 的 Phase 1 版）
 *
 * 设计：每条记录 append-only，写入 store 的 `audit` 集合。
 * Phase 7 将在此之上叠加 SHA256 链式哈希（prevHash→hash 可验证篡改）。
 * 非主流程：写入失败仅 warn，不阻断业务。
 */
import { getStore, uid } from "./store";

export type AuditEvent = {
  id?: string;
  ts: string;
  product?: string;
  runId?: string;
  step?: string;
  event: string;
  model?: string;
  detail?: string;
  quota?: { plan?: string; daily?: number; monthly?: number };
};

export async function appendAudit(product: string, ev: Omit<AuditEvent, "id" | "ts" | "product">): Promise<void> {
  try {
    await getStore().insert("audit", {
      id: uid("aud"),
      ts: new Date().toISOString(),
      product,
      ...ev,
    });
  } catch (e: any) {
    console.warn("[auditLog] append failed (non-fatal):", e?.message);
  }
}
