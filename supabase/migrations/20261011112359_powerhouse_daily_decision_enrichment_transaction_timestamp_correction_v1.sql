DO $identity_graph_owner$
DECLARE v_jobid bigint;
BEGIN
  SELECT jobid INTO v_jobid FROM cron.job
   WHERE jobname='powerhouse-identity-graph-v1' AND active=true;
  IF NOT FOUND THEN
    IF EXISTS(SELECT 1 FROM cron.job WHERE jobname LIKE 'powerhouse-identity-graph%') THEN
      RAISE EXCEPTION 'CANONICAL_IDENTITY_EXECUTOR_IDENTITY_MISMATCH';
    END IF;
    RAISE NOTICE 'CANONICAL_IDENTITY_EXECUTOR_ABSENT_IN_PREVIEW_NO_OP';
    RETURN;
  END IF;
  PERFORM cron.alter_job(
    job_id := v_jobid,
 command := replace(
   replace(
     (select command from cron.job where jobname='powerhouse-identity-graph-v1'),
     'v_start:=clock_timestamp();',
     'v_start:=now()-interval ''1 second'';'
   ),
   'where s.enrichment_date=v_date and s.enriched_at>=v_start;',
   'where s.enrichment_date=v_date and (s.enriched_at>=v_start or not (coalesce(s.source_snapshot,''{}''::jsonb) ? ''daily_decision''));'
 )
);
END
$identity_graph_owner$;
