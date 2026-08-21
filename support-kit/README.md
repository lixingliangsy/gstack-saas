# support-kit —— 多产品 AI 客服 + 反馈 共享支撑包

> 蒸馏自 GStack 已落地的 AIActRadar 复用试点。两类目标产品（AIActRadar / AgentRedTeam / 后续…）
> 接入本 kit，仅需「填空 `support.config.ts`」+「填 KB 条目」，其余代码零修改。

## 1. 包结构

```
support-kit/
├── lib/                              # 跨产品完全共享的代码（直接复制到目标项目）
│   ├── store.ts                      # JSONL/内存存储抽象
│   ├── feedback.ts                   # 反馈落库 + 邮件（懒加载 nodemailer；SMTP 缺时降级到日志+队列）
│   ├── feedback-constants.ts         # 反馈分类常量
│   ├── support-kit/types.ts          # KbEntry + SupportConfig 类型契约（SSOT）
│   └── agent/
│       ├── core.ts                   # 五步：retrieve → memory → generate → guardrails → escalate
│       ├── guardrails.ts             # H1–H5 诚实护栏
│       └── memory.ts                 # 会话记忆 + TTL
├── components/ChatWidget.tsx         # 浮动/全屏客服组件（默认参数为 GStack；通过 props 注入产品信息）
├── public/widget.js                  # 跨站嵌入脚本（vanilla JS，按 data-product 路由）
├── templates/                        # 用户填空用模板
│   ├── support.config.ts             # ← 必填
│   ├── kb.ts                         # ← 必填（5–15 条产品领域知识）
│   ├── chat.ts                       # 复制即用
│   └── embed-chat.tsx                # 复制即用
├── patches/
│   └── _app.tsx.patch.md             # 在目标项目 _app.tsx 注入 ChatWidget
├── lib/agent/kb.ts                   # ← 由模板复制后替换
└── scaffold.mjs                      # 一次性 CLI（详见 §3）
```

## 2. 接入清单 §4（每产品必须完成）

> 这是 Phase 6/Step 2 验证落地的清单。新产品上线前逐项打勾。

- [ ] **1. KB** — 拷贝 `templates/kb.ts` 到 `<产品>/lib/agent/kb.ts`；替换占位条目；保留 `retrieve` 与 `isComplianceRelated` 实现。
- [ ] **2. Config** — 拷贝 `templates/support.config.ts` 到 `<产品>/lib/support.config.ts`；五个字段全部填写（`productSlug`/`productName`/`feedbackEmail`/`chatHost`/`brandColor`，可选 `complianceDisclaimer`）。
- [ ] **3. Chat API** — 拷贝 `templates/chat.ts` 到 `<产品>/pages/api/chat.ts`；调用 `runAgentTurn({...config: SUPPORT})`。
- [ ] **4. Embed 宿主页** — 拷贝 `templates/embed-chat.tsx` 到 `<产品>/pages/embed/chat.tsx`。
- [ ] **5. Widget 挂载** — 按 `patches/_app.tsx.patch.md` 在 `<产品>/pages/_app.tsx` 渲染 `<ChatWidget productName={SUPPORT.productName} brandColor={SUPPORT.brandColor} sessionKeyPrefix={SUPPORT.productSlug} />`。
- [ ] **6. Cross-site script** — 复制 `public/widget.js`，跨站引用时按 `<script src="https://<chatHost>/widget.js" data-host="..." data-product="<slug>">`。
- [ ] **7. 依赖** — `lib/feedback.ts` 用 nodemailer 发邮件。未安装的项目里 `npm install nodemailer@^6.9.0`；如不便安装，模块会**懒加载降级**到「SMTP_NOT_CONFIGURED + 队列兜底」（不阻断主链路）。
- [ ] **8. 验证** — `tsc --noEmit` + `next build` 双绿；烟测三例：
  - T1：在配置域内的 FAQ Q → `mode: "llm"` 或 `"kb-only"`，citations 非空。
  - T2：用户说「转人工」/「投诉」/「退款」 → `escalated: true`。
  - T3：完全无关问题（讲个笑话之类） → `escalated: true`。
  - T4：缺 `message` → HTTP 400 `BAD_REQUEST`。

