# Development ledger — 2026-10-20 revenue learning breaker parity

- **Failure class:** Supabase Edge `revenue-learning-store` ReferenceError and false-success on Netlify HTTP 202 degraded.
- **Source anchors:** production function `revenue-learning-store` v10, `netlify/functions/_revenue-learning-store.mjs`, existing hourly `revenue-learning-project`.
- **Evidence:** Netlify 2026-10-20T11:01:08Z POST 502; Supabase Edge v10 code uses undefined breaker names and differs from GitHub main.
- **Repair:** checked-in reconciled bounded function, declared break windows; Netlify adapter rejects provider degraded envelopes.
- **Safety:** no new scheduler, no customer/tenant data in logs, existing service-token constant and secrets unchanged; no fake impressions/revenue/outcomes.
- **Verification required:** exact-head Required, CodeQL, preview, protected merge, deployed-version source equality, provider canary, runtime receipt and Brain learning evidence.
- **Current status:** CANDIDATE. Production, signed chain and two-tenant evidence PENDING.
