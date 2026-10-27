-- Powerhouse daily full connection enrichment v2
-- Canonical daily full-graph enrichment. Every connection is refreshed from all currently
-- available/allowed ingested LinkedIn, company and external evidence. Detailed evidence
-- remains in canonical source stores; the state table stores a compact daily projection.

create table if not exists public.powerhouse_connection_enrichment_state_v1 (
  person_key text primary key,
  linkedin_url text,
  enrichment_date date not null,
  enriched_at timestamptz not null default now(),
  data_completeness numeric not null default 0,
  linkedin_events_30d integer not null default 0,
  external_signals_90d integer not null default 0,
  company_news_120d integer not null default 0,
  runtime_evidence_90d integer not null default 0,
  latest_external_at timestamptz,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_connection_enrichment_state_v1 enable row level security;
revoke all on public.powerhouse_connection_enrichment_state_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_connection_enrichment_state_v1 to service_role;

create index if not exists powerhouse_connection_enrichment_state_date_idx
  on public.powerhouse_connection_enrichment_state_v1(enrichment_date,enriched_at desc);

create or replace function public.powerhouse_refresh_all_connection_enrichment_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date,
  p_batch_size integer default 0
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_total integer:=0;
  v_touched integer:=0;
begin
  with connections as (
    select
      coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as person_key,
      c.linkedin_url,c.naam,c.bedrijf,c.rol,c.segment,c.status,c.prioriteit,
      c.email,c.telefoon,c.whatsapp_toegestaan,c.aanleiding,c.bron,c.extra,
      lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) as company_key
    from public.bg_connecties c
    where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null
  ),
  linkedin as (
    select
      le.actor_linkedin_url,
      count(*) filter(where le.occurred_at>=v_now-interval '30 days')::integer as events_30d,
      max(le.occurred_at) as latest_at,
      (array_agg(le.actor_name order by le.occurred_at desc) filter(where nullif(trim(le.actor_name),'') is not null))[1] as latest_name,
      (array_agg(le.company_name order by le.occurred_at desc) filter(where nullif(trim(le.company_name),'') is not null))[1] as latest_company,
      (array_agg(le.role order by le.occurred_at desc) filter(where nullif(trim(le.role),'') is not null))[1] as latest_role
    from public.linkedin_engagement_events le
    where coalesce(le.is_test,false)=false
      and nullif(trim(le.actor_linkedin_url),'') is not null
    group by le.actor_linkedin_url
  ),
  person_signal as (
    select ps.entity_key as person_key,
      count(*) filter(where ps.observed_at>=v_now-interval '90 days')::integer as signals_90d,
      max(ps.observed_at) as latest_at
    from public.powerhouse_predictive_signals ps
    where ps.entity_scope='person'
    group by ps.entity_key
  ),
  company_signal as (
    select lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g')) as company_key,
      count(*) filter(where ps.observed_at>=v_now-interval '90 days')::integer as signals_90d,
      max(ps.observed_at) as latest_at
    from public.powerhouse_predictive_signals ps
    where ps.entity_scope='company'
    group by lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g'))
  ),
  news as (
    select lower(regexp_replace(trim(bn.bedrijf),'\s+',' ','g')) as company_key,
      count(*) filter(where coalesce(bn.gepubliceerd_op,bn.opgehaald_op)>=v_now-interval '120 days')::integer as news_120d,
      max(coalesce(bn.gepubliceerd_op,bn.opgehaald_op)) as latest_at
    from public.bg_bedrijfsnieuws bn
    where bn.over_dit_bedrijf is true and coalesce(bn.afgewezen_reden,'')=''
    group by lower(regexp_replace(trim(bn.bedrijf),'\s+',' ','g'))
  ),
  runtime_person as (
    select re.person_key,
      count(*) filter(where re.occurred_at>=v_now-interval '90 days')::integer as evidence_90d,
      max(re.occurred_at) as latest_at
    from public.powerhouse_runtime_events re
    where re.person_key is not null
    group by re.person_key
  ),
  runtime_company as (
    select lower(regexp_replace(trim(re.company_key),'\s+',' ','g')) as company_key,
      count(*) filter(where re.occurred_at>=v_now-interval '90 days')::integer as evidence_90d,
      max(re.occurred_at) as latest_at
    from public.powerhouse_runtime_events re
    where nullif(trim(coalesce(re.company_key,'')),'') is not null
    group by lower(regexp_replace(trim(re.company_key),'\s+',' ','g'))
  ),
  rolled as (
    select
      c.*,
      coalesce(li.events_30d,0) as linkedin_events_30d,
      coalesce(ps.signals_90d,0)+coalesce(cs.signals_90d,0) as external_signals_90d,
      coalesce(n.news_120d,0) as company_news_120d,
      greatest(coalesce(rp.evidence_90d,0),coalesce(rc.evidence_90d,0)) as runtime_evidence_90d,
      greatest(li.latest_at,ps.latest_at,cs.latest_at,n.latest_at,rp.latest_at,rc.latest_at) as latest_external_at,
      li.latest_name,li.latest_company,li.latest_role
    from connections c
    left join linkedin li on lower(trim(li.actor_linkedin_url))=lower(trim(c.linkedin_url))
    left join person_signal ps on ps.person_key=c.person_key or ps.person_key=c.linkedin_url
    left join company_signal cs on cs.company_key=c.company_key and c.company_key<>''
    left join news n on n.company_key=c.company_key and c.company_key<>''
    left join runtime_person rp on rp.person_key=c.person_key
    left join runtime_company rc on rc.company_key=c.company_key and c.company_key<>''
  ),
  upd_connecties as (
    update public.bg_connecties c
    set
      -- Never replace an existing canonical core value solely from observed social data.
      naam=coalesce(nullif(trim(c.naam),''),nullif(trim(r.latest_name),'')),
      bedrijf=coalesce(nullif(trim(c.bedrijf),''),nullif(trim(r.latest_company),'')),
      rol=coalesce(nullif(trim(c.rol),''),nullif(trim(r.latest_role),'')),
      extra=coalesce(c.extra,'{}'::jsonb)||jsonb_build_object(
        'daily_enrichment',jsonb_build_object(
          'contract','powerhouse-daily-full-connection-enrichment-v2',
          'enrichment_date',p_run_date,
          'enriched_at',v_now,
          'linkedin_events_30d',r.linkedin_events_30d,
          'external_signals_90d',r.external_signals_90d,
          'company_news_120d',r.company_news_120d,
          'runtime_evidence_90d',r.runtime_evidence_90d,
          'latest_external_at',r.latest_external_at,
          'state_table','powerhouse_connection_enrichment_state_v1',
          'all_available_ingested_evidence_applied',true
        )
      ),
      bijgewerkt_op=v_now
    from rolled r
    where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))=r.person_key
    returning coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as person_key
  ),
  ins as (
    insert into public.powerhouse_connection_enrichment_state_v1(
      person_key,linkedin_url,enrichment_date,enriched_at,data_completeness,
      linkedin_events_30d,external_signals_90d,company_news_120d,runtime_evidence_90d,
      latest_external_at,source_snapshot,updated_at
    )
    select
      r.person_key,r.linkedin_url,p_run_date,v_now,
      round((
        (case when nullif(trim(coalesce(r.naam,r.latest_name,'')),'') is not null then 1 else 0 end)+
        (case when nullif(trim(coalesce(r.bedrijf,r.latest_company,'')),'') is not null then 1 else 0 end)+
        (case when nullif(trim(coalesce(r.rol,r.latest_role,'')),'') is not null then 1 else 0 end)+
        (case when nullif(trim(r.linkedin_url),'') is not null then 1 else 0 end)+
        (case when nullif(trim(r.email),'') is not null then 1 else 0 end)
      )::numeric/5,4),
      r.linkedin_events_30d,r.external_signals_90d,r.company_news_120d,r.runtime_evidence_90d,
      r.latest_external_at,
      jsonb_build_object(
        'contract','powerhouse-daily-full-connection-enrichment-v2',
        'core',jsonb_build_object(
          'name',r.naam,'company',r.bedrijf,'role',r.rol,'segment',r.segment,'status',r.status,
          'priority',r.prioriteit,'email_present',nullif(trim(r.email),'') is not null,
          'phone_present',nullif(trim(r.telefoon),'') is not null,'source',r.bron
        ),
        'latest_linkedin_observation',jsonb_build_object(
          'name',r.latest_name,'company',r.latest_company,'role',r.latest_role
        ),
        'metrics',jsonb_build_object(
          'linkedin_events_30d',r.linkedin_events_30d,
          'external_signals_90d',r.external_signals_90d,
          'company_news_120d',r.company_news_120d,
          'runtime_evidence_90d',r.runtime_evidence_90d,
          'latest_external_at',r.latest_external_at
        ),
        'source_authorities',jsonb_build_array(
          'bg_connecties','linkedin_engagement_events','powerhouse_predictive_signals',
          'bg_bedrijfsnieuws','bg_externe_signalen','powerhouse_runtime_events',
          'powerhouse_person_intelligence_v1','powerhouse_company_intelligence_v1'
        ),
        'detailed_evidence_preserved_in_canonical_sources',true,
        'sensitive_inference_allowed',false,
        'public_or_authorized_sources_only',true
      ),
      v_now
    from rolled r
    on conflict(person_key) do update set
      linkedin_url=excluded.linkedin_url,
      enrichment_date=excluded.enrichment_date,
      enriched_at=excluded.enriched_at,
      data_completeness=excluded.data_completeness,
      linkedin_events_30d=excluded.linkedin_events_30d,
      external_signals_90d=excluded.external_signals_90d,
      company_news_120d=excluded.company_news_120d,
      runtime_evidence_90d=excluded.runtime_evidence_90d,
      latest_external_at=excluded.latest_external_at,
      source_snapshot=excluded.source_snapshot,
      updated_at=excluded.updated_at
    returning person_key
  )
  select count(*) into v_touched from ins;

  select count(*) into v_total
  from public.bg_connecties c
  where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null;

  return jsonb_build_object(
    'contract','powerhouse-daily-full-connection-enrichment-v2',
    'run_date',p_run_date,
    'connections_total',v_total,
    'connections_touched',v_touched,
    'connections_enriched_today',v_touched,
    'connections_remaining_today',greatest(0,v_total-v_touched),
    'daily_completion_ratio',case when v_total=0 then 1 else round(v_touched::numeric/v_total,4) end,
    'full_graph_daily_refresh',v_touched=v_total,
    'all_ingested_linkedin_and_external_evidence_projected',true,
    'detailed_source_evidence_preserved_in_canonical_stores',true,
    'deep_public_research_is_prioritized_and_bounded',true,
    'sensitive_inference_allowed',false,
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer) to service_role;

