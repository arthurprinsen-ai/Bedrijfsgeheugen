-- GA4 Data Spine: preserve stale source truth; distinguish bounded, independently
-- verified consent limitations from failed provider/source integration.
-- Original source owner only, no scheduler, no source observation backfill.
do $gate$
begin
  if not exists(select 1 from pg_views
    where schemaname='public' and viewname='powerhouse_data_spine_health_v1')
    or not exists(select 1 from public.powerhouse_evidence_sources
    where source_key='ga4-analytics'
      and owner_component='bg-analytics-sync-composio'
      and writer_contract='ga4-observed-metrics-v1') then
     raise exception 'GA4_ORIGINAL_DATA_SPINE_SOURCE_AUTHORITY_DRIFT';
  end if;
end
$gate$;

create or replace view public.powerhouse_data_spine_health_v1
with (security_invoker=true) as
with wanted(source_key,domain,producer_required) as (
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
         max(o.observed_at) as latest_observed_at,count(o.*)::bigint as observations
  from wanted w
  join public.powerhouse_evidence_sources s using(source_key)
  left join public.powerhouse_evidence_source_observations o using(source_key)
  group by w.source_key,w.domain,w.producer_required,s.max_age,s.writer_contract,s.owner_component
),
latest_ga4_sync as (
  select run_id,uitgevoerd_op,status,fout
  from public.bg_ga4_sync
  order by uitgevoerd_op desc
  limit 1
),
verified_consent_boundary as (
  select latest.run_id
  from latest_ga4_sync latest
  join public.powerhouse_runtime_events e
    on e.event_type='ga4_source_empty_observed'
   and e.subject_key='ga4-analytics'
   and e.evidence->>'run_id'=latest.run_id::text
  where latest.status='privacy_limited'
    and latest.fout='GA4_CONSENT_LIMITED_NO_SOURCE_ROWS'
    and latest.uitgevoerd_op <= now()
    and latest.uitgevoerd_op >= now()-interval '8 hours'
    and e.state='observed'
    and e.evidence->>'status'='CONSENT_LIMITED'
    and e.evidence->>'source_data_available'='false'
    and e.evidence->>'consented_human_first_party_event_present'='false'
    and e.evidence->'aggregate_probe'->>'sessions'='0'
    and e.evidence->'aggregate_probe'->>'event_count'='0'
  limit 1
)
select
  s.source_key,s.domain,s.producer_required,s.max_age,s.writer_contract,s.owner_component,
  s.latest_observed_at,s.observations,
  case
    when s.latest_observed_at is null then 'NOT_OBSERVED'
    when now()-s.latest_observed_at > s.max_age then 'STALE'
    else 'FRESH'
  end as freshness,
  case
    when s.source_key='ga4-analytics'
      and s.producer_required
      and (s.latest_observed_at is null or now()-s.latest_observed_at > s.max_age)
      and v.run_id is not null
    then 'CONSENT_LIMITED'
    when s.producer_required and s.latest_observed_at is null then 'PRODUCER_OR_INGEST_GAP'
    when s.producer_required and s.latest_observed_at is not null and now()-s.latest_observed_at > s.max_age then 'RECOVERY_DUE'
    else 'HEALTHY'
  end as operational_state
from state s
left join verified_consent_boundary v on s.source_key='ga4-analytics';

revoke all on public.powerhouse_data_spine_health_v1 from public,anon,authenticated;
grant select on public.powerhouse_data_spine_health_v1 to service_role;
comment on view public.powerhouse_data_spine_health_v1 is
'Original Data Spine truth: nonempty GA4 provider evidence alone changes freshness; a recent independently verified no-consent zero-row readback classifies operational state CONSENT_LIMITED (never HEALTHY), expires after eight hours, and never invents visitors or restarts an alternate writer.';

do $gate$
declare
  v_state text;
  v_freshness text;
begin
  select operational_state,freshness into v_state,v_freshness
  from public.powerhouse_data_spine_health_v1
  where source_key='ga4-analytics';
  if v_state not in ('CONSENT_LIMITED','RECOVERY_DUE','HEALTHY','PRODUCER_OR_INGEST_GAP')
     or v_freshness not in ('STALE','FRESH','NOT_OBSERVED') then
    raise exception 'GA4_DATA_SPINE_STATUS_OUTSIDE_VERIFIED_CONTRACT';
  end if;
  -- Never claim the source is FRESH solely on a privacy receipt.
  if v_state='CONSENT_LIMITED' and v_freshness='FRESH' then
    raise exception 'GA4_CONSENT_PROOF_CANNOT_CREATE_FRESH_SOURCE';
  end if;
end
$gate$;
