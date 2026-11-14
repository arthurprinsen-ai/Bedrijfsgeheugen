# 14 november 2026 — originele commerciële migratiehistorie v856 en Edge-autoriteit

## Werkelijk onafhankelijke productiegegevens
Op 2026-11-14 13:42:27.402065 UTC meldt Supabase project `adhjwmvyoixzjtmiroln` **856** toegepaste native migraties, laatste exacte versie/naam `20261114142500 / original_outreach_feedback_consumer_ack_v2`, 3 SQL-statements. De oorspronkelijke bron-lock was 855. Eén originele wachtende `autonomous_email` ontving met dezelfde research-action-ID, persoon en bedrijf de echte `NO_VERIFIED_SOURCE_RETRY`-status; hij is niet verzonden. De oorspronkelijke #116 cron blijft actief.

## Correctie en preventie
Voeg uitsluitend de **reeds toegepaste** versie 856 toe aan `supabase/migration-history.lock.json`; wijzig nooit oude provideridentiteiten en replay nooit reeds toegepaste SQL. Historische regressies voor 854 en 855 gebruiken voortaan een vaste immutable `lock.applied[N-1]` en `length>=N`; zij mogen bij een nieuwe geldige versie niet kapotgaan. De huidige strenge native/provider-bronpariteit blijft exact. De nieuwe 856-regressie bewaakt beide vorige identiteiten en bevestigt dat de SQL geen Gmail of nieuwe cron bevat.

## Wat nog open blijft
De originele `powerhouse-relationship-public-research` Edge Function is productief nog **v13**; de uitvoerbare bron is ouder dan protected-main PR #5768. SQL/live ACK bewijst dus **geen** Edge-pariteit. Geldige productieautoriteit: uitsluitend de bestaande Supabase GitHub Integration van protected `main`, plus `.github/workflows/supabase-edge-production-authority.yml` als attestation-only. Geen chatdirecte `deploy_edge_function`, dashboarddeploy, tweede scheduler of Make/Buffer-fallback. Bij ontbrekende/falende providercheck blijft status `EDGE_PROVIDER_PARITY_OPEN` met eigenaar Supabase GitHub Integration; niet fictief groen. Referentie oorspronkelijke herstel-PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5768.

## Acceptatie
Protected Required, CodeQL, Supabase-preview, merge, onafhankelijke native-856 versus Git-lock-856. Separaat: exacte Edge-Source SHA / provider versienummer/readback met Supabase GitHub App en succesvolle volgende natuurlijke bron→ontvanger-ACK. Geen gegarandeerde Gmail-mail zolang concrete bron, goedgekeurde boodschap en rechtmatige ontvanger nog ontbreken.
