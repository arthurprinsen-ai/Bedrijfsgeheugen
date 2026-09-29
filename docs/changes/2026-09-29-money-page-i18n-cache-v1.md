# Money-page conversion i18n cache closure — 29 September 2026

The revenue-first money-page rollout introduced 54 new public Dutch strings. Production is intentionally fail-closed with `STATIC_I18N_REQUIRE_CACHE=1`, so Netlify rejected the build until every new string had a static English translation.

This change adds all 54 translations in `config/bg-static-i18n-en.d/2026-09-29-money-page-order-conversion.json`.

The production contract remains unchanged: do not disable the cache requirement. Future commercial copy changes must update the English static cache in the same candidate and pass `tests/brain-static-i18n-production-cache-completeness-v1.test.mjs` before promotion.
