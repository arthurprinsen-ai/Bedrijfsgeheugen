# Original Supabase 890 — provider-version-correct AFAS source lock

22 november 2026. Dit is een herstel van de **bestaande** Supabase-migratie-identiteit, geen nieuwe SQL-migratie of extra runtime.

- Supabase project `adhjwmvyoixzjtmiroln` gaf via `list_migrations` onafhankelijke laatste identiteit `20261122162147 / portal_connector_real_afas_source_readback_v1` terug.
- De eerder gemergede bronbestandnaam `20261122162000_portal_connector_real_afas_source_readback_v1.sql` bestaat **niet** als toegepaste migratie onder dit versienummer. De vorige lock telde 889 uitvoerbare migraties.
- De SQL **inhoud blijft ongewijzigd**: enkel de uitvoerbare filename krijgt provider-versie `20261122162147`; de onjuiste filename wordt verwijderd.
- De canonieke `supabase/migration-history.lock.json` krijgt exact één 890ste provider-gelezen regel. Geen verzonnen toegepast versienummer, geen nieuwe DDL of SQL-heruitvoering.
- Alle oorspronkelijke tests, docs en agent skills verwijzen naar dezelfde werkelijke bronfile. Source lock, provider en uitvoerbare lane hebben gelijkheid.
- Regressie: `tests/brain-portal-connector-afas-provider-migration-parity-v1.test.mjs`, plus bestaande Supabase provider-lock invarianten.
- Proof vereist: exact-head Required+CodeQL, protect merge, geen provider mismatch, geen nieuwe live klantdata-claim. Voor volgende `apply_migration` altijd provider-versie teruglezen vóór GitHub bron filename + lock geschreven worden.

## Cryptografische native-provider-readback en eng begrensde release-admission

Onafhankelijke SQL-readback op `supabase_migrations.schema_migrations` voor versie `20261122162147`: exact `name=portal_connector_real_afas_source_readback_v1`, **één opgeslagen statement** en provider-statement-MD5 `c06f2b2d0392a57ca383cf0dddb0eb3c`. De letterlijke protected SQL in het GitHub-bestand heeft **5.569 bytes**, exact dezelfde MD5 en SHA-256 `f9e47051fe44931a1c48e7f7b271b803fd819a82c023fd1243213fb751fc293d`. Dit is geen afgeleid geschat bewijs maar native databank-readback en berekende source hash.

De historisch strenge `tools/ci/protected-supabase-pr-migration-tests.mjs` krijgt daarom een **eenmalige, cryptografisch gepinde en testbare uitzondering** op **uitsluitend** immutable base `933592191851cbd539b0c336fefb49b5a75106d3`, exact D `20261122162000` plus A `20261122162147`, eerste 889 identieke lockrecords, letterlijk één toegepaste 890ste provider-identiteit, exact SQL-bytehash en bestaande RLS/security-guards. Elke andere migratiedeletie of -rename blijft onvoorwaardelijk geblokkeerd. Negatieve tests staan in `tests/brain-verified-afas-890-source-reconciliation-v1.test.mjs`. Hosted Supabase preview en beschermde merge blijven verplicht.
