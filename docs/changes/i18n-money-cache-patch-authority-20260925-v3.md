# i18n money-page patch authority v3 — 25 september 2026

## Root cause

The base English translation cache had been moved from `.cache/` to `config/`, but the incremental money-page translation fragment remained at `.cache/bg-static-i18n-en.d/2026-09-25-money-pages.json`.

The builder correctly reads only the new canonical patch directory `config/bg-static-i18n-en.d`. With `STATIC_I18N_NETWORK=0` and `STATIC_I18N_REQUIRE_CACHE=1`, Netlify therefore failed closed because seven current source strings had no visible cached translation.

## Fix

- moved the existing seven translations byte-for-byte to `config/bg-static-i18n-en.d/2026-09-25-money-pages.json`;
- removed the retired `.cache` patch;
- strengthened the regression to assert the canonical config patch directory and run the offline required-cache validator;
- preserved provider-independent, fail-closed production behavior.

No product copy and no translation content were regenerated.
