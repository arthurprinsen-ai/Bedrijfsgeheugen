-- POWERHOUSE runtime cron pressure relief v1
-- Consolidates the two every-minute runtime maintenance owners into one backend session.
-- Watchdog SLA remains <= 60s; reconciliation is skipped on commercial heartbeat minutes
-- so pg_cron does not create three concurrent startup sessions on :00/:05/:10/... .

create or replace function public.powerhouse_runtime_maintenance_tick_v1(
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_locked boolean := false;
  v_reconcile boolean := false;
begin
  v_locked := pg_try_advisory_xact_lock(
    hashtextextended('powerhouse-runtime-maintenance-v1',0)
  );

  if not v_locked then
    return jsonb_build_object(
      'contract','powerhouse-runtime-maintenance-v1',
      'healthy',true,
      'state','SKIPPED_OVERLAP',
      'executed_at',p_now
    );
  end if;

  perform public.powerhouse_execution_resilience_watchdog_v1();

  v_reconcile := (extract(minute from p_now)::int % 5) <> 0;
  if v_reconcile then
    perform 1 from public.powerhouse_reconciliation_worker_v2();
  end if;

  return jsonb_build_object(
    'contract','powerhouse-runtime-maintenance-v1',
    'healthy',true,
    'watchdog_executed',true,
    'reconciliation_executed',v_reconcile,
    'commercial_heartbeat_slot',not v_reconcile,
    'executed_at',p_now
  );
end
$function$;

revoke execute on function public.powerhouse_runtime_maintenance_tick_v1(timestamptz)
  from public, anon, authenticated;
grant execute on function public.powerhouse_runtime_maintenance_tick_v1(timestamptz)
  to service_role;

do $block$
declare
  r record;
begin
  for r in
    select jobid
    from cron.job
    where jobname in (
      'powerhouse-execution-resilience-watchdog-v1',
      'powerhouse-reconciliation-worker-v2',
      'powerhouse-recovery-control-plane-v1',
      'powerhouse-runtime-maintenance-v1'
    )
  loop
    perform cron.unschedule(r.jobid);
  end loop;

  perform cron.schedule(
    'powerhouse-runtime-maintenance-v1',
    '* * * * *',
    'select public.powerhouse_runtime_maintenance_tick_v1(now());'
  );
end
$block$;
