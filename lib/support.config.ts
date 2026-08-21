/**
 * lib/support.config.ts —— GStack 的 SupportConfig 实例（多产品环境下唯一的差异文件之一）
 *
 * 复用试点（AIActRadar / AgentRedTeam）只需复制本文件并修改以下字段：
 * - productSlug / productName / feedbackEmail / chatHost
 * - kb：来自本项目 lib/agent/kb.ts 的 KB（领域知识库，各自不同）
 *
 * 其余支撑文件（lib/agent/*、lib/feedback*、components/ChatWidget、public/widget.js、
 * pages/api/chat|feedback|admin/*、pages/feedback.tsx、pages/admin/*）保持零产品依赖。
 */

import { KB } from "./agent/kb";
import type { SupportConfig } from "./support-kit/types";

export const SUPPORT: SupportConfig = {
  productSlug: "gstack",
  productName: "GStack 增长工作台",
  feedbackEmail: process.env.FEEDBACK_TO_EMAIL || "lixingliangsy@163.com",
  kb: KB,
  chatHost: process.env.APP_URL || "https://gstack.example.com",
  brandColor: "#2563EB",
};
