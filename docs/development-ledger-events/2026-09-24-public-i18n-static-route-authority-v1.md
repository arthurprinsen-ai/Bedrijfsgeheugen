# 2026-09-24 — Public i18n static-route authority

- Fingerprint: `public-i18n-static-route-authority-20260924-v1`
- Live symptom: `/prijzen` exposed `Switching language failed. Try again.`.
- Root cause: stale persisted English preference triggered runtime translation on an unprefixed Dutch public route.
- Fix: unprefixed public routes initialize as Dutch; public switching navigates to static locale routes.
- Regression: `tests/brain-public-i18n-static-route-authority-v1.test.mjs`.
- Production verifier: `tools/site-shell/verify-pricing-i18n-production.mjs`.
- Delivery PR: #2795.
- Terminal status: pending protected merge + exact-SHA production browser proof.
