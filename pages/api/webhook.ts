// pages/api/webhook.ts — re-export of the canonical gstack Waffo webhook handler.
// The registered webhook URL is <alias>.vercel.app/api/webhook, but the implementation
// lives in ./waffo-webhook. This thin module mounts it at the expected path so Waffo's
// TEST webhook POSTs resolve (fixes the prior 404). No logic is duplicated here.
export { default, config } from "./waffo-webhook";
