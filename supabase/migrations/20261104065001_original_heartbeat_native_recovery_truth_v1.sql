-- Original ONE BRAIN / Heartbeat owner, parent incident #4198; 2026-11-04.
-- Consolidated into the original already-owned migration 20261104065001; no duplicate migration writer.
-- SAME canonical scheduler #171, SAME original runtime mux, no second cron or writer.
-- Typed source receipt is fetched without provider actions, replays, side effects or public grants.
-- Do NOT mistake terminal reconciler execution success for provider recovery.
CREATE OR REPLACE FUNCTION public.powerhouse_runtime_mux_task_v1(p_task text, p_sql text, p_timeout_ms integer DEFAULT 10000)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_started timestamptz:=clock_timestamp();
  v_prior_timeout text:=current_setting('statement_timeout');
  v_receipt jsonb := null;
  v_recovery_truth jsonb := null;
begin
  if p_timeout_ms < 1000 or p_timeout_ms > 30000 then
    raise exception 'VALIDATION_ERROR';
  end if;

  perform set_config('statement_timeout',p_timeout_ms::text,true);
  if p_task in ('one-brain-reconcile','terminal-autonomous-reconcile') then
    execute p_sql into v_receipt;
  else
    execute p_sql;
  end if;
  perform set_config('statement_timeout',v_prior_timeout,true);

  -- Only the original ONE BRAIN task returns a typed policy-error receipt.
  -- All unrelated mux tasks retain their existing execution contract.
  if p_task = 'one-brain-reconcile' and
     (v_receipt is null or
      coalesce((v_receipt->>'policy_promotion_error_count')::integer,0)>0) then
    return jsonb_build_object(
      'task',p_task,'ok',false,
      'state','ONE_BRAIN_POLICY_PROMOTION_DEGRADED',
      'error_count',coalesce((v_receipt->>'policy_promotion_error_count')::integer,0),
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
  end if;

  -- Original terminal reconciliation is already scheduled by canonical cron #171.
  -- Attach ONLY a private, read-only aggregate of the original incident queue.
  -- Execution ok=true never implies the 306 historically unresolved provider outcomes succeeded.
  if p_task = 'terminal-autonomous-reconcile' then
    if v_receipt is null or jsonb_typeof(v_receipt) <> 'object'
       or v_receipt->>'contract' <> 'terminal-autonomous-reconciler-v2' then
      return jsonb_build_object('task',p_task,'ok',false,
        'state','TERMINAL_RECONCILER_SOURCE_RECEIPT_MISSING',
        'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint);
    end if;
    select public.powerhouse_recovery_review_truth_v1() into v_recovery_truth;
    if v_recovery_truth is null
       or v_recovery_truth->>'contract' <> 'original-recovery-queue-outcome-proof-v1' then
      return jsonb_build_object('task',p_task,'ok',false,
        'state','RECOVERY_REVIEW_SOURCE_RECEIPT_MISSING',
        'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint);
    end if;
    return jsonb_build_object(
      'task',p_task,'ok',true,
      'state','EXECUTION_COMPLETED_PROVIDER_OUTCOMES_SEPARATE',
      'terminal_reconciler_contract',v_receipt->>'contract',
      'recovery_review_truth',v_recovery_truth,
      'recovery_provider_resolution_proven',false,
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
  end if;

  return jsonb_build_object(
    'task',p_task,
    'ok',true,
    'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
  );
exception
  when query_canceled then
    perform set_config('statement_timeout',v_prior_timeout,true);
    return jsonb_build_object(
      'task',p_task,
      'ok',false,
      'state','TIMEOUT',
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
  when others then
    perform set_config('statement_timeout',v_prior_timeout,true);
    return jsonb_build_object(
      'task',p_task,
      'ok',false,
      'state','ERROR',
      'sqlstate',sqlstate,
      'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
    );
end
$function$;
REVOKE EXECUTE ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer) TO service_role;
COMMENT ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer) IS 'Original cron #171 mux: ONE BRAIN policy errors fail closed; original terminal reconciler success carries read-only recovery source truth EVIDENCE_DUE separately from actual provider outcomes. No extra scheduler.';
