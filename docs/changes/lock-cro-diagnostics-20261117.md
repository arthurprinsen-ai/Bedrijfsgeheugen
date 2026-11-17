# Migratielock: CRO-diagnostiekmigratie van 17 nov toegevoegd (880)

Main werd rood nadat #5964 (feat(cro) diagnostiek) migratie `20261117162500_powerhouse_cro_site_social_diagnostics_v1.sql` toevoegde zonder de lock bij te werken (879 in lock, 880 bestanden). Besluit Arthur 17 nov 2026: los alles op en beslis zelf.

- Providerreadback (Supabase `list_migrations`, project `adhjwmvyoixzjtmiroln`, 17 nov 2026): `20261117162500 powerhouse_cro_site_social_diagnostics_v1` staat als laatste toegepast.
- `supabase/migration-history.lock.json`: die ene regel toegevoegd en `captured_at` bijgewerkt. Geen test aangepast of overgeslagen.
- Lokaal: zeven lock-/migratietests groen (`brain-cro-production-migration-lock-20261029`, `brain-original-supabase-800-provider-migration-lock-20261104`, `brain-production-supabase-790-provider-source-parity-20261102`, `brain-original-provider874-lock-reconcile-20261116`, `brain-migration-lock-pr-gate-20261105`, `brain-migration-history-lock-controlegroep-20261028`, `supabase-migration-history-integrity`).
- Niet bewezen: exact-head checks op de PR en productie-readback na merge.
