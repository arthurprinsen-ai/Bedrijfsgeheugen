-- P0 #4215: Forward-only repair for a preview that applied the previous
-- maturity-view migration before its security_invoker option was appended.
-- Re-applying a prior migration number is not guaranteed by Supabase Branching.
-- Preserve existing service-role-only read access; no grant or schema widening.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10s';
DO $guard$
BEGIN
 IF to_regclass('public.powerhouse_action_evidence_maturity_v1') IS NULL
    OR position('powerhouse_opportunities opp' IN
      pg_get_viewdef('public.powerhouse_action_evidence_maturity_v1'::regclass,true))=0 THEN
  RAISE EXCEPTION 'P0_4215_MATURITY_PREVIEW_SOURCE_DRIFT';
 END IF;
END
$guard$;
ALTER VIEW public.powerhouse_action_evidence_maturity_v1 SET (security_invoker=true);
REVOKE ALL ON public.powerhouse_action_evidence_maturity_v1 FROM PUBLIC, anon, authenticated;
DO $readback$
BEGIN
 IF NOT EXISTS (
  SELECT 1 FROM pg_class c
  WHERE c.oid='public.powerhouse_action_evidence_maturity_v1'::regclass
    AND 'security_invoker=true'=ANY(c.reloptions)
    AND NOT has_table_privilege('anon',c.oid,'SELECT')
    AND NOT has_table_privilege('authenticated',c.oid,'SELECT')
    AND has_table_privilege('service_role',c.oid,'SELECT')
 ) THEN
  RAISE EXCEPTION 'P0_4215_MATURITY_VIEW_SECURITY_READBACK_FAILED';
 END IF;
END
$readback$;
COMMIT;
