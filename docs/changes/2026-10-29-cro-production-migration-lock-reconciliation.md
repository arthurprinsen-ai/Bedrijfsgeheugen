# CRO productiemigraties — bronlock na onafhankelijke provider-readback

**Datum:** 29 oktober 2026. **Eigenaar:** bestaande Powerhouse migratie-/Revenue Learning-lane. **Incidentfingerprint:** `supabase|revenue-learning|migration-history-lock-stale-after-production-20261029`. **Geen** nieuwe scheduler, databasewriter, parallelle migratieketen of betaalde preview aangemaakt.

## Menselijke diagnose
Na de beveiligde #5143-merge naar main `3ce83006f53a22f3f3d5aa19d99a1b4aed024cfc` en Netlify-deploy `6ae37fb06560c830c2117c32` was Revenue Learning-workflow `40919925385` rood, met precies één van 92 unit-/integratietests fout: `only explicitly pending replay baselines may be local-only`. De werkelijke oorzaak is **niet** een mislukte migratie of een onveilige fallback. Het bronbestand `supabase/migration-history.lock.json` liep achter op de productie-migratiehistorie. Ook de veilige herhaling van dezelfde oude commit faalde, omdat herhalen de Git-bron niet corrigeert.

## Onafhankelijk providerbewijs
Uit `supabase_migrations.schema_migrations` zijn de volgende bestaande versie+naam-identiteiten exact teruggelezen:
- `20261029122836_sales_cycle_execution_truth_guard_20261029.sql`
- `20261029125100_sales_cycle_negative_terminal_reconcile_v1.sql`
- `20261029125607_powerhouse_cycle_writer_provenance_20261029.sql`
- `20261029174600_growth_cta_alias_truth_and_idempotent_backfill.sql`
- `20261029174700_cro_observed_experiment_and_lead_order_evidence_v1.sql`

De laatste twee bevatten de CTA-aliascorrectie en de read-only CRO-bewijsweergaven; beide staan daadwerkelijk op productie. Historisch `primary_cta_click`-event op `/over-ons` van 1 oktober: exact één persistente event-ID en één CTA in de dagaggregatie. `anon` en `authenticated` krijgen nog steeds geen EXECUTE op de interne SQL-functie.

## Herstel en preventie
In deze kandidaat verandert alleen de bronlock, één Brain-learningrecord, regressiontests en menselijke change/activiteitenlogdocumentatie. Er wordt **geen** productiemigratie opnieuw gedraaid, geen historisch migratiebestand hernoemd en geen ledger zonder providerbewijs ingevuld. Nieuwe regressie `tests/brain-cro-production-migration-lock-20261029.test.mjs` en bestaande `tests/supabase-migration-history-integrity.test.mjs` blokkeren toekomstige bron-/providerdrift. Agentpreflight erft `AGENTS.md` en bestaande `.agents/skills/powerhouse-seo-conversion-orders/SKILL.md`; incident in de bestaande ONE BRAIN failure registry blijft OBSERVED totdat protected CI en merged-main herhaalde Revenue Learning-resultaten onafhankelijke sluiting aantonen.

**Status:** broncorrectie als PR-kandidaat. `LIVE` voor backend-code is afzonderlijk bevestigd op exact Netlify-SHA; `CI_HISTORY_LOCK_RECONCILED` en `REVENUE_LEARNING_GREEN` zijn **nog niet** bewezen tot de eigen PR is gemerged en een verse main-run slaagt. Ook de volgende natuurlijke geconsenteerde CTA-conversie en echte gekwalificeerde leads/orders blijven open.


## Volledige productie-lockreconciliatie en aparte previewfout — 29 oktober 2026
De hoofdbranch en de productieprovider bevatten exact 784 uniek gematchte SQL-migraties (versie+naam). De hoofdbranch-lock bevatte 774, de oorspronkelijke herstel-PR had 779; de vijf later toegepaste migraties zijn nu ook in DEZELFDE oorspronkelijke PR gekoppeld:
- `20261029180000_bg_cro_event_uid_v1.sql`
- `20261029181000_bg_cro_behavior_daily_v1.sql`
- `20261029182000_bg_cro_allowlisted_event_types_v1.sql`
- `20261029183000_instagram_media_ensure_claim_monotonicity_v1.sql`
- `20261029185000_bg_cro_validate_event_types_v1.sql`

De bestaande Supabase-preview bevat 779 reeds toegepaste versies; precies de vijf hierboven ontbreken. Supabase's GitHub Preview-controle geeft SQLSTATE 23505 op oudere, reeds aanwezige versies 20261005142118 en 20261011111605. Die oude migratiebestanden bevatten geen INSERT naar migratiehistorie. Dit is een aparte providerreplay-/geschiedenisfout, NIET de bronlockafwijking; corrigeer het met de officiële migratiebeheerder, zonder de provider-status handmatig groen te maken of migraties opnieuw uit te voeren.

Permanent preflight-contract: eerst volledig driehoeksvergelijk Git-migratiebestanden, originele source lock en echte productie-migratiehistorie; fout als enige versie/naam ontbreekt. Daarna blijft exact-head onafhankelijke Supabase Preview een afzonderlijk verplicht bewijs. Bij een reeds toegepaste versie en SQLSTATE 23505: plaats in RESULT_UNKNOWN/RECOVERY_REQUIRED en controleer providerhistorie vóór enige veilige herstap. Geen extra scheduler, kostenplichtige preview of ongecontroleerde rollback.
## Doorwerking in bestaande agent-vaardigheden
De originele `.agents/skills/powerhouse-self-improvement-layer/SKILL.md` bevat nu een pre-spend/preflight van alle bronmigraties, oorspronkelijke source lock en actuele productiemigratiehistorie op volledige versie+naamidentiteit. Nieuwe verschillen moeten door de oorspronkelijke exclusieve migratiewriter in dezelfde PR worden hersteld, vóór externe previewuitvoering. Een fout `PREVIEW_PROVIDER_HISTORY_REPLAY_CONFLICT` (SQLSTATE 23505 op reeds in preview aanwezige versie) betekent STOP/onderzoek met Supabase-herstelmechanisme; geen databasehistorie-DML, geforceerde merge, nieuwe betaalde preview of schijngroen. Het leercontract vereist `tests/brain-*.test.mjs`; generieke tests mogen als aanvullende `learning.tests` blijven. De gekoppelde regressietest valideert het bestaan van deze agentinstructie. Dit is broncodeborging; onafhankelijke runtime-adoptie door élke agent blijft een aparte bewijsverplichting.
