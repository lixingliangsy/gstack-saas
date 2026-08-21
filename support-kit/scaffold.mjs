#!/usr/bin/env node
/**
 * support-kit/scaffold.mjs —— 一键为新产品接入 AI 客服 + 反馈 能力
 *
 * 用法：
 *   node support-kit/scaffold.mjs \
 *     --target <目标项目绝对路径> \
 *     --slug   <产品 slug, 如 agentredteam> \
 *     --name   <产品中文/英文显示名> \
 *     --email  <反馈接收邮箱> \
 *     --host   <产品部署域名> \
 *     --color  <品牌主色, 默认 #0F766E>
 *
 * 行为：
 *   1) 复制 support-kit/lib/**  + components/ChatWidget.tsx + public/widget.js 到 <target>。
 *   2) 按 templates 复制 support.config.ts 与 kb.ts；用 --slug/--name/--email/--host/--color
 *      替换 SUPPORT_CONFIG_FILL_ME_* 占位。
 *   3) 复制 pages/api/chat.ts、pages/embed/chat.tsx 模板到 <target>。
 *   4) 不会触碰 <target>/pages/_app.tsx；只打印 patches/_app.tsx.patch.md 提示。
 *   5) 打印「接入清单 §4」与「下一步手动事项」。
 *
 * 退出码：0 = OK；非 0 = 中途出错（详情见 stderr）。
 */

import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { color: "#0F766E" };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    const next = argv[i + 1];
    if (a === "--target") out.target = next, i++;
    else if (a === "--slug") out.slug = next, i++;
    else if (a === "--name") out.name = next, i++;
    else if (a === "--email") out.email = next, i++;
    else if (a === "--host") out.host = next, i++;
    else if (a === "--color") out.color = next, i++;
    else if (a === "--disclaimer") out.disclaimer = next, i++;
    else if (a === "-h" || a === "--help") out.help = true;
    else throw new Error(`unknown arg: ${a}`);
  }
  return out;
}

function need(v, key) {
  if (!v) {
    console.error(`ERROR: missing required --${key}`);
    process.exit(1);
  }
  return v;
}

function copyFile(srcAbs, dstAbs) {
  fs.mkdirSync(path.dirname(dstAbs), { recursive: true });
  fs.copyFileSync(srcAbs, dstAbs);
  console.log(`  COPY  ${path.relative(process.cwd(), srcAbs)} -> ${path.relative(process.cwd(), dstAbs)}`);
}

function copyDir(srcAbs, dstAbs) {
  if (!fs.existsSync(srcAbs)) return;
  fs.mkdirSync(dstAbs, { recursive: true });
  for (const name of fs.readdirSync(srcAbs)) {
    const s = path.join(srcAbs, name);
    const d = path.join(dstAbs, name);
    if (fs.statSync(s).isDirectory()) copyDir(s, d);
    else copyFile(s, d);
  }
}

function readText(p) {
  return fs.readFileSync(p, "utf8");
}

function writeText(p, content) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, content, "utf8");
}

function renderTemplate(tpl, ctx) {
  // 占位规则：模板里形如 SUPPORT_CONFIG_FILL_ME_<key>，按 ctx[key] 替换。
  // 兜底：ctx 缺 key 时保留原占位串，便于人工 review。
  return tpl.replace(/SUPPORT_CONFIG_FILL_ME_(\w+)/g, (m, suffix) => {
    const key = suffix.toLowerCase();
    const v = ctx[key];
    return v == null ? m : String(v);
  });
}

function banner() {
  console.log(`
=========================================================
  support-kit scaffold — 多产品 AI 客服 + 反馈 一键接入
=========================================================`);
}

