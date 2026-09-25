# Production i18n cache authority v2 — 25 september 2026

## Incident

The GitHub→OIDC→Netlify transport was healthy and returned a linked production build/deploy, but Netlify still failed during the site build with exit code 2. Production therefore remained on the older commit `f45ad02f8f719958c00b7ff8e39e3ca2104353b1`.

## Structural correction

The previously generated complete English translation set was stored under `.cache/`. That is not an acceptable release authority: cache directories are mutable build/runtime implementation details.

The same immutable translation blob is now authoritative at:

`config/bg-static-i18n-en.json`

Blob SHA: `63d4e10854c4ddbfa1300fbb5186d8392ec7abfd`.

Netlify builds are now deterministic and provider-independent:
- `STATIC_I18N_NETWORK=0`;
- `STATIC_I18N_REQUIRE_CACHE=1`;
- missing coverage fails with `STATIC_I18N_CACHE_INCOMPLETE`;
- English routes are never emitted untranslated.

The translation provider is no longer part of the normal deploy critical path.

## Terminal proof

This change is complete only after protected merge, exact current-main Netlify production identity and NL→EN→NL browser readback.
