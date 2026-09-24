# 2026-09-24 — Powerhouse 50 production source promotion

- Fingerprint: `powerhouse-50-production-source-promotion-v1`
- Obligation: `powerhouse-50-production-source-promotion-v1`
- Feature merge: `94fd9cb6f04118ea9da2d318d49114562f8ce2f5`
- Provider/build fix ancestor: `3e7ef0bd633d4249e91e1a1dadaf3513c33f1ce4`
- Promotion PR: #2767
- Production mechanism: Production Source Snapshot → GitHub OIDC → Netlify deploy bridge
- Product behavior change: none
- Root cause: inherited production-provider lag after a separate pricing build parse failure
- Prevention: isolate feature health from provider lag and use one canonical promotion lineage
- Terminal state: pending exact Netlify provider + release.json + browser readback
- Public i18n regression found by backend gate: unprefixed public switch was in-place instead of static localized route.
- Fix: public switch now uses `location.assign(localizedHref(normalized))`; portal remains in-place.
- Regression: `tests/brain-pricing-i18n-prevention-skill-v1.test.mjs`.
