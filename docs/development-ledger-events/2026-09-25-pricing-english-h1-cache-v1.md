# Development ledger — pricing English H1 cache v1

- Date: 2026-09-25
- Production SHA at incident: 2a99c27066dc5e5a2782da77c7d988c9cb5f039d
- Netlify production identity: exact current main, ready.
- Canonical brand shell live readback: success.
- Failing contract: tools/site-shell/verify-pricing-i18n-production.mjs
- Exact failure: English route still shows the Dutch pricing H1.
- Root cause: critical pricing H1 resolved to Dutch/identity text in the static English cache.
- Fix: canonical patch mapping the Dutch H1 to "Pricing for SME digitalisation".
- Verifier is intentionally unchanged and remains fail-closed.
- Terminal state: pending protected merge, production deployment and exact browser readback.