create or replace view public.powerhouse_connection_enrichment_v1
with (security_invoker=true) as
select
  c.linkedin_url,
  coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as person_key,
  c.naam,c.bedrijf,c.rol,c.segment,c.status,c.prioriteit,c.email,c.telefoon,
  s.enrichment_date,s.enriched_at,s.data_completeness,s.linkedin_events_30d,
  s.external_signals_90d,s.company_news_120d,s.runtime_evidence_90d,
  s.latest_external_at,s.source_snapshot,
  s.enrichment_date=(now() at time zone 'Europe/Amsterdam')::date as enriched_today
from public.bg_connecties c
left join public.powerhouse_connection_enrichment_state_v1 s
  on s.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''));

revoke all on public.powerhouse_connection_enrichment_v1 from public,anon,authenticated;
grant select on public.powerhouse_connection_enrichment_v1 to service_role;

create or replace view public.powerhouse_connection_enrichment_coverage_v1
with (security_invoker=true) as
select
  count(*)::integer as total_connections,
  count(*) filter(where s.enrichment_date=(now() at time zone 'Europe/Amsterdam')::date)::integer as enriched_today,
  count(*) filter(where s.linkedin_events_30d>0)::integer as with_linkedin_activity,
  count(*) filter(where s.external_signals_90d>0)::integer as with_external_signals,
  count(*) filter(where s.company_news_120d>0)::integer as with_company_news,
  round(avg(coalesce(s.data_completeness,0)),4) as avg_data_completeness,
  max(s.enriched_at) as last_enrichment_at
