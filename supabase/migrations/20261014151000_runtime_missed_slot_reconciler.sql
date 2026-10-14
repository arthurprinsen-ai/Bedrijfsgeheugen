-- Detect missed operational cron slots independently from the original mux.
-- Only registered idempotent tasks enter the retry queue. No provider sends.
BEGIN;
CREATE OR REPLACE FUNCTION powerhouse_ops.reconcile_missed_operational_slots_v1(
  p_lookback_minutes integer DEFAULT 20
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO pg_catalog,public,powerhouse_ops,cron
AS $fn$
DECLARE
  v_found integer:=0;
  v_now timestamptz:=date_trunc('minute',now()) - interval '3 minutes';
BEGIN
  IF p_lookback_minutes < 5 OR p_lookback_minutes > 60 THEN
    RAISE EXCEPTION 'RECONCILER_LOOKBACK_OUT_OF_RANGE';
  END IF;
  IF NOT pg_try_advisory_xact_lock(hashtextextended('powerhouse-ops-slot-reconcile-v1',0)) THEN
    RETURN jsonb_build_object('state','PEER_RUNNING','created',0);
  END IF;
  WITH expected AS (
    SELECT slot_at,task_name
    FROM generate_series(v_now - make_interval(mins=>p_lookback_minutes),
      v_now,interval '1 minute') AS g(slot_at)
    CROSS JOIN (VALUES ('execution-resilience-watchdog'),('reconciliation-worker')) AS t(task_name)
    WHERE extract(minute from slot_at)::integer = ANY (
      ARRAY[1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59]
    )
  ), missing AS (
    SELECT e.slot_at,e.task_name FROM expected e
    WHERE EXISTS (
      SELECT 1 FROM cron.job j
      WHERE j.jobname = 'powerhouse-runtime-isolated-' || e.task_name AND j.active
    )
    AND NOT EXISTS (
      SELECT 1 FROM cron.job j
      JOIN cron.job_run_details d ON d.jobid=j.jobid
      WHERE j.jobname='powerhouse-runtime-isolated-' || e.task_name
        AND d.status='succeeded'
        AND date_trunc('minute',d.start_time)=e.slot_at
    )
  )
  INSERT INTO powerhouse_ops.runtime_retry_queue(task_name,slot_at,last_error)
  SELECT task_name,slot_at,'MISSED_OR_FAILED_CRON_SLOT' FROM missing
  ON CONFLICT(task_name,slot_at) DO NOTHING;
  GET DIAGNOSTICS v_found=ROW_COUNT;
  RETURN jsonb_build_object('contract','powerhouse-runtime-missed-slots-v1',
    'state','RECONCILED','created',v_found,'window_minutes',p_lookback_minutes,
    'observed_at',clock_timestamp());
END;
$fn$;
REVOKE ALL ON FUNCTION powerhouse_ops.reconcile_missed_operational_slots_v1(integer)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION powerhouse_ops.reconcile_missed_operational_slots_v1(integer) TO postgres;
SELECT cron.schedule('powerhouse-ops-independent-slot-reconciler',
  '*/5 * * * *',
  'select powerhouse_ops.reconcile_missed_operational_slots_v1(20)');
COMMIT;
