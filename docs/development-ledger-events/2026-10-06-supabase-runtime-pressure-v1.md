# 2026-10-06 — Supabase IPv6 / PostgREST pressure recovery

Obligation: `supabase-runtime-pressure-recovery-20261006`

Observed:
- direct project database host resolves to IPv6;
- trusted GitHub repair must therefore use Supavisor's IPv4-capable session pooler;
- Supavisor reported a 15-second session checkout timeout and a DB connection timeout to the project's IPv6 backend;
- PostgREST reported schema-cache reload failures with SQLSTATE 57014;
- production has `max_connections=60`, `cron.max_running_jobs=32`, and `cron.use_background_workers=off`;
- clustered cron schedules produced repeated `job startup timeout` failures;
- `bg-interactie(s)` traffic reached hundreds of events per minute during the degraded window.

Implemented:
- production cron fan-out staggered by stable job name;
- production migration `20261006085416_stagger_cron_database_pressure_v1` applied and mirrored into the repository;
- PostgREST schema reload requested after pressure reduction;
- `bg-interactie` production Edge Function deployed as v6 with bounded timeout/circuit breaker and fail-open 202 semantics;
- live `supabase-migration-repair-bridge` v4 source canonicalized in GitHub to preserve the IPv4 Supavisor transport.

Readback:
- recurring watchdog/reconciliation jobs returned to successful sub-second execution;
- PostgREST logged successful PostgreSQL reconnect and schema-cache load;
- no continued high-volume 522 storm was observed after recovery.

Safety:
- no direct write to Supabase migration history tables;
- no publication-provider bypass;
- no critical business writer was changed to fail-open.
