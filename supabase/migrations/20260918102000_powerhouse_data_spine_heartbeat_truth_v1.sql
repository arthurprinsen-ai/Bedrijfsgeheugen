-- Powerhouse data-spine heartbeat truth v1
-- Health heartbeats prove producer/read-path liveness only; they never mutate or fabricate customer business state.

create or replace function public.powerhouse_data_spine_watchdog_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path=public,pg_catalog
as $$
declare
  r record;
  v_gaps integer := 0;
  v_portal_rows bigint := 0;
  v_portal_latest timestamptz;
begin
  perform public.powerhouse_data_spine_reconcile_v1(p_now);

  select count(*),max(coalesce(source_updated_at,updated_at))
    into v_portal_rows,v_portal_latest
  from public.portal_state_layers;

  perform public.powerhouse_record_source_observation_v1(
    'portal-state',
    'portal-state-runtime-heartbeat:'||to_char(date_trunc('hour',p_now),'YYYYMMDDHH24'),
    'portal-state-runtime-heartbeat',
    p_now,
    jsonb_build_object(
      'contract','powerhouse-data-spine-heartbeat-truth-v1',
      'authority','portal_state_layers',
      'heartbeat_only',true,
      'customer_state_changed',false,
      'source_rows',v_portal_rows,
      'latest_source_updated_at',v_portal_latest,
      'truth_boundary','producer/read-path liveness is not a customer-state update'
    )
  );

  for r in select * from public.powerhouse_data_spine_health_v1 loop
    if r.operational_state<>'HEALTHY' then v_gaps:=v_gaps+1; end if;
    insert into public.powerhouse_runtime_events(
      dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence
    )
    values(
      'data-spine-health:'||r.source_key||':'||to_char(date_trunc('hour',p_now),'YYYYMMDDHH24'),
      'source_health_evaluated','powerhouse-data-spine',r.source_key,'data-intelligence',p_now,
      jsonb_build_object(
        'freshness',r.freshness,
        'operational_state',r.operational_state,
        'latest_observed_at',r.latest_observed_at,
        'observations',r.observations
      ),
      jsonb_build_object(
        'contract','powerhouse-unified-data-intelligence-spine-v1',
        'heartbeat_contract','powerhouse-data-spine-heartbeat-truth-v1',
        'domain',r.domain,
        'owner_component',r.owner_component
      ),
      case when r.operational_state='HEALTHY' then 'observed' else 'error' end,
      case when r.operational_state='HEALTHY' then 'verified' else 'degraded' end,
      case when r.operational_state='HEALTHY' then 1 else 0 end
    )
    on conflict (dedupe_key) do update set
      occurred_at=excluded.occurred_at,
      evidence=excluded.evidence,
      context=excluded.context,
      state=excluded.state,
      data_quality=excluded.data_quality,
      confidence=excluded.confidence,
      updated_at=now();
  end loop;

  return jsonb_build_object(
    'contract','powerhouse-unified-data-intelligence-spine-v1',
    'heartbeat_contract','powerhouse-data-spine-heartbeat-truth-v1',
    'checked_at',p_now,
    'gaps',v_gaps,
    'state',case when v_gaps=0 then 'GREEN' else 'AMBER' end
  );
end
$$;

revoke execute on function public.powerhouse_data_spine_watchdog_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_data_spine_watchdog_v1(timestamptz) to service_role;

comment on function public.powerhouse_data_spine_watchdog_v1(timestamptz) is
'Runs canonical reconciliation, records a portal persistence/read heartbeat without mutating customer-state timestamps, and evaluates unified data-spine freshness.';
