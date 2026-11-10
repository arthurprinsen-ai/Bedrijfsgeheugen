# 10 november 2026 — originele ONE BRAIN 819e migratie readback

- **Root incident:** https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- **Oorspronkelijke eigenaar:** beschermde Supabase GitOps-release en bestaande GitHub migratiebron, geen tweede control-plane
- **Gecontroleerd:** 2026-11-10 08:19:43.652162 UTC, project `adhjwmvyoixzjtmiroln`
- **Provider feit:** 819 originele migraties, 819 unieke versies, nieuwste `20261110073500_original_content_handoff_receipts_v1`
- **Bronafwijking:** oude lock 818 vóór update, werkelijke uitvoerbare SQL op `main` reeds 819
- **Gekozen herstel:** append exact geverifieerde 819e identiteitsrij aan bestaande lock; oude 818 rows en alle provider-SQL ongemoeid
- **Reproduceerbare regressie:** bestaande historische migratie-integriteitstests, oorspronkelijke Required/CodeQL, native Hosted Preview en terminale productiereadback; zonder deze bewijzen niet terminal GREEN
- **Vervolg:** originele commerciële PR #5543 opnieuw baselinen, exacte candidate-migratie in officiële preview toetsen, protected merge en originele E-mail→provider-ID→BRAIN ontvanger meten
- **Verboden shortcuts:** geen migrations table manipulatie, geen migratiebestand wissen, geen fake applied, geen extra executor of cron, geen onbevoegde email-send
