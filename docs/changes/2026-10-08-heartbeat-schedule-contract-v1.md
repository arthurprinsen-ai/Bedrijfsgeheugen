# Canonical Heartbeat scheduler contract alignment — 8 October 2026

Obligation-ID: `powerhouse-heartbeat-schedule-contract-20261008-v1`.

## Existing production evidence
Supabase `cron.job` job 52 `powerhouse-autonomous-improvement-cycle-v1` is active with schedule `34 * * * *`. Its current command calls `select public.powerhouse_autonomous_improvement_cron_v1();`. Recent `cron.job_run_details` rows on 8 October report succeeded; this is scheduler execution proof, **not** proof that a champion surpassed a challenger or that business results improved.

## Root cause
The September 16 implementation originally scheduled this job at minute 42 and configured direct `cycle_v1(now())`. The source-controlled production migration `20261006085416_stagger_cron_database_pressure_v1.sql` subsequently spread cron work to reduce concurrent database pressure, moving the existing job to minute 34 without inventing another scheduler. The earlier configuration and validator were not updated.

## Correction
Update only the existing runtime contract and validation to the current 34-minute schedule, preserve the existing canonical cron wrapper invocation and point to the migration as provenance. An existing backend test asserts the correct job name, schedule and migration source. No DB migration, scheduler redeployment, security bypass, social send or new authority.

## Closure
Protected Required/CodeQL → merge → exact `main` source readback → verify current cron.job command/schedule and latest cron.job_run_details → compare canonical Brain record outcomes separately → machine/human learning. If canonical schedule changes again, this reference and the test must change in the same PR.
