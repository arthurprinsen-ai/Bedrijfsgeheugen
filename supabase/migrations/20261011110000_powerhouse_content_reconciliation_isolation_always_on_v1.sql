-- P0 #4198. Reconciliation telemetry must not starve the canonical publication executor.
-- This replays the production hotfix, preserves original owner/ACL, authorisation
-- and publication gates, and modifies no second schedule or provider sender.
CREATE OR REPLACE FUNCTION public.powerhouse_content_closed_loop_tick_v1(
  p_now timestamptz DEFAULT now()
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog', 'net', 'vault'
AS $function$
DECLARE
  v_request bigint;
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_token text;
BEGIN
  BEGIN
    PERFORM public.powerhouse_reconcile_content_outcomes_v1(v_date);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'CONTENT_OUTCOME_RECONCILE_ISOLATED: % %',
      SQLSTATE, left(SQLERRM, 240);
    BEGIN
      INSERT INTO public.bg_gezondheid(
        gemeten_op, onderdeel, soort, status, detail, gegevens
      ) VALUES (
        now(), 'powerhouse-content-closed-loop-tick', 'reconciliation',
        'fout', left(SQLERRM,360),
        jsonb_build_object('run_date',v_date::text,
          'stage','reconcile_pre','isolated',true)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'CONTENT_RECONCILE_DIAGNOSTIC_WRITE_FAILED: %',SQLSTATE;
    END;
  END;

  -- Auth/security and provider dispatch errors are deliberately NOT caught.
  v_token := nullif(trim(public.bg_geheim('powerhouse_daily_scheduler_token')), '');
  IF v_token IS NULL THEN
    RAISE EXCEPTION 'CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE';
  END IF;
  SELECT net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token',v_token
    ),
    body := jsonb_build_object('runDate',v_date::text),
    timeout_milliseconds := 120000
  ) INTO v_request;
  RETURN v_request;
END
$function$;

DO $guard$
DECLARE v_job record;
BEGIN
  SELECT jobid,jobname,schedule,active,command INTO v_job
  FROM cron.job WHERE jobname='powerhouse-content-orchestrator-daily-v1'
  LIMIT 1;
  IF NOT FOUND THEN
    -- Preview projects do not necessarily import production cron.job IDs.
    RAISE NOTICE 'EXISTING_CONTENT_SCHEDULER_ABSENT_NO_SECOND_EXECUTOR_CREATED';
    RETURN;
  END IF;
  IF trim(v_job.command) IS DISTINCT FROM
      'select public.powerhouse_content_closed_loop_tick_v1();' THEN
    RAISE EXCEPTION 'CANONICAL_CONTENT_EXECUTOR_IDENTITY_MISMATCH';
  END IF;
  IF NOT v_job.active OR v_job.schedule <> '27 * * * *' THEN
    PERFORM cron.alter_job(v_job.jobid,schedule:='27 * * * *',active:=true);
  END IF;
END
$guard$;
