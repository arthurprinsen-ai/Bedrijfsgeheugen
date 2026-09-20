# Orchestrator select-pending race — 20 september 2026

Fingerprint: `orchestrator-select-pending-race-v1`.

## Incident
De productie-Edge Function `powerhouse-content-orchestrator` stopte met `ORCHESTRATOR_INTERNAL_ERROR` in stage `select-pending`. Daardoor kon de content closed-loop vóór social dispatch afbreken, terwijl reeds goedgekeurde kanaalcontent in `content_ready` bleef staan.

## Root cause
De queue-head selectie gebruikte PostgREST `.limit(1).maybeSingle()` op de verzameling van `decision='publish'` en `state='decided'`. Deze single-object conversie gaf in productie een read error op het select-pending pad en maakte de volledige orchestrator-run afhankelijk van een fragiele responsevorm.

## Fix
- selecteer de queue-head als array met expliciete sortering;
- sorteer eerst op priority aflopend en daarna channel oplopend voor determinisme;
- gebruik `limit(1)` en neem daarna lokaal element 0;
- behandel een lege array als `NO_PENDING_ARTIFACT`;
- log bij echte databasefouten code, message en details;
- publicatiestatus blijft fail-closed; geen bypass of directe provider-write.

## Preventie
Queue-head selectie in Powerhouse gebruikt voortaan geen `maybeSingle()` wanneer het semantisch om een geordende werklijst gaat. De regressie staat in `tests/brain-powerhouse-content-orchestrator-pending-selection.test.mjs`.

## Evidence
- `supabase/functions/powerhouse-content-orchestrator/index.ts`
- `tests/brain-powerhouse-content-orchestrator-pending-selection.test.mjs`
- `brain/learning/2026-09-20-orchestrator-select-pending-race-v1.json`
- production failure: `ORCHESTRATOR_INTERNAL_ERROR`, stage `select-pending`, 20 september 2026.
