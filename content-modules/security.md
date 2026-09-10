# GStack Growth Console — Security & compliance

## What we handle
GStack processes the product descriptions, market data, and usage information you submit to produce compliance briefs, route payments, and generate analytics. We do not train public models on your submissions without explicit consent.

## Data handling commitments
- Inputs are used only to produce your compliance brief and operate your account; not published or indexed by us.
- Payments processed by Waffo (merchant of record) — we never store full card data.
- Exports contain only your own account data.
- Audit logs are retained for the duration of your subscription plus 30 days.

## Compliance posture
- **GDPR / UK-GDPR** aligned data handling (lawful basis, data minimization, access on request, right to erasure). [ref: GDPR](https://gdpr.eu/)
- **EU VAT & OSS** — GStack maps VAT obligations for digital services sold within the EU and references the One-Stop Shop scheme where applicable. [ref: EU VAT](https://ec.europa.eu/taxation_customs/vat-oss_en)
- **PCI-DSS** — payment card data is handled by Waffo's PCI-DSS compliant infrastructure; GStack does not touch raw card data. [ref: PCI-DSS](https://www.pcisecuritystandards.org/)
- **OWASP** guidance applied for web app security and LLM prompt-injection hygiene. [ref: OWASP](https://owasp.org/)
- **SCCs / adequacy decisions** referenced for cross-border data transfer from EU to non-EU jurisdictions.

## ⚠️ We do NOT guarantee
- We do **NOT guarantee** compliance with any regulation.
- We do **NOT claim 100%** security or uptime.
- We do **NOT promise** the tool will "never miss" an issue — coverage is fixed at the named checks in your plan.
- All compliance output is decision-support, not legal advice. Consult a qualified professional for binding decisions.

## Subprocessors
| Subprocessor | Purpose | Region |
|---|---|---|
| Waffo | Payments (merchant of record) | [region] |
| NVIDIA NIM | LLM inference (platform key) | [region] |
| Vercel | App hosting | Global edge |
