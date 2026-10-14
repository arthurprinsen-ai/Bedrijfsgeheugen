-- Bounded cursor replay for long PostgreSQL outages. No outbound provider writes.
-- The prior slot reconciler stays present; this upgrades its cron entry.
BEGIN;
CREATE TABLE IF NOT EXISTS powerhouse_ops.runtime_recovery_cursor (
  cursor_name text PRIMARY KEY,
  next_slot timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK(cursor_name='operational-slot-scan-v1')
);
REVOKE ALL ON powerhouse_ops.runtime_recovery_cursor FROM PUBLIC,anon,authenticated;
-- Bootstrap with a modest window only on first installation; afterwards, cursor
-- survives DB downtime and drives bounded historical catch-up over many ticks.
INSERT INTO powerhouse_ops.runtime_recovery_cursor(cursor_name,next_slot)
VALUES ('operational-slot-scan-v1',date_trunc('minute',now()-interval '30 minutes'))
ON CONFLICT(cursor_name) DO NOTHING;

CREATE OR REPLACE FUNCTION powerhouse_ops.reconcile_missed_operational_slots_cursor_v1()
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER
SET search_path TO pg_catalog,public,powerhouse_ops,cron
AS $fn$
DECLARE
  v_cursor timestamptz;
  v_end timestamptz;
  v_latest timestamptz := date_trunc('minute',now())-interval '3 minutes';
  v_inserted int := 0;
  v_scanned int := 0;
BEGIN
  IF NOT pg_try_advisory_xact_lock(hashtextextended('powerhouse-ops-slot-cursor-v1',0)) THEN
    RETURN jsonb_build_object('state','PEER_RUNNING');
  END IF;
  SELECT next_slot INTO v_cursor FROM powerhouse_ops.runtime_recovery_cursor
  WHERE cursor_name='operational-slot-scan-v1' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'RECOVERY_CURSOR_MISSING'; END IF;
  -- Never process more than 30 minutes of slots in one invocation, even after
  -- days of database downtime. The next tick resumes from the committed cursor.
  v_end:=least(v_latest,v_cursor+interval '29 minutes');
  IF v_end<v_cursor THEN
    RETURN jsonb_build_object('state','CURRENT','pending_minutes',0,'created',0);
  END IF;
  WITH expected AS (
    SELECT g.slot_at,t.task_name FROM
    generate_series(v_cursor,v_end,interval '1 minute') AS g(slot_at)
    CROSS JOIN (VALUES('execution-resilience-watchdog'),('reconciliation-worker')) AS t(task_name)
    WHERE extract(minute from g.slot_at)::int=ANY(ARRAY[
      1,3,4,6,8,9,11,13,14,16,18,19,21,23,24,26,28,29,
      31,33,34,36,38,39,41,43,44,46,48,49,51,53,54,56,58,59])
  ), missing AS (
    SELECT e.slot_at,e.task_name FROM expected e
    WHERE EXISTS (
      SELECT 1 FROM cron.job j
      WHERE j.jobname='powerhouse-runtime-isolated-'||e.task_name AND j.active
    )
    AND NOT EXISTS (
      SELECT 1 FROM cron.job j JOIN cron.job_run_details d ON d.jobid=j.jobid
      WHERE j.jobname='powerhouse-runtime-isolated-'||e.task_name
      AND d.status='succeeded'
      AND date_trunc('minute',d.start_time)=e.slot_at
    )
  )
  INSERT INTO powerhouse_ops.runtime_retry_queue(task_name,slot_at,last_error)
  SELECT task_name,slot_at,'MISSED_OR_FAILED_CRON_SLOT' FROM missing
  ON CONFLICT(task_name,slot_at) DO NOTHING;
  GET DIAGNOSTICS v_inserted=ROW_COUNT;
  v_scanned:=(extract(epoch from (v_end-v_cursor))/60)::int+1;
  UPDATE powerhouse_ops.runtime_recovery_cursor
  SET next_slot=v_end+interval '1 minute',updated_at=now()
  WHERE cursor_name='operational-slot-scan-v1';
  RETURN jsonb_build_object('contract','powerhouse-missed-slots-cursor-v1',
    'state','CHECKPOINT_COMMITTED','window_start',v_cursor,'window_end',v_end,
    'scanned_minutes',v_scanned,'created',v_inserted,
    'backlog_minutes',greatest(0,(extract(epoch from (v_latest-v_end))/60)::int));
END
$fn$;
REVOKE ALL ON FUNCTION powerhouse_ops.reconcile_missed_operational_slots_cursor_v1()
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION powerhouse_ops.reconcile_missed_operational_slots_cursor_v1()
  TO postgres;
SELECT cron.schedule('powerhouse-ops-independent-slot-reconciler',
 '*/5 * * * *',
 'select powerhouse_ops.reconcile_missed_operational_slots_cursor_v1()');
COMMIT;
