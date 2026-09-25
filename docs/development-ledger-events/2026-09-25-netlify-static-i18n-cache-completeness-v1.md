# 2026-09-25 — Netlify static i18n cache completeness v1

Observed:
- linked Netlify production build for `66f5051e…` failed during site build;
- Netlify production requires `STATIC_I18N_REQUIRE_CACHE=1`;
- pre-merge gates did not execute the exact cache-completeness validator.

Action:
- add permanent pre-merge regression coverage for `build-localized-routes.mjs --validate-cache`;
- preserve fail-closed production behavior;
- repair any reported missing cache entries in the same lineage;
- require production exact-SHA + pricing/i18n browser proof after redeploy.
