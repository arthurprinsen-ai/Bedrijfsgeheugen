# I18n fail-closed regression — 25 September 2026

## Observed production defect

Production was on exact main SHA `390e058e581874cb08f5b2d4608d886a5c9a7dcf`, but `/en/prijzen` still exposed Dutch pricing copy.

## Root cause

A later static-translation resilience change unintentionally replaced the fail-closed production catch with `STATIC_I18N_PROVIDER_FALLBACK` + `return null`. That silently restored the old behavior: production could emit English routes without completed English translations.

## Fix

- restore a production throw path: `STATIC_I18N_PRODUCTION_TRANSLATION_FAILED`;
- restore the mandatory post-translation guard: `STATIC_I18N_PRODUCTION_TRANSLATION_REQUIRED`;
- keep deploy previews allowed to work offline;
- strengthen the regression so production fallback-to-null cannot return unnoticed;
- trigger the canonical Production Source Snapshot after merge;
- require the existing production browser verifier to reject Dutch English-routes and the known language-switch error.

This incident strengthens canonical fingerprint `i18n-production-fail-closed-20260924-v1`.
