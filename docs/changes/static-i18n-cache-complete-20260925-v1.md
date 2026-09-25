# Static i18n production cache completeness recovery — 2026-09-25

Fingerprint: `static-i18n-cache-complete-20260925-v1`.

## Incident
Protected `main` advanced, but Netlify production remained on an older commit. Provider deploy `6ab68cc1620347dff3081d39` failed during the site build.

Exact reproduction of the Netlify build chain identified the blocking error: `STATIC_I18N_CACHE_INCOMPLETE` with 1,926 missing English translations after the production composition scripts had generated or changed public HTML.

## Root cause
The static English cache was validated against an incomplete source surface. The Netlify build first composes and mutates public pages, and only then generates localized routes. That post-composition surface contained strings that were not present in the immutable cache.

The fail-closed behavior was correct: production must not publish partially translated English pages.

## Recovery
A controlled GitHub Actions recovery lane ran the exact pre-i18n production composition, generated the missing English cache entries using the existing authorized Actions secret, and then reran cache validation with network access disabled. Recovery run `36153434965` completed successfully.

The production fix commits only the resulting deterministic cache plus this learning closure. Netlify remains configured with `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=1`.

## Permanent prevention
Every production candidate that can change the public HTML surface must validate English cache completeness after the same composition steps Netlify executes. Missing translations are repaired in CI and committed before deployment; Netlify itself never needs an AI provider key.

Terminal live status still requires protected merge, Netlify exact-main `commit_ref`, and functional NL/EN browser readback.
