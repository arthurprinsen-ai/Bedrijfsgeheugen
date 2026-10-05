
create or replace function public.powerhouse_sync_identity_graph_batch_v1(p_batch_size integer default 500)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare v_now timestamptz:=now(); v_contacts int:=0; v_opps int:=0; v_events int:=0;
begin
  with candidates as (
    select *
    from public.bg_connecties
    where coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),''),nullif(trim(email),'')) is not null
    order by bijgewerkt_op desc nulls last
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), raw as (
    select
      coalesce(nullif(trim(sleutel),''),'person:'||md5(coalesce(nullif(lower(trim(linkedin_url)),''),nullif(lower(trim(email)),''),nullif(lower(trim(naam)),''),'unknown'))) entity_key,
      nullif(trim(sleutel),'') person_key,
      nullif(lower(regexp_replace(trim(coalesce(bedrijf,'')),'\s+',' ','g')),'') company_key,
      x.identifier_type,md5(lower(trim(x.identifier_value))) identifier_hash,
      greatest(.50::numeric,least(1::numeric,coalesce(prioriteit,0)/100.0)) confidence,
      jsonb_build_object('relationship_status',status,'segment',segment,'source',coalesce(bron,'bg_connecties')) evidence,
      bijgewerkt_op source_updated_at
    from candidates
    cross join lateral(values
      ('linkedin_url',nullif(linkedin_url,'')),('email',nullif(email,'')),('connection_key',nullif(sleutel,''))
    ) x(identifier_type,identifier_value)
    where x.identifier_value is not null
  ), src as (
    select distinct on(identifier_type,identifier_hash)
      entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence
    from raw order by identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select 'person',entity_key,person_key,company_key,identifier_type,identifier_hash,'bg_connecties',confidence,v_now,v_now,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=v_now,evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_contacts=row_count;

  with recent as (
    select *
    from public.powerhouse_opportunities
    where coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) is not null
    order by updated_at desc nulls last
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence
    from (
      select case when nullif(trim(person_key),'') is not null then 'person' else 'company' end entity_type,
        coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) entity_key,
        nullif(trim(person_key),'') person_key,nullif(trim(company_key),'') company_key,
        case when nullif(trim(person_key),'') is not null then 'person_key' else 'company_key' end identifier_type,
        md5(lower(trim(coalesce(nullif(person_key,''),nullif(company_key,''),subject_key)))) identifier_hash,
        least(1::numeric,greatest(.25::numeric,coalesce(confidence,.5))) confidence,
        jsonb_build_object('opportunity_key',opportunity_key,'stage',stage,'status',status) evidence,
        updated_at source_updated_at
      from recent
    ) q
    order by entity_type,identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'powerhouse_opportunities',confidence,v_now,v_now,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=v_now,evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_opps=row_count;

  with recent as (
    select *
    from public.growth_events
    where is_robot is not true
      and occurred_at>=v_now-interval '30 days'
      and coalesce(nullif(trim(payload->>'person_key'),''),nullif(trim(payload->>'company_key'),''),nullif(trim(canonical),''),nullif(trim(attribution_root_key),'')) is not null
    order by occurred_at desc
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), raw as (
    select
      case when nullif(trim(payload->>'person_key'),'') is not null then 'person' else 'company' end entity_type,
      coalesce(nullif(trim(payload->>'person_key'),''),nullif(trim(payload->>'company_key'),''),nullif(trim(canonical),''),nullif(trim(attribution_root_key),'')) entity_key,
      nullif(trim(payload->>'person_key'),'') person_key,nullif(trim(payload->>'company_key'),'') company_key,
      case when nullif(trim(payload->>'person_key'),'') is not null then 'event_person_key'
           when nullif(trim(payload->>'company_key'),'') is not null then 'event_company_key' else 'attribution_root_key' end identifier_type,
      md5(lower(trim(coalesce(nullif(payload->>'person_key',''),nullif(payload->>'company_key',''),nullif(canonical,''),attribution_root_key)))) identifier_hash,
      occurred_at,jsonb_build_object('source','growth_events','event_type',event_type) evidence
    from recent
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,occurred_at,evidence
    from raw order by entity_type,identifier_type,identifier_hash,occurred_at desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'growth_events',.60,v_now,occurred_at,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence;
  get diagnostics v_events=row_count;

  return jsonb_build_object('contract','powerhouse-identity-graph-batch-v1','batch_size',p_batch_size,
    'contacts_touched',v_contacts,'opportunities_touched',v_opps,'events_touched',v_events,
    'nodes',(select count(distinct entity_type||':'||entity_key) from public.powerhouse_identity_graph_v1),
    'identifiers',(select count(*) from public.powerhouse_identity_graph_v1),
    'bounded_incremental',true,'executed_at',v_now);
end $$;
revoke execute on function public.powerhouse_sync_identity_graph_batch_v1(integer) from public,anon,authenticated;
grant execute on function public.powerhouse_sync_identity_graph_batch_v1(integer) to service_role;

create or replace function public.powerhouse_revenue_event_spine_cycle_v1(
 p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public' as $$
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
    case when coalesce((v_health->>'attribution_balanced')::boolean,true) then 'actioned' else 'degraded' end,
    'VERIFIED',1,now()
  )
  on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,
    context=excluded.context,state=excluded.state,updated_at=excluded.updated_at;
  return v_result;
end $$;
