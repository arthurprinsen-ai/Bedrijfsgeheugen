create index if not exists powerhouse_opportunities_identity_recent_idx
on public.powerhouse_opportunities (updated_at desc nulls last)
where coalesce(
  nullif(trim(person_key),''),
  nullif(trim(company_key),''),
  nullif(trim(subject_key),'')
) is not null;

create or replace function public.powerhouse_revenue_event_spine_cycle_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public'
as $function$
declare
  v_identity jsonb;
  v_attribution jsonb;
  v_health jsonb;
  v_result jsonb;
begin
  v_identity := jsonb_build_object(
    'contract','powerhouse-identity-graph-deferred-v1',
    'inline',false,
    'owner','powerhouse-identity-graph-v1',
    'reason','identity maintenance is outside the latency-critical commercial heartbeat',
    'bounded_incremental',true
  );

  v_attribution := public.powerhouse_refresh_revenue_attribution_snapshot_v1();
  select to_jsonb(h)
    into v_health
    from public.powerhouse_revenue_event_spine_health_v1 h;

  v_result := jsonb_build_object(
    'contract','powerhouse-rocket-revenue-event-spine-v3',
    'run_date',p_run_date,
    'identity_graph',v_identity,
    'multi_touch_attribution',v_attribution,
    'health',v_health,
    'orchestration',jsonb_build_object(
      'mode','bounded_critical_path',
      'full_identity_maintenance_owner','powerhouse-identity-graph-v1 independent maintenance',
      'runtime_identity_owner','deferred',
      'next_best_action_owner','powerhouse_commercial_next_best_action_v5 -> revenue_command_center_snapshot_v1',
      'action_owner','powerhouse_materialize_command_center_actions_v1',
      'reason','Heavy identity maintenance is excluded from the commercial heartbeat transaction.'
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
      'bounded_critical_path',true,
      'identity_maintenance_deferred',true
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
    updated_at=excluded.updated_at;

  return v_result;
end
$function$;

do $outer$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid
  from cron.job
  where jobname='powerhouse-runtime-maintenance-v1'
  order by jobid desc
  limit 1;

  if v_jobid is null then
    raise exception 'RUNTIME_MAINTENANCE_JOB_MISSING';
  end if;

  perform cron.alter_job(
    v_jobid,
    schedule := '1-4,6-9,11-14,16-19,21-24,26-29,31-34,36-39,41-44,46-49,51-54,56-59 * * * *'
  );
end;
$outer$;
;
