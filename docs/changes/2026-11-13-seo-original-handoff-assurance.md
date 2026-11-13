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

## 13 november 2026 17:03 UTC — onafhankelijk productie- en overdrachtsbewijs

Beschermde PR [#5748](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5748) is gemerged in `main` op `6e435bdcffc343b1fd834d3d5a65abfeedb67e31`; [Required](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43467928347), inclusief postgres-replay, Supabase preview en broncontract, en [CodeQL](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43467927648) zijn geslaagd. Onafhankelijke Supabase-productie-inspectie bevestigt toegepaste migratie `20261113164000` en de originele `public.powerhouse_refresh_seo_assurance_v1` met exacte bronrevisie, consumer-ACK, productie, meting, uitkomst en volgende-run-leergates. Geen vervangende scheduler of publisher.

De bestaande oorspronkelijke SEO-assurancefunctie is opnieuw geëvalueerd via haar eigen contract; productie-readback: `pass=false`, `state=WAIT_PRODUCTION_ACTION`, `source_received=true`, `consumer_ack_exact=true`, `execution_proven=false`, `measurement_proven=false`, `outcome_proven=false`, `learning_next_run_proven=false`. Exacte originele ONE BRAIN-bronverplichting: `40b62d82-dcd3-4a44-98d0-3f94071008a9`, bron-SHA256 en consumer-revisie `937fd65725813cf0320465b5a92231d86f0faf5327bdd128057e2b6c16baacfb`, verplichting `OPEN`, `optimization_status=NOT_EXECUTED`. De zes oorspronkelijke receipts `action/readback/measurement/outcome/learning/guard` hebben onafhankelijk `pass=false` en dezelfde oorspronkelijke obligation-ID.

De bestaande `powerhouse_refresh_loop_assurance_v1` heeft vervolgens dezelfde status via originele ONE BRAIN/Heartbeat-verplichting `OPERATIONS_ASSURANCE` gepubliceerd: `seo-opportunity-resolver=RED`, `state=OPEN`, bij 7 GREEN en 8 RED lussen. Dit corrigeert het oude vals-groene portaal-/assurance-signaal, maar bewijst uitdrukkelijk **geen** gerealiseerde conversie of omzet. De oorspronkelijke dagelijkse SEO-, content-, bron- en publicatie-executors blijven actief; de volgende **natuurlijke** originele uitvoeringscyclus en echte provider-/leereffecten zijn nog NIET onafhankelijk bewezen. Registreer geen `FULFILLED`, omzet of herstel zonder originele provider- en effectbewijzen.
