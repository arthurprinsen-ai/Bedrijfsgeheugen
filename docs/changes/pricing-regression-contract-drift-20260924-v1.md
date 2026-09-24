# Pricing regression contract drift — 24 september 2026

Fingerprint: `pricing-regression-contract-drift-20260924-v1`

After #2832 made direct DOM geometry plus `page.mouse.click` canonical, two older regressions still asserted superseded locator behavior and contradicted each other. They are aligned to the canonical verifier without weakening fail-closed visibility, real-pointer or semantic postconditions.

Regression authority:
- `tests/brain-pricing-production-dom-geometry-pointer-v1.test.mjs`
- `tests/brain-pricing-mobile-lifecycle-actionability-v1.test.mjs`
- `tests/brain-pricing-production-actionability-v1.test.mjs`
