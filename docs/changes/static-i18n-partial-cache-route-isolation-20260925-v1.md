# Static i18n partial-cache route isolation — 2026-09-25

## Symptom
The public language control worked and /en/prijzen rendered with html lang=en, but the visible H1 remained “Prijzen voor digitalisering in het mkb”. The production browser gate correctly rejected that state.

## Root cause
The static-English builder treated translation cache completeness as a site-wide binary switch. With STATIC_I18N_NETWORK=0, any cache miss anywhere in the public estate caused translateAll() to return no translation map. As a result, all /en/* files were emitted from Dutch source even when their own strings were already present in the cache.

The pricing H1 is split into three normal text nodes and all three already have canonical cache entries:
- Prijzen voor → Prices for
- digitalisering → digitalization
- in het mkb → in SMEs

## Repair
Offline builds now retain the cached translation map and apply all known translations. A missing string falls back only for that string. Route metadata remains truthful: data-bg-static-translated=true only when that route has no remaining gaps.

The build also emits route-level gap diagnostics so new untranslated strings are visible without taking unrelated English pages down with them.

## Terminal contract
The delivery is not complete until protected merge, exact-main Netlify production identity, pricing interaction proof, and NL→EN→NL browser readback on /, /prijzen and /systemen-koppelen are green.
