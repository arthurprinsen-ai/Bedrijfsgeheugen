# P0 Result Guardian: oorspronkelijke composer-provideroverdracht bewijzen

Datum: 17 november 2026. Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
De bestaande #171 Result Guardian en #116 Heartbeat blijven de enigen die de originele commerciële lus bewaken en afhandelen.

## Probleem
De originele Heartbeat gaf green/ACK via pg_net request_id terwijl oorspronkelijke providercalls 32x HTTP 503 PLAN_READ timeout opleverden en de commerciële composer niets verwerkte. De oorspronkelijke PR #5957 herstelt de SQL-performance; de eerstvolgende natuurlijke call om 12:37 UTC gaf onafhankelijk HTTP 200, processed=5, passed=0 en expliciete originele actie-ID's. Dat bewijst technisch consumer-verwerking, geen goedgekeurde bron en geen Gmail-mail. Een succesvolle scheduler/queued request is geen consumer-resultaat.

## Autonome structurele herstelcontrole
Breid de **bestaande** trigger public.powerhouse_original_result_guardian_v1() uit, verbonden aan de bestaande email-executor health tick van #171. Lees uit originele powerhouse_runtime_events event_type= commercial_heartbeat een recent request_id (max 50 minuten), valideer numeric ID en match op net._http_response.id. Leg exact echte provider-HTTP-status, response-at, gematchte original request-ID, parsed processed-count, tijdstempel en classificatie in de originele result_guardian snapshot en de bestaande hourly ONE BRAIN event op.

- 503 PLAN_READ: ORIGINAL_COMPOSER_PLAN_READ_SQL_TIMEOUT, herstel/eerst perf onderzoek, DEGRADED; geen extra onbewezen kandidaat voorbereiden.
- Andere echte HTTP >=400: ORIGINAL_COMPOSER_PROVIDER_HTTP_NON_SUCCESS, DEGRADED; zelfde originele provider owner en fail-closed.
- HTTP 200 + contract + processed >0: ORIGINAL_COMPOSER_PROCESSED_NOT_GMAIL_SENT; betekent alleen daadwerkelijk verwerkte plannen in originele composer, nooit dat de berichten verzendbaar zijn of bezorgd.
- HTTP 200 zonder positief verwerkingsbewijs: ORIGINAL_COMPOSER_HTTP_200_PROCESSING_NOT_PROVEN.
- Geen recent gekorreleerd antwoord: NO_RECENT_CORRELATED_PROVIDER_RECEIPT; geen fictief succes.

Dezelfde oorspronkelijke hourly dedupe, cron #171/#116, originele privacy/bron/recipient checks, research retry, ONE BRAIN, suppressions, regels, en Gmail provider-send exclusiviteit blijven intact. Geen extra scheduler, nieuwe Edge-functie, externe vendor, credential of budgetverhoging. Dienstinterne SECURITY DEFINER trigger heeft exact service_role-only EXECUTE.

## Acceptatie
Protected Required/CodeQL/Supabase Preview -> protected merge -> native migration 20261117124500 -> originele productiefunctie-/rechtenreadback -> eerstvolgende **natuurlijke** #171 health tick die echte native #116/pg_net HTTP ID koppelt en ORIGINAL_COMPOSER_PROCESSED_NOT_GMAIL_SENT of een rode foutcode terugleest. Dit is nog steeds geen commerciële GREEN: 0 source-quality passes en 0 Gmail sends, bronlimiet 432 blijft apart. Volledige E2E alleen met echte specifieke bron, lawful recipient authority, origineel Gmail immutable provider message/thread ID en onafhankelijk action/outcome readback. Bij onvoldoende bron blijft veilige HOLD open.

Regressie: tests/brain-original-guardian-composer-provider-readback-20261117.test.mjs
