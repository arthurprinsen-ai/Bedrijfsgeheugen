
create or replace view public.powerhouse_data_spine_health_v1 as
with wanted(source_key, domain, producer_required) as (
  values
    ('ga4-analytics'::text,'analytics'::text,true),
    ('gsc-search'::text,'search'::text,true),
    ('linkedin'::text,'social_metrics'::text,false),
    ('composio-linkedin-publication'::text,'social_publication'::text,true),
    ('instagram-social'::text,'social_metrics'::text,false),
    ('social-buffer'::text,'legacy_social_transport'::text,false),
    ('tavily-intelligence'::text,'external_intelligence_provider'::text,false),
    ('external-intelligence'::text,'external_intelligence'::text,true),
    ('dataforseo-intelligence'::text,'search_intelligence'::text,true),
    ('portal-state'::text,'customer_state'::text,true)
),
state as (
  select w.source_key,w.domain,w.producer_required,s.max_age,s.writer_contract,s.owner_component,
         max(o.observed_at) latest_observed_at,count(o.*) observations
  from wanted w
  join public.powerhouse_evidence_sources s using(source_key)
  left join public.powerhouse_evidence_source_observations o using(source_key)
  group by w.source_key,w.domain,w.producer_required,s.max_age,s.writer_contract,s.owner_component
)
select source_key,domain,producer_required,max_age,writer_contract,owner_component,
       latest_observed_at,observations,
       case
         when latest_observed_at is null then 'NOT_OBSERVED'
         when now()-latest_observed_at > max_age then 'STALE'
         else 'FRESH'
       end as freshness,
       case
         when producer_required and latest_observed_at is null then 'PRODUCER_OR_INGEST_GAP'
         when producer_required and latest_observed_at is not null and now()-latest_observed_at > max_age then 'RECOVERY_DUE'
         else 'HEALTHY'
       end as operational_state
from state;

create or replace function public.powerhouse_capture_notion_projection_observation_v1()
returns trigger
language plpgsql
security definer
set search_path='public','pg_catalog'
as $$
begin
  if lower(coalesce(new.status,''))='groen' then
    perform public.powerhouse_record_source_observation_v1(
      'notion-projection',
      'notion-sync:'||to_char(date_trunc('hour',new.uitgevoerd_op),'YYYYMMDDHH24'),
      'notion-sync:'||new.run_id::text,
      new.uitgevoerd_op,
      jsonb_build_object(
        'contract','notion-projection-parity-v1',
        'authority','bg_notion_sync',
        'run_id',new.run_id,
        'workload',new.wat,
        'records_synced',new.records_gesyncet,
        'status',new.status,
        'read_after_write_verified',true
      )
    );
  end if;
  return new;
end $$;

drop trigger if exists powerhouse_capture_notion_projection_observation_v1 on public.bg_notion_sync;
create trigger powerhouse_capture_notion_projection_observation_v1
after insert on public.bg_notion_sync
for each row execute function public.powerhouse_capture_notion_projection_observation_v1();

select public.powerhouse_record_source_observation_v1(
  'notion-projection',
  'notion-sync-backfill:'||to_char(date_trunc('hour',x.uitgevoerd_op),'YYYYMMDDHH24'),
  'notion-sync:'||x.run_id::text,
  x.uitgevoerd_op,
  jsonb_build_object(
    'contract','notion-projection-parity-v1',
    'authority','bg_notion_sync',
    'run_id',x.run_id,
    'workload',x.wat,
    'records_synced',x.records_gesyncet,
    'status',x.status,
    'read_after_write_verified',true,
    'backfill',true
  )
)
from (
  select *
  from public.bg_notion_sync
  where lower(status)='groen'
  order by uitgevoerd_op desc
  limit 1
) x;
