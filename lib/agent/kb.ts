/**
 * lib/agent/kb.ts —— 产品知识库（AI 客服智能体检索源）
 *
 * 初版采用「关键词 + 中文二元组」轻量检索（无外部向量依赖，契合 gstack 零运维起步）。
 * 后续可平滑升级为向量检索（替换 retrieve 实现即可，接口不变）。
 *
 * 红线（沿用 AIActRadar M7 / M11）：
 * - 客服应答必须引用 KB 出处（cite），绝不编造产品能力/定价/政策。
 * - 合规类条目须打 tag，由 guardrails 在答案上附加「仅供参考」声明。
 */

import type { KbEntry } from "../support-kit/types";
export type { KbEntry };

export const KB: KbEntry[] = [
  {
    id: "overview",
    title: "GStack 是什么",
    keywords: ["是什么", "介绍", "gstack", "增长工作台", "做什么", "产品"],
    body:
      "GStack 增长工作台是一个面向独立开发者的出海控制台，把建站、支付、合规与增长分析四件事串到一起，让你用更少时间把产品卖到更多国家。它不是单点工具，而是一套「从落地到收款到合规到增长」的工作流。",
    source: "产品文档 / 官网首页",
    tags: [],
  },
  {
    id: "pillars",
    title: "四大支柱：建站 / 支付 / 合规 / 增长分析",
    keywords: ["四大", "支柱", "建站", "支付", "合规", "增长分析", "功能", "能做什么"],
    body:
      "GStack 围绕四个支柱：① 建站 —— 落地页 / 博客 / SEO 一键生成，面向 AI 搜索优化；② 支付 —— Waffo 订阅接入，覆盖欧美主流市场；③ 合规 —— 出海合规 / 市场准入扫描（GDPR、VAT、消费者保护、应用商店与支付监管）；④ 增长分析 —— 用量、转化、漏斗与留存看板，指导增长决策。",
    source: "产品文档 / 功能概览",
    tags: [],
  },
  {
    id: "compliance-tool",
    title: "出海合规 / 市场准入扫描工具",
    keywords: ["合规", "扫描", "市场准入", "gdpr", "vat", "消费者保护", "应用商店", "支付监管", "检查", "义务"],
    body:
      "出海合规扫描是 GStack 的核心 AI 工具：你输入产品 / 业务描述、目标市场、商业模式、是否处理个人数据与支付、分发渠道、用户年龄，工具输出一份结构化的「合规就绪度简报」——覆盖 GDPR / UK-GDPR / CCPA 数据义务、欧盟 / 英国 VAT 与 OSS、消费者保护（价格透明、撤回权、禁止刷评）、应用商店规则（隐私标签、IAP）、支付监管（PCI-DSS、SCA / PSD2）与跨境数据传输（SCC / 充分性认定）。规则引擎先跑、LLM 辅助解释，结论可解释、可复核。",
    source: "产品文档 / 合规扫描",
    tags: ["compliance"],
  },
  {
    id: "pricing",
    title: "定价：Free / Pro / Enterprise",
    keywords: ["定价", "价格", "多少钱", "收费", "免费", "pro", "enterprise", "套餐", "档位", "价格表"],
    body:
      "三档：Free（¥0，每月 10 次合规扫描、基础增长看板、社区支持）；Pro（¥29/月 或 ¥290/年，每月 300 次扫描、完整增长看板 + 导出、AI 客服知识库、邮件支持）；Enterprise（¥199/月 或 ¥1990/年，不限合规扫描、多席位 + 审计轨迹、BYOK 自带密钥、专属支持）。年付已含折扣。",
    source: "官网定价页 / 产品文档",
    tags: [],
  },
  {
    id: "free-vs-pro",
    title: "Free 与 Pro 的主要区别",
    keywords: ["free", "pro", "区别", "免费版", "升级", "差异", "选哪个"],
    body:
      "核心差异在配额与能力：Free 每月仅 10 次合规扫描、只有基础看板、无导出；Pro 把扫描提到每月 300 次、开放完整增长看板与导出、启用 AI 客服知识库、并提供邮件支持。独立开发者正式出海通常从 Pro 起步。",
    source: "官网定价页",
    tags: [],
  },
  {
    id: "payment-waffo",
    title: "支付方式（Waffo）",
    keywords: ["支付", "付款", "waffo", "信用卡", "订阅", "怎么付", "付费", "invoice"],
    body:
      "GStack 通过 Waffo Pancake 接入订阅支付，支持欧美主流信用卡 / 支付方式，月付与年付均可。升级时在结账页选择档位与周期，跳转 Waffo 完成支付，订阅状态会自动同步到你的账户。",
    source: "产品文档 / 支付",
    tags: [],
  },
  {
    id: "upgrade",
    title: "如何升级 / 管理订阅",
    keywords: ["升级", "订阅", "管理", "取消", "换档", "billing", "账单", "降级"],
    body:
      "在账户页（/account）可查看当前订阅与权益；升级点击对应档位的「升级」按钮进入 Waffo 结账。如需取消或变更周期，可在账户页操作或在结账后通过 Waffo 管理订阅。订阅变更一般按账单周期生效。",
    source: "产品文档 / 账户",
    tags: [],
  },
  {
    id: "privacy",
    title: "GStack 如何处理我的数据",
    keywords: ["隐私", "数据", "收集", "个人信息", "安全", "加密", "存储", "密码"],
    body:
      "GStack 仅收集运行服务所必需的数据：账户邮箱与（哈希后的）密码、你提交的合规扫描输入、必要的用量指标。密码使用 bcrypt 哈希，密钥仅存于服务端。我们不会把你的业务数据用于训练或转售。详细以隐私政策为准。",
    source: "产品文档 / 隐私",
    tags: ["compliance"],
  },
  {
    id: "ai-support-scope",
    title: "AI 客服能做什么 / 不能做什么",
    keywords: ["客服", "机器人", "ai 客服", "智能体", "能回答", "边界", "限制"],
    body:
      "我是 GStack 的 AI 客服助手，基于产品知识库回答关于产品、功能、定价、支付、账户与合规扫描的常见问题，并在需要时为你转接人工。我无法替代法律 / 税务 / 专业顾问意见，合规类答复仅供参考；我也不能直接修改你的账户、处理退款或访问你的支付凭证。",
    source: "产品文档 / AI 客服",
    tags: [],
  },
  {
    id: "compliance-disclaimer",
    title: "合规答复的免责声明",
    keywords: ["法律", "意见", "保证", "合规认证", "免责", "顾问", "责任"],
    body:
      "关于 GDPR、VAT、消费者保护、应用商店与支付监管等话题，GStack 提供的是决策辅助与信息梳理，不构成法律、税务或专业意见，也不构成「合规认证」。正式出海前请结合首要法律文本并咨询合格顾问。",
    source: "产品文档 / 合规扫描",
    tags: ["compliance"],
  },
  {
    id: "account-login",
    title: "登录 / 账户问题",
    keywords: ["登录", "登入", "账号", "账户", "注册", "密码", "忘记密码", "无法登录"],
    body:
      "账户使用邮箱 + 密码登录。如果忘记密码或无法登录，请通过页面「联系我们 / 转人工」提交，团队会协助你核实身份后处理。出于安全考虑，我们不会在聊天中直接索要或重置你的密码。",
    source: "产品文档 / 账户",
    tags: [],
  },
  {
    id: "growth-analytics",
    title: "增长分析看板",
    keywords: ["增长", "分析", "看板", "漏斗", "留存", "转化", "指标", "umami", "数据"],
    body:
      "增长分析模块提供用量、转化、漏斗与留存看板（Free 为精简版，Pro 及以上为完整版并支持导出）。这些数据帮助你判断哪些渠道与功能真正带来增长，指导下一步投入。",
    source: "产品文档 / 增长分析",
    tags: [],
  },
  {
    id: "embed-widget",
    title: "把客服组件嵌入自己的网站",
    keywords: ["嵌入", "widget", "脚本", "集成", "自己的网站", "iframe", "跨站", "部署"],
    body:
      "GStack 提供可嵌入的客服组件：在你想加载的页面加入 <script src=\"https://你的域名/embed/chat\"></script>（或通过 /embed/chat 的 iframe），即可在任意网站显示聊天入口。组件通过 iframe 隔离样式，跨站安全。具体 host 以你的部署域名为准。",
    source: "产品文档 / 嵌入",
    tags: [],
  },
  {
    id: "contact-human",
    title: "联系我们 / 转人工",
    keywords: ["联系", "人工", "转人工", "投诉", "退款", "维权", "销售", "真人", "客服电话", "找人"],
    body:
      "如果你需要人工协助（如账户异常、退款、商务合作或政策咨询），告诉我「转人工」并留下邮箱，我们会通过邮件尽快联系你。你也可以在反馈页（/feedback）提交详细诉求。",
    source: "产品文档 / 支持",
    tags: [],
  },
];

