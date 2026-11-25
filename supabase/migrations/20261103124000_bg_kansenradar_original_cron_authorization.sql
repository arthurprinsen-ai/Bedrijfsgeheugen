-- 2026-11-03: original Kansenradar cron auth, NO parallel scheduler.
-- Preview environments do not carry production-only Vault tokens. The guarded
-- SQL emits ZERO HTTP requests if the current environment has no valid token.
-- Original production cron remains active and retains exactly its job ID/name.
DO $kansenradar_original$
DECLARE
  v_id bigint;
  v_current text;
  v_expected text := $old$select net.http_post(url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-kansenradar', body := '{}'::jsonb, headers := '{"content-type":"application/json"}'::jsonb, timeout_milliseconds := 150000);$old$;
  v_previously_authorized text := $prior$select net.http_post(url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-kansenradar', body := '{}'::jsonb, headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',public.bg_geheim('powerhouse_daily_scheduler_token')), timeout_milliseconds := 150000);$prior$;
  v_authorized text := $new$select net.http_post(url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-kansenradar', body := '{}'::jsonb, headers := jsonb_build_object('content-type','application/json','x-powerhouse-token', credential.token), timeout_milliseconds := 150000) from (select public.bg_geheim('powerhouse_daily_scheduler_token') as token) as credential where length(coalesce(credential.token,'')) >= 16;$new$;
BEGIN
  IF (SELECT count(*) FROM cron.job WHERE jobname = 'bg-kansenradar-dagelijks') <> 1 THEN
    RAISE EXCEPTION 'BG_KANSENRADAR_ORIGINAL_CRON_CARDINALITY_NOT_ONE';
  END IF;
  SELECT jobid,command INTO v_id,v_current
    FROM cron.job WHERE jobname = 'bg-kansenradar-dagelijks' AND active=true;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'BG_KANSENRADAR_ORIGINAL_CRON_NOT_ACTIVE';
  END IF;
  IF v_current = v_authorized THEN
    RETURN; -- idempotent on original job
  END IF;
  IF v_current NOT IN (v_expected,v_previously_authorized) THEN
    RAISE EXCEPTION 'BG_KANSENRADAR_ORIGINAL_CRON_DRIFT_REFUSE_OVERWRITE';
  END IF;
  -- No unsafe provider call in preview: query has WHERE token length>=16.
  -- Exactly the original job is updated; schedule/name/active state preserved.
  PERFORM cron.alter_job(job_id := v_id, command := v_authorized, active := true);
  IF NOT EXISTS (
    SELECT 1 FROM cron.job WHERE jobid=v_id AND active=true AND command=v_authorized
  ) THEN
    RAISE EXCEPTION 'BG_KANSENRADAR_ORIGINAL_CRON_READBACK_FAILED';
  END IF;
END
$kansenradar_original$;
