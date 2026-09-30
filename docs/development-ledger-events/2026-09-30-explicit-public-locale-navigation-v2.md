# 2026-09-30 — RECOVERY — explicit public locale navigation v2

- Fingerprint: `website|i18n|explicit-public-locale-navigation|v2`
- Exact-main Company Brain route was already proven HTTP 200/canonical/visible on mobile + desktop.
- Remaining failure: production pricing NL→EN language click timed out.
- Root cause: implicit anchor default after mobile-menu mutation was not reliable.
- Fix: explicit `location.assign(href)` for public locale-option clicks.
- Regression: `tests/brain-i18n-persistent-navigation-v1.test.mjs`.
- Production canary: `tools/site-shell/verify-pricing-i18n-production.mjs`.
