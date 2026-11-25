# 17 november 2026 — Supabase native versie 876 naar bestaande GitOps-bronlock

Eigenaar: oorspronkelijke GitOps-/Supabase-migratiehistorie-eigenaar. Bestaand P0: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Incident en onafhankelijke broncontrole

Beschermde [PR #5939](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5939) bracht de bestaande Result Guardian-migratie `20261117094500_original_result_guardian_existing_watchdog_v1.sql` op main. Productieprovider `supabase_migrations.schema_migrations` heeft versie `20261117094500` met exact de naam `original_result_guardian_existing_watchdog_v1` **reeds toegepast**. Onafhankelijke bronaudit op `2026-11-17T09:16:03.759162+00:00`: 876 toegepaste migraties; bronlock 875. Alle 875 oude versie-/naamparen komen in exact dezelfde volgorde overeen. Er ontbreekt maar één record: de 876e.

De bestaande `tests/brain-cro-production-migration-lock-20261029.test.mjs` en andere originale GitOps-regressies wezen daardoor beschermde kandidaat #5940 op zes algemene migratie-integriteitsfouten af. Dit was geen bewijs dat het eigenlijke incidentherstel van #5940 fout was, maar een gedeelde productie-/bronconfiguratiefout.

## Herstel binnen dezelfde eigenaar

Schrijf uitsluitend één provider-bewezen versie-/naam-paar bij in `supabase/migration-history.lock.json` met de originele provider-controle-tijd; behoud alle oude records bytegetrouw qua versie/naam, volgorde, originele project-ID en overige schema. **Geen SQL-migratie uitvoeren of opnieuw afspelen**, geen Supabase DDL, extra cron, queue, provider, toegangsverruiming, bypass of nieuwe scheduler. De originele releasepoorten Required, CodeQL en providerreconciliatie blijven beslissend.

## Testbare preventie

- Alle SQL-migratieversies moeten vooraf een onafhankelijke provider-bronidentiteit hebben; het lock is geen zelfgemaakte acceptatie van alleen lokale code.
- Test native provider 876, lock 876, exacte volledige set gelijk, 0 naamconflicten, 0 onbekende of ontbrekende provideridentiteiten.
- Originale migratie-integriteitstest `tests/brain-cro-production-migration-lock-20261029.test.mjs` moet slagen op echte gewijzigde commit.
- Na GitHub-merge bronlock vanuit actuele main opnieuw ophalen en vergelijken met provider; pas dan deze technische stap als live registreren. De bredere ONE BRAIN-agent/lus blijft open tot originele consumer- en resultaatbevestiging.

Geen fictieve zakelijke resultaten, verzonden e-mails, posts of reparaties claimen.
