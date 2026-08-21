/**
 * gstack 垂直规则集 —— 出海合规 / 市场准入扫描（GDPR / VAT / 消费者保护 /
 * 应用商店 / 支付监管 / 跨境数据传输 / 儿童保护）。
 *
 * 设计（沿用 AIActRadar M6）：
 * - 确定性规则先跑（不依赖 LLM），判定可解释、可自测。
 * - LLM 仅做辅助扩写，不能发明合规保证。
 * - 所有检测均为启发式，报告须标注「决策支持，非法律意见」。
 */

export const RULESET_VERSION = "gstack-market-access@2026-08-20";

export type GsSeverity = "low" | "medium" | "high";

export interface GsRule {
  id: string;
  title: string;
  severity: GsSeverity;
  /** 仅当 detectedMarkets 命中其中任一区域时适用；空数组 = 全局适用 */
  regions: string[];
  check: (ctx: GsCtx) => boolean;
  remediation: string;
  ref: string;
}

export interface GsCtx {
  description: string;
  markets: string[]; // 归一化区域码：eu/uk/us/ca/au/jp/other
  businessModel: string; // B2B / B2C / B2B+B2C
  collectsPii: boolean | null; // null = 不确定
  payments: boolean;
  distribution: "Web" | "App Store" | "两者";
  ageGroup: string; // 成人 / 全年龄 / 含儿童
}

// ---------------------------------------------------------------------------
// 区域检测：从显式市场字段 + 描述自由文本中归一化
// ---------------------------------------------------------------------------
const REGION_INDEX: { code: string; label: string; patterns: RegExp[] }[] = [
  { code: "eu", label: "欧盟 (EU)", patterns: [/eu\b|european union|europe|欧洲|欧盟|德国|法国|意大利|西班牙/i] },
  { code: "uk", label: "英国 (UK)", patterns: [/uk\b|united kingdom|britain|england|英国|英格兰/i] },
  { code: "us", label: "美国 (US)", patterns: [/us\b|usa|u\.s\.|united states|america|美国|加州|california|纽约|new york/i] },
  { code: "ca", label: "加拿大 (CA)", patterns: [/canada|加拿大/i] },
  { code: "au", label: "澳大利亚 (AU)", patterns: [/australia|澳洲|澳大利亚/i] },
  { code: "jp", label: "日本 (JP)", patterns: [/japan|日本/i] },
];

export function detectMarkets(marketsText: string, description = ""): { code: string; label: string }[] {
  const text = `${marketsText} ${description}`;
  const out: { code: string; label: string }[] = [];
  const seen = new Set<string>();
  for (const r of REGION_INDEX) {
    const hit = r.patterns.some((p) => p.test(text));
    // 显式逗号列表优先：即便描述未命中，只要 marketsText 含区域词也计入
    const explicit = new RegExp(`\\b${r.code}\\b`, "i").test(marketsText);
    if (hit || explicit) {
      if (!seen.has(r.code)) {
        seen.add(r.code);
        out.push({ code: r.code, label: r.label });
      }
    }
  }
  if (out.length === 0) out.push({ code: "other", label: "其他 / 未指定" });
  return out;
}

// ---------------------------------------------------------------------------
// 高风险行业标记（需特殊牌照 / 强监管）
// ---------------------------------------------------------------------------
const SECTOR_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: "赌博 / 博彩（需牌照）", pattern: /gambl|casino|bet|lottery|彩票|博彩|赌博/i },
  { label: "加密货币 / 数字资产（需注册）", pattern: /crypto|web3|token|defi|nft|比特币|加密货币|虚拟货币/i },
  { label: "医疗 / 健康声明（强监管）", pattern: /medical|health|diagnos|治疗|处方|药|clinical|医保/i },
  { label: "金融 / 放贷 / 投资（牌照）", pattern: /loan|lending|mortgage|credit|invest|broker|证券|放贷|理财|基金/i },
  { label: "烟草 / 酒精（年龄限制）", pattern: /tobacco|vape|alcohol|尼古丁|烟草|酒精|酒/i },
];

export function detectSectorRisks(description: string): string[] {
  return SECTOR_PATTERNS.filter((s) => s.pattern.test(description)).map((s) => s.label);
}

