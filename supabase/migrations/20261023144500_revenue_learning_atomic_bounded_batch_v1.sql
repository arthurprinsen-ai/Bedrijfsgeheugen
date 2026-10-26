-- P0 #4445: one bounded action-learning reconciliation, no second scheduler.
-- Fingerprint: growth|revenue-learning|bounded-atomic-sales-action-reconcile|20261023-v1
-- Uses the existing three revenue_learning_obligations per executed action
-- as durable fair-progress receipts; no independent cursor table/registry.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '20s';

DO $guard$
BEGIN
  IF to_regclass('public.powerhouse_sales_actions') IS NULL
     OR to_regclass('public.revenue_learning_obligations') IS NULL
     OR to_regprocedure('public.powerhouse_reconcile_action_learning_obligations_v1(uuid)') IS NULL
  THEN
    RAISE EXCEPTION 'REVENUE_RECONCILE_CANONICAL_SOURCE_MISSING';
  END IF;
END
$guard$;

CREATE OR REPLACE FUNCTION public.powerhouse_reconcile_action_learning_batch_v1(p_limit integer DEFAULT 16)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $function$
DECLARE
  v_row record;
  v_processed integer := 0;
  v_total integer := 0;
BEGIN
  IF p_limit IS NULL OR p_limit < 1 OR p_limit > 16 THEN
    RAISE EXCEPTION 'REVENUE_RECONCILE_BATCH_LIMIT_INVALID' USING ERRCODE='22023';
  END IF;

  -- All calls use the incumbent service-role boundary. A contested lock does
  -- not report a successful reconciliation and does not trigger a second writer.
  IF NOT pg_catalog.pg_try_advisory_xact_lock(
      pg_catalog.hashtextextended('powerhouse.revenue.action-learning.v1', 0)) THEN
    RETURN jsonb_build_object('status','BUSY','reconciled',0);
  END IF;

  SELECT count(*)::integer INTO v_total
  FROM public.powerhouse_sales_actions
  WHERE executed_at IS NOT NULL;

  -- Missing receipts first; otherwise the *least recently reconciled* action.
  -- Existing per-action upserts refresh their three receipts atomically with this
  -- transaction. Newer evidence is never fabricated, even when outcomes are absent.
  FOR v_row IN
    SELECT a.action_id
    FROM public.powerhouse_sales_actions a
    LEFT JOIN LATERAL (
      SELECT CASE WHEN count(o.obligation_id)=3 THEN min(o.updated_at)
                  ELSE NULL END AS last_checked
      FROM public.revenue_learning_obligations o
      WHERE o.tenant_id='canonical'
        AND o.obligation_id IN (
          'sales-action:'||a.action_id::text||':outcome',
          'sales-action:'||a.action_id::text||':economics',
          'sales-action:'||a.action_id::text||':feedback'
        )
    ) receipts ON TRUE
    WHERE a.executed_at IS NOT NULL
    ORDER BY receipts.last_checked ASC NULLS FIRST, a.executed_at ASC, a.action_id ASC
    LIMIT p_limit
  LOOP
    PERFORM public.powerhouse_reconcile_action_learning_obligations_v1(v_row.action_id);
    v_processed := v_processed + 1;
  END LOOP;

  RETURN jsonb_build_object('status','OK','reconciled',v_processed,
                            'total_executed',v_total,'batch_cap',p_limit,
                            'coverage','BOUNDED_NOT_ALL_ACTIONS');
END
$function$;

-- RPC is never an anonymous/customer callable privileged action.
REVOKE ALL ON FUNCTION public.powerhouse_reconcile_action_learning_batch_v1(integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_reconcile_action_learning_batch_v1(integer)
  TO service_role;

DO $verify$
BEGIN
  IF pg_catalog.has_function_privilege('anon',
       'public.powerhouse_reconcile_action_learning_batch_v1(integer)', 'EXECUTE')
     OR pg_catalog.has_function_privilege('authenticated',
       'public.powerhouse_reconcile_action_learning_batch_v1(integer)', 'EXECUTE')
     OR NOT pg_catalog.has_function_privilege('service_role',
       'public.powerhouse_reconcile_action_learning_batch_v1(integer)', 'EXECUTE')
  THEN
    RAISE EXCEPTION 'REVENUE_RECONCILE_BATCH_ROLE_BOUNDARY_INVALID';
  END IF;
END
$verify$;

COMMIT;
