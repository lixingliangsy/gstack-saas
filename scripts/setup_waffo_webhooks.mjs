// scripts/setup_waffo_webhooks.mjs — Register gstack's webhook receiver with Waffo.
// Run:  node scripts/setup_waffo_webhooks.mjs
// Requires WAFFO_MERCHANT_ID + WAFFO_PRIVATE_KEY in .env.local and a deployed
// webhook URL (GSTACK_WEBHOOK_URL, e.g. https://<your-app>/api/waffo-webhook).
import { WaffoPancake } from "@waffo/pancake-ts";
import fs from "fs";
import path from "path";

const ENV_PATH = path.join(process.cwd(), ".env.local");
function loadEnvLocal() {
  if (!fs.existsSync(ENV_PATH)) return {};
  let raw = fs.readFileSync(ENV_PATH, "utf8").replace(/^\uFEFF/, "");
  const out = {};
  for (const line of raw.split("\n")) {
    const s = line.trim();
    if (!s || s.startsWith("#") || !s.includes("=")) continue;
    const i = s.indexOf("=");
    out[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  }
  return out;
}

const env = loadEnvLocal();
const merchantId = env.WAFFO_MERCHANT_ID;
const privateKey = env.WAFFO_PRIVATE_KEY;
const storeId = env.WAFFO_STORE_ID;
const webhookUrl = env.GSTACK_WEBHOOK_URL;

if (!merchantId || !privateKey) {
  console.error("FATAL: WAFFO_MERCHANT_ID / WAFFO_PRIVATE_KEY missing from .env.local");
  process.exit(1);
}
if (!storeId) {
  console.error("FATAL: WAFFO_STORE_ID missing (your Waffo store id, e.g. STO_xxx)");
  process.exit(1);
}
if (!webhookUrl) {
  console.error("FATAL: GSTACK_WEBHOOK_URL missing (deployed webhook endpoint)");
  process.exit(1);
}

const client = new WaffoPancake({ merchantId, privateKey });
const EVENTS = [
  "order.completed",
  "subscription.activated",
  "subscription.payment_succeeded",
  "refund.succeeded",
  "refund.failed",
];

try {
  const res = await client.webhooks.add({
    storeId,
    channel: "http",
    url: webhookUrl,
    events: EVENTS,
    testMode: false,
  });
  console.log("OK gstack webhook registered:", JSON.stringify(res));
} catch (e) {
  console.error("ERR gstack webhook:", e?.message || String(e));
  process.exit(1);
}
