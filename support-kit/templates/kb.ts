/**
 * kb.ts 模板 —— 用户应在 SUPPORT_CONFIG_FILL_ME 中替换占位内容。
 *
 * 使用：
 *   1) 复制此文件到 <产品项目>/lib/agent/kb.ts
 *   2) 把 KB 数组里所有 SUPPORT_KB_FILL_ME 替换为该产品的真实条目
 *   3) tags 中的 'compliance' 用于触发「仅供参考」声明与升级策略
 *
 * ---
 * 为什么 scaffold 只写占位、不写实际内容（2026-08-21 联网复核）
 *
 * 业界共识（Generative AI + HITL 治理文献）：
 *   - "Combating Hallucinations and Inaccuracies: The most pressing risk is
 *      the propensity of generative AI to 'hallucinate' – generating
 *      plausible-sounding but factually incorrect information." — elimu.io
 *   - "Subject-matter experts must approve or correct AI-generated responses
 *      before they are formally codified or deployed to the assistant."
 *      — seniorexecutive.com
 *   - "AI knowledge management works best when humans remain actively
 *      involved... AI should NOT: Make final decisions, Override human
 *      judgment, Replace domain expertise." — atchative.com
 *
 * 三层人机分工（customerscience.com.au 的 tiered HITL）：
 *   - Creation oversight   ：产品负责人 / 领域专家 — 写 KB；定范围与可引用来源
 *   - Validation oversight ：产品负责人 + AI 检索自检 — 交叉对照官方资料
 *   - Publication oversight：产品负责人签字 — 提交前 tsc + build 双绿 + 烟测三例
 *
 * AI 负责「加速与结构化」—— 草稿生成、引用对仗、跨语言对齐；
 * AI 不负责「最终事实」—— 所有领域知识必须由人类作者定稿。
 */
import type { KbEntry } from "../support-kit/types";
export type { KbEntry };

export const KB: KbEntry[] = [
  {
    id: "SUPPORT_KB_FILL_ME",
    title: "示例条目 — 请替换",
    keywords: ["示例", "替换", "fill", "me"],
    body:
      "这是 KB 占位条目。请按产品实际 FAQ / 文档填充 5–15 条结构化知识；" +
      "切勿保留这一条上线。",
    source: "产品文档 / 待替换",
    tags: [],
  },
  // …继续按此格式补充
];

/* —— 以下为通用检索实现；通常无须改动 —— */
function normalize(s: string): string {
  return (s || "").toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ");
}
function toWords(s: string): string[] {
  return normalize(s).split(/\s+/).map((w) => w.trim()).filter(Boolean);
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
  let s = 0;
  for (const kw of entry.keywords) {
    const k = kw.toLowerCase();
    if (q.includes(k)) s += 3;
  }
  for (const tw of toWords(entry.title)) {
    if (qWords.has(tw)) s += 2;
  }
  const idx = normalize((entry.keywords.join(" ") + " " + entry.title + " " + entry.body.slice(0, 400)));
  for (const g of qGrams) if (idx.includes(g)) s += 0.5;
  return s;
}

export interface RetrieveResult {
  entries: KbEntry[];
  topScore: number;
}

export function retrieve(query: string, topK = 4, entries: KbEntry[] = KB): RetrieveResult {
  const scored = entries.map((e) => ({ e, s: scoreEntry(e, query) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK);
  return { entries: scored.map((x) => x.e), topScore: scored.length ? scored[0].s : 0 };
}

export function isComplianceRelated(entries: KbEntry[]): boolean {
  return entries.some((e) => e.tags.includes("compliance"));
}
