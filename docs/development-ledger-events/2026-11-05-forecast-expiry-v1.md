# 2026-11-05 — Forecasts get a lifetime

- Canonical obligation: `website|seo-growth|forecast-expiry|20261105-v1`.
- Defect: expired forecasts stayed active and drove 8 of the last 10 daily blogs about the closed CPNL subsidy.
- Scope: one migration, one test, learning and change documentation.
- Already done on production on instruction of Arthur: 3,484 stale forecasts set to expired; blog 5 Nov written off as FAILED (`EXPIRED_FUTURE_EVENT_CLAIM`).
- Required next proofs: protected merge by Arthur and migration applied; next daily blog not about an expired event.
- No claim about visitors or orders.

## 2026-11-06 — provider-migratie #810 vs bronlock 809

- Herkomst: originele Required preflight van PR #5477, run #42184168547, faalde op de eerlijke triple-source migratiegate. Fout: `20261105190000_powerhouse_expire_stale_forecasts_v1.sql` lokaal aanwezig maar ontbreekt in canonieke `supabase/migration-history.lock.json`.
- Onafhankelijke provider-readback: Supabase schema_migrations **810**, max versie `20261105190000`, naam `powerhouse_expire_stale_forecasts_v1`; 810 SQL-scripts in bron na eerder beschermde merge; bestaande bronlock telde 809. Geen mismatch in SQL-naam of dubbele versie, uitsluitend bronlock-appended identiteit ontbreekt.
- Correctie: append exact werkelijk toegepaste entry aan oorspronkelijke JSON-lock, behoud alle 809 vorige entries, geen DDL/SQL- of cronherhaling. Werk hetzelfde machine learning + menselijke wijzigingsdocument bij in de oorspronkelijke herstelbranch.
- Preventie: oorspronkelijke migratie integriteitstest en preflight blijven verplicht voor alle PR’s, ook docs-only. Geen alternatieve writer, fake-providerhistorie of handmatige permissiebypass.
- Laatste bewijs pas na Required/CodeQL en origineel protected merge/readback; natuurlijk cron/blog outcome afzonderlijk EVIDENCE_DUE.
