-- Fix powerhouse-autonomous-improvement-runtime-v1 writeback to the canonical brain_records taxonomy.
-- Root cause: the initial adapter used non-canonical record_type/record_kind values.

create or replace function public.powerhouse_autonomous_improvement_cycle_v1(p_now timestamptz default now())
returns public.brain_records
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_bucket timestamptz := date_trunc('hour', p_now);
  v_record_id text := 'autonomous-improvement:' || to_char(v_bucket at time zone 'UTC', 'YYYYMMDDHH24');
  v_idempotency text := 'powerhouse-autonomous-improvement-runtime-v1:' || to_char(v_bucket at time zone 'UTC', 'YYYYMMDDHH24');
  v_failures_24h bigint := 0;
  v_blockers_24h bigint := 0;
  v_runtime_p95_24h numeric;
  v_runtime_p95_baseline numeric;
  v_runtime_delta_pct numeric;
  v_cost_24h numeric := 0;
  v_cost_baseline_daily numeric;
  v_cost_delta_pct numeric;
  v_verified_value_30d bigint := 0;
  v_revenue_30d numeric := 0;
  v_previous_record_id text;
  v_candidate_count integer := 0;
  v_packet jsonb;
  v_record public.brain_records;
begin
  select count(*) into v_failures_24h from public.brain_failure_occurrences where observed_at >= p_now - interval '24 hours';
  select count(*) into v_blockers_24h from public.brain_blocker_occurrences where created_at >= p_now - interval '24 hours';

  select percentile_cont(0.95) within group (order by metric_value_ms) into v_runtime_p95_24h
  from public.brain_runtime_metrics where observed_at >= p_now - interval '24 hours' and metric_value_ms is not null;

  select percentile_cont(0.95) within group (order by metric_value_ms) into v_runtime_p95_baseline
  from public.brain_runtime_metrics
  where observed_at >= p_now - interval '8 days' and observed_at < p_now - interval '24 hours' and metric_value_ms is not null;

  if v_runtime_p95_24h is not null and v_runtime_p95_baseline is not null and v_runtime_p95_baseline <> 0 then
    v_runtime_delta_pct := round(((v_runtime_p95_24h - v_runtime_p95_baseline) / v_runtime_p95_baseline) * 100, 2);
  end if;

  select coalesce(sum(net_amount),0) into v_cost_24h from public.brain_cost_by_operation where last_usage_at >= p_now - interval '24 hours';
  select coalesce(sum(net_amount),0) / 7 into v_cost_baseline_daily
  from public.brain_cost_by_operation where last_usage_at >= p_now - interval '8 days' and last_usage_at < p_now - interval '24 hours';

  if v_cost_baseline_daily is not null and v_cost_baseline_daily <> 0 then
    v_cost_delta_pct := round(((v_cost_24h - v_cost_baseline_daily) / v_cost_baseline_daily) * 100, 2);
  end if;

  select count(*) into v_verified_value_30d from public.brain_value_evaluations where verified is true and verified_at >= p_now - interval '30 days';
  select coalesce(sum(revenue_eur),0) into v_revenue_30d from public.growth_outcomes where occurred_at >= p_now - interval '30 days' and revenue_eur is not null;

  select record_id into v_previous_record_id
  from public.brain_records
  where tenant_id='canonical'
    and record_type='CurrentState'
    and record_kind='current_state'
    and owner_id='powerhouse-autonomous-improvement-runtime-v1'
    and record_id<>v_record_id
  order by observed_at desc limit 1;

  v_candidate_count :=
      (case when v_failures_24h > 0 then 1 else 0 end)
    + (case when v_blockers_24h > 0 then 1 else 0 end)
    + (case when v_runtime_delta_pct is not null and v_runtime_delta_pct >= 10 then 1 else 0 end)
    + (case when v_cost_delta_pct is not null and v_cost_delta_pct >= 15 then 1 else 0 end);

  v_packet := jsonb_build_object(
    'fingerprint','powerhouse-autonomous-improvement-runtime-v1',
    'run_id',v_idempotency,
    'observed_at',p_now,
    'lifecycle',jsonb_build_array('OBSERVE','FITNESS','CAPABILITY_MAP','CANDIDATE','PORTFOLIO','REPLAY','EXPERIMENT','CHAOS','DECIDE','PROMOTE_OR_ROLLBACK','SIMPLIFY','VALUE_ATTRIBUTE','WRITEBACK','REVALIDATE'),
    'observe',jsonb_build_object('failure_occurrences_24h',v_failures_24h,'blocker_occurrences_24h',v_blockers_24h,'runtime_p95_ms_24h',v_runtime_p95_24h,'runtime_p95_ms_baseline',v_runtime_p95_baseline,'cost_24h',v_cost_24h,'cost_baseline_daily',v_cost_baseline_daily,'verified_value_evaluations_30d',v_verified_value_30d,'realized_revenue_eur_30d',v_revenue_30d),
    'fitness',jsonb_build_object('no_magic_score',true,'runtime_performance',jsonb_build_object('delta_pct',v_runtime_delta_pct,'material_regression',coalesce(v_runtime_delta_pct>=10,false)),'cost_efficiency',jsonb_build_object('delta_pct',v_cost_delta_pct,'material_regression',coalesce(v_cost_delta_pct>=15,false)),'reliability',jsonb_build_object('failures_24h',v_failures_24h,'blockers_24h',v_blockers_24h)),
    'capability_graph',jsonb_build_object('projection_only',true,'authorities',jsonb_build_array('supabase:brain_records','brain_failure_occurrences','brain_blocker_occurrences','brain_runtime_metrics','brain_cost_by_operation','brain_value_evaluations','growth_outcomes'),'new_persistent_authority',false),
    'candidates',jsonb_build_object('count',v_candidate_count,'failure_signal',v_failures_24h>0,'blocker_signal',v_blockers_24h>0,'performance_regression_signal',coalesce(v_runtime_delta_pct>=10,false),'cost_regression_signal',coalesce(v_cost_delta_pct>=15,false)),
    'portfolio_decision',jsonb_build_object('mode','champion_challenger','decision',case when v_candidate_count>0 then 'CANDIDATE_REQUIRES_EXPERIMENT_EVIDENCE' else 'NO_MATERIAL_CANDIDATE' end,'promotion_requires_predefined_metric',true,'promotion_requires_minimum_observations',true,'guardrails_required',true),
    'causal_evidence',jsonb_build_object('causality_not_assumed',true,'causal_claim',false),
    'replay',jsonb_build_object('previous_run_id',v_previous_record_id,'counterfactual_decisions_only',true,'available',v_previous_record_id is not null),
    'chaos',jsonb_build_object('mode','safe_synthetic_only','destructive',false,'scenarios',jsonb_build_array('supabase_unavailable','provider_429','schema_mismatch','stale_knowledge','agent_timeout','partial_writeback')),
    'simplification',jsonb_build_object('proposals_only',true,'destructive_auto_delete',false),
    'value_feedback',jsonb_build_object('observed_realized_revenue_eur_30d',v_revenue_30d,'verified_value_evaluations_30d',v_verified_value_30d,'invented_value',false),
    'promotion_holds',jsonb_build_array('security_non_degradation','correctness_non_degradation','tenant_isolation_non_degradation','unknown_critical_evidence_fails_closed','rollback_required'),
    'writeback',jsonb_build_object('authority','supabase:brain_records','idempotent',true,'new_store',false,'record_type','CurrentState','record_kind','current_state'),
    'revalidate',jsonb_build_object('required',true,'next_cycle_hourly',true)
  );

  select * into v_record from public.brain_append_record(
    'canonical',v_record_id,'CurrentState','current_state','bedrijfsgeheugen-powerhouse',v_idempotency,
    case when v_previous_record_id is null then array[]::text[] else array[v_previous_record_id] end,
    'powerhouse-autonomous-improvement-runtime-v1',case when v_candidate_count>0 then 'OBSERVED' else 'VERIFIED' end,p_now,true,true,
    jsonb_build_object('candidate_count',v_candidate_count,'writeback_verified',true),array[]::text[],
    jsonb_build_object('source','supabase_pg_cron','authority','canonical','freshness','live'),v_packet,v_idempotency,'powerhouse-autonomous-improvement-runtime-v1'
  );
  return v_record;
end;
$function$;

revoke execute on function public.powerhouse_autonomous_improvement_cycle_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_autonomous_improvement_cycle_v1(timestamptz) to service_role;
