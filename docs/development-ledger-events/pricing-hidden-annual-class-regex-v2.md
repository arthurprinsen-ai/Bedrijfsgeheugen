# Development ledger — pricing-hidden-annual-class-regex-v2

- Trigger: production shell contract failed after intentional yearly billing was restored.
- Root cause: escaped word-boundary tokens in regex literal created a false-negative hidden-class check.
- Fix: correct `.jr` class-boundary regex in live and build-integrity contracts.
- Verification: `tools/site-shell/test-live-contract.mjs` negative fixture plus canonical pricing regression test.
- Delivery state: pending exact-head gates, merge, production deployment and production readback.
