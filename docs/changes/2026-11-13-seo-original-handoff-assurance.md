# 13 november 2026 — SEO-overdracht zonder false-green

## Probleem
De bestaande `seo-opportunity-resolver`-assurance rapporteerde GREEN bij >=1 aanbeveling of voorspelling, terwijl de oorspronkelijke `brain_obligations.GROWTH_SOURCE_DAILY_HANDOFF` van 11, 12 en 13 november OPEN bleven: exacte originele consumer-ACK, maar geen bevestigde productieactie, CRO-experiment of causaal/omzetresultaat. In `powerhouse_growth_source_daily_v1` was `technical_seo_audit` niet onafhankelijk bewezen en was de actuele GA4-bron incompleet. De indicator verwarde een goed lopende resolver met een afgeronde commerciële keten.

## Herstel in de bestaande autoriteit
Beschermde migratie `20261113164000_original_seo_one_chain_outcome_assurance_v2.sql` verandert uitsluitend de oorspronkelijke `powerhouse_refresh_seo_assurance_v1`. Ontvangst geldt pas na exacte bron-SHA256 en original consumer-revisie; productie, meting, resultaat en leertoepassing worden afzonderlijk gecontroleerd. Tot alle externe bewijzen aanwezig zijn is `guard.pass=false`; een succesvolle cron, blog of aanbeveling telt niet als omzet.

De keywordintelligence-bron heeft `tenant_id=canonical`, terwijl de dagelijkse bronverzameling `tenant_id=bedrijfsgeheugen` gebruikt. Deze mapping wordt expliciet, niet weggefilterd. Missende providers blijven UNKNOWN. Eén originele scheduler en dezelfde receipt-registry blijven bevoegd. Geen nieuwe uitvoerders, schema's, backfill, OAuth-bypass, extra tracking of publicatie.

## Verificatie en herstel
Regressietest `tests/brain-seo-original-handoff-assurance-20261113.test.mjs` en migration-time functie-readback. Beveiligde Required/BRAIN/CodeQL/Supabase preview, protected merge, echte productie-migratie-readback en natuurlijke bestaande SEO-run met `guard=false` terwijl de bron OPEN is. Test de exacte `original_obligation_id`/SHA/ACK voor dezelfde tenant/dag. Gevolg blijft OPEN tot onafhankelijke actie- en commerciële outcome-receipts. Geen 'alles groen' zonder die bewijzen.

Rollback uitsluitend met nieuwe beschermde migratie van de eerdere functiebody, niet door handmatig bronbewijs of statussen te herschrijven.

Bronincident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
