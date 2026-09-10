// pages/api/waffo-webhook.ts — gstack Waffo webhook receiver.
// Fail-closed verification (HMAC shared secret OR RSA-SHA256 via SDK) + persistent
// dedup (event.id + orderId) + best-effort subscription upgrade by buyer email.
import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { verifyWebhook } from "@waffo/pancake-ts";
import { applyPurchaseToUser } from "../../lib/subscriptions";
import { appendAudit } from "../../lib/auditLog";
import { PRODUCT } from "../../lib/product";

export const config = { api: { bodyParser: false } };

const APP_SLUG = PRODUCT.slug || "gstack";

const UMAMI_URL = (process.env.NEXT_PUBLIC_UMAMI_URL || "").replace(/\/$/, "");
const UMAMI_ID = process.env.NEXT_PUBLIC_UMAMI_ID;

const WAFFO_WEBHOOK_SECRET = process.env.WAFFO_WEBHOOK_SECRET;
const WAFFO_WEBHOOK_PROD_PUBLIC_KEY = process.env.WAFFO_WEBHOOK_PROD_PUBLIC_KEY;
const WAFFO_WEBHOOK_TEST_PUBLIC_KEY = process.env.WAFFO_WEBHOOK_TEST_PUBLIC_KEY;

const PURCHASE_EVENTS = new Set([
  "order.completed",
  "subscription.activated",
  "subscription.payment_succeeded",
  "OrderCompleted",
  "SubscriptionActivated",
  "SubscriptionPaymentSucceeded",
]);

const REFUND_EVENTS = new Set(["refund.succeeded", "refund.failed", "RefundSucceeded", "RefundFailed"]);

