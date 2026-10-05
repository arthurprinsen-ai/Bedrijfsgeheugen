-- Close the predictive calibration timing gap without creating a parallel scheduler family.
-- The existing daily-named job remains canonical; only its cadence changes to hourly at :50.

do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid
  from cron.job
  where jobname = 'powerhouse-forecast-calibrator-daily'
  limit 1;

  if v_jobid is null then
    raise exception 'Missing canonical cron job powerhouse-forecast-calibrator-daily';
  end if;

  perform cron.alter_job(v_jobid, schedule := '50 * * * *');
end;
$$;

insert into public.powerhouse_runtime_events (
  dedupe_key,event_type,source,subject_key,channel,occurred_at,
  evidence,context,state,data_quality,confidence,created_at,updated_at
)
values (
  'learning:forecast-calibrator-timing-gap-v1',
  'production_learning_recorded',
  'powerhouse-forecast-calibrator',
  'forecast-calibrator-timing-gap',
  'system',
  now(),
  jsonb_build_object(
    'incident','forecast calibrator timing gap',
    'root_cause','the canonical calibrator ran once before a same-day forecast calibration obligation was created, leaving it overdue until the next day',
    'prevention','reuse the existing powerhouse-forecast-calibrator-daily cron job but evaluate hourly at minute 50; the edge function exits without AI usage when no calibration is due',
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
