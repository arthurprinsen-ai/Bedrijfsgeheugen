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


## Production proof — 24 september 2026
- GitHub main merge: `4e16c5c496241ce516cd13373103c51b4f9fd6dd`.
- Supabase migration `trigger_based_mkb_acquisition_runtime_v1`: succesvol toegepast op `adhjwmvyoixzjtmiroln`.
- Readback: `powerhouse_mkb_trigger_intelligence_v1`, refresh-function en scheduler-wrapper bestaan.
- Scheduler readback: bestaande `powerhouse-commercial-learning-v1`, `27 * * * *`, actief, command `select public.powerhouse_trigger_based_mkb_acquisition_cycle_v1();`.
- Eerste gecontroleerde refresh: 0 eligible triggers, 0 opportunities, 0 interne research-actions, 0 forecasts, geen externe outreach.
- Negatieve safety-readback: 0 gewone `connection_activated` events foutief geclassificeerd.
- Supabase advisor readback: 0 security-lints op de nieuwe trigger-runtime-surface; bestaande projectbrede lints zijn niet als opgelost gemarkeerd.

**Status:** `LIVE_PROVEN_FAIL_CLOSED_RUNTIME`. De runtime is actief, maar genereert bewust niets zolang expliciet company-level kooptriggerbewijs ontbreekt. Externe outreach is niet door deze runtime geactiveerd.
