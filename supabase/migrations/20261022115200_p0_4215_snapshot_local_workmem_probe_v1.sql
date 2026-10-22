-- P0 #4215. Versioned canonical-runtime parity for the existing snapshot task #46.
-- A reversible, transaction-local memory probe, NOT a view or outcome change.
-- Preview may omit this canonical job; never create a second scheduler.
DO $revenue_memory_probe$
DECLARE
  owner_row record;
  old_anchor text := ' perform set_config(''statement_timeout'',''90000'',true);';
  memory_clause text := ' perform set_config(''work_mem'',''8MB'',true);';
  desired_command text;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended('powerhouse:snapshot-job-46-config-lease',0));
  SELECT jobid,jobname,schedule,active,command INTO owner_row
    FROM cron.job
   WHERE jobname='powerhouse-revenue-intelligence-snapshot-15m';
  IF NOT FOUND THEN
    RAISE NOTICE 'P0_4215_SNAPSHOT_OWNER_ABSENT_PREVIEW';
    RETURN;
  END IF;
  -- Original four-runs-an-hour no-data preview cannot be mutated to a different
  -- production schedule, even when its job name matches.
  IF owner_row.schedule='7,22,37,52 * * * *' THEN
    RAISE NOTICE 'P0_4215_LEGACY_PREVIEW_OWNER_PRESERVED';
    RETURN;
  END IF;
  IF owner_row.schedule<>'55 * * * *' OR owner_row.active IS NOT TRUE
     OR position(old_anchor IN owner_row.command)=0
     OR position('pg_try_advisory_xact_lock' IN owner_row.command)=0
     OR position('powerhouse_ensure_commercial_progression_forecasts_v1' IN owner_row.command)=0
     OR position('powerhouse_refresh_revenue_intelligence_snapshot_v1' IN owner_row.command)=0 THEN
    RAISE EXCEPTION 'P0_4215_SNAPSHOT_OWNER_OR_COMMAND_DRIFT';
  END IF;
  IF position('work_mem' IN owner_row.command)>0 THEN
    IF position(memory_clause IN owner_row.command)=0 THEN
      RAISE EXCEPTION 'P0_4215_UNEXPECTED_EXISTING_WORKMEM_VALUE';
    END IF;
    RAISE NOTICE 'P0_4215_SNAPSHOT_LOCAL_WORKMEM_ALREADY_PRESENT';
    RETURN;
  END IF;
  desired_command := replace(owner_row.command,old_anchor,memory_clause||chr(10)||old_anchor);
  IF desired_command=owner_row.command THEN
    RAISE EXCEPTION 'P0_4215_SNAPSHOT_REPLACE_FAILED';
  END IF;
  -- Do not alter the job identity, schedule, provider, forecast source or timeout.
  PERFORM cron.alter_job(job_id:=owner_row.jobid,command:=desired_command);
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobid=owner_row.jobid
     AND jobname=owner_row.jobname AND schedule=owner_row.schedule
     AND active AND command=desired_command) THEN
    RAISE EXCEPTION 'P0_4215_SNAPSHOT_POSTWRITE_CAS_FAILED';
  END IF;
END
$revenue_memory_probe$;
