# _app.tsx 补丁：用 patch-package / 手动合并的方式更新
#
# 注入位置：在 `<Component {...pageProps} />` 之后；保留所有原有 Script / Head 等节点。
#
# 最小新增（共 6 行）：
#   import ChatWidget from '../components/ChatWidget';        // 如已有则跳过
#   import { SUPPORT } from '../lib/support.config';
#   …
#   <Component {...pageProps} />
#   <ChatWidget
#     productName={SUPPORT.productName}
#     brandColor={SUPPORT.brandColor}
#     sessionKeyPrefix={SUPPORT.productSlug}
#   />
#
# 如果项目里已有 ChatWidget import，请先检查 productName 是否与 SUPPORT.productName 一致；
# 如果不一致，应以 SUPPORT 为准（避免产品信息漂移）。
#
# ---
# 为什么 scaffold 不直接覆盖 _app.tsx（2026-08-21 复核）
#
# 业界共识（gh-scaffold / scaffor / projectforge 等）：
#   - "Safe by default (no overwrites unless you ask)" — gh-scaffold
#   - "Pre-flight checks abort if any destination file already exists"
#   - "Injections only touch declared targets at declared anchors"
#
# _app.tsx 通常包含产品自有的：
#   - <Script src="..." />  ← Umami / Sentry / 第三方分析
#   - <Head>...</Head>      ← 字体 / 隐私 banner / 品牌 meta
#   - ErrorBoundary / 全局 Context Provider
# 一旦强制覆盖会把产品的可观测性、SEO、隐私合规一次性抹掉。
#
# 当前设计：scaffold 把 patch 打印到 stdout，让产品负责人走 diff 合并。
# 演化路径（不在当前版本）：增加 --merge-chat-widget 选项（AST 注入，
# 仅在 --force 时才覆盖，scaffold 默认 safe-by-default）。
#
# 详细见 https://github.com/JLugagne/scaffor 与
# https://www.npmjs.com/package/gh-scaffold