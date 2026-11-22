# Original Supabase 890 — provider-version-correct AFAS source lock

22 november 2026. Dit is een herstel van de **bestaande** Supabase-migratie-identiteit, geen nieuwe SQL-migratie of extra runtime.

- Supabase project `adhjwmvyoixzjtmiroln` gaf via `list_migrations` onafhankelijke laatste identiteit `20261122162147 / portal_connector_real_afas_source_readback_v1` terug.
- De eerder gemergede bronbestandnaam `20261122162000_portal_connector_real_afas_source_readback_v1.sql` bestaat **niet** als toegepaste migratie onder dit versienummer. De vorige lock telde 889 uitvoerbare migraties.
- De SQL **inhoud blijft ongewijzigd**: enkel de uitvoerbare filename krijgt provider-versie `20261122162147`; de onjuiste filename wordt verwijderd.
- De canonieke `supabase/migration-history.lock.json` krijgt exact één 890ste provider-gelezen regel. Geen verzonnen toegepast versienummer, geen nieuwe DDL of SQL-heruitvoering.
- Alle oorspronkelijke tests, docs en agent skills verwijzen naar dezelfde werkelijke bronfile. Source lock, provider en uitvoerbare lane hebben gelijkheid.
- Regressie: `tests/brain-portal-connector-afas-provider-migration-parity-v1.test.mjs`, plus bestaande Supabase provider-lock invarianten.
- Proof vereist: exact-head Required+CodeQL, protect merge, geen provider mismatch, geen nieuwe live klantdata-claim. Voor volgende `apply_migration` altijd provider-versie teruglezen vóór GitHub bron filename + lock geschreven worden.
