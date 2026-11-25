# Forecasts get a lifetime

**Date:** 5 November 2026. **Status:** candidate, not production-proven until merged and applied.

After the blog approval step went live, its first approved blog was blocked by the reader-ready gate (`EXPIRED_FUTURE_EVENT_CLAIM`): the text announced that the Circular Plastics NL subsidy "opens on 6 October 2026". The gate was right. The cause is upstream: `powerhouse_forecasts` rows stay `active` after their own `expected_by`/`horizon_end`, because only forecasts with a calibration obligation are ever expired. 3,826 of 11,626 active forecasts were past their horizon, and the generator only filters on status, so 8 of the last 10 daily blogs were about the same dead signal.

## Change
- `powerhouse_expire_stale_forecasts_v1`: one update, active/claimed forecasts with a horizon before the Amsterdam date become `expired`. Only `status` and `updated_at` change. No deletes.
- One hourly `pg_cron` job (`powerhouse-forecast-expiry-v1`, minute 5). No new scheduler service, publisher, table or edge function.
- Done already, on instruction of Arthur: the same update ran once on production (3,484 rows) and the 5 Nov blog was written off as FAILED with a reason.

## Not proven yet
Merge and applied migration. Then the next daily blog must not be about an expired event. This does not by itself bring visitors or orders.

## 6 november 2026 — live database-identiteit en bronlock gesynchroniseerd

De oorspronkelijke applicatie van de SQL-migratie is in de live Supabase-projecthistorie onafhankelijk gelezen: **810 toegepaste versies**, hoogste versie `20261105190000`, naam `powerhouse_expire_stale_forecasts_v1`. Exact dezelfde uitvoerbare SQL stond al op beschermd `main`. Alleen `supabase/migration-history.lock.json` liep achter (809/810), waardoor het originele Required-preflight #42184168547 (PR #5477) terecht blokkeerde op meerdere integriteitsregressies.

Herstel: voeg uitsluitend de bestaande, werkelijk toegepaste versie + naam aan het bestaande bronlock toe; laat SQL en live provider ongemoeid. Update het originele machineleerrecord en dit menselijke verslag plus de append-only ledger onder één beschermd herstel-PR. Er is géén tweede SQL-uitvoering, verzonnen migratie, afwijkende database-eigenaar, nieuwe cron of verlaagde test. De lockpariteit is pas officieel afgerond na exact-head Required/CodeQL, beschermde merge en onafhankelijke source/providerreadback. De natuurlijke hourly expiry-run en kwaliteit van de eerstvolgende blog blijven afzonderlijk te meten; geen omzet- of leadclaim.
