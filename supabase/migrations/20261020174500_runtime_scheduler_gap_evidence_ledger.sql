-- P0 #4478 / #4215: durable, fail-closed missed-slot evidence on the EXISTING pg_cron scheduler #171.
-- This creates NO job, provider dispatch, retry, forecast outcome, publication or email.
-- A later successful *current* run never retroactively verifies a missing historical slot.

CREATE TABLE IF NOT EXISTS powerhouse_ops.runtime_scheduler_gap_ledger_v1 (
  jobid integer NOT NULL DEFAULT 171 CHECK (jobid = 171),
  run_slot timestamptz NOT NULL,
  classification text NOT NULL CHECK (classification IN (
    'CRON_EXECUTION_FAILED', 'NO_CRON_EXECUTION_EVIDENCE', 'INNER_TASK_FAILED'
  )),
  cron_runid bigint,
  cron_status text,
  failure_excerpt text,
  inner_task_results jsonb NOT NULL DEFAULT '[]'::jsonb,
  resolution_state text NOT NULL DEFAULT 'RESULT_READBACK_REQUIRED'
    CHECK (resolution_state IN (
      'RESULT_READBACK_REQUIRED', 'PROVEN_BACKFILLED',
      'NO_SAFE_BACKFILL', 'PROVEN_SUPERSEDED'
    )),
  resolution_evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  external_replay_allowed boolean NOT NULL DEFAULT false CHECK (external_replay_allowed = false),
  first_observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  last_observed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (jobid, run_slot)
);

COMMENT ON TABLE powerhouse_ops.runtime_scheduler_gap_ledger_v1 IS
  'Immutable slot identity; source-backed gap classification. Success means evidence-backed result readback, not a later cron success. No automatic external replay.';

CREATE OR REPLACE FUNCTION powerhouse_ops.capture_runtime_scheduler_gaps_v1(
  p_since interval DEFAULT interval '24 hours',
  p_limit integer DEFAULT 900
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path TO pg_catalog, powerhouse_ops, cron
AS $function$
DECLARE
  v_recorded integer := 0;
  v_missing integer := 0;
  v_inner_failures integer := 0;
BEGIN
  IF p_since <= interval '0 minutes' OR p_since > interval '48 hours'
     OR p_limit < 1 OR p_limit > 2000 THEN
    RAISE EXCEPTION 'INVALID_BOUNDED_AUDIT_WINDOW';
  END IF;

  IF NOT pg_try_advisory_xact_lock(hashtextextended('powerhouse-171-gap-evidence-owner',0)) THEN
    RETURN jsonb_build_object('state','SKIPPED_OVERLAP','replay_performed',false);
  END IF;

  WITH expected AS MATERIALIZED (
    SELECT slot
    FROM generate_series(
      date_trunc('minute', now() - p_since),
      date_trunc('minute', now() - interval '5 minutes'),
      interval '1 minute'
    ) AS slot
    WHERE extract(minute FROM slot AT TIME ZONE 'UTC')::integer % 5 IN (1,3,4)
  ),
  attempts AS MATERIALIZED (
    SELECT DISTINCT ON (date_trunc('minute',d.start_time))
      date_trunc('minute',d.start_time) AS run_slot,
      d.runid,
      d.status,
      left(coalesce(d.return_message,''),300) AS failure_excerpt
    FROM cron.job_run_details d
    WHERE d.jobid=171
      AND d.start_time >= now()-p_since-interval '1 minute'
      AND d.start_time < now()
    ORDER BY date_trunc('minute',d.start_time),d.start_time DESC,d.runid DESC
  ),
  gaps AS MATERIALIZED (
    SELECT
      e.slot,
      CASE
        WHEN r.run_slot IS NOT NULL THEN 'INNER_TASK_FAILED'
        WHEN a.status='failed' THEN 'CRON_EXECUTION_FAILED'
        ELSE 'NO_CRON_EXECUTION_EVIDENCE'
      END AS classification,
      a.runid,
      a.status,
      a.failure_excerpt,
      CASE WHEN r.run_slot IS NOT NULL
        THEN coalesce(r.task_results,'[]'::jsonb)
        ELSE '[]'::jsonb END AS task_results
    FROM expected e
    LEFT JOIN powerhouse_ops.runtime_scheduler_run_evidence_v1 r
      ON r.run_slot=e.slot
    LEFT JOIN attempts a ON a.run_slot=e.slot
    WHERE r.run_slot IS NULL OR r.healthy IS DISTINCT FROM true
    ORDER BY e.slot
    LIMIT p_limit
  ),
  stored AS (
    INSERT INTO powerhouse_ops.runtime_scheduler_gap_ledger_v1 (
      jobid,run_slot,classification,cron_runid,cron_status,
      failure_excerpt,inner_task_results
    )
    SELECT 171, slot, classification, runid, status,
      failure_excerpt, task_results
    FROM gaps
    ON CONFLICT (jobid,run_slot) DO UPDATE SET
      classification=EXCLUDED.classification,
      cron_runid=EXCLUDED.cron_runid,
      cron_status=EXCLUDED.cron_status,
      failure_excerpt=EXCLUDED.failure_excerpt,
      inner_task_results=EXCLUDED.inner_task_results,
      last_observed_at=clock_timestamp()
    WHERE powerhouse_ops.runtime_scheduler_gap_ledger_v1.resolution_state='RESULT_READBACK_REQUIRED'
      AND (powerhouse_ops.runtime_scheduler_gap_ledger_v1.classification,
           powerhouse_ops.runtime_scheduler_gap_ledger_v1.cron_runid,
           powerhouse_ops.runtime_scheduler_gap_ledger_v1.cron_status,
           powerhouse_ops.runtime_scheduler_gap_ledger_v1.failure_excerpt,
           powerhouse_ops.runtime_scheduler_gap_ledger_v1.inner_task_results)
        IS DISTINCT FROM
          (EXCLUDED.classification,EXCLUDED.cron_runid,EXCLUDED.cron_status,
           EXCLUDED.failure_excerpt,EXCLUDED.inner_task_results)
    RETURNING classification
  )
  SELECT count(*),
         count(*) FILTER (WHERE classification <> 'INNER_TASK_FAILED'),
         count(*) FILTER (WHERE classification = 'INNER_TASK_FAILED')
  INTO v_recorded,v_missing,v_inner_failures
  FROM stored;

  RETURN jsonb_build_object(
    'contract','canonical-runtime-scheduler-gap-evidence-v1',
    'jobid',171,
    'window',p_since::text,
    'inserted_or_changed',v_recorded,
    'missing_slot_records_changed',v_missing,
    'inner_failure_records_changed',v_inner_failures,
    'replay_performed',false,
    'provider_delivery_claimed',false,
    'truth_boundary','Each historical slot requires independent result or explicit non-replay disposition; later successes do not erase gaps'
  );
END;
$function$;

-- Private operational evidence only; clients have no Data API / SQL execution access.
REVOKE ALL ON TABLE powerhouse_ops.runtime_scheduler_gap_ledger_v1 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION powerhouse_ops.capture_runtime_scheduler_gaps_v1(interval,integer)
  FROM PUBLIC, anon, authenticated;
