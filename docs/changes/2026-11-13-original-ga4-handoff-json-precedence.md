# Original #171 content consumer — GA4 SQLSTATE 22P02 herstel

13 november 2026. Bronketen: oorspronkelijke `powerhouse-runtime-scheduler-mux-v1` cron #171 → `public.powerhouse_content_handoff_receipts_v1(timestamptz)` → `brain_obligations.CONTENT_HANDOFF` → originele ONE BRAIN/Heartbeat assurance. Geen nieuwe scheduler, alternatieve consumer, nieuwe queue, provideractie, massale sluiting of bypass.

## Onafhankelijke productieanalyse

De echte productie-stand `content-closed-loop` was RED met `content_handoff.state=SOURCE_RECHECK_REQUIRED`, `content_handoff_failure_sqlstate=22P02`. De originele `powerhouse_refresh_loop_assurance_v1` vangt de fout wel veilig af zodat andere processen blijven draaien, maar kan de inhoudelijke overdracht daardoor niet afhandelen.

Een alleen diagnostische SQL-run heeft de origineelfunctie aangeroepen in een PL/pgSQL subtransactie die **altijd teruggedraaid wordt**, ook wanneer de functie normaal zou slagen. De originele foutmelding was:

```
SQLSTATE 22P02
invalid input syntax for type json
DETAIL Token "ga4" is invalid.
CONTEXT powerhouse_content_handoff_receipts_v1(timestamp with time zone) line 139 at assignment
```

Oorzaak: de branch voor onafhankelijk gemeten blogs bouwde de GA4 bronidentiteit op met:
```sql
v_event:='ga4:'||r.metrics->>'window_start'||':'||r.metrics->>'window_end';
```
De losse `->>`-operatoren werden niet afgeschermd tegen concatenatie; PostgreSQL probeerde de letterlijke `ga4:`-prefix als JSON te parsen.

## Exact herstel, geen nieuwe keten

De **gehele** oorspronkelijke functie uit de laatst geautoriseerde / toegepaste migratie `20261113082500_original_cancelled_social_learning_source_ack_v1.sql` is behouden. De werkende DDL is byte voor byte gelijk aan de actuele productie-`pg_get_functiondef`, behalve voor de precies **één** aangepaste expressie:

```sql
v_event:='ga4:'||(r.metrics->>'window_start')||':'||(r.metrics->>'window_end');
```

De bestaande gates blijven: alleen aantoonbaar `measured_at`, bestaande `window_start`, `window_end`, meetkwaliteit niet `UNVERIFIED`/`INSUFFICIENT_DATA`, onafhankelijke analysis receipt, tenant/source revision/correlation, expliciete oorspronkelijke owner en terminal-proof trigger. Een correct gevormde `ga4:<start>:<end>` is **alleen** een bronidentiteit; geen provider send, klantconversie, aangenomen causaal effect of terminale learning ACK.

Migration: `supabase/migrations/20261113121500_original_ga4_handoff_json_operator_precedence_v1.sql`. Regressie `tests/brain-original-ga4-content-handoff-json-precedence-20261113.test.mjs` toetst exact slechts deze wijziging t.o.v. de bron, bestaande autorisatie en negatieve checks. Machine-leerregel staat in `brain/learning/2026-11-13-original-ga4-handoff-json-precedence-v1.json`. Permanente agentregels en bestaande social/CRO-skill bijgewerkt.

## Acceptatie

Eerst beschermde Required/BRAIN/CodeQL/native Supabase preview; pas daarna automatische migratie via originele GitHub↔Supabase productie-integratie. Verifieer via **onafhankelijke productie** `supabase_migrations.schema_migrations` versie + naam, function-definition met afgeschermde beide JSON-accessors en oorspronkelijke terminal-proof trigger met effectieve `anon`/`authenticated` deny. Daarna moet eerstvolgende natuurlijke #171 assure-run `22P02` niet meer rapporteren en moeten de originele BRAIN-ontvangstbewijzen weer worden verwerkt. 365 open sourceverplichtingen/184 ontbrekende onafhankelijke learningvensters blijven formeel OPEN totdat eigen oorspronkelijke consumer-receipts, provider- en leereffect zijn bewezen. Bestaande maandelijkse/zesuurse schedulers blijven actief, geen tweede lus.

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
