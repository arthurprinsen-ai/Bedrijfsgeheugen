-- 4 Nov 2026 original ONE BRAIN/Heartbeat owner. Source: exact production pg_get_functiondef, not duplicate migration 20261104065001.
-- One original protected release: #171 inherits existing read-only recovery receipt; only retire duplicate #184 if #171 is native ACTIVE.
-- Preserves original ONE BRAIN fail-closed policy, all unrelated task outputs, privileges, and no provider replay.
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
  -- Read only the original aggregated source under the same bounded task timeout.
  if p_task = 'terminal-autonomous-reconcile' and v_receipt is not null then
    v_recovery_truth := public.powerhouse_recovery_review_truth_v1();
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

  -- Terminal operation may execute successfully while historical provider outcomes are still unknown.
  -- Missing original return contract OR source proof is an execution failure, never silent green.
  if p_task = 'terminal-autonomous-reconcile' then
    if v_receipt is null
      or v_receipt->>'contract' is distinct from 'terminal-autonomous-reconciler-v2'
      or v_recovery_truth is null
      or v_recovery_truth->>'contract' is distinct from 'original-recovery-queue-outcome-proof-v1'
      or not (v_recovery_truth ? 'explicitly_unresolved')
    then
      return jsonb_build_object(
        'task',p_task,
        'ok',false,
        'state','ORIGINAL_RECOVERY_SOURCE_PROOF_MISSING',
        'recovery_provider_resolution_proven',false,
        'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
      );
    end if;
    return jsonb_build_object(
      'task',p_task,
      'ok',true,
      'state','EXECUTED_OUTCOME_EVIDENCE_SEPARATE',
      'terminal_contract','terminal-autonomous-reconciler-v2',
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
COMMENT ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer) IS 'Existing #171 mux: unchanged watchdog/reconciliation ownership, typed original recovery source truth on terminal task without claiming provider outcomes.';

-- Native cron.job administration is intentionally OUTSIDE the schema migration role's permissions.
-- Operational phase two, only after protected prod deploy and two natural #171 receipts:
-- original authorized production owner verifies exact native #171 / #184 identity and service-only ACL,
-- uses native postgres cron.unschedule for ONLY #184 with independent readback, and logs evidence in ONE BRAIN.
-- Until phase two is independently proven, the source duplication incident remains ACTIVE.
-- No additional scheduler, provider side effect, or public privilege change is created here.
