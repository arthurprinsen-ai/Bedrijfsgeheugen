# P0 #4215 — restore an already-applied production migration source file

## Precise deployment failure
Production Supabase project `adhjwmvyoixzjtmiroln` has 746 remote-applied migration versions, but protected GitHub `main` had only 745 migration files. A complete version-set comparison found exactly one missing Git file: `supabase/migrations/20261023070053_p0_4215_forecast_scope_lower_idx.sql`.

The native Supabase production workflow failed at 2026-10-23T07:42:53Z with `Remote migration versions not found in local migrations directory`. The identical 1,620-byte SQL was already applied and its physical `ph_forecasts_active_scope_lower_p0` index independently verified (definition MD5 `26970207b59f178ef927b57a4ab57d8c`).

## Minimal source-only correction
This PR restores the exact previously-applied SQL under its actual production migration version. Immutable Git blob SHA-1: `3e6af2848e72d8733b73900eff7174315427a55c`. It does **not** repeat the production DDL, delete existing migration entries, increase database timeouts, modify cron schedules or tenant grants, fake financial data, or merge the wider #4558/#4630 view changes. The attached Node regression detects any SQL byte drift.

The related original-owner PR #4558 remains separately gated; its original version `20261023064000` and maturity-view redesign are outside this source-history-only change.

## Commercial production evidence
Natural native cron #46 run `122338` **succeeded** on 23 Oct 2026, started 07:55:00 UTC and ended 07:56:49 UTC (109.766s). Snapshot contains 838 distinct opportunities with ranks 1–838 and refreshed_at 07:55:01 UTC. It used the already-live partial `lower(scope_key)` index, without deployment of the broader candidate refresh function.

## Guarded acceptance
The repository delivery workflow must verify the exact branch head, Git hygiene, Brain learning evaluation, documentation and immutable development ledger, CodeQL and the native Supabase Preview. Do not waive a provider check if preview capacity is unavailable. After **protected** merge verify `main` contains the exact source bytes, remote/local migration versions align (746/746), Supabase main deployment is healthy, service-only ACL persists and existing native job retains autonomous successful operation.

Official docs: https://supabase.com/docs/guides/deployment/database-migrations and https://supabase.com/docs/guides/deployment/branching/github-integration .
