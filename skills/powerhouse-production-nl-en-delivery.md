# Powerhouse Production NL/EN Delivery

## Purpose
Keep public Dutch/English delivery deterministic, provider-independent at runtime, and terminally verifiable.

## Permanent contract
- Dutch canonical routes are unprefixed: `/`, `/prijzen`, etc.
- English canonical routes are `/en/*`.
- Production builds use `STATIC_I18N_NETWORK=0`.
- Production builds use `STATIC_I18N_REQUIRE_CACHE=1`.
- The immutable English cache is versioned in `config/bg-static-i18n-en.json` plus approved patches.
- An incomplete cache MUST fail the production build. Never publish Dutch source under an `/en/*` URL as fallback.
- Volatile operational metadata such as build timestamps/version stamps MUST be excluded with `data-bg-no-translate` and `translate="no"`.
- Translation providers may enrich cache in CI, but production deployment must not depend on runtime/provider translation.

## Terminal proof
LIVE_BEWEZEN requires protected merge, exact Netlify production commit_ref, NL→EN→NL browser readback, English pricing H1, no visible language error, and Brain/skill/ledger writeback.

## Prevention
If cache validation reports missing strings, repair the cache or classify non-user copy out of the corpus. Never disable `STATIC_I18N_REQUIRE_CACHE` to make production green.
