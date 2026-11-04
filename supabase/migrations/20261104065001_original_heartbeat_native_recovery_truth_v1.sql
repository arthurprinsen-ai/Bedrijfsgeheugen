-- Original Heartbeat #171 integration. Incident #4198.
-- This source is copied from original production pg_get_functiondef on 4 Nov.
-- Only original mux task terminal-autonomous-reconcile gains a read-only
-- typed outcome receipt; all other original task execution contracts unchanged.
-- Existing scheduler/lease, original source user permissions, timeout and
-- original provider publication actions remain untouched.
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
begin
  if p_timeout_ms < 1000 or p_timeout_ms > 30000 then
    raise exception 'VALIDATION_ERROR';
  end if;

  perform set_config('statement_timeout',p_timeout_ms::text,true);
  if p_task = 'one-brain-reconcile' then
    execute p_sql into v_receipt;
  else
    execute p_sql;
  end if;
  perform set_config('statement_timeout',v_prior_timeout,true);

  -- Independent source-only outcome receipt for the ORIGINAL natural
  -- terminal-autonomous-reconcile task of existing scheduler #171.
  -- This is read-only; no second worker, cron, side effect or blind replay.
  if p_task = 'terminal-autonomous-reconcile' then
    select public.powerhouse_recovery_review_truth_v1() into v_receipt;
    if v_receipt is null or
       coalesce(v_receipt->>'contract','') <> 'original-recovery-queue-outcome-proof-v1' then
      return jsonb_build_object(
        'task',p_task,'ok',false,
        'state','RECOVERY_SOURCE_TRUTH_UNVERIFIED',
        'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
      );
    end if;
  end if;

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

  return jsonb_build_object(
    'task',p_task,
    'ok',true,
    'elapsed_ms',floor(extract(epoch from (clock_timestamp()-v_started))*1000)::bigint
  ) || case when p_task = 'terminal-autonomous-reconcile' then
      jsonb_build_object(
        'recovery_review_truth',jsonb_build_object(
          'contract',v_receipt->>'contract',
          'outcome_state',v_receipt->>'outcome_state',
          'review_completed',v_receipt->'review_completed',
          'explicitly_unresolved',v_receipt->'explicitly_unresolved',
          'provider_resolution',v_receipt->>'provider_resolution',
          'provider_success_count',v_receipt->'provider_success_count'
        ),
        'recovery_provider_resolution_proven',false
      )
    else '{}'::jsonb end;
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
REVOKE EXECUTE ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer)
  TO service_role;
COMMENT ON FUNCTION public.powerhouse_runtime_mux_task_v1(text,text,integer) IS
  'Original Heartbeat mux task authority: typed ONE BRAIN policy errors and natural terminal recovery review-versus-provider truth, with existing fail-closed execution and strict service-only ACL.';
