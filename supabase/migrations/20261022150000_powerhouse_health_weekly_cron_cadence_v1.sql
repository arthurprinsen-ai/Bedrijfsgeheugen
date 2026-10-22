-- Obligation-ID: powerhouse|health-weekly-cron-cadence-aware|20261022-v1
-- Correct false 74-hour alerts for successful weekly jobs without changing cron owners.
-- Fail closed on definition/security drift. Production delivery is protected.
DO $migration$
DECLARE
  v_definition text;
  v_after text;
  v_old text := $old$when r.laatste_run<now()-interval '74 hours' then 'waarschuwing'$old$;
  v_new text := $new$when r.schedule~'^[0-5]?[0-9] ([01]?[0-9]|2[0-3]) \* \* [0-6]$' and r.laatste_run<now()-interval '7 days 2 hours' then 'waarschuwing' when r.schedule~'^[0-5]?[0-9] ([01]?[0-9]|2[0-3]) \* \* [0-6]$' then 'ok' when r.laatste_run<now()-interval '74 hours' then 'waarschuwing'$new$;
BEGIN
  IF to_regprocedure('public.bg_gezondheid_meten()') IS NULL THEN
    RAISE EXCEPTION 'HEALTH_WEEKLY_CANONICAL_FUNCTION_MISSING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='bg_gezondheid_meten'
      AND p.prosecdef
      AND 'search_path=public, cron, net'=ANY(p.proconfig)
      AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
      AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
      AND has_function_privilege('service_role',p.oid,'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'HEALTH_WEEKLY_CANONICAL_SECURITY_DRIFT';
  END IF;
  SELECT pg_get_functiondef('public.bg_gezondheid_meten()'::regprocedure) INTO v_definition;
  IF position(v_new IN v_definition)>0 THEN RETURN; END IF;
  IF position(v_old IN v_definition)=0 OR
     length(v_definition)-length(replace(v_definition,v_old,''))<>length(v_old) THEN
    RAISE EXCEPTION 'HEALTH_WEEKLY_SOURCE_SIGNATURE_DRIFT';
  END IF;
  IF position($daily$when r.schedule~'^\d+ \d+ \* \* \*$' and r.laatste_run<now()-interval '26 hours' then 'fout'$daily$ IN v_definition)=0
      OR position($failed$when r.laatste_status<>'succeeded' then 'fout'$failed$ IN v_definition)=0
      OR position($never$when r.laatste_run is null then 'fout'$never$ IN v_definition)=0 THEN
    RAISE EXCEPTION 'HEALTH_WEEKLY_SAFETY_GUARD_DRIFT';
  END IF;
  EXECUTE replace(v_definition,v_old,v_new);
  SELECT pg_get_functiondef('public.bg_gezondheid_meten()'::regprocedure) INTO v_after;
  IF position(v_new IN v_after)=0
     OR position($failed$when r.laatste_status<>'succeeded' then 'fout'$failed$ IN v_after)=0
     OR position($never$when r.laatste_run is null then 'fout'$never$ IN v_after)=0 THEN
    RAISE EXCEPTION 'HEALTH_WEEKLY_POSTWRITE_READBACK_FAILED';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='bg_gezondheid_meten'
      AND p.prosecdef
      AND 'search_path=public, cron, net'=ANY(p.proconfig)
      AND NOT has_function_privilege('anon',p.oid,'EXECUTE')
      AND NOT has_function_privilege('authenticated',p.oid,'EXECUTE')
      AND has_function_privilege('service_role',p.oid,'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'HEALTH_WEEKLY_SECURITY_POSTWRITE_DRIFT';
  END IF;
END
$migration$;
