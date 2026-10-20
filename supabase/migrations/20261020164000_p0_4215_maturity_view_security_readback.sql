-- P0 #4215: reconcile a provider-preview migration which applied before
-- the updated 20261020163500 source was verified as security_invoker.
-- This is a new, idempotent migration to avoid reusing a previously recorded version.
-- Preserve the internal service-role access contract. No broadening of RLS or grants.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '10s';

DO $check$
BEGIN
  IF to_regclass('public.powerhouse_action_evidence_maturity_v1') IS NULL THEN
    RAISE EXCEPTION 'P0_4215_MATURITY_VIEW_MISSING';
  END IF;
  IF position('powerhouse_opportunities opp' IN
    pg_get_viewdef('public.powerhouse_action_evidence_maturity_v1'::regclass,true)) = 0 THEN
    RAISE EXCEPTION 'P0_4215_MATURITY_FASTPATH_NOT_APPLIED';
  END IF;
END
$check$;

ALTER VIEW public.powerhouse_action_evidence_maturity_v1
  SET (security_invoker = true);
REVOKE ALL ON public.powerhouse_action_evidence_maturity_v1
  FROM PUBLIC, anon, authenticated;

DO $readback$
DECLARE
  v_opts text[];
BEGIN
  SELECT reloptions INTO v_opts
    FROM pg_class WHERE oid='public.powerhouse_action_evidence_maturity_v1'::regclass;
  IF NOT ('security_invoker=true' = ANY(COALESCE(v_opts,ARRAY[]::text[]))) THEN
    RAISE EXCEPTION 'P0_4215_VIEW_INVOKER_READBACK_FAILED';
  END IF;
  IF has_table_privilege('anon',
        'public.powerhouse_action_evidence_maturity_v1','SELECT')
     OR has_table_privilege('authenticated',
        'public.powerhouse_action_evidence_maturity_v1','SELECT') THEN
    RAISE EXCEPTION 'P0_4215_VIEW_BROWSER_ACCESS_READBACK_FAILED';
  END IF;
  IF NOT has_table_privilege('service_role',
        'public.powerhouse_action_evidence_maturity_v1','SELECT') THEN
    RAISE EXCEPTION 'P0_4215_VIEW_SERVICE_ROLE_READBACK_FAILED';
  END IF;
END
$readback$;
COMMIT;
