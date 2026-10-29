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
