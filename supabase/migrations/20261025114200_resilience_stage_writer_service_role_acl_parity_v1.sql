-- P0 #4198: clean-room permissions must equal canonical production permission boundary.
-- Genuine watchdog EXECUTE is server-only and now calls the existing stage writer.
-- The exact service_role grant already exists on production but was missing from preview.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='20s';

DO $guard$
BEGIN
  IF to_regprocedure('public.powerhouse_record_loop_stage_v1(text,text,jsonb,timestamp with time zone)') IS NULL
     OR to_regprocedure('public.powerhouse_execution_resilience_watchdog_v1(timestamp with time zone,integer,integer)') IS NULL
  THEN RAISE EXCEPTION 'RESILIENCE_CANONICAL_STAGE_WRITER_MISSING'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p WHERE p.pronamespace='public'::regnamespace
      AND p.proname='powerhouse_record_loop_stage_v1'
      AND p.prosecdef
  ) THEN RAISE EXCEPTION 'RESILIENCE_STAGE_WRITER_PRIVILEGE_CONTRACT_DRIFT'; END IF;
END
$guard$;

-- Ensure no public or customer role may call the SECURITY DEFINER stage writer.
REVOKE EXECUTE ON FUNCTION public.powerhouse_record_loop_stage_v1(text,text,jsonb,timestamp with time zone)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_record_loop_stage_v1(text,text,jsonb,timestamp with time zone)
  TO service_role;

DO $verify$
DECLARE v_oid oid := to_regprocedure('public.powerhouse_record_loop_stage_v1(text,text,jsonb,timestamp with time zone)')::oid;
BEGIN
  IF NOT has_function_privilege('service_role',v_oid,'EXECUTE')
     OR has_function_privilege('anon',v_oid,'EXECUTE')
     OR has_function_privilege('authenticated',v_oid,'EXECUTE')
  THEN RAISE EXCEPTION 'RESILIENCE_STAGE_WRITER_ROLE_PARITY_FAILED'; END IF;
END
$verify$;

COMMIT;
