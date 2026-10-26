# P0 #4215 — indexherstel voor twee geobserveerde portaalleesqueries

Datum: 2026-10-20
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: `portal|authenticated-read-index-optimization|20261020`
Delivery-Lane: backend
Candidate-Type: recovery

## Onderbouwing
Productielogs tonen afzonderlijke PostgreSQL `57014` statementtimeouts op `bronpublicaties` (sorteert op `publicatiedatum DESC NULLS LAST`) en `bg_externe_signalen` (filter `toegestaan=true`, sort `gepubliceerd_op DESC NULLS LAST`). Exacte code: `supabase/functions/portal-state-eu/index.ts`, action `entrepreneur_intelligence`, maximaal 350/250 rijen.

De preview schema-readback toont voor `bronpublicaties` alleen een index met **bron_id als eerste kolom**, niet een globale tijdsortering. Voor `bg_externe_signalen` ontbreken een filterende tijdindex en zijn alleen `url` en `onderwerp` geïndexeerd. Preview bevat 0 rijen, dus `EXPLAIN` toont Sort/Seq Scan maar is geen bruikbaar productiebenchmark. Productie-SQL-connecties vielen tijdens onderzoek al uit vóór indexinventarisatie.

## Gerichte aanpassing
Twee additieve B-tree-indexen met `IF NOT EXISTS`, passende `NULLS LAST` en een partial-index uitsluitend voor toegestane signalen. De migratie gebruikt een korte DDL lock-wachttijd; geen scheduler, klantdata, permissie of RLS wordt gewijzigd. Geen verhoging van querytimeout.

## Fail-closed acceptatie
1. Required CI/CodeQL, scope- en learning-contracten; pas daarna beschermde merge.
2. Check productie `pg_indexes` vóór/na migratie en `pg_stat_user_indexes`; expliciete source-SHA/migration-readback.
3. Op representatieve data: `EXPLAIN (ANALYZE, BUFFERS)` van beide queries met echte LIMITs en controle van plannergebruik, lock-/pooldruk en latency p95.
4. Correlatie tussen Netlify 504, Supabase `portal-state-eu` `PORTAL_READ_SLOW/FAILED`, PostgREST en PostgreSQL. Verifieer onafhankelijk de 76 contact-authority- en 42 Heartbeat-timeouts, voorkom overbelasting en overlap zonder de canonieke scheduler uit te schakelen.
5. Authenticated immutable production `GET /api/portal-ondernemersdata` HTTP 200, payload shape, bronversheid en geen stale-as-current; twee geïsoleerde tenant write→Brain ACK→recompute→dashboard readback.
6. Alleen bij zelfstandig bewezen productieacceptatie: #4215 sluiten.

**Geen volledige systeemoplossing geclaimd:** ontbreken van preview-indexen bewijst geen productie-indexontbreken. Een index lost mogelijk een deel van de latency op, niet bewezen resource-/poolverzadiging of de commerciële snapshotproblemen.
