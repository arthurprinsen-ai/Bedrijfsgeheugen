# 2026-09-24 — Pricing mobile lifecycle actionability

- Fingerprint: `pricing-mobile-lifecycle-offscreen-click-v1`
- Productie-fout: real click timeout op `[data-bg-stage="loss"]` bij 390×844.
- Root cause: primaire lifecycle-tabs waren afhankelijk van horizontale overflow.
- Fix: mobile wrap + visible overflow; alle fases direct actioneerbaar.
- Regression: `tests/brain-pricing-mobile-lifecycle-actionability-v1.test.mjs`.
- Production verifier blijft echte click gebruiken.
