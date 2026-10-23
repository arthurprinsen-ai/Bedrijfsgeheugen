-- POWERHOUSE runtime cron deconfliction v1
-- Reduces systematic pg_cron startup collisions without disabling canonical owners.

do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid
  from cron.job
  where jobname='powerhouse-reconciliation-worker-v2' and active
  limit 1;
  if v_jobid is null then
    raise exception 'CRON_JOB_MISSING:powerhouse-reconciliation-worker-v2';
  end if;
  perform cron.alter_job(v_jobid, schedule => '59 seconds');

  select jobid into v_jobid
  from cron.job
  where jobname='powerhouse-data-spine-watchdog-v1' and active
  limit 1;
  if v_jobid is null then
    raise exception 'CRON_JOB_MISSING:powerhouse-data-spine-watchdog-v1';
  end if;
  perform cron.alter_job(v_jobid, schedule => '4,14,24,34,44,54 * * * *');

  select jobid into v_jobid
  from cron.job
  where jobname='powerhouse-revenue-attribution-snapshot-v1' and active
  limit 1;
  if v_jobid is null then
    raise exception 'CRON_JOB_MISSING:powerhouse-revenue-attribution-snapshot-v1';
  end if;
  perform cron.alter_job(v_jobid, schedule => '9,24,39,54 * * * *');
end $$;

do $verify$
declare
  v_schedule text;
begin
  select schedule into v_schedule from cron.job
  where jobname='powerhouse-reconciliation-worker-v2' and active limit 1;
  if v_schedule <> '59 seconds' then
    raise exception 'CRON_SCHEDULE_READBACK_FAILED:powerhouse-reconciliation-worker-v2:%',coalesce(v_schedule,'MISSING');
  end if;

  select schedule into v_schedule from cron.job
  where jobname='powerhouse-data-spine-watchdog-v1' and active limit 1;
  if v_schedule <> '4,14,24,34,44,54 * * * *' then
    raise exception 'CRON_SCHEDULE_READBACK_FAILED:powerhouse-data-spine-watchdog-v1:%',coalesce(v_schedule,'MISSING');
  end if;

  select schedule into v_schedule from cron.job
  where jobname='powerhouse-revenue-attribution-snapshot-v1' and active limit 1;
  if v_schedule <> '9,24,39,54 * * * *' then
    raise exception 'CRON_SCHEDULE_READBACK_FAILED:powerhouse-revenue-attribution-snapshot-v1:%',coalesce(v_schedule,'MISSING');
  end if;

  if not exists(
    select 1 from cron.job
    where jobname='powerhouse-execution-resilience-watchdog-v1'
      and active
      and schedule='* * * * *'
  ) then
    raise exception 'CRON_OWNER_DRIFT:powerhouse-execution-resilience-watchdog-v1';
  end if;

  if not exists(
    select 1 from cron.job
    where jobname='powerhouse-one-commercial-heartbeat-v1'
      and active
      and command ilike '%powerhouse_commercial_heartbeat_v1%'
  ) then
    raise exception 'CRON_OWNER_DRIFT:powerhouse-one-commercial-heartbeat-v1';
  end if;
end
$verify$;
