// pages/api/checkout.ts — Server-side Waffo checkout redirect (gstack).
import type { NextApiRequest, NextApiResponse } from "next";
import { PRODUCT } from "../../lib/product";
import { createCheckout } from "../../lib/waffo";
import { getUserFromRequest } from "../../lib/auth";

function withUtm(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_campaign", "opc_launch");
    u.searchParams.set("utm_content", PRODUCT.slug);
    u.searchParams.set("utm_source", "product_site");
    u.searchParams.set("utm_medium", "checkout_cta");
    return u.toString();
  } catch {
    return url;
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const tierRaw = req.query && typeof req.query.tier === "string" ? req.query.tier : "pro";
  const tier = tierRaw === "pro" || tierRaw === "enterprise" ? tierRaw : "pro";
  const cycle = req.query && req.query.cycle === "yearly" ? "yearly" : "monthly";

  const tierDef = PRODUCT.pricing.find((t) => t.id === tier);
  const productId = tierDef?.waffoProductId?.[cycle];

  if (productId) {
    try {
      const session = await createCheckout(productId, {
        slug: PRODUCT.slug,
        buyerEmail: getUserFromRequest(req)?.email,
        successUrl: `https://${req.headers.host}/dashboard?checkout=success&tier=${tier}&cycle=${cycle}`,
      });
      if (session?.checkoutUrl) {
        return res.redirect(302, withUtm(session.checkoutUrl));
      }
    } catch (e: any) {
      console.error("[checkout] mint failed:", e?.message || e);
    }
  } else {
    console.warn("[checkout] missing waffoProductId for", tier, cycle);
  }

  // Graceful fallback: stable Waffo store product page.
  const storeBase = process.env.WAFFO_STORE_URL || "";
  if (storeBase) {
    const target = storeBase.endsWith("/") ? storeBase + PRODUCT.slug : storeBase + "/" + PRODUCT.slug;
    return res.redirect(302, target);
  }
  return res.redirect(302, "/pricing.html");
}
