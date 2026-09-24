# 2026-09-24 — Trigger-based MKB acquisition runtime projection v1

Fingerprint: `powerhouse-trigger-based-mkb-acquisition-runtime-v1`

## Change
De bestaande opportunity-scout is uitgebreid met een fail-closed commerciële contextprojectie. Het opportunity-contract en de acquisitie-skill zijn overeenkomstig bijgewerkt en er zijn regressietests toegevoegd.

## Why
De eerste acquisitie-delivery borgde beleid, skill, System Map en learning, maar de opportunity-runtime droeg de nieuwe commerciële velden nog niet expliciet. Daardoor was er een mapping gap tussen acquisitiecontract en execution stack.

## Prevention
Geen commerciële execution zonder expliciete trigger, probleemhypothese, beslissersrol, next action, evidence en minimale confidence. Ontbrekende context blijft null/observe.

## Scope
Geen nieuwe store, CRM of executor. Alleen projectie in bestaande canonical opportunity authority.


## Supabase production projection
Added migration `supabase/migrations/20260924131500_trigger_based_mkb_acquisition_runtime_v1.sql` and regression `tests/supabase-trigger-based-mkb-acquisition-runtime-v1.test.mjs` to close the gap between the in-process opportunity validator and the scheduler-owned production commercial loop.

The migration creates no table and no new cron. It reuses the active `powerhouse-commercial-learning-v1` job, canonical opportunities/forecasts/actions, keeps commercial value at zero without observed value evidence, and only prepares internal research automatically. Provider/outbound side effects remain blocked until existing execution gates are satisfied.

## Productiebewijs — 24 september 2026
Status: **LIVE_BEWEZEN**.

Readback:
- view `powerhouse_mkb_trigger_intelligence_v1` bestaat in productie;
- functies `powerhouse_refresh_trigger_based_mkb_acquisition_v1(date)` en `powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)` bestaan;
- cron `powerhouse-commercial-learning-v1` is actief op `27 * * * *` en roept de trigger-wrapper aan;
- laatste cycle: `actioned`, `external_outreach_executed=false`;
- anon/authenticated hebben geen SELECT/EXECUTE; alleen service_role.

Rollback-safe production canary: trigger `growth`, confidence 0.884, 1 opportunity op `signal`, 1 interne `research_enrichment`-actie, expected value 0, expected revenue 0, forecast revenue potential 0, external side effect false. Na rollback bleven 0 synthetische signalen/opportunities/actions/forecasts achter.

Huidige echte company-trigger kandidaten: 0. Dat is een geldige lege productiestand; de runtime wacht evidence-first op echte company-trigger evidence.
