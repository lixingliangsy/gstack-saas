# GStack 支付集成与产品发布指南

## 第一部分：生产环境 Webhook 配置

### 1.1 Webhook URL 配置

Waffo 需要一个公网可访问的 URL 来发送支付回调事件。

#### 生产环境部署后配置

```
Webhook URL: https://your-domain.com/api/waffo-webhook
```

#### 步骤：

1. **Vercel 部署**
   ```bash
   # 部署到 Vercel
   vercel deploy --prod --yes
   
   # 获取生产域名
   # 例如：https://gstack-saas.vercel.app
   ```

2. **在 Waffo 后台配置 Webhook**
   - 登录 Waffo Dashboard: https://pancake.waffo.ai
   - 进入 Settings → Webhooks
   - 添加 Webhook URL: `https://your-domain.com/api/waffo-webhook`
   - 配置事件订阅：order.completed, subscription.activated

3. **环境变量配置**（Vercel Dashboard）
   ```
   WAFFO_ENVIRONMENT=production
   WAFFO_MERCHANT_ID=your_prod_merchant_id
   WAFFO_PRIVATE_KEY=your_prod_private_key
   WAFFO_WEBHOOK_SECRET=your_webhook_secret
   WAFFO_WEBHOOK_PROD_PUBLIC_KEY=your_prod_public_key
   ```

### 1.2 开发环境 Webhook 测试

开发环境使用测试端点手动触发 webhook：

```bash
# 使用测试端点模拟 webhook
curl -X POST http://localhost:3000/api/test-webhook \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","tier":"pro"}'
```

**参数说明：**
- `email`: 用户邮箱（必填）
- `tier`: 套餐等级（free/pro/enterprise），可选
- `productId`: Waffo 产品 ID，可选（与 tier 二选一）

**返回示例：**
```json
{
  "ok": true,
  "message": "Test webhook processed successfully",
  "input": {
    "email": "user@example.com",
    "productId": "PROD_6zFjdRqcdQQ2HqqhJVY3YR",
    "tier": "pro"
  },
  "result": {
    "ok": true,
    "reason": "upgraded"
  },
  "user": {
    "id": "usr_xxx",
    "email": "user@example.com",
    "plan": "pro",
    "role": "user"
  }
}
```

### 1.3 本地开发公网隧道（可选）

如需在本地开发时接收真实 webhook，可使用内网穿透工具：

```bash
# 使用 ngrok
ngrok http 3000

# 使用 localtunnel
npx localtunnel --port 3000

# 使用 cloudflared
cloudflared tunnel --url http://localhost:3000
```

将生成的公网 URL 配置到 Waffo 测试环境。

---

## 第二部分：产品发布网站和平台

### 2.1 主要发布平台列表

| 平台 | 类型 | URL | 目标用户 | 优先级 | 说明 |
|------|------|-----|----------|--------|------|
| Product Hunt | 产品发现 | https://producthunt.com | 早期采纳者、开发者 | 🔴 高 | 产品发布首选，获取早期用户反馈 |
| Hacker News | 技术社区 | https://news.ycombinator.com | 开发者、技术爱好者 | 🔴 高 | 技术产品必读社区，需遵守社区规则 |
| Reddit (r/SaaS) | 社交社区 | https://reddit.com/r/SaaS | SaaS 从业者 | 🔴 高 | 付费订阅用户获取 |
| Reddit (r/startups) | 社交社区 | https://reddit.com/r/startups | 创业者 | 🟡 中 | 创业相关话题讨论 |
| Reddit (r/webdev) | 社交社区 | https://reddit.com/r/webdev | Web 开发者 | 🟡 中 | 开发者社区 |
| Indie Hackers | 独立开发者 | https://indiehackers.com | 独立开发者 | 🔴 高 | 目标用户精准 |
| GitHub | 代码托管 | https://github.com | 开发者、技术社区 | 🔴 高 | 开源组件/SDK 发布 |
| npm | 包管理器 | https://npmjs.com | JavaScript 开发者 | 🟡 中 | 发布 SDK/工具包 |
| G2 | 软件评测 | https://g2.com | 企业买家、决策者 | 🟡 中 | B2B SaaS 必备评测平台 |
| Capterra | 软件目录 | https://capterra.com | 企业买家 | 🟡 中 | B2B 软件发现平台 |
| AlternativeTo | 软件替代 | https://alternativeto.net | 软件用户 | 🟡 中 | 竞品替代关键词流量 |
| TechCrunch | 科技媒体 | https://techcrunch.com | 科技行业从业者 | 🟢 低 | 需 PR 资源 |
| The Verge | 科技媒体 | https://theverge.com | 大众科技读者 | 🟢 低 | 需 PR 资源 |
| Medium | 内容平台 | https://medium.com | 内容营销、SEO | 🟡 中 | 发布技术文章、SEO 引流 |
| LinkedIn | 职业社交 | https://linkedin.com | B2B 决策者 | 🟡 中 | B2B 产品营销 |
| Twitter/X | 社交平台 | https://twitter.com | 开发者、科技圈 | 🟡 中 | 技术话题、社区运营 |
| YouTube | 视频平台 | https://youtube.com | 教程用户、SEO | 🟢 低 | 产品演示视频 |
| TikTok | 短视频 | https://tiktok.com | 年轻用户 | 🟢 低 | 视情况考虑 |
| App Store | 移动应用 | https://apps.apple.com | iOS 用户 | 🟢 低 | 如适用 |
| Google Play | 移动应用 | https://play.google.com | Android 用户 | 🟢 低 | 如适用 |

