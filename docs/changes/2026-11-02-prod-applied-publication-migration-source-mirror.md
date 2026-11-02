# P0 #4198 — Herstel ontbrekende Git-bron van al toegepaste Supabase-migratie

**Datum:** 2 november 2026. **Eigenaar:** bestaande Supabase production release authority / ONE BRAIN / Heartbeat. **Status:** kandidaat, nog niet live. **Veroorzakende release:** PR #5252 beschermd gemerged in `3621657751881f50240f9dd4a787a76530c7d369`.

## Onafhankelijk bewezen blokkade
Het originele Supabase production GitHub-deploymentcheck `125161001325` faalde met `Remote migration versions not found in local migrations directory`. Read-only query op `supabase_migrations.schema_migrations` gaf **788 toegepaste** productiemigraties. De actuele Git-main bevatte 789 executable SQL-bestanden. Exacte versie/naam-vergelijking: alleen toegepaste versie `20261031135451_publication_sync_preserve_recovery_handoff_v1` ontbrak in Git; de nieuwe, al geteste intake-migraties `20261102074013` en `20261102075243` ontbraken nog in productie. Een bron-merge is dus geen productie-uitrol.

De door Supabase officieel opgeslagen volledige SQL voor versie `20261031135451` is **2875 bytes, byte-identiek** aan het al aanwezige bestand `supabase/migrations/20261031133000_publication_sync_preserve_recovery_handoff_v1.sql`. Beide versies zijn werkelijk door productie toegepast en hebben dezelfde originele idempotente publisher-herstelfunctie. Dit is **geen reden** om productiehistorie aan te passen of te herschrijven.

## Correctie, geen parallel proces
Herstel exact dezelfde provider-SQL onder de werkelijk toegepaste tweede versie in `supabase/migrations/20261031135451_publication_sync_preserve_recovery_handoff_v1.sql`. De functie is de originele `public.sync_content_publication_obligations` met dezelfde `SECURITY DEFINER`, dezelfde beperkte ACL, behoud van `next_action` op bestaande records, en zonder nieuwe scheduler, externe publicatie of provider-receipt. Geen SQL-mutatie in productie via deze kandidaat.

Regressie: `tests/brain-production-publication-sync-migration-mirror-20261102.test.mjs` vereist byte-identieke inhoud en onveranderde oorspronkelijke publicatie-eigenaarschap; `brain/learning/2026-11-02-prod-applied-publication-migration-missing-source-v1.json` legt oorzaak en herstel vast.

## Acceptatie en opvolging
Protected Required/CodeQL/System Map/preview op exacte commit, daarna beschermde merge naar main. Supabase originele GitHub integration moet vervolgens alle twee eerder geblokkeerde intake-migraties **daadwerkelijk** op productie toepassen; bronreadback moet beide versie-identiteiten, triggerdefinities en EXECUTE=false voor browserrollen bevestigen. Pas dan source rollout PROVEN, maar echte betaalde klant, conversie na legitieme identiteitsclaim en retest op volgende natuurlijke run blijven OPEN. P0 #4198 niet sluiten door code alleen.