## 3. CLI：scaffold.mjs（一次成型）

```bash
node support-kit/scaffold.mjs \
  --target E:/AgentCPM/07_一人公司出海项目/agentredteam \
  --slug  agentredteam \
  --name  "AgentRedTeam" \
  --email feedback@example.com \
  --host  https://agentredteam.example.com \
  --color #B91C1C
```

脚本会：

1. 复制 `support-kit/lib/**` 与 `support-kit/components/ChatWidget.tsx` 与 `support-kit/public/widget.js` 到目标项目。
2. 复制 `templates/support.config.ts` 与 `templates/kb.ts` 模板，并把 `--slug/--name/--email/--host/--color` 替换到 SUPPORT。
3. 复制 `templates/chat.ts` 与 `templates/embed-chat.tsx` 到目标项目。
4. 把 `pages/_app.tsx.patch.md` 的内容以**单行注释**的形式插入到目标 `_app.tsx`（不会覆盖原有代码；用标记让你手动合并）。
5. 打印 §4 验收清单。

## 4. 产品差异的红线（必读）

任何产品使用本 kit 时**不能**违反：

- 🟢 **绝不静默 mock** — `lib/agent/core.ts` 已实现「无 LLM 密钥 → kb-only 诚实模式」；不要绕过 `callSupportLLM` 写假 LLM 路径。
- 🟢 **诚实护栏 H1–H5** — 任何 guardrails 触发 `escalate` 时**必须**走 `lib/feedback.ts` 的升级路径，不要直接在 UI 里把邮件内容展示给用户。
- 🟢 **客服应答必须引用 KB 出处** — 让用户能回查 KB 条目的 `source`；系统提示词里规则 1 已强制。
- 🟢 **合规类答复附免责声明** — 在 KB 条目上打 `tags: ["compliance"]`，guardrails 会自动追加免责声明；不要自己拼接。
- 🟢 **配置即代码** — `support.config.ts` 与 `kb.ts` 是多产品环境下唯二可改的文件；其余代码一律通过 props / 参数接收产品信息，不要硬编码产品名或 slug。

## 4.5 三条架构决策的依据（2026-08-21 联网复核）

> 来自以下权威来源的对照：
> - Turborepo / Yarn workspaces / Next.js 多 package 实践（tsconfig composite vs exclude）
> - gh-scaffold / scaffor / projectforge 等 scaffold CLI 的"safe by default"原则
> - Generative AI + HITL 治理（elimu.io、customerscience.com.au、seniorexecutive.com、atchative.com 等）

### 4.5.1 tsconfig 必须排除 `support-kit/**`（不仅是良好实践）

**业界共识**：当 kit 自带 `lib/` 镜像放在应用源码树下时，若不排除，TypeScript 默认 `include: ["**/*.ts"]` 会把 kit 自己的 `core.ts` / `guardrails.ts` / `kb.ts` 当成应用源码参与类型检查，导致：
1. **重复类型冲突**——产品的 `lib/agent/kb.ts` 与 kit 的 `lib/agent/kb.ts` 解析到同一相对路径，引发"re-export"歧义。
2. **错误的工作区边界**——开发者编辑器把 kit 当成应用代码，跳转/重构会污染。
3. **构建产物污染**——`include` 默认会把 kit 的 `.ts` 视作应用源打进 bundle。

**两条可行路径**：

| 方案 | 何时适用 | 实施成本 |
|------|---------|---------|
| **A. `tsconfig.json` 显式 `exclude`（当前）** | kit 仍在应用源码树下，零迁移成本 | ★☆☆ |
| **B. 提取 kit 到仓库根 + TS `composite: true` 项目引用** | 多产品长期演进，希望 kit 独立版本化、独立 CI | ★★★ |

> 详细见 https://turbo.build/repo/docs/handbook/linting/typescript 与 https://turborepo.com/docs/handbook/linting/typescript —— 推荐 **composite + project references** 作为长期演进方向；短期落地用 **exclude**（最低阻力）。

