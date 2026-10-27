# Development ledger — commercial pricing last-writer recovery

- Canonical public source: `prijzen.html`
- Protected build contract: `tools/site-shell/pricing-build-integrity.mjs`
- Static EN cache: `config/bg-static-i18n-en.d/2026-10-01-commercial-pricing-v2.json`
- Production content gate: `.github/workflows/production-source-snapshot.yml`
- Browser proof: `tools/site-shell/verify-pricing-i18n-production.mjs`
- Regression: `tests/brain-commercial-pricing-last-writer-v1.test.mjs`
- Closure: exact main in Netlify production plus public `/prijzen` readback.
