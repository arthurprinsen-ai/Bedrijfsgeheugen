# 2026-09-24 — Pricing mobile production actionability

- Fingerprint: `pricing-mobile-production-actionability-v1`
- Failed production run: `36049745098`, job `107802035445`.
- Viewport: 390×844.
- Failed target: `[data-bg-stage="loss"]`.
- Root cause: real pointer target could land under sticky site chrome after automatic scrolling.
- Fix: explicit safe positioning + non-zero actionability box + normal Playwright pointer click.
- Forbidden bypasses: `force:true`, DOM `.click()`.
- Deployment closure: operational refresh of `.github/workflows/production-source-snapshot.yml` in the same candidate.
- Regression: `tests/brain-pricing-production-actionability-v1.test.mjs`.
