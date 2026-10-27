-- Preserve the canonical executor identity and its existing ACL, owner and token gate.
-- An outcome reconciliation failure is observational: it may not disable a live
-- publication attempt. Publication identity, unique-claim and provider proof
-- remain the separate mandatory gates in the downstream content loop.
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
    -- Only isolate the side-effect-free preflight reconciliation.  Do not catch
    -- authentication, provider dispatch, or provider publication failures.
    RAISE WARNING 'CONTENT_OUTCOME_RECONCILE_ISOLATED: % %',
      SQLSTATE, left(SQLERRM, 240);
    BEGIN
      INSERT INTO public.bg_gezondheid(
        gemeten_op,onderdeel,soort,status,detail,gegevens
      ) VALUES (
        now(),'powerhouse-content-closed-loop-tick','reconciliation',
        'fout',left(SQLERRM,360),
        jsonb_build_object('run_date',v_date::text,
                           'stage','reconcile_pre',
                           'isolated',true)
      );
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING 'CONTENT_RECONCILE_DIAGNOSTIC_WRITE_FAILED: %',SQLSTATE;
    END;
  END;

  v_token := nullif(trim(public.bg_geheim('powerhouse_daily_scheduler_token')), '');
  IF v_token IS NULL THEN
    RAISE EXCEPTION 'CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE';
  END IF;

  SELECT net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token', v_token
    ),
    body := jsonb_build_object('runDate',v_date::text),
    timeout_milliseconds := 120000
  ) INTO v_request;

  RETURN v_request;
END
$function$;

-- Modify only the existing, verified owner; no second cron job.
DO $guard$
DECLARE v_job record;
BEGIN
  SELECT jobid,jobname,active,command,schedule INTO v_job
  FROM cron.job WHERE jobid=140;
  IF NOT FOUND THEN
    -- Native preview replay includes other independent cron jobs, but not the
    -- production-only owner. Do not create or activate an owner in preview.
    -- A conflicting similarly named content executor must still fail closed.
    IF EXISTS (
      SELECT 1 FROM cron.job
      WHERE jobname LIKE 'powerhouse-content-orchestrator%'
    ) THEN
      RAISE EXCEPTION 'CANONICAL_CONTENT_EXECUTOR_IDENTITY_MISMATCH';
    END IF;
    RAISE NOTICE 'CANONICAL_CONTENT_EXECUTOR_ABSENT_IN_PREVIEW_NO_OP';
    RETURN;
  END IF;
  IF v_job.jobname IS DISTINCT FROM 'powerhouse-content-orchestrator-daily-v1'
      OR trim(v_job.command) IS DISTINCT FROM
        'select public.powerhouse_content_closed_loop_tick_v1();' THEN
    RAISE EXCEPTION 'CANONICAL_CONTENT_EXECUTOR_IDENTITY_MISMATCH';
  END IF;
  IF NOT v_job.active OR v_job.schedule <> '27 * * * *' THEN
    PERFORM cron.alter_job(v_job.jobid, schedule := '27 * * * *', active := true);
  END IF;
END
$guard$;

-- The original production ledger stored this function as SECURITY DEFINER and
-- production grants already exclude browser roles. In a fresh preview the
-- function is recreated, so enforce the same deny-by-default ACL explicitly.
REVOKE EXECUTE ON FUNCTION public.powerhouse_content_closed_loop_tick_v1(timestamptz)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_content_closed_loop_tick_v1(timestamptz)
  TO service_role;
