# 2026-09-24 — Pricing mobile lifecycle visibility

- Fingerprint: `pricing-mobile-lifecycle-tabs-visible-20260924-v1`
- Failed production run: `36015748460`
- Failed selector: `[data-bg-stage="loss"]`
- Root cause: primary lifecycle controls horizontally overflowed on 390px viewport
- Fix: 2-column mobile grid; 48px minimum touch targets; wrapped labels
- Regression: `tests/brain-pricing-mobile-lifecycle-tabs-visible-v1.test.mjs`
- Production proof required: exact SHA + provider deploy + pricing interaction + English switch
