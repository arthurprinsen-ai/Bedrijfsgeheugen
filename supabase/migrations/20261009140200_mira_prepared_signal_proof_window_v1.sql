-- P0 #4198: align Mira's forward-prepared 22:02 local signal harvest with next-day proof.
-- Keep the existing assurance function, scheduler, guard, source truth and privileges.
-- A pre-midnight qualified source remains fresh for 24h, but irrelevant/unqualified
-- records never count as a valid complaint signal.
DO $mira_window$
DECLARE
  v_original text;
  v_changed text;
  v_before text := 'where updated_at >= date_trunc(''day'',p_now at time zone ''Europe/Amsterdam'') at time zone ''Europe/Amsterdam'';';
  v_after text := E'where observed_at >= p_now-interval ''24 hours''\n    and eligible = true\n    and evidence_score >= 0.40\n    and total_score >= 0.75;';
BEGIN
  SELECT pg_get_functiondef('public.powerhouse_refresh_regression_stage_evidence_v1(timestamptz)'::regprocedure)
    INTO v_original;
  IF v_original IS NULL THEN RAISE EXCEPTION 'MIRA_EXISTING_ASSURANCE_REQUIRED'; END IF;
  IF (length(v_original)-length(replace(v_original,v_before,'')))/length(v_before) <> 1
  THEN RAISE EXCEPTION 'MIRA_SOURCE_WINDOW_REBASE_REQUIRED'; END IF;
  v_changed := replace(v_original,v_before,v_after);
  EXECUTE v_changed;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    WHERE p.oid='public.powerhouse_refresh_regression_stage_evidence_v1(timestamptz)'::regprocedure
    AND p.prosecdef
    AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
    AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
    AND has_function_privilege('service_role',p.oid,'EXECUTE')
  ) THEN RAISE EXCEPTION 'MIRA_ASSURANCE_PRIVILEGE_DRIFT'; END IF;
END $mira_window$;
