/**
 * lib/product.ts —— 单一产品配置源（AIActRadar M1 克隆模式）
 * 改这里即可改品牌/定价/文案/权益；新增市场只需复制仓库并改本文件。
 */

export interface PricingTier {
  id: "free" | "pro" | "enterprise";
  name: string;
  priceMonthly: number; // 0 = 免费
  priceAnnual: number; // 年付总价（已折）
  tagline: string;
  features: string[];
  featured?: boolean;
  ctaLabel: string;
  /** Waffo 产品 ID（Phase 3 接入支付时填充，test/production 分别配置） */
  waffoProductId?: { monthly?: string; yearly?: string };
  /** 公平配额（M3） */
  quota: { daily: number; monthly: number; maxTokens: number };
}

export const PRODUCT = {
  name: "GStack 增长工作台",
  slug: "gstack",
  tagline: "把建站、支付、合规与增长分析串起来的出海控制台。让独立开发者用更少时间，把产品卖到更多国家。",
  /** Demo 模式：仅当用户主动勾选 + 环境允许时启用，绝不静默 mock（AIActRadar 红线） */
  mock: process.env.NODE_ENV !== "production" && process.env.GSTACK_DISABLE_MOCK !== "1",
  pillars: [
    { key: "build", label: "建站", desc: "落地页 / 博客 / SEO 一键生成，面向 AI 搜索优化。" },
    { key: "pay", label: "支付", desc: "Waffo 订阅接入，覆盖欧美主流市场。" },
    { key: "comply", label: "合规", desc: "出海合规 / 市场准入扫描：GDPR、VAT、消费者保护、应用商店与支付监管。" },
    { key: "grow", label: "增长分析", desc: "用量、转化、漏斗与留存看板，指导增长决策。" },
  ],
  nav: [
    { href: "/#features", label: "功能" },
    { href: "/pricing.html", label: "定价" },
    { href: "/product.html", label: "产品" },
    { href: "/login", label: "登录" },
  ],
  /** 核心管线 ID（M6 状态机） */
  pipelineId: "gstack-market-access-v1",
  /** 出海合规 / 市场准入扫描 表单字段（单一源，components/Tool.tsx 据此渲染） */
  inputs: [
    { key: "system_description", label: "产品 / 业务描述", placeholder: "例如：面向北美独立开发者的订阅制 SaaS，处理用户邮箱与账单信息", type: "textarea" },
    { key: "markets", label: "目标市场（逗号分隔）", placeholder: "EU, US, UK, CA, AU, JP …", type: "text" },
    { key: "business_model", label: "商业模式", type: "select", options: ["B2B", "B2C", "B2B+B2C"] },
    { key: "collects_pii", label: "是否处理个人数据", type: "select", options: ["是", "否", "不确定"] },
    { key: "payments", label: "是否处理支付", type: "select", options: ["是", "否"] },
    { key: "distribution", label: "分发渠道", type: "select", options: ["Web", "App Store", "两者"] },
    { key: "age_group", label: "用户年龄", type: "select", options: ["成人", "全年龄", "含儿童"] },
  ] as ProductInput[],
  /** 核心管线 LLM 系统提示词（出海合规 / 市场准入扫描） */
  systemPrompt:
    "You are a market-access & cross-border compliance analyst for independent software founders going global. " +
    "Given a product description and target markets, produce a concise, structured compliance readiness brief. " +
    "Cover: GDPR/UK-GDPR/CCPA data obligations, EU/UK VAT & OSS, consumer-protection (price transparency, withdrawal, fake-review bans), " +
    "app-store rules (privacy labels, IAP), payment regulation (PCI-DSS, SCA/PSD2), and cross-border data transfer (SCCs/adequacy). " +
    "Reference the rule-based findings provided; do NOT invent legal guarantees. Label every claim as decision-support, not legal advice. " +
    "Write in the same language as the user's input.",
  pricing: [
    {
      id: "free",
      name: "Free",
      priceMonthly: 0,
      priceAnnual: 0,
      tagline: "起步验证你的出海想法",
      features: ["合规扫描 每月 10 次", "基础增长看板", "社区支持"],
      ctaLabel: "免费开始",
      quota: { daily: 10, monthly: 50, maxTokens: 4000 },
    },
    {
      id: "pro",
      name: "Pro",
      priceMonthly: 29,
      priceAnnual: 290,
      tagline: "独立开发者的主战场",
      features: ["合规扫描 每月 300 次", "完整增长看板 + 导出", "AI 客服知识库", "邮件支持"],
      featured: true,
      ctaLabel: "升级 Pro",
      waffoProductId: { monthly: "PROD_1vc39RkO42bmrog52GWCrO", yearly: "PROD_5UW1AFD2nMVScYKwqhJG4L" },
      quota: { daily: 40, monthly: 300, maxTokens: 16000 },
    },
    {
      id: "enterprise",
      name: "Enterprise",
      priceMonthly: 199,
      priceAnnual: 1990,
      tagline: "团队与合规刚需",
      features: ["不限合规扫描", "多席位 + 审计轨迹", "BYOK 自带密钥", "专属支持"],
      ctaLabel: "联系我们",
      waffoProductId: { monthly: "PROD_1Ta3sqsfZrfOhnKzkuUiiz", yearly: "PROD_6Zqr4SFvvnqp2gKqytjakb" },
      quota: { daily: 200, monthly: 3000, maxTokens: 64000 },
    },
  ] as PricingTier[],
};

export interface ProductInput {
  key: string;
  label: string;
  type?: "text" | "textarea" | "select";
  placeholder?: string;
  options?: string[];
}

export type ProductConfig = typeof PRODUCT;
