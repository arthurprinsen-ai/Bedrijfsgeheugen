# Development ledger — English pricing residual cleanup

- Scope: English `/en/prijzen` commercial copy only
- Root cause: replacement ordering left partially translated phrases
- Fix: deterministic residual translation pass in `tools/site-shell/apply-commercial-pricing-v1.mjs`
- Regression: `tests/brain-commercial-pricing-last-writer-v1.test.mjs`
- Closure requires exact-main Netlify production and public English readback.