async function main() {
  const args = parseArgs(process.argv);
  banner();

  if (args.help) {
    console.log("用法见 README.md §3（CLI：scaffold.mjs）");
    return;
  }

  const target = path.resolve(need(args.target, "target"));
  const slug = need(args.slug, "slug");
  const name = need(args.name, "name");
  const email = need(args.email, "email");
  // 去掉 scheme：模板会在前面拼 https://，重复就成 https://https://…
  const hostRaw = need(args.host, "host");
  const host = hostRaw.replace(/^https?:\/\//, "");

  if (!fs.existsSync(target) || !fs.statSync(target).isDirectory()) {
    console.error(`ERROR: --target 不是已存在的目录：${target}`);
    process.exit(1);
  }
  if (!fs.existsSync(path.join(target, "package.json"))) {
    console.error(`ERROR: --target 缺少 package.json，确认是 Next.js 项目根目录？`);
    process.exit(1);
  }

  console.log(`\n目标: ${target}`);
  console.log(`Slug: ${slug}  Name: ${name}  Email: ${email}  Host: ${host}  Color: ${args.color}\n`);

  // 1) lib + components + public
  console.log("→ (1) 复制共享库与组件：");
  copyDir(path.join(__dirname, "lib"), path.join(target, "lib"));
  copyFile(path.join(__dirname, "components", "ChatWidget.tsx"), path.join(target, "components", "ChatWidget.tsx"));
  copyFile(path.join(__dirname, "public", "widget.js"), path.join(target, "public", "widget.js"));

  // 2) Templates + 替换占位
  console.log(`\n→ (2) 渲染并写入配置 / KB：`);
  const configTpl = readText(path.join(__dirname, "templates", "support.config.ts"));
  const ctx = {
    slug,
    name,
    email,
    host,
    color: args.color,
    disclaimer: args.disclaimer || "",
  };
  const configOut = renderTemplate(configTpl, ctx);
  writeText(path.join(target, "lib", "support.config.ts"), configOut);
  console.log(`  WRITE lib/support.config.ts  （已注入 slug/name/email/host/color${ctx.disclaimer ? "/disclaimer" : ""}）`);

  const kbTpl = readText(path.join(__dirname, "templates", "kb.ts"));
  writeText(path.join(target, "lib", "agent", "kb.ts"), kbTpl);
  console.log(`  WRITE lib/agent/kb.ts       （占位条目，请人工替换）`);

  // 3) pages/api/chat + embed/chat
  console.log(`\n→ (3) 写入对话端点与跨站嵌入页：`);
  writeText(path.join(target, "pages", "api", "chat.ts"), readText(path.join(__dirname, "templates", "chat.ts")));
  console.log(`  WRITE pages/api/chat.ts`);
  writeText(path.join(target, "pages", "embed", "chat.tsx"), readText(path.join(__dirname, "templates", "embed-chat.tsx")));
  console.log(`  WRITE pages/embed/chat.tsx`);

  // 4) 不动 _app.tsx，打印补丁提示
  console.log(`\n→ (4) ${path.join(target, "pages", "_app.tsx")}（未触碰）`);
  console.log(`     请按 support-kit/patches/_app.tsx.patch.md 在末尾插入 <ChatWidget … />`);
  console.log(`     如该文件已存在 ChatWidget，确保 productName/brandColor/sessionKeyPrefix 取自 SUPPORT，避免产品信息漂移。`);

  // 5) 打印 §4 checklist
  const hostClean = host.replace(/^https?:\/\//, "");
  console.log(`\n→ (5) 接入清单 §4（手动逐项打勾）：`);
  console.log(`     [ ] 替换 lib/agent/kb.ts 占位条目为产品真实 FAQ（5–15 条）`);
  console.log(`     [ ] 在 lib/support.config.ts 确认字段（已自动注入）`);
  console.log(`     [ ] package.json 增加 "nodemailer": "^6.9.0"（feedback 邮件用；可延后）`);
  console.log(`     [ ] 合并 pages/_app.tsx 补丁：注入 <ChatWidget … />`);
  console.log(`     [ ] 跨站引用：<script src="https://${hostClean}/widget.js" data-host="https://${hostClean}" data-product="${slug}"></script>`);
  console.log(`     [ ] 验证：tsc --noEmit && next build 双绿`);
  console.log(`     [ ] 烟测：T1 业务 FAQ → KB 引证；T2 「转人工」→ escalated:true；T3 闲聊 → escalated:true；T4 缺 message → HTTP 400`);

  console.log(`\n✓ 完成。下一步请人工完成 §4 清单（建议先做「替换 KB」再做「验三步构建」）。`);
}

main().catch((e) => {
  console.error("FATAL:", e?.stack || e?.message || e);
  process.exit(1);
});
