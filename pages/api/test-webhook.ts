import type { NextApiRequest, NextApiResponse } from "next";
import { applyPurchaseToUser } from "../../lib/subscriptions";
import { findByEmail } from "../../lib/users";
import { PRODUCT } from "../../lib/product";

/**
 * /api/test-webhook — 开发环境 webhook 测试端点
 * 
 * 用于在本地开发时模拟 Waffo webhook 回调。
 * 生产环境请使用 /api/waffo-webhook.ts
 * 
 * 使用方法：
 *   POST /api/test-webhook
 *   Body: { "email": "user@example.com", "productId": "PROD_xxx" }
 *   或   { "email": "user@example.com", "tier": "pro" }
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 仅在开发环境可用
  const isDev = process.env.NODE_ENV !== "production";
  if (!isDev) {
    return res.status(403).json({ error: "Test webhook only available in development mode" });
  }

  try {
    const body = req.body || {};
    const { email, productId, tier } = body;

    // 参数校验
    if (!email) {
      return res.status(400).json({ error: "email is required" });
    }

    // 根据 tier 查找 productId（可选便捷方式）
    let resolvedProductId = productId;
    if (!resolvedProductId && tier) {
      const tierConfig = PRODUCT.pricing.find((t) => t.id === tier);
      if (tierConfig?.waffoProductId?.monthly) {
        resolvedProductId = tierConfig.waffoProductId.monthly;
      }
    }

    if (!resolvedProductId) {
      return res.status(400).json({ 
        error: "productId or tier is required",
        available_tiers: PRODUCT.pricing.map((t) => t.id)
      });
    }

    // 查找用户
    const user = await findByEmail(email);
    if (!user) {
      return res.status(404).json({ error: "User not found", email });
    }

    // 应用购买到用户
    const result = await applyPurchaseToUser(email, resolvedProductId);

    // 验证更新结果
    const updatedUser = await findByEmail(email);

    return res.status(200).json({
      ok: true,
      message: "Test webhook processed successfully",
      input: { email, productId: resolvedProductId, tier },
      result,
      user: {
        id: updatedUser?.id,
        email: updatedUser?.email,
        plan: updatedUser?.plan,
        role: updatedUser?.role,
      },
      product_map: PRODUCT.pricing.map((t) => ({
        tier: t.id,
        productId: t.waffoProductId?.monthly,
      })),
    });
  } catch (error: any) {
    console.error("[test-webhook] Error:", error);
    return res.status(500).json({ 
      error: "Internal server error",
      message: error?.message || String(error)
    });
  }
}
