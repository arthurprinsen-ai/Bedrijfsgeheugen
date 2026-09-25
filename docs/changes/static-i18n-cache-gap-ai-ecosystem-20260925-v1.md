# Complete deterministic English cache after AI-ecosystem copy — 25 September 2026

## Production symptom

The public English route `/en/prijzen` existed and returned HTTP 200, but it was emitted with `data-bg-static-translated="false"`. The runtime fallback then called `/api/i18n-translate`, which returned `502 {"error":"translation_failed"}`. The language UI consequently showed “Switching language failed. Try again.”

## Root cause

The current repository already had the correct deterministic i18n architecture:

- base authority: `config/bg-static-i18n-en.json`;
- incremental authority: `config/bg-static-i18n-en.d/*.json`;
- production provider calls disabled;
- fail-closed cache validation.

The canonical validator identified exactly 119 missing strings, all introduced by the new AI-ecosystem public copy. Pricing translations were already present.

## Repair

Added `config/bg-static-i18n-en.d/2026-09-25-ai-ecosystem.json` with all 119 missing English translations.

Verified on current main source:

- 95 selected public routes;
- 7,508 canonical source strings;
- `STATIC_I18N_CACHE_COMPLETE`;
- `staticEnglish=true`;
- `runtimeFallback=false`;
- `/en/prijzen`: `lang=en`, `data-bg-static-translated=true`, H1 `Prices for digitalization in SMEs`;
- `/en/ai-ecosysteem`: `lang=en`, `data-bg-static-translated=true`.

Public English routes therefore no longer need the failing runtime translation provider for initial rendering.
