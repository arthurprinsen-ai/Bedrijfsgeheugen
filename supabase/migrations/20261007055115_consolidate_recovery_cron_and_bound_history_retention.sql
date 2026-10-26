-- Live recovery consolidation applied through Supabase migration 20261007055115.
-- This file restores repository parity with the production migration ledger.

create or replace function public.powerhouse_recovery_control_plane_tick_v1()
returns jsonb
language plpgsql
security invoker
set search_path to 'public','pg_catalog'
as $function$
declare
  v_locked boolean := false;
  v_watchdog_rows bigint := 0;
  v_reconcile_rows bigint := 0;
  v_started_at timestamptz := clock_timestamp();
begin
  select pg_try_advisory_xact_lock(hashtextextended('powerhouse-recovery-control-plane-tick-v1', 0))
    into v_locked;

  if not v_locked then
    return jsonb_build_object(
      'ok', true,
      'state', 'SKIPPED_OVERLAP',
      'contract', 'powerhouse-recovery-control-plane-tick-v1',
      'observed_at', clock_timestamp()
    );
  end if;

  select count(*) into v_watchdog_rows
    from public.powerhouse_execution_resilience_watchdog_v1();

  select count(*) into v_reconcile_rows
    from public.powerhouse_reconciliation_worker_v2();

  return jsonb_build_object(
    'ok', true,
    'state', 'COMPLETED',
    'contract', 'powerhouse-recovery-control-plane-tick-v1',
    'watchdog_rows', v_watchdog_rows,
    'reconciliation_rows', v_reconcile_rows,
    'elapsed_ms', floor(extract(epoch from (clock_timestamp()-v_started_at))*1000)::bigint,
    'observed_at', clock_timestamp()
  );
end;
$function$;

revoke execute on function public.powerhouse_recovery_control_plane_tick_v1()
  from public, anon, authenticated;
grant execute on function public.powerhouse_recovery_control_plane_tick_v1()
  to service_role;

comment on function public.powerhouse_recovery_control_plane_tick_v1() is
  'Canonical single-connection minutely recovery owner: execution-resilience watchdog then reconciliation worker, protected by a transaction advisory lock.';

do $outer$
declare
  r record;
begin
  for r in
    select jobid
    from cron.job
    where jobname in (
      'powerhouse-execution-resilience-watchdog-v1',
      'powerhouse-reconciliation-worker-v2',
      'powerhouse-recovery-control-plane-v1'
    )
  loop
    perform cron.unschedule(r.jobid);
  end loop;

  perform cron.schedule(
    'powerhouse-recovery-control-plane-v1',
    '* * * * *',
    'select public.powerhouse_recovery_control_plane_tick_v1();'
  );
end;
$outer$;

create or replace function public.powerhouse_cron_history_retention_v1(
  p_keep interval default interval '14 days',
  p_batch_size integer default 10000
)
returns bigint
language plpgsql
security invoker
set search_path to 'public','cron','pg_catalog'
as $function$
declare
  v_deleted bigint := 0;
begin
  if p_keep < interval '1 day'
     or p_batch_size < 100
     or p_batch_size > 50000 then
    raise exception 'VALIDATION_ERROR';
  end if;

  with doomed as (
    select runid
    from cron.job_run_details
    where end_time is not null
      and end_time < now() - p_keep
    order by end_time
    limit p_batch_size
  )
  delete from cron.job_run_details d
  using doomed
  where d.runid = doomed.runid;

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$function$;

revoke execute on function public.powerhouse_cron_history_retention_v1(interval,integer)
  from public, anon, authenticated;
grant execute on function public.powerhouse_cron_history_retention_v1(interval,integer)
  to service_role;

comment on function public.powerhouse_cron_history_retention_v1(interval,integer) is
  'Bounded pg_cron history retention; removes at most p_batch_size completed runs older than p_keep.';

do $outer$
declare
  r record;
begin
  for r in
    select jobid
    from cron.job
    where jobname = 'powerhouse-cron-history-retention-v1'
  loop
    perform cron.unschedule(r.jobid);
  end loop;

  perform cron.schedule(
    'powerhouse-cron-history-retention-v1',
    '49 3,9,15,21 * * *',
    $cmd$select public.powerhouse_cron_history_retention_v1(interval '14 days', 10000);$cmd$
  );
end;
$outer$;
