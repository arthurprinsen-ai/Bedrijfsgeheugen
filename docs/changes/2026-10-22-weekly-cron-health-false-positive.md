# Weekly pg_cron health warning false-positive — 22 October 2026

Obligation: `powerhouse|health-weekly-cron-cadence-aware|20261022-v1`. Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215.

## Observed failure
`public.bg_gezondheid_meten()` classifies any non-daily cron run older than 74 hours as warning, independent of the owner's scheduled cadence. At 22 October, both exact existing active weekly jobs `bg-zoekwoordkansen-wekelijks` (`0 6 * * 1`) and `bg-experimentcyclus-wekelijks` (`40 6 * * 1`) have a successful Monday 19 October execution but are called stale. `cron.timezone` is GMT. Cron success is not proof of downstream business/output evidence.

## Single-source proposed repair
supabase/migrations/20261022150000_powerhouse_health_weekly_cron_cadence_v1.sql changes only the existing function's classification branch by a fail-closed textual source signature patch, preserving the signature, SECURITY DEFINER, security search_path, EXECUTE grants, daily overdue errors, failed/never-ran errors, and 74-hour threshold for other cadence types. Simple numeric weekday schedules receive 7-day + 2-hour tolerance; a missed week still causes warning. No new job/function/side-effect. It is safe to rerun only if the function source exactly matches expected migration signature.

## Acceptance
Run targeted Node regression; exact-head Required CI, CodeQL, Supabase Preview and migration-history replay; verify existing hourly cron job unchanged; production post-merge pg_proc and role ACL readback, representative current weekly health `ok` plus forced overdue and failure negative canaries in isolated preview. Preserve open `NOOIT_BEWEZEN` upstream provider outcome obligations. Do not release solely based on PR, planning or local tests.
