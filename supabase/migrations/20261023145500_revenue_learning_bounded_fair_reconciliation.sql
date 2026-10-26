-- Canonical revenue learning: one bounded, fair, atomic reconciliation batch.
-- Parent: #4445. No new scheduler, store, tenant, or external provider call.
-- The caller is the already-token-guarded revenue-learning-store Edge function.
-- Base source function retains its original obligation IDs and evidence semantics.
CREATE OR REPLACE FUNCTION public.powerhouse_reconcile_action_learning_batch_v1(
  p_limit integer DEFAULT 20
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $body$
DECLARE
  v_limit integer := LEAST(GREATEST(COALESCE(p_limit,20),1),20);
  v_total integer := 0;
  v_selected integer := 0;
  v_action record;
BEGIN
  -- Executed source actions are the authority; no fabricated outcome rows.
  SELECT count(*) INTO v_total
  FROM public.powerhouse_sales_actions
  WHERE executed_at IS NOT NULL;

  -- The existing outcome-obligation updated_at is the durable, idempotent
  -- progress signal: missing/new action IDs first, then least recently visited.
  -- Stable tie breakers make every batch reproducible, even after restarts.
  FOR v_action IN
    SELECT a.action_id
    FROM public.powerhouse_sales_actions AS a
    LEFT JOIN public.revenue_learning_obligations AS ob
      ON ob.tenant_id='canonical'
      AND ob.obligation_id='sales-action:'||a.action_id::text||':outcome'
    WHERE a.executed_at IS NOT NULL
    ORDER BY ob.updated_at ASC NULLS FIRST,
             a.executed_at ASC, a.action_id ASC
    LIMIT v_limit
  LOOP
    -- No external HTTP round trip per action. Any error rolls back this
    -- single database transaction; existing on-conflict keys deduplicate.
    PERFORM public.powerhouse_reconcile_action_learning_obligations_v1(v_action.action_id);
    v_selected := v_selected + 1;
  END LOOP;

  RETURN pg_catalog.jsonb_build_object(
    'selected',v_selected,
    'total_executed',v_total,
    'remaining_review_required',v_total>v_selected,
    'proof_level','BOUNDED_RECONCILIATION_ONLY'
  );
END;
$body$;

-- This new RPC is not a public SECURITY DEFINER capability.
REVOKE ALL ON FUNCTION public.powerhouse_reconcile_action_learning_batch_v1(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.powerhouse_reconcile_action_learning_batch_v1(integer) FROM anon;
REVOKE ALL ON FUNCTION public.powerhouse_reconcile_action_learning_batch_v1(integer) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_reconcile_action_learning_batch_v1(integer) TO service_role;
