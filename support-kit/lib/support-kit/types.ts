/**
 * lib/support-kit/types.ts —— 客服/反馈模块「共享支撑包」的类型定义
 *
 * 这是跨产品复用的唯一类型契约：
 * 1. KbEntry —— 知识库条目结构（kb.ts 实现检索）
 * 2. SupportConfig —— 产品级配置（含 KB 数组）
 *
 * 每个产品在自己的 support.config.ts 中提供一份 SupportConfig 实例
 * （不同产品仅 KB 与本文件外的产品元信息不同），其余文件零产品依赖。
 */

export interface KbEntry {
  id: string;
  title: string;
  /** 检索关键词（命中加权最高） */
  keywords: string[];
  /** 正文（答复骨架） */
  body: string;
  /** 出处（用于引用标注，如「官网 FAQ」「产品文档」） */
  source: string;
  /** 语义标签：compliance 等会触发声明/升级策略 */
  tags: string[];
}

/** 产品级配置：多产品环境下唯一的差异来源 */
export interface SupportConfig {
  /** 产品 slug，如 "gstack" | "aiactradar" | "agentredteam" */
  productSlug: string;
  /** 产品中文名，用于系统提示词 / 邮件主题 / 组件标题 */
  productName: string;
  /** 反馈与升级邮件接收人（可被 env.FEEDBACK_TO_EMAIL 覆盖） */
  feedbackEmail: string;
  /** 本产品知识库 */
  kb: KbEntry[];
  /** 部署域名，作为 widget.js data-host 默认值与跨站 iframe 源 */
  chatHost: string;
  /** 可选：领域合规声明，附在合规类答复之后 */
  complianceDisclaimer?: string;
  /** 可选：品牌主色（组件强调色），默认 #2563EB */
  brandColor?: string;
}
