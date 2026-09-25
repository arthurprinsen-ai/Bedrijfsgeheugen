# Static i18n terminal fail-closed recovery — 25 September 2026

## Incident

Netlify and protected `main` were already aligned, but the production browser gate proved that `/en/prijzen` still rendered the Dutch pricing H1.

## Root cause

Production was configured with `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=0`. When the immutable English cache was incomplete, `build-localized-routes.mjs` was therefore allowed to generate an English route from untranslated Dutch source and mark it for runtime fallback. Runtime translation was not a valid production authority.

A previously validated full cache reduced the current gap from 1,926 strings to one item: a dynamically generated version stamp such as `versie 25 sep, 19:00`. That value changes every build and must never be a translation-cache key.

## Fix

- restore the previously validated immutable English cache;
- mark the version stamp `data-bg-no-translate translate="no"`;
- restore `STATIC_I18N_REQUIRE_CACHE=1` while keeping network translation disabled in production;
- retain mobile NL→EN→NL browser proof and explicit English pricing-H1 verification.

The production contract is now deterministic: incomplete English coverage blocks the build instead of publishing Dutch content under an English URL.
