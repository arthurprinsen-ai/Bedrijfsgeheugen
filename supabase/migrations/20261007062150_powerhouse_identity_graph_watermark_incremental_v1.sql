create or replace function public.powerhouse_sync_identity_graph_batch_v1(p_batch_size integer default 500)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_now timestamptz:=now();
  v_contacts int:=0;
  v_opps int:=0;
  v_events int:=0;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-identity-graph-maintenance-v1',0)) then
    return jsonb_build_object(
      'contract','powerhouse-identity-graph-batch-v1',
      'batch_size',p_batch_size,
      'skipped',true,
      'reason','maintenance_lock_busy',
      'executed_at',v_now
    );
  end if;

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
      x.identifier_type,
      md5(lower(trim(x.identifier_value))) identifier_hash,
      greatest(.50::numeric,least(1::numeric,coalesce(prioriteit,0)/100.0)) confidence,
      jsonb_build_object('relationship_status',status,'segment',segment,'source',coalesce(bron,'bg_connecties')) evidence,
      coalesce(bijgewerkt_op,v_now) source_updated_at
    from candidates
    cross join lateral(values
      ('linkedin_url',nullif(linkedin_url,'')),('email',nullif(email,'')),('connection_key',nullif(sleutel,''))
    ) x(identifier_type,identifier_value)
    where x.identifier_value is not null
  ), src as (
    select distinct on(identifier_type,identifier_hash)
      entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence,source_updated_at
    from raw
    order by identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  ), delta as (
    select s.*
    from src s
    left join public.powerhouse_identity_graph_v1 g
      on g.entity_type='person'
     and g.identifier_type=s.identifier_type
     and g.identifier_hash=s.identifier_hash
    where g.graph_id is null
       or g.last_seen_at is null
       or g.last_seen_at < s.source_updated_at
       or g.entity_key is distinct from s.entity_key
       or g.person_key is distinct from s.person_key
       or g.company_key is distinct from s.company_key
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select 'person',entity_key,person_key,company_key,identifier_type,identifier_hash,'bg_connecties',confidence,source_updated_at,source_updated_at,evidence
  from delta
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence
  where public.powerhouse_identity_graph_v1.last_seen_at is distinct from excluded.last_seen_at
     or public.powerhouse_identity_graph_v1.entity_key is distinct from excluded.entity_key
     or public.powerhouse_identity_graph_v1.person_key is distinct from excluded.person_key
     or public.powerhouse_identity_graph_v1.company_key is distinct from excluded.company_key;
  get diagnostics v_contacts=row_count;

  with recent as (
    select *
    from public.powerhouse_opportunities
    where coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) is not null
    order by updated_at desc nulls last
    limit greatest(1,least(coalesce(p_batch_size,500),1000))
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence,source_updated_at
    from (
      select
        case when nullif(trim(person_key),'') is not null then 'person' else 'company' end entity_type,
        coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) entity_key,
        nullif(trim(person_key),'') person_key,
        nullif(trim(company_key),'') company_key,
        case when nullif(trim(person_key),'') is not null then 'person_key' else 'company_key' end identifier_type,
        md5(lower(trim(coalesce(nullif(person_key,''),nullif(company_key,''),subject_key)))) identifier_hash,
        least(1::numeric,greatest(.25::numeric,coalesce(confidence,.5))) confidence,
        jsonb_build_object('opportunity_key',opportunity_key,'stage',stage,'status',status) evidence,
        coalesce(updated_at,v_now) source_updated_at
      from recent
    ) q
    order by entity_type,identifier_type,identifier_hash,source_updated_at desc nulls last,confidence desc
  ), delta as (
    select s.*
    from src s
    left join public.powerhouse_identity_graph_v1 g
      on g.entity_type=s.entity_type
     and g.identifier_type=s.identifier_type
     and g.identifier_hash=s.identifier_hash
    where g.graph_id is null
       or g.last_seen_at is null
       or g.last_seen_at < s.source_updated_at
       or g.entity_key is distinct from s.entity_key
       or g.person_key is distinct from s.person_key
       or g.company_key is distinct from s.company_key
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'powerhouse_opportunities',confidence,source_updated_at,source_updated_at,evidence
  from delta
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence
  where public.powerhouse_identity_graph_v1.last_seen_at is distinct from excluded.last_seen_at
     or public.powerhouse_identity_graph_v1.entity_key is distinct from excluded.entity_key
     or public.powerhouse_identity_graph_v1.person_key is distinct from excluded.person_key
     or public.powerhouse_identity_graph_v1.company_key is distinct from excluded.company_key;
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
      nullif(trim(payload->>'person_key'),'') person_key,
      nullif(trim(payload->>'company_key'),'') company_key,
      case when nullif(trim(payload->>'person_key'),'') is not null then 'event_person_key'
           when nullif(trim(payload->>'company_key'),'') is not null then 'event_company_key' else 'attribution_root_key' end identifier_type,
      md5(lower(trim(coalesce(nullif(payload->>'person_key',''),nullif(payload->>'company_key',''),nullif(canonical,''),attribution_root_key)))) identifier_hash,
      occurred_at,
      jsonb_build_object('source','growth_events','event_type',event_type) evidence
    from recent
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,occurred_at,evidence
    from raw
    order by entity_type,identifier_type,identifier_hash,occurred_at desc
  ), delta as (
    select s.*
    from src s
    left join public.powerhouse_identity_graph_v1 g
      on g.entity_type=s.entity_type
     and g.identifier_type=s.identifier_type
     and g.identifier_hash=s.identifier_hash
    where g.graph_id is null
       or g.last_seen_at is null
       or g.last_seen_at < s.occurred_at
       or g.entity_key is distinct from s.entity_key
       or g.person_key is distinct from s.person_key
       or g.company_key is distinct from s.company_key
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,source,confidence,first_seen_at,last_seen_at,evidence
  )
  select entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,'growth_events',.60,occurred_at,occurred_at,evidence
  from delta
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=public.powerhouse_identity_graph_v1.evidence||excluded.evidence
  where public.powerhouse_identity_graph_v1.last_seen_at is distinct from excluded.last_seen_at
     or public.powerhouse_identity_graph_v1.entity_key is distinct from excluded.entity_key
     or public.powerhouse_identity_graph_v1.person_key is distinct from excluded.person_key
     or public.powerhouse_identity_graph_v1.company_key is distinct from excluded.company_key;
  get diagnostics v_events=row_count;

  return jsonb_build_object(
    'contract','powerhouse-identity-graph-batch-v1',
    'batch_size',p_batch_size,
    'contacts_touched',v_contacts,
    'opportunities_touched',v_opps,
    'events_touched',v_events,
    'nodes',(select count(distinct entity_type||':'||entity_key) from public.powerhouse_identity_graph_v1),
    'identifiers',(select count(*) from public.powerhouse_identity_graph_v1),
    'bounded_incremental',true,
    'watermark_incremental',true,
    'executed_at',v_now
  );
end
$function$;

revoke execute on function public.powerhouse_sync_identity_graph_batch_v1(integer)
  from public, anon, authenticated;
grant execute on function public.powerhouse_sync_identity_graph_batch_v1(integer)
  to service_role;;
