# 2026-09-24 — Pricing production stable-scroll

- Fingerprint: `pricing-production-stable-scroll-before-click-v1`
- Failed run: `36054089352`
- Failed job: `107818017368`
- Exact live SHA at failure: `396b0ca1afbc39ce613ef473c452bf13ac459c59`
- Failure: `locator.scrollIntoViewIfNeeded: Timeout`
- Root cause: Playwright auto-scroll stability wait, before real pointer click.
- Fix: deterministic DOM scroll + preserved Playwright pointer click.
- Regression: `tests/brain-pricing-mobile-lifecycle-actionability-v1.test.mjs`
- Terminal status: pending protected merge and production browser readback.
