# Native migratie 20261115162500 werkelijk toegepast, GitHub-bronlock achtergebleven

**15 november 2026 · P0** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

De reeds beschermde oorspronkelijke LinkedIn-migratie uit PR #5878 `supabase/migrations/20261115162500_original_personal_source_supplier_completeness_v4.sql` heeft een echte native Supabase-providerregistratie: project `adhjwmvyoixzjtmiroln`, versie `20261115162500`, naam `original_personal_source_supplier_completeness_v4`, **3 toegepaste statements**. Onafhankelijke broncontrole van de originele `public.powerhouse_ensure_personal_source_rotation_v2(date)` bevestigt het nieuwe `source_text_complete_verified`-gedrag. Providerobservatie `2026-11-15T15:55:57.640411Z`.

GitHub `supabase/migration-history.lock.json` bleef steken op versie `20261115162000`, 869 records, terwijl het oorspronkelijke SQL-manifest al 870 werkelijk uitgevoerde migraties omvatte. Daardoor stopten de bestaande historische migratietests bij een volgende correctie, namelijk de originele sales-action reexecution PR https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5879. Deze bronafwijking mag niet door tijdelijke test-uitschakeling of door `unapplied` voor `applied` uit te geven worden omzeild.

## Exacte correctie
Alleen de **oorspronkelijke** gematerialiseerde providerlock is gecorrigeerd: voeg exact één onafhankelijk toegepaste native `20261115162500`-identiteit toe, leg de providerwaarneming vast en laat alle eerdere 869 bronregels in dezelfde volgorde en met hetzelfde ID staan. Geen nieuwe SQL-migratie, authwijziging, niet-geautoriseerde DB-write, extra scheduler, queue, agent, executor of alternatief releasesysteem.

**Verplichte acceptatie:** huidige provider `schema_migrations` bevat exact deze native versie én 3 oorspronkelijke statements, de originele functie heeft de specifieke relevante broncontrole, de protected migratiehistorie-/source-lock regressies zijn groen en de GitHub-lock bevat exact 870 toepasselijke historische records. Pas daarna mag PR #5879 op de nieuwe oorspronkelijke bronbasis opnieuw getest worden. Dit is uitsluitend migratiebronpariteit, niet innovatie-ACK, providerpublicatie of gerealiseerde klantwaarde. P0 blijft open.
