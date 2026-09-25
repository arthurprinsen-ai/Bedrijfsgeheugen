# Public copy ↔ static i18n cache coupling v1

Date: 2026-09-25

## Incident
Exact-main production failed after SEO money-page copy changed. The previous versioned English cache was complete before those copy changes, but the new strings were not part of that cache.

## Fix
A small versioned translation overlay now covers the new Exact Online, API-koppeling and Twinfield source strings. The localized-route builder merges versioned overlays into the canonical cache before validation and generation.

## Prevention
Any public HTML copy change must carry its English cache update in the same delivery candidate. A targeted regression protects the changed source strings. Production remains fail-closed: untranslated English is not accepted.
