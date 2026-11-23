# Static i18n keys for the 7 November blog — 2026-11-07

## Problem
After the daily blog of 2026-11-07 merged, the BRAIN backend lane on main failed with `STATIC_I18N_CACHE_INCOMPLETE: 2 missing translation(s)` (tests `brain-static-i18n-production-cache-completeness-v1`, `brain-static-i18n-versioned-cache-v1` and the incremental patch merge test).

## Cause
`config/bg-static-i18n-en.d/powerhouse-blog-2026-11-07.json` keys the article as fragments that follow the production transform chain. The BRAIN cache tests look up the final committed blocks: the whole intro paragraph (455 characters) and the intro excerpt including its heading (219 characters). The same class failed on 2026-11-06 (#5494).

## Change
- `config/bg-static-i18n-en.d/powerhouse-blog-2026-11-07-segments.json`: the two exact keys from `STATIC_I18N_CACHE_MISSING`, translated by joining the existing provider translations of the same fragments. The existing patch is untouched.
- Learning record and ledger event; the existing rule `REPREPARE_I18N_PATCH_FROM_FINAL_PUBLIC_TEXT_AFTER_ANY_TEXT_CHANGE` stays the control.

## Not changed
No test weakened, no change to the build script, the main cache, the workflow or other patches. The check stays fail-closed.

## Known limit
The patch generator still produces fragment-level keys, so the next daily blog can fail the same way. Not fixed here.

## Independent gates
Protected Required, CodeQL, original BRAIN backend lane on main.