**实施**：每个接入产品的 `tsconfig.json` 在 `"exclude"` 数组中追加 `"support-kit/**"`（参考 GStack / AIActRadar / AgentRedTeam 现状）。

### 4.5.2 scaffold 永远不动 `_app.tsx`

**业界共识**（来自 scaffor / gh-scaffold / projectforge）：

> "Safe by default (no overwrites unless you ask)" — gh-scaffold
> "Pre-flight checks abort if any destination file already exists" — scaffor
> "Injections only touch declared targets at declared anchors; pre-flight aborts if a target is missing" — scaffor

`_app.tsx` 通常包含产品自有的 `<Script>`（Umami / Sentry）、`<Head>`（品牌 / 字体 / 隐私 banner）等关键节点，**强制覆盖等于把产品的可观测性、SEO、隐私合规一次性抹掉**。即使能做到"合并"，AST 级注入也比"覆盖"更稳；前者第一次落地成本高，故选择"打印 patch + 让人工走 diff"。

**当前设计**：
- scaffold 检测到 `<ChatWidget />` 已在 `_app.tsx` 时 → 仍打印 `patches/_app.tsx.patch.md` 内容，**不触碰**原文件。
- 后续演化路径：增加 `--merge-chat-widget` 选项（AST 注入，仅在用户明确 `--force` 时才覆盖）。

> 详细见 https://github.com/JLugagne/scaffor 与 https://www.npmjs.com/package/gh-scaffold。

### 4.5.3 scaffold 永远不写 KB 实际内容（领域知识是产品负责人的活）

**业界共识**（来自 elimu.io / customerscience.com.au / seniorexecutive.com 等）：

> "Combating Hallucinations and Inaccuracies: The most pressing risk is the propensity of generative AI to 'hallucinate' – generating plausible-sounding but factually incorrect information. In critical domains... inaccurate knowledge can have severe, even life-threatening, consequences." — elimu.io

> "Human-in-the-loop (HITL) is a control pattern where a person is deliberately placed inside the AI knowledge workflow to review, approve, correct, or reject content before it becomes 'trusted' knowledge." — customerscience.com.au

> "Subject-matter experts must approve or correct AI-generated responses before they are formally codified or deployed to the assistant." — seniorexecutive.com

> "AI knowledge management works best when humans remain actively involved... AI should: Support decisions, Provide context, Surface relevant history, Suggest possible actions. AI should NOT: Make final decisions, Override human judgment, Replace domain expertise." — atchative.com

**三层人机分工**（参考 customerscience.com.au 的 tiered HITL）：

| 层级 | 角色 | 工作 |
|------|------|------|
| Creation oversight | 产品负责人 / 领域专家 | 写 KB 条目；定范围与可引用来源；定 `tags: ["compliance"]` 等语义标签 |
| Validation oversight | 产品负责人 + AI 检索自检 | 用 scaffold 提供的 `retrieve()` 自测覆盖率；交叉对照官方/上游资料 |
| Publication oversight | 产品负责人签字 | 把 `SUPPORT_KB_FILL_ME` 全部替换为正式 ID；提交前 tsc + next build 双绿 + 烟测三例 |

> AI 负责 **加速与结构化**（草稿生成、引用对仗、跨语言对齐），不负责 **最终事实**。

**实施**：scaffold 只写 1 条占位 `SUPPORT_KB_FILL_ME`，注释明确"不得保留上线"。验证产物见 GStack 14 条 / AIActRadar 10 条 / AgentRedTeam 12 条真实 FAQ。

## 5. 已落地试点

| 产品 | 路径 | 是否通过 §4 |
|------|------|--------------|
| GStack | `E:/AgentCPM/07_一人公司出海项目/gstack-saas/` | ✅ tsc+build 双绿；T1/T2/T4 烟测全过 |
| AIActRadar | `E:/AgentCPM/07_一人公司出海项目/12_Micro_SaaS出海/aiactradar/` | ✅ tsc+build 双绿；T2（EU AI Act 时点）含 KB 引用；T4 400；T5 闲聊 → escalate |
| AgentRedTeam | _待脚手架_ | — |