// ---------------------------------------------------------------------------
// 规则集（确定性）
// ---------------------------------------------------------------------------
const has = (ctx: GsCtx, ...codes: string[]) => codes.some((c) => ctx.markets.includes(c));
const b2cLike = (ctx: GsCtx) => ctx.businessModel === "B2C" || ctx.businessModel === "B2B+B2C";

export const GS_RULES: GsRule[] = [
  {
    id: "GS-001",
    title: "GDPR 个人数据处理义务 (EU)",
    severity: "high",
    regions: ["eu"],
    check: (c) => c.collectsPii !== false,
    remediation:
      "在欧盟处理个人数据须有合法依据（同意/合同/正当利益等）、提供隐私政策、履行数据主体权利（访问/删除/携带）、指定欧盟代表（如适用）、72 小时内通报数据泄露。建议采用标准合同条款 (SCCs) 处理跨境传输。",
    ref: "https://gdpr-info.eu/",
  },
  {
    id: "GS-002",
    title: "UK GDPR 个人数据处理义务 (UK)",
    severity: "high",
    regions: ["uk"],
    check: (c) => c.collectsPii !== false,
    remediation:
      "面向英国用户处理个人数据须遵守 UK GDPR 与 Data Protection Act 2018：合法依据、隐私声明、数据主体权利、ICO 注册（如阈值触发）、跨境传输须有充分性认定或国际数据传输协议 (IDTA)。",
    ref: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/",
  },
  {
    id: "GS-003",
    title: "CCPA / CPRA 加州隐私 (US)",
    severity: "medium",
    regions: ["us"],
    check: (c) => c.collectsPii !== false,
    remediation:
      "若面向加州用户且达到营收/数据量门槛，须遵守 CCPA/CPRA：提供「Do Not Sell/Share」选项、隐私政策披露、用户访问/删除/拒绝权。美国多州（Virginia/CDPA、Colorado/CPA 等）亦有类似立法。",
    ref: "https://oag.ca.gov/privacy/ccpa",
  },
  {
    id: "GS-004",
    title: "欧盟 VAT / OSS 一站式申报 (数字服务)",
    severity: "high",
    regions: ["eu"],
    check: (c) => b2cLike(c) || c.payments,
    remediation:
      "向欧盟消费者销售数字商品/服务须按目的地国税率征收 VAT，并通过 One-Stop-Shop (OSS) 统一申报。注意 €10,000 阈值与各国税率差异（19%–27%）。",
    ref: "https://taxation-customs.ec.europa.eu/taxation/vat/one-stop-shop_en",
  },
  {
    id: "GS-005",
    title: "英国 VAT (数字服务)",
    severity: "medium",
    regions: ["uk"],
    check: (c) => b2cLike(c) || c.payments,
    remediation:
      "向英国消费者销售数字服务须注册 UK VAT（阈值为 £85,000 或境外供应商直接向英消费者销售），按 20% 标准税率征收并定期申报。",
    ref: "https://www.gov.uk/register-for-vat",
  },
  {
    id: "GS-006",
    title: "消费者保护：价格透明与撤回权 (EU/UK)",
    severity: "medium",
    regions: ["eu", "uk"],
    check: (c) => b2cLike(c),
    remediation:
      "面向消费者的数字内容/服务须满足价格全包透明、14 天无理由撤回（除非明确放弃）、清晰的退订机制；EU 数字内容指令 (DCD) 与 UK CRA 均适用。",
    ref: "https://commission.europa.eu/law/law-topic/consumer-protection-law_en",
  },
  {
    id: "GS-007",
    title: "应用商店合规 (Apple / Google)",
    severity: "high",
    regions: [],
    check: (c) => c.distribution === "App Store" || c.distribution === "两者",
    remediation:
      "上架 App Store / Google Play 须完成隐私「营养标签」、遵守审核指南；若销售数字商品，Apple 要求使用其内购 (IAP) 并抽成（通常 15%–30%）。提前准备隐私政策与数据收集声明。",
    ref: "https://developer.apple.com/app-store/review/guidelines/",
  },
  {
    id: "GS-008",
    title: "支付卡行业 PCI-DSS",
    severity: "high",
    regions: [],
    check: (c) => c.payments,
    remediation:
      "凡接触持卡人数据须符合 PCI-DSS（建议通过 Stripe/Paddle 等合规 PSP 代持卡数据，避免自建持卡人数据存储）。保留支付凭证、限制数据留存周期。",
    ref: "https://www.pcisecuritystandards.org/",
  },
  {
    id: "GS-009",
    title: "PSD2 / SCA 强客户认证 (EU 支付)",
    severity: "medium",
    regions: ["eu"],
    check: (c) => c.payments,
    remediation:
      "在欧盟处理电子支付须满足 PSD2 的强客户认证 (SCA)：交易需双因素验证，并处理好豁免场景（小额/ recurring）。选用支持 SCA 的 PSP（Stripe/Adyen）。",
    ref: "https://www.eba.europa.eu/regulation-and-policy/payment-services-and-electronic-money/strong-customer-authentication-and-secure-open-standards-communication",
  },
  {
    id: "GS-010",
    title: "跨境数据传输：SCCs / 充分性认定",
    severity: "high",
    regions: ["eu", "uk"],
    check: (c) => c.collectsPii !== false && (c.markets.includes("us") || c.markets.includes("ca") || c.markets.includes("au") || c.markets.includes("jp") || c.distribution !== "Web"),
    remediation:
      "从 EU/UK 向第三国（如美国）传输个人数据须具备合法传输机制：标准合同条款 (SCCs/IDTA)、或依赖 EU-US Data Privacy Framework (DPF) 充分性认定。落地数据传输影响评估 (TIA)。",
    ref: "https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection_en",
  },
  {
    id: "GS-011",
    title: "儿童 / 未成年用户保护",
    severity: "high",
    regions: [],
    check: (c) => c.ageGroup === "含儿童",
    remediation:
      "若服务面向或可能被儿童使用，须遵守美国 COPPA（13 岁以下需父母同意）、英国 Age-Appropriate Design Code、GDPR 第 8 条（数字同意年龄门槛）。默认最高隐私设置、年龄验证、内容适龄。",
    ref: "https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa",
  },
  {
    id: "GS-012",
    title: "虚假评价 / 暗黑模式禁止 (EU Omnibus)",
    severity: "medium",
    regions: ["eu"],
    check: (c) => b2cLike(c),
    remediation:
      "EU 数字服务与消费者保护 (Omnibus) 严禁购买/伪造用户评价、使用诱导性暗黑模式（false scarcity、预勾选订阅等）。保存真实评价来源，界面默认诚实透明。",
    ref: "https://commission.europa.eu/law/law-topic/consumer-protection-law_en",
  },
];

