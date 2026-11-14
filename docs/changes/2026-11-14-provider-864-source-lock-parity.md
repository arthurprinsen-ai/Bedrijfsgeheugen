# 2026-11-14 — Oorspronkelijke migratiehistorie herstellen na innovatieherstel #5800

## Onafhankelijk bronbewijs
Oorspronkelijke Supabase productieproject `adhjwmvyoixzjtmiroln` heeft op `2026-11-14T19:58:11.511607Z` **864 daadwerkelijk toegepaste native migraties** teruggegeven. Laatste exacte version/name is `20261114235900 innovation_original_agent_intake_recovery_v1`, oorspronkelijke beschermd gemergede [PR #5800](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5800) op main SHA `cdb73c78705df28c98a2fc56a98421dff4cabe32`. De originele repository-lock was nog 863. Het vorige origineel beschermde #5805 had 863 identiteiten afgestemd.

## Een beschermde originele source-only correctie
Voeg uitsluitend werkelijk provider-bewezen versie/naam 864 toe aan `supabase/migration-history.lock.json`, behoud oude 863 ongewijzigd, update `captured_at` naar originele provider timestamp. Geen tweede SQL-migratie of out-of-band schemawijziging, geen cron/scheduler/worker/agent/Brain/queue, geen omzeiling van protected CI, geen provider-publicatie of klantdata-aanpassing. Exact-HEAD Required, CodeQL, provider Preview en oorspronkelijke merge plus onafhankelijke main/provider 864/864 readback zijn verplicht.

## Overgebleven innovatiedebt
De daadwerkelijke original-ONE-BRAIN-herstelprocedure heeft 14 historische `INNOVATION_INTAKE` van `RESULT_UNKNOWN` naar `PLANNED` teruggebracht, met 14 nieuwe idempotente originele reconciliatiejobs `RESOLVED` (één poging, `NO_SIDE_EFFECT_STARTED`, `consumer_ack_proven=false`). Na opnieuw uitvoeren van de originele 120s-watchdog boven zijn timeout bleven alle 14 `PLANNED`; geen hernieuwde `WORKER_LOST`. Alle 14 originele `INNOVATION_DELIVERY` verplichtingen staan nog OPEN; 0 geregistreerde echte consumer ACK en 0 onafhankelijk gemeten innovatieresultaten. Heartbeat is terecht `RECOVERY_DUE`. Geen cosmetisch groen na bron-lock-herstel.

Oorspronkelijk P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198. Regressie `tests/supabase-migration-history-integrity.test.mjs`. Brain fingerprint `supabase|migration-history|provider-864-lock-863-source-parity|20261114-v1`.
