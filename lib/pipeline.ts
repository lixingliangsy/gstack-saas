import { randomUUID } from "crypto";

// gstack 出海合规 / 市场准入扫描 工作流（intake → classify → assess → report）。
// 复用 AIActRadar M6 四步状态机骨架，领域语言改为市场准入。
export type StepId = "intake" | "classify" | "assess" | "report";
export type RunStatus = "running" | "awaiting_confirm" | "done" | "failed";

export type RunState = {
  id: string;
  runId: string;
  step: StepId;
  inputs: Record<string, string>;
  artifacts: Record<string, unknown>;
  status: RunStatus;
  pipelineId: string;
  rulesetVersion?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
};

export const PIPELINE_ID = "gstack-market-access-v1";

export const STEP_ORDER: StepId[] = ["intake", "classify", "assess", "report"];

export const STEP_LABELS: Record<StepId, string> = {
  intake: "Step 1/4 · 采集产品与市场信息",
  classify: "Step 2/4 · 识别目标市场监管",
  assess: "Step 3/4 · 映射合规义务",
  report: "Step 4/4 · 生成就绪度报告",
};

export function createRun(inputs: Record<string, string>, pipelineId: string): RunState {
  const now = new Date().toISOString();
  const id = randomUUID();
  return {
    id,
    runId: id,
    step: "intake",
    inputs,
    artifacts: {},
    status: "running",
    pipelineId,
    createdAt: now,
    updatedAt: now,
  };
}

export function assertTransition(from: StepId, to: StepId) {
  const i = STEP_ORDER.indexOf(from);
  const j = STEP_ORDER.indexOf(to);
  if (j !== i + 1) {
    throw new Error(`Invalid step transition: ${from} → ${to}`);
  }
}

export function advance(state: RunState, to: StepId): RunState {
  assertTransition(state.step, to);
  return { ...state, step: to, updatedAt: new Date().toISOString() };
}
