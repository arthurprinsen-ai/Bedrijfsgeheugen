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

-- Decommission only the proven redundant native recovery cron, atomically after the original #171 mux is installed and source-checked.
-- Preview branches can omit prod cron metadata: in that case there is nothing to retire.
DO $one_original_recovery_owner$
DECLARE
  v_job record;
  v_n integer;
BEGIN
  SELECT count(*) INTO v_n FROM cron.job
   WHERE active AND jobname='powerhouse-original-recovery-control-plane-v1';
  IF v_n > 1 THEN
    RAISE EXCEPTION 'ORIGINAL_RECOVERY_DUPLICATE_OWNER_CONFLICT: %',v_n;
  END IF;
  IF v_n = 1 THEN
    SELECT * INTO v_job FROM cron.job
     WHERE active AND jobname='powerhouse-original-recovery-control-plane-v1'
     FOR UPDATE;
    IF v_job.schedule <> '*/15 * * * *'
       OR btrim(v_job.command) <> 'select public.powerhouse_recovery_control_plane_tick_v1();'
    THEN
      RAISE EXCEPTION 'ORIGINAL_RECOVERY_JOB_DRIFT_REQUIRES_OWNER_REVIEW';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM cron.job WHERE active
        AND jobname='powerhouse-runtime-scheduler-mux-v1'
        AND command LIKE '%powerhouse_runtime_scheduler_mux_v3%'
    ) THEN
      RAISE EXCEPTION 'ORIGINAL_171_SCHEDULER_MISSING_KEEP_184';
    END IF;
    IF has_function_privilege('anon','public.powerhouse_runtime_mux_task_v1(text,text,integer)','EXECUTE')
       OR has_function_privilege('authenticated','public.powerhouse_runtime_mux_task_v1(text,text,integer)','EXECUTE')
    THEN
      RAISE EXCEPTION 'ORIGINAL_HEARTBEAT_PRIVILEGE_DRIFT_KEEP_184';
    END IF;
    PERFORM cron.unschedule(v_job.jobid);
  END IF;
END;
$one_original_recovery_owner$;
