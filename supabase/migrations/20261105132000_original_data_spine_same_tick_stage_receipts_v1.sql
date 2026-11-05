-- Same original source owner: data-spine-watchdog -> original Heartbeat receipts.
-- Real source health every 10m, legacy stages every 30m; fail closed on data gaps.
-- No new cron, table, payer, provider or public security grant.
begin;
CREATE OR REPLACE FUNCTION public.powerhouse_data_spine_watchdog_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  r record;
  v_gaps integer := 0;
  v_portal_rows bigint := 0;
  v_portal_latest timestamptz;
  v_stage text;
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

  -- Original source owner: record only completed, real source-health observations
  -- on the same 10-minute heartbeat. The old 30-minute stage bridge remains
  -- as a historical independent crosscheck, not a second publisher.
  foreach v_stage in array array['action','outcome','learning','guard'] loop
    perform public.powerhouse_record_loop_stage_v1(
      'data-spine-watchdog',v_stage,
      jsonb_build_object(
        'contract','powerhouse-unified-data-intelligence-spine-v1',
        'evidence_type','original_watchdog_same_tick_source_truth',
        'source_check_at',p_now,
        'unhealthy_sources',v_gaps,
        'pass',case when v_stage='guard' then v_gaps=0 else null end,
        'action_kind',case
          when v_stage='action' and v_gaps=0 then 'VERIFIED_NO_OP'
          when v_stage='action' then 'REPAIR_REQUIRED'
          else 'OBSERVED' end,
        'customer_outcome_verified',false,
        'causal_learning_verified',false
      ),p_now);
  end loop;

  return jsonb_build_object(
    'contract','powerhouse-unified-data-intelligence-spine-v1',
    'heartbeat_contract','powerhouse-data-spine-heartbeat-truth-v1',
    'checked_at',p_now,
    'gaps',v_gaps,
    'state',case when v_gaps=0 then 'GREEN' else 'AMBER' end
  );
end
$function$;
revoke all on function public.powerhouse_data_spine_watchdog_v1(timestamptz)
  from public,anon,authenticated;
grant execute on function public.powerhouse_data_spine_watchdog_v1(timestamptz)
  to service_role;
commit;
