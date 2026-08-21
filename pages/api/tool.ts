import type { NextApiRequest, NextApiResponse } from "next";
import { PRODUCT } from "../../lib/product";
import { checkQuota, resolvePlan, callLLM, AIError, type Plan } from "../../lib/aiGateway";
import { getUserFromRequest } from "../../lib/auth";
import { getUserById } from "../../lib/users";
import { STEP_LABELS, STEP_ORDER, advance, createRun, type StepId } from "../../lib/pipeline";
import { saveRun, loadRun } from "../../lib/runs";
import { appendAudit } from "../../lib/auditLog";
import { runDeterministicChecks } from "../../lib/rules/gstack-rules";
import { validateAnalyzePayload } from "../../lib/schema";

function formatReport(state: {
  runId: string;
  rulesetVersion?: string;
  artifacts: Record<string, unknown>;
  inputs: Record<string, string>;
}): string {
  const checks = state.artifacts.ruleHits as
    | {
        rulesetVersion: string;
        hits: Array<{ id: string; title: string; severity: string; remediation: string; ref: string; regions: string[] }>;
        detectedMarkets: Array<{ code: string; label: string }>;
        businessModel: string;
        flags: Record<string, unknown>;
        sectorRisks: string[];
        summary: Record<string, number>;
      }
    | undefined;
  const modelText = String(state.artifacts.modelText || "");
  const desc = String(state.inputs.system_description || state.inputs.description || "").slice(0, 220);
  const markets = String(state.inputs.markets || "?");
  const bModel = String(state.inputs.business_model || "?");
  const lines: string[] = [];
  lines.push(`出海合规 / 市场准入扫描 · run ${state.runId}`);
  lines.push(`产品描述: ${desc || "(未提供)"}`);
  lines.push(`目标市场: ${markets} · 商业模式: ${bModel}`);
  lines.push(`规则集: ${state.rulesetVersion || checks?.rulesetVersion || "n/a"}`);
  if (checks?.detectedMarkets?.length) {
    lines.push(`识别区域: ${checks.detectedMarkets.map((m) => m.label).join(", ")}`);
  }
  lines.push("");

  if (checks?.sectorRisks?.length) {
    lines.push("=== ⚠️ 强监管行业标记（需特殊牌照/资质） ===");
    for (const s of checks.sectorRisks) lines.push(`- ${s}`);
    lines.push("");
  }

  const sev = checks?.summary || { critical: 0, high: 0, medium: 0, low: 0 };
  lines.push(`=== 规则命中（${sev.high} 高 / ${sev.medium} 中 / ${sev.low} 低） ===`);
  const hits = checks?.hits || [];
  if (!hits.length) lines.push("(未触发规则 — 请人工复核)");
  else {
    for (const h of hits) {
      lines.push(`- [${h.severity}] ${h.id} ${h.title}`);
      lines.push(`  整改: ${h.remediation}`);
    }
  }
  lines.push("");

  lines.push("=== AI 辅助合规扩写 ===");
  lines.push(modelText || "(demo / 模型不可用)");
  lines.push("");
  lines.push("---");
  lines.push("来源: 规则引擎 (gstack-market-access) + AI 辅助。本结果为决策支持，非法律意见。");
  return lines.join("\n");
}

