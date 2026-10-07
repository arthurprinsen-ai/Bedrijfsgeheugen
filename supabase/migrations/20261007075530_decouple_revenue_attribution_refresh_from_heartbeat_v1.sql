-- Keep commercial heartbeat latency-bounded.
-- Revenue attribution materialization already has one canonical maintenance owner:
-- powerhouse-runtime-scheduler-mux-v1 at minutes 7/22/37/52.
-- Heartbeat consumes the latest durable snapshot and its health projection only.

create or replace function public.powerhouse_revenue_event_spine_cycle_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog', 'public'
as $function$
declare
  v_identity jsonb;
  v_attribution jsonb;
  v_health jsonb;
  v_result jsonb;
  v_refreshed_at timestamptz;
  v_snapshot_age_seconds bigint;
begin
  v_identity := public.powerhouse_sync_identity_graph_batch_v1(25);

  -- Read the already materialized attribution truth. Never rebuild the 180-day
  -- attribution graph inside the five-minute commercial heartbeat transaction.
  select to_jsonb(h)
    into v_health
  from public.powerhouse_revenue_event_spine_health_v1 h;

  begin
    v_refreshed_at := nullif(v_health->>'attribution_refreshed_at','')::timestamptz;
  exception
    when others then
      v_refreshed_at := null;
  end;

  v_snapshot_age_seconds :=
    case
      when v_refreshed_at is null then null
      else greatest(0, floor(extract(epoch from (now() - v_refreshed_at)))::bigint)
    end;

  v_attribution := jsonb_build_object(
    'contract','powerhouse-revenue-attribution-snapshot-read-v1',
    'state',case when v_refreshed_at is null then 'NOT_MATERIALIZED' else 'SNAPSHOT_READ' end,
    'mode','read_only_snapshot',
    'critical_path_refresh',false,
    'refresh_owner','powerhouse-runtime-scheduler-mux-v1',
    'refresh_minutes',jsonb_build_array(7,22,37,52),
    'attribution_touches',coalesce((v_health->>'attribution_touches')::bigint,0),
    'attributed_revenue_eur',coalesce((v_health->>'attributed_revenue_eur')::numeric,0),
    'attribution_balanced',coalesce((v_health->>'attribution_balanced')::boolean,true),
    'revenue_outcomes_without_touches',coalesce((v_health->>'revenue_outcomes_without_touches')::bigint,0),
    'attribution_refreshed_at',v_refreshed_at,
    'snapshot_age_seconds',v_snapshot_age_seconds,
    'executed_at',now()
  );

  v_result := jsonb_build_object(
    'contract','powerhouse-rocket-revenue-event-spine-v3',
    'run_date',p_run_date,
    'identity_graph',v_identity,
    'multi_touch_attribution',v_attribution,
    'health',v_health,
    'orchestration',jsonb_build_object(
      'mode','bounded_incremental_runtime',
      'full_identity_maintenance_owner','powerhouse_sync_identity_graph_v1 independent maintenance',
      'runtime_identity_owner','powerhouse_sync_identity_graph_batch_v1',
      'attribution_refresh_owner','powerhouse-runtime-scheduler-mux-v1',
      'attribution_heartbeat_mode','read_only_snapshot',
      'next_best_action_owner','powerhouse_commercial_next_best_action_v5 -> revenue_command_center_snapshot_v1',
      'action_owner','powerhouse_materialize_command_center_actions_v1',
      'reason','Whole-history attribution materialization is maintenance work and is outside the latency-critical heartbeat transaction.'
    ),
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values(
    'rocket-revenue-spine:'||p_run_date,
    'rocket_revenue_event_spine_cycle',
    'powerhouse-rocket-revenue-event-spine-v3',
    'growth-revenue-os',
    now(),
    v_result,
    jsonb_build_object(
      'existing_state_first',true,
      'reuse_first',true,
      'bounded_incremental_runtime',true,
      'attribution_critical_path_refresh',false,
      'attribution_refresh_owner','powerhouse-runtime-scheduler-mux-v1'
    ),
    case when coalesce((v_health->>'attribution_balanced')::boolean,true) then 'actioned' else 'error' end,
    'VERIFIED',
    1,
    now()
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=excluded.updated_at;

  return v_result;
end
$function$;

revoke execute on function public.powerhouse_revenue_event_spine_cycle_v1(date)
  from public, anon, authenticated;
grant execute on function public.powerhouse_revenue_event_spine_cycle_v1(date)
  to service_role;

comment on function public.powerhouse_revenue_event_spine_cycle_v1(date) is
'Latency-bounded commercial revenue spine. Heartbeat reads durable attribution snapshot/health only; powerhouse-runtime-scheduler-mux-v1 owns attribution refresh.';
