/**
 * lib/agent/guardrails.ts —— AI 客服诚实护栏（借鉴 AIActRadar M7 G1–G5）
 *
 * 在生成答案后、发出前运行。失败即拒绝「编造式」答复，并触发转人工。
 *
 *   H1 — 应答须引用 KB 出处；无出处且低置信 → 转人工（不编造）。
 *   H2 — 不承诺未经证实的产品能力 / 定价 / 政策（禁止「保证」「一定」「100%」式绝对措辞）。
 *   H3 — 合规类话题必须附「仅供参考」声明。
 *   H4 — 用户明确要求人工 / 投诉 / 退款 / 销售 → 转人工。
 *   H5 — 模型自身表达不确定 → 标记需人工复核（不强行作答）。
 */

import type { KbEntry } from "./kb";

export interface GuardrailContext {
  citations: KbEntry[];
  topScore: number;
  userMessage: string;
  answer: string;
  complianceRelated: boolean;
}

export interface GuardrailResult {
  /** 是否应转人工（拒绝独立作答，交由真人跟进） */
  escalate: boolean;
  /** 附加到答案后的声明（如「仅供参考」） */
  note: string;
  violations: string[];
  /** 模型表达不确定 → 提示需人工复核 */
  needsHumanReview: boolean;
}

const ESCALATE_USER_PHRASES: RegExp[] = [
  /转人工/,
  /人工(客服|服务|协助|支持)?/,
  /投诉/,
  /退款/,
  /维权/,
  /找(真?人|客服|销售)/,
  /客服(电话|微信|联系方式)/,
  /联系(销售|商务|人工)/,
];

// H2 — 禁止绝对化承诺（产品能力 / 定价 / 政策）
const ABSOLUTE_PHRASES: RegExp[] = [
  /\b(保证|一定|100%|绝对|肯定)\b.*(合规|通过|成功|解决|赔付|退款)/,
  /(保证|确保|承诺).{0,12}(不违规|不被罚|零风险|无风险)/,
  /\b我们(保证|承诺|确保)(你|您的)(账户|订阅|合规|数据)/,
];

const UNCERTAINTY_MARKER: RegExp =
  /(不确定|无法(确定|确认|保证)|建议(你|您)?(咨询|联系|核实)|以.*(为准|为准)|需(要|人工|专业).{0,6}(复核|确认|顾问)|超出我的|我不(确定|清楚|确定))/;

const COMPLIANCE_DISCLAIMER =
  "（以上内容仅供参考，不构成法律 / 税务 / 专业意见，也不构成「合规认证」；正式决策前请结合首要法律文本并咨询合格顾问。）";

const LOW_CONFIDENCE_THRESHOLD = 2;

export function detectUserEscalation(message: string): boolean {
  return ESCALATE_USER_PHRASES.some((re) => re.test(message || ""));
}

export function detectUncertainty(text: string): boolean {
  return UNCERTAINTY_MARKER.test(text || "");
}

/** 主入口：返回是否转人工 + 声明 + 违规码。 */
export function applyGuardrails(ctx: GuardrailContext): GuardrailResult {
  const violations: string[] = [];
  let escalate = false;

  // H4 — 用户明确要求人工
  if (detectUserEscalation(ctx.userMessage)) {
    escalate = true;
    violations.push("H4_USER_ESCALATION");
  }

  // H1 — 低置信（无 KB 命中或 topScore 过低）→ 不编造，转人工
  if (ctx.topScore < LOW_CONFIDENCE_THRESHOLD && ctx.citations.length === 0) {
    escalate = true;
    violations.push("H1_LOW_CONFIDENCE");
  }

  // H2 — 绝对化承诺（即便有 KB，也标记，必要时转人工）
  for (const re of ABSOLUTE_PHRASES) {
    if (re.test(ctx.answer)) {
      violations.push("H2_ABSOLUTE_PROMISE");
      escalate = true;
    }
  }

  // H5 — 模型不确定 → 标记需人工复核（不强行作答时转人工）
  const needsHumanReview = detectUncertainty(ctx.answer);
  if (needsHumanReview && ctx.citations.length === 0) {
    escalate = true;
    violations.push("H5_UNCERTAINTY");
  }

  // H3 — 合规类必须附声明
  let note = "";
  if (ctx.complianceRelated) {
    note = COMPLIANCE_DISCLAIMER;
  }

  return { escalate, note, violations, needsHumanReview };
}
