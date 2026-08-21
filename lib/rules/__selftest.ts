/* Deterministic self-test for the gstack market-access rules engine (no LLM). */
import { detectMarkets, detectSectorRisks, runDeterministicChecks, GS_RULES } from "./gstack-rules";

let pass = 0;
let fail = 0;
function assert(name: string, cond: boolean) {
  if (cond) {
    pass++;
    console.log("  PASS " + name);
  } else {
    fail++;
    console.log("  FAIL " + name);
  }
}

// AC-1: region detection from explicit list + free text
const m1 = detectMarkets("EU, US", "");
assert("detectMarkets EU+US", m1.some((x) => x.code === "eu") && m1.some((x) => x.code === "us"));
const m2 = detectMarkets("", "面向欧洲和英国用户");
assert("detectMarkets from description (eu+uk)", m2.some((x) => x.code === "eu") && m2.some((x) => x.code === "uk"));
const m3 = detectMarkets("", "只做日本市场");
assert("detectMarkets JP", m3.some((x) => x.code === "jp"));
const m4 = detectMarkets("", "no market mentioned");
assert("no market → other", m4.length === 1 && m4[0].code === "other");

// AC-2: GDPR rule fires for EU + PII
const r1 = runDeterministicChecks({ system_description: "SaaS that stores user emails", markets: "EU", collects_pii: "是", business_model: "B2B" });
assert("GDPR (GS-001) hits for EU+PII", r1.hits.some((h) => h.id === "GS-001"));
assert("carries detectedMarkets", r1.detectedMarkets.some((x) => x.code === "eu"));

// AC-3: VAT rule fires for EU + B2C
const r2 = runDeterministicChecks({ system_description: "subscription app", markets: "EU", business_model: "B2C", collects_pii: "否", payments: "是" });
assert("EU VAT (GS-004) hits for EU+B2C", r2.hits.some((h) => h.id === "GS-004"));
assert("PSD2/SCA (GS-009) hits for EU payments", r2.hits.some((h) => h.id === "GS-009"));

// AC-4: App Store rule is global
const r3 = runDeterministicChecks({ system_description: "mobile game", markets: "US", distribution: "App Store", business_model: "B2C" });
assert("App Store (GS-007) hits for distribution=App Store", r3.hits.some((h) => h.id === "GS-007"));

// AC-5: Children rule fires
const r4 = runDeterministicChecks({ system_description: "kids learning app", markets: "US", age_group: "含儿童", business_model: "B2C" });
assert("Children (GS-011) hits for age=含儿童", r4.hits.some((h) => h.id === "GS-011"));
assert("COPPA sector/children via US", r4.detectedMarkets.some((x) => x.code === "us"));

// AC-6: sector risk detection
const sr = detectSectorRisks("an online casino with crypto payments");
assert("sector risk gambling", sr.some((s) => s.includes("赌博")));
assert("sector risk crypto", sr.some((s) => s.includes("加密货币")));

// AC-7: summary counts
const r5 = runDeterministicChecks({ system_description: "eu saas with payments and pii", markets: "EU,UK", business_model: "B2B+B2C", collects_pii: "是", payments: "是", distribution: "两者", age_group: "成人" });
assert("summary high >= 1", r5.summary.high >= 1);
assert("hits non-empty", r5.hits.length > 0);
assert("rulesetVersion present", r5.rulesetVersion === "gstack-market-access@2026-08-20");

// AC-8: non-applicable market rule excluded (US only → no GDPR)
const r6 = runDeterministicChecks({ system_description: "us only app", markets: "US", collects_pii: "是", business_model: "B2B" });
assert("no GDPR for US-only", !r6.hits.some((h) => h.id === "GS-001"));

// AC-9: all rules have required fields
const wellFormed = GS_RULES.every((r) => r.id && r.title && r.regions && typeof r.check === "function" && r.remediation && r.ref);
assert("all GS_RULES well-formed", wellFormed);

console.log(`\nSELFTEST ${fail === 0 ? "ALL PASS" : "HAS FAILURES"} — pass=${pass} fail=${fail}`);
if (fail > 0) process.exit(1);
