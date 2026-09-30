# 2026-09-30 — RECOVERY — explicit public locale click navigation

- **Fingerprint:** `website|i18n|explicit-language-option-navigation|v1`
- **Signal:** exact production deploy succeeded, but production NL→EN click canary timed out.
- **Root cause:** language click had split ownership: locale state in `i18n.js`, navigation via browser-default anchor while mobile menu handlers also processed the click.
- **Fix:** `i18n.js` now prevents default and delegates every supported language option to `setLocale(target)`; public route transition is explicit `location.assign(localizedHref(target))`.
- **Regression:** `tests/brain-i18n-persistent-navigation-v1.test.mjs`.
- **Production canary:** `tools/site-shell/verify-pricing-i18n-production.mjs`.
- **Prior production evidence:** deploy `6abcd140f1058f000872d54a`, SHA `94c6474bd511e3031e3603f4c773777e94e3ea56`; affected routes green, locale click failed.
- **Terminal rule:** no LIVE claim until the unchanged click-driven canary is green on production.
