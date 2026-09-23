# Pricing toggles + NL/EN interaction recovery — 2026-09-23

## Observed production failure
On iPhone Safari the lifecycle and billing controls were visible but tapping them did not change the active panel or billing state. The mobile language control showed “Switching language failed. Try again.” and the page stayed Dutch.

## Root cause
Pricing listeners were attached directly to the initial DOM nodes. The shared mobile shell can replace those nodes after parsing, so the visible controls can outlive their listeners. The language runtime had a separate architectural fault: on canonical routes it navigated to `/en/<route>`, while production builds intentionally run with `STATIC_I18N_NETWORK=0`. If new copy is missing from the static translation cache, the English route is not emitted and the switch has nowhere valid to go.

## Fix
Pricing uses `/assets/js/pricing-interactions-v4.js?v=20260923-3` with document-level delegated click/change/input handling. NL/EN now switches canonical pages in place using the existing `/api/i18n-translate` runtime; the locale remains persisted in `bg_locale`. Static localized routes are still supported when present. The global i18n runtime URL is cache-busted.

## Closure rule
Do not mark this resolved until the exact merged main SHA is deployed to Netlify production and browser verification proves: lifecycle click changes the visible panel, monthly/yearly changes visible price state, English changes visible page copy, and returning to Dutch restores Dutch copy.
