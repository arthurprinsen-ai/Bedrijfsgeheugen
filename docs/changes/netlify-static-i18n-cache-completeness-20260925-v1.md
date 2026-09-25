# Netlify static i18n cache completeness — 25 September 2026

Netlify production runs with `STATIC_I18N_REQUIRE_CACHE=1`. That is intentionally fail-closed: every translatable string on every public route must already exist in the committed English cache.

The production build for `66f5051e…` failed after merge, while pre-merge gates had been green. The structural defect is the missing parity between production and pre-merge validation.

This change adds a permanent regression test that executes:

`node tools/site-shell/build-localized-routes.mjs --validate-cache`

with network translation disabled and the production cache requirement enabled. New public copy must therefore bring its cache entry in the same PR, before Netlify ever sees it.

The production fail-closed policy remains intact.
