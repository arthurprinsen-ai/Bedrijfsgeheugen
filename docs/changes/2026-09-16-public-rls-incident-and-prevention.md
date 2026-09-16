# Public RLS incident and prevention — 2026-09-16

## Incident

Supabase reported `rls_disabled_in_public` for the Bedrijfsgeheugen Powerhouse project. The alert stated that a table in the `public` schema could be read, edited and deleted because Row-Level Security was disabled.

The unsafe state existed before the current verification. Earlier hardening migrations repaired the exposed tables. On 2026-09-16, before installing the generic prevention control, production readback showed 0 of 120 ordinary `public` tables with RLS disabled. The remaining gap was recurrence prevention.

## Root cause

The system relied on table-specific migrations to enable RLS. There was no database-level invariant forcing every newly created `public` table behind RLS, and no independent reconciler repairing RLS drift. Because browser roles can hold table grants, RLS must never be optional on a `public` table.

## Canonical invariant

`public` is a schema name, not an authorization decision. Every ordinary or partitioned table in `public` must have RLS enabled at all times. Intended client access is granted only through explicit RLS policies and least-privilege grants. Production migrations after the prevention baseline must never disable RLS.

## Preventive controls

The migration `20260916053000_powerhouse_public_rls_regression_guard.sql` adds four layers:

1. A PostgreSQL `ddl_command_end` event trigger enables RLS immediately on every newly created ordinary or partitioned table in `public`. With no policy, access is default-deny.
2. A `pg_cron` reconciler runs every five minutes and re-enables RLS if drift is detected.
3. A private `powerhouse_security_guard_events` evidence table records automatic enforcement; `anon` and `authenticated` have no table access and the guard functions are not callable by browser roles.
4. A repository regression contract runs for every future Supabase migration and rejects `DISABLE ROW LEVEL SECURITY` after this baseline.

The install migration also creates a temporary probe table and aborts transactionally if RLS is not enabled automatically.

## Production verification

Required readbacks after deployment:

```sql
select
  count(*) filter (where not c.relrowsecurity) as public_tables_without_rls,
  count(*) as public_tables_total
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p');
```

Expected: `public_tables_without_rls = 0`.

```sql
select evtname, evtevent, evtenabled
from pg_event_trigger
where evtname = 'powerhouse_public_rls_default_deny';
```

Expected: one enabled `ddl_command_end` trigger.

```sql
select jobid, jobname, schedule, active
from cron.job
where jobname = 'powerhouse-public-rls-guard-scan';
```

Expected: one active job with schedule `*/5 * * * *`.

```sql
select public.powerhouse_public_rls_guard_scan();
```

Expected in healthy state: `0` repairs.

## Runbook

If Supabase reports `rls_disabled_in_public` again, treat it as a P0 security drift event. Do not solve it by broadening policies or browser grants. First confirm the offending relation, run the guard scan, verify the DDL trigger and cron job, inspect the latest guard events, and identify the migration or privileged action that attempted to create or leave a table without RLS. The corrective change must preserve the fail-closed invariant.

## Learning / prevention rule

A security fix is not complete when the currently exposed table is closed. The exact failure mode must be converted into an enforceable invariant with automatic prevention, independent drift repair, CI regression coverage, production readback and durable incident documentation.
