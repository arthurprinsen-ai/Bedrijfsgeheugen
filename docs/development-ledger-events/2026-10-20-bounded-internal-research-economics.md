# #4215 — bounded internal research economics recovery ledger

Date: 2026-10-20
Obligation-ID: portal|bounded-internal-research-economics|20261020
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4215
Baseline main: 0787ab0cb2f2c8523dd9b63b894cbbc61df5d199
State: REVIEW_CANDIDATE / NOT_LIVE

Read-only production evidence: postgres_logs 10:38:38 UTC pg_cron 57014 at economics backfill FOR SELECT, live function DDL unbounded, ~7003 sales_actions and ~266 economics estimated rows, economics action_id unique index. Proposed recovery caps to 50 per existing mux invocation and adds candidate partial index. It does not delete/un-schedule existing logic, fake provider costs or install independent state. Prior protected cron-spreading #4538 merged and live schedule verified; this lane is distinct and does not compete with that cron migration.

Closure only with scope/learning gate, Required CI, CodeQL, Supabase preview, protected merge, verified production migration when DB pool is healthy, batch/catch-up/lock runtime evidence, signed portal 200 and two isolated tenants. No blanket GREEN.