function readRaw(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function getSignature(req: NextApiRequest): string | null {
  return (req.headers["x-waffo-signature"] as string) || (req.headers["waffo-signature"] as string) || null;
}

function hmacVerify(payload: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader || !secret) return false;
  let sig = signatureHeader.trim();
  const v1 = /(?:^|,)v1=([^,\s]+)/i.exec(sig);
  if (v1) sig = v1[1].trim();
  else {
    const sha = /sha256=([^,\s]+)/i.exec(sig);
    if (sha) sig = sha[1].trim();
    else sig = sig.replace(/^t=\d+,?/i, "").trim();
  }
  if (!sig) return false;
  const expectedHex = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  const expectedB64 = crypto.createHmac("sha256", secret).update(payload).digest("base64");
  for (const expected of [expectedHex, expectedB64]) {
    try {
      if (sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return true;
    } catch {
      /* next */
    }
    try {
      const sb = Buffer.from(sig, "base64");
      const eb = Buffer.from(expected, "base64");
      if (sb.length && eb.length && sb.length === eb.length && crypto.timingSafeEqual(sb, eb)) return true;
    } catch {
      /* next */
    }
  }
  return false;
}

const DELIVERY_LOG = path.join(process.cwd(), ".data/waffo-deliveries.jsonl");

function loadDeliveryKeys(): Set<string> {
  try {
    const lines = fs.existsSync(DELIVERY_LOG) ? fs.readFileSync(DELIVERY_LOG, "utf-8").split("\n") : [];
    const s = new Set<string>();
    for (const l of lines) {
      if (!l.trim()) continue;
      try {
        const r = JSON.parse(l);
        if (r.eventId) s.add(r.eventId);
        if (r.orderId) s.add("order:" + r.orderId);
      } catch {
        /* skip */
      }
    }
    return s;
  } catch {
    return new Set();
  }
}

function recordDelivery(r: { eventId?: string; orderId?: string; type?: string; amount?: string; currency?: string }) {
  try {
    fs.appendFileSync(DELIVERY_LOG, JSON.stringify({ ...r, ts: Date.now() }) + "\n");
  } catch (e) {
    console.error("[waffo-webhook] delivery log write failed", e);
  }
}

export function isDuplicate(eventId?: string, orderId?: string): boolean {
  if (!eventId && !orderId) return false;
  const seen = loadDeliveryKeys();
  if (eventId && seen.has(eventId)) return true;
  if (orderId && seen.has("order:" + orderId)) return true;
  return false;
}

export function verifyWebhookSignature(raw: string, sig: string | null): boolean {
  if (!sig) return false;
  if (WAFFO_WEBHOOK_PROD_PUBLIC_KEY || WAFFO_WEBHOOK_TEST_PUBLIC_KEY) {
    try {
      verifyWebhook(raw, sig);
      return true;
    } catch {
      return false;
    }
  }
  if (WAFFO_WEBHOOK_SECRET) return hmacVerify(raw, sig, WAFFO_WEBHOOK_SECRET);
  // Fallback: Waffo SDK built-in public keys auto-detect test/prod. This matches the
  // other 5 products' handlers (which call verifyWebhook directly with no env key) and
  // is what lets TEST webhooks verify in this deployment where no WAFFO_WEBHO_* env is set.
  try {
    verifyWebhook(raw, sig);
    return true;
  } catch {
    return false;
  }
}

async function forwardToUmami(p: { currency: string; value: string; transaction_id: string; item_id: string; item_name: string }) {
  if (!UMAMI_ID || !UMAMI_URL) return;
  try {
    const res = await fetch(`${UMAMI_URL}/api/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payload: { website: UMAMI_ID, name: "purchase", data: p, url: "/waffo-webhook", hostname: APP_SLUG } }),
    });
    if (!res.ok) console.error(`[waffo-webhook] Umami send failed: ${res.status}`);
  } catch (e) {
    console.error("[waffo-webhook] Umami send error", e);
  }
}

async function applySubscription(data: any, eventId?: string) {
  const email =
    data?.buyerEmail || data?.email || data?.customerEmail || data?.metadata?.email || data?.customer?.email;
  const productId = data?.productId || data?.product?.id;
  const result = await applyPurchaseToUser(email, productId);
  console.log("[waffo-webhook] subscription apply:", { email, productId, ...result, eventId });
  await appendAudit(APP_SLUG, {
    event: "subscription_apply",
    detail: `${result.reason}${email ? " email=" + email : ""}`,
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const raw = (await readRaw(req)).toString("utf8");

  if (!WAFFO_WEBHOOK_SECRET && !WAFFO_WEBHOOK_PROD_PUBLIC_KEY && !WAFFO_WEBHOOK_TEST_PUBLIC_KEY) {
    // No explicit key env set. Do NOT fail closed: the Waffo SDK ships built-in public
    // keys that auto-detect test vs prod, so verifyWebhookSignature() below still verifies
    // the signature. (Matches the other 5 products, which never set a webhook key env.)
    console.warn("[waffo-webhook] no WAFFO_WEBHO_* env set; using Waffo SDK built-in public keys for verification.");
  }

  const sig = getSignature(req);
  if (!sig) return res.status(401).end("Missing signature");

  if (!verifyWebhookSignature(raw, sig)) return res.status(401).end("Invalid signature");

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return res.status(200).json({ received: true, verified: true });
  }

  const eventType: string = event?.eventType || event?.type || "";
  const data: any = event?.data || {};

  if (REFUND_EVENTS.has(eventType)) {
    return res.status(200).json({ received: true, verified: true, kind: "refund" });
  }

  if (PURCHASE_EVENTS.has(eventType)) {
    const eventId = event?.id || event?.eventId;
    const orderId = data?.orderId;
    if (isDuplicate(eventId, orderId)) return res.status(200).json({ received: true, verified: true, dup: true });
    const currency = String(data?.currency || "USD").toUpperCase();
    const value = String(data?.amount ?? 0);
    const transaction_id = orderId || eventId || `waffo_${Date.now()}`;
    const item_name = data?.productName || APP_SLUG;
    recordDelivery({ eventId, orderId, type: eventType, amount: value, currency });
    await forwardToUmami({ currency, value, transaction_id, item_id: APP_SLUG, item_name });
    await applySubscription(data, eventId);
  }

  return res.status(200).json({ received: true, verified: true });
}
