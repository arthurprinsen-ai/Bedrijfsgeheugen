-- Production-proven cadence fix for predictive forecast calibration.
-- Reuses the exact canonical daily calibrator command and schedules an hourly retry.

do $$
declare
  v_jobid bigint;
  v_command text;
begin
  select command into v_command
  from cron.job
  where jobname = 'powerhouse-forecast-calibrator-daily'
    and active = true
  limit 1;

  if v_command is null then
    raise exception 'canonical powerhouse-forecast-calibrator-daily cron command not found';
  end if;

  select jobid into v_jobid
  from cron.job
  where jobname = 'powerhouse-forecast-calibrator-hourly-v1'
  limit 1;

  if v_jobid is not null then
    perform cron.unschedule(v_jobid);
  end if;

  perform cron.schedule(
    'powerhouse-forecast-calibrator-hourly-v1',
    '20 * * * *',
    v_command
  );
end;
$$;

insert into public.powerhouse_runtime_events (
  dedupe_key,event_type,source,subject_key,channel,occurred_at,
  evidence,context,state,data_quality,confidence,created_at,updated_at
)
values (
  'learning:forecast-calibrator-cadence-v1',
  'production_learning_recorded',
  'powerhouse-forecast-calibrator',
  'calibrator-cadence-gap',
  'system',
  now(),
  jsonb_build_object(
    'incident','due forecast calibration obligation can be created after the once-daily calibrator already ran',
    'root_cause','daily calibrator at 05:50 observed no due calibrations; later daily-cycle refresh created a due obligation for the same calendar day',
    'prevention','reuse the canonical calibrator command hourly at minute 20 while retaining the daily job',
    'contract','predictive-first-mover-intelligence-v1'
  ),
  jsonb_build_object('learning_contract','closed-loop'),
  'observed','OBSERVED',1,now(),now()
)
on conflict (dedupe_key) do update
  set occurred_at=excluded.occurred_at,
      evidence=excluded.evidence,
      context=excluded.context,
      state=excluded.state,
      data_quality=excluded.data_quality,
      updated_at=excluded.updated_at;
