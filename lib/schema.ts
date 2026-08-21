/**
 * lib/schema.ts —— 轻量结构化校验（收敛 AIActRadar 散弹 cast）
 * 仅做软校验，失败返回 { ok:false }，不抛异常阻断主流程。
 */
export interface AnalyzePayload {
  findings: Array<{
    title: string;
    severity: "low" | "medium" | "high";
    evidence?: string;
    remediation?: string;
    source?: string;
  }>;
  summary: string;
}

export function validateAnalyzePayload(p: unknown): { ok: true; data: AnalyzePayload } | { ok: false; error: string } {
  if (!p || typeof p !== "object") return { ok: false, error: "payload must be object" };
  const obj = p as Record<string, unknown>;
  const findings = obj.findings;
  if (!Array.isArray(findings)) return { ok: false, error: "findings must be array" };
  if (typeof obj.summary !== "string") return { ok: false, error: "summary must be string" };
  for (const f of findings) {
    if (typeof f !== "object" || f === null) return { ok: false, error: "finding must be object" };
    const fo = f as Record<string, unknown>;
    if (typeof fo.title !== "string") return { ok: false, error: "finding.title must be string" };
    if (!["low", "medium", "high"].includes(String(fo.severity))) return { ok: false, error: "finding.severity invalid" };
  }
  return { ok: true, data: p as AnalyzePayload };
}
