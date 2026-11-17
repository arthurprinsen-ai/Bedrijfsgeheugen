# 17 november 2026 — Herstel originele Supabase-migratie-identiteit 878

Eigenaar: de al bestaande native Supabase/GitOps migratiecontrole van Bedrijfsgeheugen, P0 https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198.

## Bron en fout

Bij de eerdere oorspronkelijke Result Guardian-reparatie is SQL-migratie `20261117110000_original_guardian_news_source_provider_truth_v2` **reeds echt toegepast** in Supabase-productie. De autonome originele GitOps-registratie van de native versie/name bleef één stap achter: `supabase/migration-history.lock.json` had 877 versies, native management API 878. Alle **eerste 877** versie/naam-combinaties zijn volledig en ordelijk exact gelijk. Alleen de 878e ontbrak. De bestaande Required-tests van onafhankelijke PR #5949 signaleerden dit als zes terechte bronpariteitsfouten. Dat is geen reden om de testen uit te zetten of migraties opnieuw uit te voeren.

## Exact minimaal herstel

Append alleen de native provider-identiteit `{"version":"20261117110000","name":"original_guardian_news_source_provider_truth_v2"}` als originele 878e rij en het feitelijke controletijdstip in dezelfde bronlock. Laat het oorspronkelijke SQL-bestand, Supabase-productie, permissies, scheduler #171, Janitor, website, e-mail en agentwriter onaangeroerd. Geen nieuw migratiebestand, DDL, kopie in een parallel register of afgeleide groene status.

Herleidbare controle: originele native `list_migrations`, volledige ordered 877-prefix gelijk, oorspronkelijk executable bestand `supabase/migrations/20261117110000_original_guardian_news_source_provider_truth_v2.sql`, Required-incident https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/44063305193.

## Preventie

De oorspronkelijke source owner moet bij het native migratieresultaat dezelfde exacte provider version/name, originele source revision en einde-van-apply bewijs automatisch overdragen voordat andere PR's een ouder lock als releasebasis gebruiken. Ontbrekende provider-lock parity blijft `SOURCE_LOCK_PARITY_DUE` in ONE BRAIN. Wijziging uitrollen uitsluitend via originele protected GitHub Required en CodeQL, daarna exact current-main plus native-provider 878 readback. Deze bronfix zegt niets over externe publicaties of gerealiseerde sales.

Geen bulk-afsluiting van open handoffs, geen negeren van nieuwe productie-overschrijvingen, geen nieuwe scheduler, geen herhaalde SQL apply. Nieuwe migraties na deze meting kunnen een nieuwe broncontrole vereisen.