// ---------------------------------------------------------------------------
// 聚合确定性检测
// ---------------------------------------------------------------------------
export function runDeterministicChecks(inputs: Record<string, string>) {
  const description = String(inputs.system_description || inputs.description || "");
  const marketsRaw = String(inputs.markets || "");
  const detected = detectMarkets(marketsRaw, description);
  const markets = detected.map((m) => m.code);

  const bModel = String(inputs.business_model || "B2B+B2C");
  const piiRaw = String(inputs.collects_pii || "不确定");
  const collectsPii: boolean | null = piiRaw === "否" ? false : piiRaw === "是" ? true : null;
  const payments = String(inputs.payments || "否") === "是";
  const distribution = (["Web", "App Store", "两者"].includes(inputs.distribution || "") ? inputs.distribution : "Web") as GsCtx["distribution"];
  const ageGroup = String(inputs.age_group || "成人");

  const ctx: GsCtx = { description, markets, businessModel: bModel, collectsPii, payments, distribution, ageGroup };

  const hits = GS_RULES.filter((r) => {
    const applies = r.regions.length === 0 || r.regions.some((rg) => markets.includes(rg));
    return applies && r.check(ctx);
  }).map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.severity,
    regions: r.regions,
    remediation: r.remediation,
    ref: r.ref,
    source: "Rule-based" as const,
  }));

  const sectorRisks = detectSectorRisks(description);

  const summary = {
    critical: 0,
    high: hits.filter((h) => h.severity === "high").length,
    medium: hits.filter((h) => h.severity === "medium").length,
    low: hits.filter((h) => h.severity === "low").length,
  };

  return {
    rulesetVersion: RULESET_VERSION,
    hits,
    detectedMarkets: detected,
    businessModel: bModel,
    flags: { collectsPii, payments, distribution, ageGroup },
    sectorRisks,
    summary,
  };
}
