-- Powerhouse Full-Cycle Proof v1 consolidation.
-- EXISTING-STATE-FIRST: remove scheduler drift; do not create a parallel scheduler.
-- Canonical commercial lineage remains:
-- powerhouse_forecasts -> powerhouse_sales_actions -> powerhouse_sales_outcomes -> powerhouse_forecast_calibration
-- with powerhouse_runtime_events for observed execution/learning evidence.
-- Realized revenue is only observed revenue; provider readback remains mandatory before proven execution.

DO $$
DECLARE
  v_duplicate_jobid bigint;
  v_canonical_jobid bigint;
BEGIN
  SELECT jobid INTO v_duplicate_jobid
  FROM cron.job
  WHERE jobname = 'powerhouse-forecast-calibrator-hourly-v1'
  LIMIT 1;

  IF v_duplicate_jobid IS NOT NULL THEN
    PERFORM cron.unschedule(v_duplicate_jobid);
  END IF;

  SELECT jobid INTO v_canonical_jobid
  FROM cron.job
  WHERE jobname = 'powerhouse-forecast-calibrator-daily'
  LIMIT 1;

  IF v_canonical_jobid IS NULL THEN
    RAISE EXCEPTION 'Missing canonical cron job powerhouse-forecast-calibrator-daily';
  END IF;

  -- Keep one canonical job. Despite the historical name, it evaluates hourly.
  PERFORM cron.alter_job(v_canonical_jobid, schedule := '50 * * * *', active := true);
END;
$$;

INSERT INTO public.powerhouse_runtime_events (
  dedupe_key,event_type,source,subject_key,channel,occurred_at,
  evidence,context,state,data_quality,confidence,created_at,updated_at
)
VALUES (
  'learning:full-cycle-calibrator-consolidation-v1',
  'production_learning_recorded',
  'powerhouse-full-cycle-proof-v1',
  'duplicate-calibrator-scheduler',
  'system',
  now(),
  jsonb_build_object(
    'incident','duplicate calibrator schedulers were active simultaneously',
    'root_cause','two valid historical fixes were both deployed: the canonical calibrator was changed to hourly and a second hourly retry job was also created',
    'prevention','NO_PARALLEL_SCHEDULER: retain only powerhouse-forecast-calibrator-daily at minute 50 each hour and reject future duplicate scheduler families',
    'canonical_lineage',jsonb_build_array(
      'powerhouse_forecasts',
      'powerhouse_sales_actions',
      'powerhouse_sales_outcomes',
      'powerhouse_forecast_calibration',
      'powerhouse_runtime_events'
    ),
    'economic_truth','realized revenue is counted only from observed powerhouse_sales_outcomes; pipeline and engagement remain leading indicators',
    'delivery_truth','provider readback remains required before an external action can be treated as proven',
    'contract','powerhouse-full-cycle-proof-v1'
  ),
  jsonb_build_object(
    'architecture','Bedrijfsgeheugen Powerhouse',
    'principle','no-parallel-scheduler',
    'supersedes_runtime_job','powerhouse-forecast-calibrator-hourly-v1',
    'canonical_runtime_job','powerhouse-forecast-calibrator-daily'
  ),
  'observed','OBSERVED',1,now(),now()
)
ON CONFLICT (dedupe_key) DO UPDATE
SET occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=excluded.updated_at;
