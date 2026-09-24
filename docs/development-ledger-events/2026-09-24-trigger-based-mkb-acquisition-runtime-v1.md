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
