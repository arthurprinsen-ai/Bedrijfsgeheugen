-- Normalize degraded runtime health to the canonical lifecycle state contract.
-- powerhouse_runtime_events.state allows observed/decided/actioned/closed/ignored/error.
-- Degradation semantics remain explicit in data_quality/evidence; lifecycle state uses error.

create or replace function public.powerhouse_commercial_intelligence_heartbeat_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'::text))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_now timestamptz:=now(); v_snapshot_at timestamptz; v_rows int:=0; v_age interval;
begin
  select max(refreshed_at),count(*)::int into v_snapshot_at,v_rows
  from public.powerhouse_revenue_command_center_snapshot_v1;
  v_age := case when v_snapshot_at is null then null else v_now-v_snapshot_at end;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-intelligence-heartbeat:'||p_run_date,
    'commercial_intelligence_heartbeat',
    'powerhouse-commercial-intelligence-heartbeat-v5',
    'company-person-commercial',
    v_now,
    jsonb_build_object(
      'source_nba','powerhouse_commercial_next_best_action_v5',
      'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
      'snapshot_refreshed_at',v_snapshot_at,
      'snapshot_rows',v_rows,
      'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end
    ),
    jsonb_build_object(
      'critical_path_mode','read_only_snapshot',
      'heavy_intelligence_refresh_inline',false,
      'reason','prevent lock contention/deadlocks with asynchronous research/composer/provider writebacks',
      'existing_refresh_owners_preserved',true,
      'single_action_materializer',true
    ),
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 'actioned' else 'error' end,
    case when v_snapshot_at is not null and v_rows>0 then 'VERIFIED' else 'INCOMPLETE' end,
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 1 else .4 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-intelligence-heartbeat-v5',
    'healthy',v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0,
    'source_nba','v5',
    'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
    'snapshot_refreshed_at',v_snapshot_at,
    'snapshot_rows',v_rows,
    'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end,
    'critical_path','read-only',
    'heavy_refresh_inline',false,
    'executed_at',v_now
  );
end $function$;

create or replace function public.powerhouse_commercial_heartbeat_v1(
  p_now timestamp with time zone default now()
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_catalog'
as $function$
declare
  v_run_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_full_needed boolean := false;
  v_full jsonb := '{}'::jsonb;
  v_composer jsonb := '{}'::jsonb;
  v_closure jsonb := '{}'::jsonb;
  v_terminal jsonb := '{}'::jsonb;
  v_output jsonb := '{}'::jsonb;
  v_gate jsonb := '{}'::jsonb;
begin
  select not exists (
    select 1
    from public.powerhouse_runtime_events e
    where e.dedupe_key='one-commercial-decision-loop:'||v_run_date::text
      and e.occurred_at >= v_run_date::timestamp at time zone 'Europe/Amsterdam'
  ) into v_full_needed;

  if v_full_needed then
    v_full := public.powerhouse_one_commercial_decision_loop_v1(v_run_date);
  else
    v_composer := public.powerhouse_dispatch_human_sales_composer_v2(5);
    v_closure := public.powerhouse_commercial_action_closure_watchdog_v1(p_now);
    v_terminal := public.powerhouse_terminalize_action_outcome_lineage_v1(v_run_date);
    v_output := public.powerhouse_commercial_output_assurance_v1(v_run_date);
  end if;

  v_terminal := public.powerhouse_terminalize_action_outcome_lineage_v1(v_run_date);
  v_gate := public.powerhouse_commercial_regression_gate_v1(v_run_date);

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-heartbeat:'||to_char(p_now at time zone 'UTC','YYYYMMDDHH24MI'),
    'commercial_heartbeat',
    'powerhouse-commercial-heartbeat-v1',
    'growth-revenue-os',
    p_now,
    jsonb_build_object(
      'full_cycle_executed',v_full_needed,
      'full_cycle',v_full,
      'composer',v_composer,
      'closure',v_closure,
      'terminal_lineage',v_terminal,
      'output_assurance',v_output,
      'regression_gate',v_gate
    ),
    jsonb_build_object(
      'single_scheduler_owner',true,
      'existing_state_first',true,
      'terminal_lineage_required',true,
      'provider_execution_owned_by_canonical_channel_executors',true
    ),
    case when coalesce((v_gate->>'healthy')::boolean,false) then 'actioned' else 'error' end,
    case when coalesce((v_gate->>'healthy')::boolean,false) then 'VERIFIED' else 'PARTIAL' end,
    case when coalesce((v_gate->>'healthy')::boolean,false) then 1 else 0.5 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-heartbeat-v1',
    'run_date',v_run_date,
    'full_cycle_executed',v_full_needed,
    'terminal_lineage',v_terminal,
    'regression_gate',v_gate,
    'healthy',coalesce((v_gate->>'healthy')::boolean,false),
    'executed_at',p_now
  );
end
$function$;

create or replace function public.powerhouse_revenue_event_spine_cycle_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'::text))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare v_identity jsonb; v_attribution jsonb; v_health jsonb; v_result jsonb;
begin
  v_identity:=public.powerhouse_sync_identity_graph_batch_v1(500);
  v_attribution:=public.powerhouse_refresh_revenue_attribution_snapshot_v1();
  select to_jsonb(h) into v_health from public.powerhouse_revenue_event_spine_health_v1 h;

  v_result:=jsonb_build_object(
    'contract','powerhouse-rocket-revenue-event-spine-v2','run_date',p_run_date,
    'identity_graph',v_identity,'multi_touch_attribution',v_attribution,'health',v_health,
    'orchestration',jsonb_build_object(
      'mode','bounded_incremental_runtime',
      'full_identity_maintenance_owner','powerhouse_sync_identity_graph_v1 independent maintenance',
      'runtime_identity_owner','powerhouse_sync_identity_graph_batch_v1',
      'next_best_action_owner','powerhouse_commercial_next_best_action_v5 -> revenue_command_center_snapshot_v1',
      'action_owner','powerhouse_materialize_command_center_actions_v1',
      'reason','Heavy whole-graph maintenance is outside the latency-critical commercial execution loop.'
    ),
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'rocket-revenue-spine:'||p_run_date,'rocket_revenue_event_spine_cycle',
    'powerhouse-rocket-revenue-event-spine-v2','growth-revenue-os',now(),v_result,
    jsonb_build_object('existing_state_first',true,'reuse_first',true,'bounded_incremental_runtime',true),
    case when coalesce((v_health->>'attribution_balanced')::boolean,true) then 'actioned' else 'error' end,
    'VERIFIED',1,now()
  )
  on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,
    context=excluded.context,state=excluded.state,updated_at=excluded.updated_at;
  return v_result;
end $function$;