### 2.2 目标关键词与标签

**SEO 关键词：**
- SaaS compliance tool
- GDPR compliance checker
- EU AI Act compliance
- VAT compliance tool
- market entry compliance
- automated compliance scanning

**技术标签：**
- #SaaS #Compliance #GDPR #AICompliance #MarketEntry
- #出海合规 #合规扫描 #GDPR合规 #市场准入

### 2.3 发布内容建议

#### Product Hunt 发布
- **标题**: GStack - Automated Compliance Scanner for Global SaaS
- **描述**: Auto-generate GDPR/VAT/consumer protection readiness reports for your SaaS in minutes
- **标签**: SaaS, Compliance, Developer Tools

#### Hacker News 提交
- **标题**: Show HN: GStack - Open-source compliance scanner for SaaS going global
- **链接**: https://your-domain.com

#### Reddit 发帖
- **r/SaaS**: "Built a compliance scanner for SaaS - feedback welcome"
- **r/webdev**: "Automating GDPR compliance checks for SaaS applications"

#### Indie Hackers
- 发布产品发布帖（Launch Post）
- 分享收入数据和发展历程

### 2.4 发布时间建议

| 平台 | 最佳发布时间（UTC） | 说明 |
|------|---------------------|------|
| Product Hunt | 00:00 | 每天午夜刷新，争取当日排名 |
| Hacker News | 08:00-10:00 | 美国东部工作日上午 |
| Reddit | 14:00-16:00 | 避开周末，工作日发布 |
| Indie Hackers | 全天 | 社区活跃度较均匀 |

### 2.5 发布检查清单

- [ ] 产品页面（/pricing.html）完整可访问
- [ ] Demo 视频/截图准备就绪
- [ ] 定价信息准确
- [ ] 注册/登录流程畅通
- [ ] 测试账号可正常体验
- [ ] AI 客服响应正常
- [ ] 支付流程测试通过
- [ ] 文档/帮助页面就绪
- [ ] 社交媒体链接有效
- [ ] SEO meta tags 完整
- [ ] Open Graph 图片准备

---

## 第三部分：监控与维护

### 3.1 支付状态监控

```bash
# 查看交付日志
cat .data/waffo-deliveries.jsonl

# 查看用户订阅状态
curl http://localhost:3000/api/admin/users
```

### 3.2 常见问题排查

| 问题 | 排查步骤 |
|------|----------|
| Webhook 未触发 | 检查 Waffo 后台配置 → 确认公网可达 → 查看服务器日志 |
| 支付成功但套餐未更新 | 使用 test-webhook 手动触发 → 检查用户邮箱匹配 |
| 登录状态不同步 | 清除浏览器 Cookie → 重新登录 → 检查 /api/auth/session |
| 产品 ID 映射错误 | 检查 lib/product.ts 中的 waffoProductId 配置 |

### 3.3 测试账号

```
邮箱：test+gstack+tester001@example.com
密码：TestPassword123!
当前套餐：Pro
```

---

**文档版本**: v1.0
**更新时间**: 2026-08-21
