
create index if not exists powerhouse_opportunities_updated_at_identity_idx
  on public.powerhouse_opportunities (updated_at desc nulls last)
  where coalesce(
    nullif(trim(person_key),''),
    nullif(trim(company_key),''),
    nullif(trim(subject_key),'')
  ) is not null;

alter table public.powerhouse_identity_graph_v1 set (
  autovacuum_vacuum_scale_factor = 0.02,
  autovacuum_vacuum_threshold = 1000,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_analyze_threshold = 1000
);

create or replace function public.powerhouse_sync_identity_graph_runtime_v2(
  p_batch_size integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_batch integer := greatest(10,least(coalesce(p_batch_size,100),200));
  v_contacts integer := 0;
  v_opps integer := 0;
  v_events integer := 0;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-identity-graph-maintenance-v1',0)) then
    return jsonb_build_object(
      'contract','powerhouse-identity-graph-runtime-v2',
      'batch_size',v_batch,
      'skipped',true,
      'reason','maintenance_lock_busy',
      'executed_at',v_now
    );
  end if;

  with candidates as (
    select sleutel,linkedin_url,email,naam,bedrijf,prioriteit,status,segment,bron,
           coalesce(bijgewerkt_op,v_now) as source_seen_at
    from public.bg_connecties
    where coalesce(
      nullif(trim(sleutel),''),
      nullif(trim(linkedin_url),''),
      nullif(trim(email),'')
    ) is not null
    order by bijgewerkt_op desc nulls last
    limit v_batch
  ), raw as (
    select
      coalesce(
        nullif(trim(sleutel),''),
        'person:'||md5(coalesce(
          nullif(lower(trim(linkedin_url)),''),
          nullif(lower(trim(email)),''),
          nullif(lower(trim(naam)),''),
          'unknown'
        ))
      ) as entity_key,
      nullif(trim(sleutel),'') as person_key,
      nullif(lower(regexp_replace(trim(coalesce(bedrijf,'')),'\s+',' ','g')),'') as company_key,
      x.identifier_type,
      md5(lower(trim(x.identifier_value))) as identifier_hash,
      greatest(.50::numeric,least(1::numeric,coalesce(prioriteit,0)/100.0)) as confidence,
      jsonb_build_object('relationship_status',status,'segment',segment,'source',coalesce(bron,'bg_connecties')) as evidence,
      source_seen_at
    from candidates
    cross join lateral(values
      ('linkedin_url',nullif(linkedin_url,'')),
      ('email',nullif(email,'')),
      ('connection_key',nullif(sleutel,''))
    ) x(identifier_type,identifier_value)
    where x.identifier_value is not null
  ), src as (
    select distinct on(identifier_type,identifier_hash)
      entity_key,person_key,company_key,identifier_type,identifier_hash,confidence,evidence,source_seen_at
    from raw
    order by identifier_type,identifier_hash,source_seen_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,
    source,confidence,first_seen_at,last_seen_at,evidence
  )
  select
    'person',entity_key,person_key,company_key,identifier_type,identifier_hash,
    'bg_connecties',confidence,source_seen_at,source_seen_at,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=coalesce(public.powerhouse_identity_graph_v1.evidence,'{}'::jsonb)||excluded.evidence
  where excluded.last_seen_at > public.powerhouse_identity_graph_v1.last_seen_at
     or excluded.entity_key is distinct from public.powerhouse_identity_graph_v1.entity_key
     or excluded.person_key is distinct from public.powerhouse_identity_graph_v1.person_key
     or excluded.company_key is distinct from public.powerhouse_identity_graph_v1.company_key
     or excluded.confidence > public.powerhouse_identity_graph_v1.confidence
     or not coalesce(public.powerhouse_identity_graph_v1.evidence,'{}'::jsonb) @> excluded.evidence;
  get diagnostics v_contacts=row_count;

  with recent as (
    select opportunity_key,stage,status,person_key,company_key,subject_key,confidence,
           coalesce(updated_at,v_now) as source_seen_at
    from public.powerhouse_opportunities
    where coalesce(
      nullif(trim(person_key),''),
      nullif(trim(company_key),''),
      nullif(trim(subject_key),'')
    ) is not null
    order by updated_at desc nulls last
    limit v_batch
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,
      confidence,evidence,source_seen_at
    from (
      select
        case when nullif(trim(person_key),'') is not null then 'person' else 'company' end as entity_type,
        coalesce(nullif(trim(person_key),''),nullif(trim(company_key),''),nullif(trim(subject_key),'')) as entity_key,
        nullif(trim(person_key),'') as person_key,
        nullif(trim(company_key),'') as company_key,
        case when nullif(trim(person_key),'') is not null then 'person_key' else 'company_key' end as identifier_type,
        md5(lower(trim(coalesce(nullif(person_key,''),nullif(company_key,''),subject_key)))) as identifier_hash,
        least(1::numeric,greatest(.25::numeric,coalesce(confidence,.5))) as confidence,
        jsonb_build_object('opportunity_key',opportunity_key,'stage',stage,'status',status) as evidence,
        source_seen_at
      from recent
    ) q
    order by entity_type,identifier_type,identifier_hash,source_seen_at desc nulls last,confidence desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,
    source,confidence,first_seen_at,last_seen_at,evidence
  )
  select
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,
    'powerhouse_opportunities',confidence,source_seen_at,source_seen_at,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=coalesce(public.powerhouse_identity_graph_v1.evidence,'{}'::jsonb)||excluded.evidence
  where excluded.last_seen_at > public.powerhouse_identity_graph_v1.last_seen_at
     or excluded.entity_key is distinct from public.powerhouse_identity_graph_v1.entity_key
     or excluded.person_key is distinct from public.powerhouse_identity_graph_v1.person_key
     or excluded.company_key is distinct from public.powerhouse_identity_graph_v1.company_key
     or excluded.confidence > public.powerhouse_identity_graph_v1.confidence
     or not coalesce(public.powerhouse_identity_graph_v1.evidence,'{}'::jsonb) @> excluded.evidence;
  get diagnostics v_opps=row_count;

  with recent as (
    select event_type,canonical,attribution_root_key,payload,occurred_at
    from public.growth_events
    where is_robot is not true
      and occurred_at >= v_now-interval '30 days'
      and coalesce(
        nullif(trim(payload->>'person_key'),''),
        nullif(trim(payload->>'company_key'),''),
        nullif(trim(canonical),''),
        nullif(trim(attribution_root_key),'')
      ) is not null
    order by occurred_at desc
    limit v_batch
  ), raw as (
    select
      case when nullif(trim(payload->>'person_key'),'') is not null then 'person' else 'company' end as entity_type,
      coalesce(
        nullif(trim(payload->>'person_key'),''),
        nullif(trim(payload->>'company_key'),''),
        nullif(trim(canonical),''),
        nullif(trim(attribution_root_key),'')
      ) as entity_key,
      nullif(trim(payload->>'person_key'),'') as person_key,
      nullif(trim(payload->>'company_key'),'') as company_key,
      case
        when nullif(trim(payload->>'person_key'),'') is not null then 'event_person_key'
        when nullif(trim(payload->>'company_key'),'') is not null then 'event_company_key'
        else 'attribution_root_key'
      end as identifier_type,
      md5(lower(trim(coalesce(
        nullif(payload->>'person_key',''),
        nullif(payload->>'company_key',''),
        nullif(canonical,''),
        attribution_root_key
      )))) as identifier_hash,
      occurred_at,
      jsonb_build_object('source','growth_events','event_type',event_type) as evidence
    from recent
  ), src as (
    select distinct on(entity_type,identifier_type,identifier_hash)
      entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,occurred_at,evidence
    from raw
    order by entity_type,identifier_type,identifier_hash,occurred_at desc
  )
  insert into public.powerhouse_identity_graph_v1(
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,
    source,confidence,first_seen_at,last_seen_at,evidence
  )
  select
    entity_type,entity_key,person_key,company_key,identifier_type,identifier_hash,
    'growth_events',.60,occurred_at,occurred_at,evidence
  from src
  on conflict(entity_type,identifier_type,identifier_hash) do update set
    entity_key=excluded.entity_key,
    person_key=coalesce(excluded.person_key,public.powerhouse_identity_graph_v1.person_key),
    company_key=coalesce(excluded.company_key,public.powerhouse_identity_graph_v1.company_key),
    confidence=greatest(public.powerhouse_identity_graph_v1.confidence,excluded.confidence),
    last_seen_at=greatest(public.powerhouse_identity_graph_v1.last_seen_at,excluded.last_seen_at),
    evidence=coalesce(public.powerhouse_identity_graph_v1.evidence,'{}'::jsonb)||excluded.evidence
  where excluded.last_seen_at > public.powerhouse_identity_graph_v1.last_seen_at
     or excluded.entity_key is distinct from public.powerhouse_identity_graph_v1.entity_key
     or excluded.person_key is distinct from public.powerhouse_identity_graph_v1.person_key
     or excluded.company_key is distinct from public.powerhouse_identity_graph_v1.company_key
     or excluded.confidence > public.powerhouse_identity_graph_v1.confidence
     or not coalesce(public.powerhouse_identity_graph_v1.evidence,'{}'::jsonb) @> excluded.evidence;
  get diagnostics v_events=row_count;

  return jsonb_build_object(
    'contract','powerhouse-identity-graph-runtime-v2',
    'batch_size',v_batch,
    'contacts_touched',v_contacts,
    'opportunities_touched',v_opps,
    'events_touched',v_events,
    'bounded_incremental',true,
    'noop_conflicts_suppressed',true,
    'executed_at',v_now
  );
end;
$function$;

revoke execute on function public.powerhouse_sync_identity_graph_runtime_v2(integer)
  from public, anon, authenticated;
grant execute on function public.powerhouse_sync_identity_graph_runtime_v2(integer)
  to service_role;

comment on function public.powerhouse_sync_identity_graph_runtime_v2(integer) is
  'Latency-bounded identity graph sync for the commercial heartbeat. Uses source timestamps, suppresses no-op conflict writes, and avoids whole-graph counts.';
