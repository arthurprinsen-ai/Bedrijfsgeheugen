-- Hourly revenue-intelligence snapshot (cron job "powerhouse-revenue-intelligence-snapshot-15m",
-- schedule 55 * * * *): statement_timeout must be armed before the DO statement starts.
-- set_config(...) inside the DO block does not re-arm the timer of the running statement, so the
-- effective limit was the default 120 s. Measured over 14 days: 336 runs, 4 failed (about 1.2 percent)
-- at about 120 s; successful runs average about 60 s and reach 114 s. Only the cron command changes;
-- the snapshot functions, their ACL and the advisory lock are untouched.
do $m$
declare
  v_id bigint;
begin
  if to_regclass('cron.job') is null then
    raise notice 'cron.job not available in this environment; nothing to change';
    return;
  end if;
  select jobid into v_id from cron.job where jobname = 'powerhouse-revenue-intelligence-snapshot-15m';
  if v_id is null then
    raise notice 'cron job powerhouse-revenue-intelligence-snapshot-15m not found; nothing to change';
    return;
  end if;
  perform cron.alter_job(
    v_id,
    command := $cmd$set local statement_timeout = '240s';
do $snap$
begin
 if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-revenue-intelligence-snapshot',0)) then
   raise notice 'snapshot overlapping, safely skipped';
   return;
 end if;
 perform set_config('statement_timeout','240000',true);
 perform public.powerhouse_ensure_commercial_progression_forecasts_v1((now() at time zone 'Europe/Amsterdam')::date);
 perform public.powerhouse_refresh_revenue_intelligence_snapshot_v1();
end;
$snap$;$cmd$
  );
end
$m$;
