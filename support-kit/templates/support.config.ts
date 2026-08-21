/**
 * support.config.ts 模板 —— 替换 SUPPORT_CONFIG_FILL_ME_* 占位即可使用。
 *
 * 推荐字段填充规则：
 * - productSlug：小写字母 + 中划线（用作 localStorage sessionKey 前缀、邮件主题前缀、widget.js data-product）
 * - productName：展示在 UI / 系统提示词 / 邮件主题里的中文或英文产品名
 * - feedbackEmail：转人工升级邮件接收人；可用 env.FEEDBACK_TO_EMAIL 覆盖
 * - chatHost：作为 widget.js data-host 默认值与跨站 iframe 源
 * - brandColor：组件强调色，按品牌手册设置（建议与主色板对齐）
 * - complianceDisclaimer：（可选）合规类答复末尾的免责声明
 */
import { KB } from "./agent/kb";
import type { SupportConfig } from "./support-kit/types";

export const SUPPORT: SupportConfig = {
  productSlug: "SUPPORT_CONFIG_FILL_ME_slug",
  productName: "SUPPORT_CONFIG_FILL_ME_name",
  feedbackEmail: process.env.FEEDBACK_TO_EMAIL || "SUPPORT_CONFIG_FILL_ME_email",
  kb: KB,
  chatHost: process.env.APP_URL || "https://SUPPORT_CONFIG_FILL_ME_host",
  brandColor: "SUPPORT_CONFIG_FILL_ME_color",
  complianceDisclaimer: "SUPPORT_CONFIG_FILL_ME_disclaimer",
};