// --- 轻量检索：关键词命中 + 标题词 + 中文二元组重叠 ---
function normalize(s: string): string {
  return (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}

function toWords(s: string): string[] {
  return normalize(s)
    .split(/\s+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

function cjkBigrams(s: string): string[] {
  const grams: string[] = [];
  for (const w of toWords(s)) {
    if (/[\u4e00-\u9fff]/.test(w) && w.length >= 2) {
      for (let i = 0; i < w.length - 1; i++) grams.push(w.slice(i, i + 2));
    }
  }
  return grams;
}

function scoreEntry(entry: KbEntry, query: string): number {
  const q = normalize(query);
  const qWords = new Set(toWords(q));
  const qGrams = new Set(cjkBigrams(q));
  let score = 0;

  // 关键词命中（最高权重）
  for (const kw of entry.keywords) {
    const k = kw.toLowerCase();
    if (q.includes(k)) score += 3;
  }
  // 标题词命中
  for (const tw of toWords(entry.title)) {
    if (qWords.has(tw)) score += 2;
  }
  // 二元组重叠（模糊召回）
  const idx = normalize((entry.keywords.join(" ") + " " + entry.title + " " + entry.body.slice(0, 400)));
  for (const g of qGrams) {
    if (idx.includes(g)) score += 0.5;
  }
  return score;
}

export interface RetrieveResult {
  entries: KbEntry[];
  topScore: number;
}

/** 返回按相关性降序的前 topK 条；topScore 用于置信度判断（<2 视为低置信→转人工）。 */
export function retrieve(query: string, topK = 4, entries: KbEntry[] = KB): RetrieveResult {
  const scored = entries.map((e) => ({ e, s: scoreEntry(e, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK);
  return {
    entries: scored.map((x) => x.e),
    topScore: scored.length ? scored[0].s : 0,
  };
}

export function isComplianceRelated(entries: KbEntry[]): boolean {
  return entries.some((e) => e.tags.includes("compliance"));
}
