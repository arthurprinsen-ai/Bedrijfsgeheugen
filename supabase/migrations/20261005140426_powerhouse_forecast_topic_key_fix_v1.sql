CREATE OR REPLACE FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 'actioned' else 'degraded' end,
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
end $function$
