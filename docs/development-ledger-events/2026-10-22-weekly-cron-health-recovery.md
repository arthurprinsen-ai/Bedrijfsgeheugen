# Append-only development event 2026-10-22 — weekly cron health

- Obligation-ID: `powerhouse|health-weekly-cron-cadence-aware|20261022-v1`
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215#issuecomment-6341551907
- Baseline main: f627153ed569820917a2dc5787dd210613f0395e
- Evidence: direct production `pg_get_functiondef(public.bg_gezondheid_meten)`, `cron.job`, `cron.job_run_details`; 19 Oct 06:00/06:40 UTC succeeded, 22 Oct marked weekly stale due unconditional 74h.
- Candidate: protected, migration supabase/migrations/20261022150000_powerhouse_health_weekly_cron_cadence_v1.sql with negative guard and no new scheduler; regression tests file `tests/brain-weekly-cron-health-74h-false-positive-20261022.test.mjs`.
- Safety: service_role-only security definer; existing protected delivery, no active provider replay, no status forcing.
- Writer lease: CANDIDATE, only distinct health-cadence files and corresponding learning/system map/skill projection, no active CI-repair or revenue-perf branch mutation.
- Terminality: OPEN until exact candidate Required+CodeQL+preview, protected merge, function-security and weekly run readback. No production DDL in this candidate operation.
