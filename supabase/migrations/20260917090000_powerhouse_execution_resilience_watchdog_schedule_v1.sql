-- Powerhouse execution resilience watchdog schedule v1
-- Production parity for powerhouse-execution-resilience-v1.
-- Safe by design: the watchdog only marks stale operations RECOVERY_REQUIRED
-- and enqueues canonical reconciliation; it never replays side effects.

do $$
declare
  v_jobid bigint;
begin
  select jobid
  into v_jobid
  from cron.job
  where jobname = 'powerhouse-execution-resilience-watchdog-v1'
  limit 1;

  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;

  perform cron.schedule(
    'powerhouse-execution-resilience-watchdog-v1',
    '* * * * *',
    'select public.powerhouse_execution_resilience_watchdog_v1();'
  );
end;
$$;
