-- P0 original ONE BRAIN and existing runtime mux. Fail closed on policy-promotion errors.
-- Based on independent production pg_get_functiondef 2026-11-03; preserve grants, job schedules and owners.
CREATE OR REPLACE FUNCTION public.powerhouse_one_brain_reconcile_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  a record;
  p record;
  v_signals bigint:=0;
  v_policies bigint:=0;
  v_promoted bigint:=0;
  v_promotion jsonb;
  v_health jsonb;
  v_policy_errors integer := 0;
  v_failure_receipts jsonb := '[]'::jsonb;
  v_sqlstate text;
  v_policy_hash text;
  v_failure_payload jsonb;
  v_occurrence_id text;
begin
  -- Only observed canonical runtime signals open decision cycles. Downstream stages remain evidence-first.
  for a in
    select event_id
    from public.powerhouse_runtime_events
    where event_type='scan_submitted' and source='website.frisse_blik'
    order by occurred_at,event_id
  loop
    perform public.powerhouse_open_cycle_from_runtime_signal_v1(a.event_id);
    v_signals:=v_signals+1;
  end loop;

  -- Reuse existing truth-producing engines; never duplicate their stores.
  perform public.powerhouse_refresh_forecast_calibration_obligations();
  perform public.powerhouse_mature_experiment_assignments_v1(p_now);

  -- Proven experiment policies may promote; sparse/contaminated/unproven policies stay fail-closed.
  for p in select experiment_key from public.powerhouse_experiment_policies order by experiment_key loop
    v_policies:=v_policies+1;
    begin
      v_promotion:=public.powerhouse_promote_policy_if_proven_v1(p.experiment_key);
      if coalesce((v_promotion->>'promoted')::boolean,false) then
        v_promoted:=v_promoted+1;
      end if;
    exception when others then
      -- Retain progress on other policies but never discard the original error.
      get stacked diagnostics v_sqlstate = RETURNED_SQLSTATE;
      v_policy_hash := encode(digest(coalesce(p.experiment_key,''),'sha256'),'hex');
      v_failure_payload := jsonb_build_object(
        'source','powerhouse_one_brain_reconcile_v1',
        'failure_class','EXPERIMENT_POLICY_PROMOTION',
        'sqlstate',v_sqlstate,
        'experiment_key_sha256',v_policy_hash,
        'observed_at',p_now,
        'owner','original-one-brain-policy-promotion',
        'recovery','Repair the original policy and prove the next natural run',
        'external_side_effect',false
      );
      v_occurrence_id := 'one-brain:policy-promotion:'||v_policy_hash||':'||
                         to_char(p_now at time zone 'UTC','YYYYMMDDHH24MISSUS');
      -- If the original register is unavailable, the existing mux catches
      -- the raised error and records a failed task instead of false success.
      perform public.brain_observe_failure(
        v_occurrence_id,
        'powerhouse|one-brain|silent-policy-promotion-failure|20261103-v1',
        encode(digest(v_failure_payload::text,'sha256'),'hex'),
        v_failure_payload
      );
      v_policy_errors := v_policy_errors + 1;
      v_failure_receipts := v_failure_receipts || jsonb_build_array(
        jsonb_build_object('experiment_key_sha256',v_policy_hash,'sqlstate',v_sqlstate)
      );
    end;
  end loop;

  select to_jsonb(h) into v_health from public.powerhouse_one_brain_runtime_health_v1 h limit 1;
  return jsonb_build_object(
    'contract','powerhouse-one-brain-runtime-v1',
    'reconciled_at',p_now,
    'runtime_signals_seen',v_signals,
    'experiment_policies_seen',v_policies,
    'policies_promoted',v_promoted,
    'policy_promotion_error_count',v_policy_errors,
    'policy_promotion_errors',v_failure_receipts,
    'health',v_health,
    'truth_boundary','no synthetic stages, economics, feedback, outcomes or causal proof'
  );
end
$function$;

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
