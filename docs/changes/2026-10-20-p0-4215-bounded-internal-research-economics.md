# P0 #4215 — begrens bestaande interne onderzoekseconomie-backfill

Datum: 2026-10-20
Issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Obligation-ID: portal|bounded-internal-research-economics|20261020
Delivery-Lane: backend
Candidate-Type: recovery

## Productiebron en root cause
Supabase postgres_logs om 10:38:38 UTC laten een echte 57014 zien binnen `powerhouse_backfill_internal_research_economics_v1(timestamptz)` bij FOR over SELECT. De functie wordt vanuit de bestaande mux v2/v3 aangeroepen. Het live `pg_get_functiondef` is teruggelezen: de lus verwerkt alle nog niet geboekte interne onderzoeksacties in één transactie, zonder LIMIT. `pg_class` schat 7003 sales_actions / 266 economics-rijen. De huidige unieke economics(action_id)-index borgt dedupe; een exact kandidaatindex ontbreekt.

## Herstel in bestaande autoriteit
Een idempotente productie-migratie behoudt alle predicates, human_approved/evidence_only guards, dedupe, source evidence, recorded_at, SECURITY DEFINER/search_path en onwaargenomen provider/externe kosten. Eén scheduler-aanroep verwerkt maximaal 50 eligible records; de volgende bestaande scheduler-pass gaat verder op basis van `NOT EXISTS economics(action_id)`. Er wordt geen cursor opgeslagen en geen oud record uitgesloten. Een beperkte partial index op de stabiele selectiewaarheid helpt de kandidaatselectie. Geen nieuwe cronjob, tweede Brain, nieuwe tabel of wijziging van commerciële senders.

## Risico en acceptatie
Een korte lock_timeout 2s en statement_timeout 20s voorkomt een onbeperkte DDL-wacht. Nog niet toegepast terwijl de database aantoonbaar verzadigd is. Test replay op exacte predicates, idempotentie, truth en geen deletions. Preview Required + CodeQL en SQL-contract; daarna alleen beschermde merge en veilige productiemigratie via canonieke Supabase route. Voor/na: `pg_indexes`, `pg_get_functiondef`, batchgrootte, backlog, query-timing, cron 171 en 116, pool-/startup-time-outs. Functionele portal HTTP 200, twee tenants en financiële outcome blijven afzonderlijk bewijs vereist. Deze PR is geen LIVE_PROVEN verklaring.
