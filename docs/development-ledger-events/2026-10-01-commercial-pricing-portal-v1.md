# Development ledger — unified commercial packaging

- Date: 2026-10-01
- Change: unified SaaS + consulting pricing and Portal V2 entitlement parity
- Canonical commercial catalog: `config/commercial-offers-v1.json`
- Public pricing composer: `tools/site-shell/apply-commercial-pricing-v1.mjs`
- Portal plan access: `portal-v2/plan-access.js`
- Checkout: Starter / Pro / Groei self-service; Enterprise sales-led
- Server-side SaaS plan rows and entitlements updated in existing Supabase tables
- Regression: `tests/brain-commercial-pricing-portal-v1.test.mjs`
- Terminal condition: protected main + Netlify production commit parity + public pricing readback + portal bundle/readback
