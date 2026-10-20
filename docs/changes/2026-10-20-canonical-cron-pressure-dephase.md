# P0 #4215 — veilige spreiding van twee bestaande cronjobs

Datum: 2026-10-20
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: portal|canonical-cron-pressure-dephase|20261020
Delivery-Lane: backend
Candidate-Type: recovery

## Feitelijk productieonderzoek
Supabase SQL kon na tijdelijke connection timeouts de actieve cron-jobinventaris teruggeven.
- #116 `powerhouse-commercial-learning-v1`: `0,5,7,10,12,15,20,22,25,27,30,35,37,40 * * * *`; commerciële stage-indeling hoort bij dit commando en mag niet worden gewijzigd.
- #130 `powerhouse-portal-visual-assurance-sync-v1`: `12 * * * *`, licht HTTP-outboxverzoek naar bestaande Edge Function; dezelfde startminuut als #116.
- #46 `powerhouse-revenue-intelligence-snapshot-15m`: werkelijk `52 * * * *` (één keer per uur, ondanks naam), zware prognose- en revenue-snapshot met statement_timeout 90 s.
- #129 `powerhouse-autonomous-outreach-assurance-hourly-v1`: `52 * * * *`, gelijktijdig met #46.
- #138 identity, #171 mux blijven actief en hun commando's, frequenties en startminuten ongewijzigd.
- PostgreSQL 57014 en pg_cron startup timeouts zijn onafhankelijk gelogd; twee portal-query-indexen uit PR #4537 ontbreken op het moment van readback in productie.

## Wijziging
Wijzig uitsluitend de schedules van de twee reeds bestaande actieve eigenaren:
- #130: `:12` -> `:45` (ieder uur).
- #46: `:52` -> `:55` (ieder uur).

Geen sender, commerciële stage, provider-token, tenant-data, job-ID, runfrequentie, jobcommand, privacyregel of nieuwe scheduler verandert. De migratie weigert onverwachte schedules/commands en is idempotent. In de beschikbare preview bestaat de oudere revenue-snapshotowner nog 4× per uur op minuten 7,22,37,52; de migratie herkent en **behoudt** deze afwijkende frequentie expliciet, in plaats van 4 runs stilzwijgend tot 1 run te reduceren. In productie is de actuele owner aantoonbaar 1× per uur op minuut 52 en wordt alleen die owner naar minuut 55 gezet. Afwezige previewowners worden niet gereconstrueerd. Verminderde gelijktijdige startdruk is de bedoeling, niet reeds gemeten resultaat.

## Acceptatie / geen kunstmatig groen
1. Required CI, CodeQL, Supabase Preview contract en protected merge op exact head.
2. Op een voldoende gezonde productieverbinding: `cron.job` readback voor 46/130/116/129/138/171, actieve status en ongewijzigde commands; controle migratiegeschiedenis.
3. Controleer `cron.job_run_details` en Postgres logs na minstens een geplande cyclus; aantallen failures, startup timeouts en CPU/pool over rolling windows.
4. Indien stabiel: toets of migratie `p0_4215_portal_read_sort_indexes` daadwerkelijk ontbreekt (geen blind retry); herbeoordeel locking, voer veilige bestaande migratie uit bij lage belasting en controleer echte indexen en queryplannen.
5. Diagnostic PR #4535 met stage-meting behouden; signed Netlify `/api/portal-ondernemersdata` moet HTTP 200 teruggeven en twee geïsoleerde tenants moeten hun write→sourceRevision→Brain ACK→recompute→dashboards readback leveren.

P0 #4215 blijft OPEN totdat het hele klantgegevenspad LIVE_PROVEN is; deze maatregel kan niet onafhankelijk databasebelastingsherstel aantonen.