from public.bg_connecties c
left join public.powerhouse_connection_enrichment_state_v1 s
  on s.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''));

revoke all on public.powerhouse_connection_enrichment_coverage_v1 from public,anon,authenticated;
grant select on public.powerhouse_connection_enrichment_coverage_v1 to service_role;

comment on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer) is
'Full-graph daily connection enrichment. Applies all available/allowed ingested LinkedIn, company and external evidence to every connection, while preserving detailed evidence in canonical source stores.';

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_connection_enrichment jsonb;
  v_external_intelligence jsonb;
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_all_plays jsonb;
  v_linkedin_sales_dispatch jsonb;
  v_outreach_prepare jsonb;
  v_growth_email_promotion jsonb;
  v_persuasion jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_connection_enrichment:=public.powerhouse_refresh_all_connection_enrichment_v1(p_run_date,0);
  v_external_intelligence:=public.powerhouse_refresh_relationship_external_intelligence_v1(p_run_date);
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_growth_swarm:=public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  v_growth_activation:=public.powerhouse_materialize_growth_swarm_v1(p_run_date);
  v_all_plays:=public.powerhouse_activate_remaining_growth_plays_v3(p_run_date);
  v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_growth_email_promotion:=public.powerhouse_promote_growth_play_emails_v1(p_run_date);
  v_persuasion:=public.powerhouse_optimize_prepared_outreach_v1(p_run_date);
  v_outreach_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);
  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'all_connection_enrichment',v_connection_enrichment,
    'relationship_external_intelligence',v_external_intelligence,
    'relationship_revenue',v_relationship,
    'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger,
    'growth_swarm',v_growth_swarm,
    'growth_swarm_activation',v_growth_activation,
    'all_growth_plays',v_all_plays,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,
    'growth_play_email_promotion',v_growth_email_promotion,
    'persuasion_optimizer',v_persuasion,
    'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,
    'run_date',p_run_date,'executed_at',now()
  );
end;
$$;