function collectInputs(state: { inputs: Record<string, string> }): string {
  return (PRODUCT.inputs || [])
    .map((f) => `${f.label}: ${state.inputs[f.key] || "(未提供)"}`)
    .join("\n");
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = (req.body || {}) as {
      inputs?: Record<string, string>;
      useMock?: boolean;
      plan?: "free" | "pro" | "enterprise";
      action?: "start" | "status";
      runId?: string;
      step?: StepId;
    };

    const inputs = body.inputs || {};
    const useMock = !!body.useMock;
    const plan = resolvePlan(req); // 信任边界：绝不读 body.plan
    // 订阅权益：登录用户取其套餐（admin=enterprise），取更高优先级
    const session = getUserFromRequest(req);
    const PLAN_ORDER: Plan[] = ["free", "pro", "enterprise"];
    let sessionPlan: Plan = "free";
    if (session) {
      const u = await getUserById(session.sub);
      if (u) sessionPlan = u.role === "admin" ? "enterprise" : u.plan;
    }
    const effectivePlan: Plan = PLAN_ORDER.indexOf(sessionPlan) > PLAN_ORDER.indexOf(plan) ? sessionPlan : plan;
    const slug = String(PRODUCT.slug || "gstack");
    const pipelineId = String(PRODUCT.pipelineId || "gstack-market-access-v1");

    if (body.action === "status" && body.runId) {
      const existing = await loadRun(body.runId);
      if (!existing) return res.status(404).json({ error: "Run not found", code: "RUN_NOT_FOUND" });
      return res.status(200).json({
        runId: existing.runId,
        step: existing.step,
        stepLabel: STEP_LABELS[existing.step],
        status: existing.status,
        artifacts: existing.artifacts,
        demo: false,
      });
    }

    // 显式 Demo 模式 —— 绝不静默 mock（失败不降级为 mock）
    if (useMock) {
      const state = createRun(inputs, pipelineId);
      const checks = runDeterministicChecks(inputs);
      state.artifacts.ruleHits = checks;
      state.rulesetVersion = checks.rulesetVersion;
      state.step = "report";
      state.status = "done";
      state.artifacts.modelText = "（Demo 预览：未调用模型）";
      const result = formatReport(state);
      await saveRun(state);
      await appendAudit(slug, { runId: state.runId, step: "report", event: "demo_complete", detail: "explicit useMock" });
      return res.status(200).json({
        result,
        demo: true,
        mock: true,
        runId: state.runId,
        step: "report",
        stepLabel: STEP_LABELS.report,
        steps: STEP_ORDER.map((s) => ({ id: s, label: STEP_LABELS[s] })),
        rulesetVersion: checks.rulesetVersion,
        ruleHits: checks.hits,
      });
    }

    // 配额检查（信任边界：plan 来自服务端/签名）
    const quota = checkQuota(slug, effectivePlan);
    if (!quota.ok) {
      return res.status(429).json({
        error: "公平使用额度已耗尽。请升级或等待重置。",
        code: "QUOTA_EXCEEDED",
        demo: false,
      });
    }

    // 无密钥 → 显式 503，绝不静默降级
    const hasKey = !!process.env.OPENAI_API_KEY;
    if (!hasKey) {
      return res.status(503).json({
        error: "AI 网关未配置（缺少 OPENAI_API_KEY）。请开启 Demo 模式或配置密钥。",
        code: "AI_NOT_CONFIGURED",
        demo: false,
      });
    }

    // 全流程：intake → classify → assess(LLM) → report
    const state = createRun(inputs, pipelineId);

    // intake
    state.artifacts.ingestedAt = new Date().toISOString();
    state.artifacts.inputKeys = Object.keys(state.inputs);
    await appendAudit(slug, { runId: state.runId, step: "intake", event: "ingest_ok", quota: { plan: effectivePlan } });
    state.step = "classify";

    // classify（确定性规则）
    const checks = runDeterministicChecks(state.inputs);
    state.artifacts.ruleHits = checks;
    state.rulesetVersion = checks.rulesetVersion;
    state.artifacts.flags = checks.flags;
    await appendAudit(slug, { runId: state.runId, step: "classify", event: "rules_ok", quota: { plan: effectivePlan } });
    state.step = "assess";

    // assess（LLM 辅助，绝不发明合规保证）
    try {
      const systemPrompt = String(PRODUCT.systemPrompt || "");
      const userText =
        collectInputs(state) +
        "\n\n请尊重以下规则命中（不要编造合规保证）：\n" +
        JSON.stringify((state.artifacts.ruleHits as any)?.hits || []);
      const modelText = await callLLM(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: userText },
        ],
        { maxTokens: 2000, temperature: 0.3 }
      );
      state.artifacts.modelText = modelText;
      const soft = validateAnalyzePayload({
        findings: ((state.artifacts.ruleHits as any)?.hits || []).map((h: any) => ({
          title: h.title,
          severity: h.severity,
          evidence: h.id,
          remediation: h.remediation,
          source: "Rule-based",
        })),
        summary: modelText.slice(0, 400),
      });
      if (soft.ok) state.artifacts.analyze = soft.data;
      await appendAudit(slug, { runId: state.runId, step: "assess", event: "assess_ok", quota: { plan: effectivePlan } });
    } catch (e: any) {
      const err = e instanceof AIError ? e : new AIError("AI_UPSTREAM_FAILED", e?.message || "unknown", 502);
      state.status = "failed";
      state.error = err.message;
      await saveRun(state);
      return res.status(err.status).json({
        error: "AI 调用失败：" + err.message,
        code: err.code,
        degraded: true,
        demo: false,
        runId: state.runId,
      });
    }
    state.step = "report";

    // report
    state.status = "done";
    const result = formatReport(state);
    state.artifacts.report = result;
    await saveRun(state);
    await appendAudit(slug, { runId: state.runId, step: "report", event: "report_ok" });

    return res.status(200).json({
      result,
      demo: false,
      mock: false,
      source: "Model-assisted",
      runId: state.runId,
      step: "report",
      stepLabel: STEP_LABELS.report,
      steps: STEP_ORDER.map((s) => ({ id: s, label: STEP_LABELS[s] })),
      rulesetVersion: state.rulesetVersion,
      model: process.env.OPENAI_MODEL || "meta/llama-3.1-8b-instruct",
    });
  } catch (e: any) {
    return res.status(502).json({
      error: "服务调用失败：" + (e?.message || "unknown error"),
      code: "AI_UPSTREAM_FAILED",
      degraded: true,
      demo: false,
    });
  }
}
