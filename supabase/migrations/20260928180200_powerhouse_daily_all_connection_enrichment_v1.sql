-- Powerhouse daily all-connection enrichment v1
-- Guarantees one enrichment pass per connection per day and incremental refresh when new evidence arrives.

create table if not exists public.powerhouse_connection_enrichment_state_v1 (
  person_key text primary key,
  linkedin_url text,
  person_name text,
  company_name text,
  role text,
  enrichment_date date not null,
  last_enriched_at timestamptz not null default now(),
  linkedin_last_seen_at timestamptz,
  company_news_last_seen_at timestamptz,
  external_signal_last_seen_at timestamptz,
  linkedin_events_30d integer not null default 0,
  company_news_30d integer not null default 0,
  external_signals_30d integer not null default 0,
  completeness_score numeric not null default 0,
  source_summary jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_connection_enrichment_state_v1 enable row level security;
revoke all on public.powerhouse_connection_enrichment_state_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_connection_enrichment_state_v1 to service_role;

create index if not exists powerhouse_connection_enrichment_state_date_idx
  on public.powerhouse_connection_enrichment_state_v1(enrichment_date,last_enriched_at desc);

create or replace function public.powerhouse_refresh_all_connection_enrichment_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_total integer:=0;
  v_touched integer:=0;
  v_core_filled integer:=0;
begin
  select count(*) into v_total from public.bg_connecties
  where coalesce(nullif(trim(sleutel),''),nullif(trim(linkedin_url),'')) is not null;

  with latest_li as (
    select distinct on (lower(trim(actor_linkedin_url)))
      lower(trim(actor_linkedin_url)) as linkedin_key,
      actor_name,company_name,role,occurred_at
    from public.linkedin_engagement_events
    where coalesce(is_test,false)=false
      and nullif(trim(actor_linkedin_url),'') is not null
    order by lower(trim(actor_linkedin_url)), occurred_at desc nulls last
  )
  update public.bg_connecties c
  set
    naam=coalesce(nullif(trim(c.naam),''),nullif(trim(li.actor_name),'')),
    bedrijf=coalesce(nullif(trim(c.bedrijf),''),nullif(trim(li.company_name),'')),
    rol=coalesce(nullif(trim(c.rol),''),nullif(trim(li.role),'')),
    bijgewerkt_op=case
      when (nullif(trim(c.naam),'') is null and nullif(trim(li.actor_name),'') is not null)
        or (nullif(trim(c.bedrijf),'') is null and nullif(trim(li.company_name),'') is not null)
        or (nullif(trim(c.rol),'') is null and nullif(trim(li.role),'') is not null)
      then now() else c.bijgewerkt_op end
  from latest_li li
  where lower(trim(c.linkedin_url))=li.linkedin_key
    and (
      (nullif(trim(c.naam),'') is null and nullif(trim(li.actor_name),'') is not null)
      or (nullif(trim(c.bedrijf),'') is null and nullif(trim(li.company_name),'') is not null)
      or (nullif(trim(c.rol),'') is null and nullif(trim(li.role),'') is not null)
    );
  get diagnostics v_core_filled=row_count;

  with
  connection_base as (
    select
      coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as person_key,
      c.linkedin_url,c.naam,c.bedrijf,c.rol,c.segment,c.status,c.email,c.telefoon,c.bijgewerkt_op,
      lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\s+',' ','g')) as company_key
    from public.bg_connecties c
    where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null
  ),
  li as (
    select
      lower(trim(actor_linkedin_url)) as linkedin_key,
      max(occurred_at) as last_seen_at,
      count(*) filter(where occurred_at>=now()-interval '30 days')::integer as events_30d
    from public.linkedin_engagement_events
    where coalesce(is_test,false)=false
      and nullif(trim(actor_linkedin_url),'') is not null
    group by lower(trim(actor_linkedin_url))
  ),
  news as (
    select
      lower(regexp_replace(trim(bedrijf),'\s+',' ','g')) as company_key,
      max(coalesce(gepubliceerd_op,opgehaald_op)) as last_seen_at,
      count(*) filter(where coalesce(gepubliceerd_op,opgehaald_op)>=now()-interval '30 days')::integer as news_30d
    from public.bg_bedrijfsnieuws
    where over_dit_bedrijf is true and nullif(trim(bedrijf),'') is not null
    group by lower(regexp_replace(trim(bedrijf),'\s+',' ','g'))
  ),
  sig_person as (
    select entity_key as person_key,max(observed_at) as last_seen_at,
      count(*) filter(where observed_at>=now()-interval '30 days')::integer as signals_30d
    from public.powerhouse_predictive_signals
    where entity_scope='person'
    group by entity_key
  ),
  sig_company as (
    select lower(regexp_replace(trim(entity_key),'\s+',' ','g')) as company_key,
      max(observed_at) as last_seen_at,
      count(*) filter(where observed_at>=now()-interval '30 days')::integer as signals_30d
    from public.powerhouse_predictive_signals
    where entity_scope='company'
    group by lower(regexp_replace(trim(entity_key),'\s+',' ','g'))
  ),
  candidate as (
    select
      b.*,
      li.last_seen_at as linkedin_last_seen_at,
      coalesce(li.events_30d,0) as linkedin_events_30d,
      news.last_seen_at as company_news_last_seen_at,
      coalesce(news.news_30d,0) as company_news_30d,
      greatest(sp.last_seen_at,sc.last_seen_at) as external_signal_last_seen_at,
      coalesce(sp.signals_30d,0)+coalesce(sc.signals_30d,0) as external_signals_30d,
      round((
        (case when nullif(trim(b.naam),'') is not null then 1 else 0 end)+
        (case when nullif(trim(b.linkedin_url),'') is not null then 1 else 0 end)+
        (case when nullif(trim(b.bedrijf),'') is not null then 1 else 0 end)+
        (case when nullif(trim(b.rol),'') is not null then 1 else 0 end)+
        (case when nullif(trim(b.email),'') is not null then 1 else 0 end)
      )::numeric/5,4) as completeness_score
    from connection_base b
    left join li on lower(trim(b.linkedin_url))=li.linkedin_key
    left join news on b.company_key<>'' and b.company_key=news.company_key
    left join sig_person sp on sp.person_key=b.person_key or sp.person_key=b.linkedin_url
    left join sig_company sc on b.company_key<>'' and b.company_key=sc.company_key
  ),
  due as (
    select c.*
    from candidate c
    left join public.powerhouse_connection_enrichment_state_v1 s on s.person_key=c.person_key
    where s.person_key is null
       or s.enrichment_date<>p_run_date
       or c.linkedin_last_seen_at>s.last_enriched_at
       or c.company_news_last_seen_at>s.last_enriched_at
       or c.external_signal_last_seen_at>s.last_enriched_at
       or c.bijgewerkt_op>s.last_enriched_at
  ),
  upserted as (
    insert into public.powerhouse_connection_enrichment_state_v1(
      person_key,linkedin_url,person_name,company_name,role,enrichment_date,last_enriched_at,
      linkedin_last_seen_at,company_news_last_seen_at,external_signal_last_seen_at,
      linkedin_events_30d,company_news_30d,external_signals_30d,completeness_score,source_summary,snapshot,updated_at
    )
    select
      d.person_key,d.linkedin_url,d.naam,d.bedrijf,d.rol,p_run_date,now(),
      d.linkedin_last_seen_at,d.company_news_last_seen_at,d.external_signal_last_seen_at,
      d.linkedin_events_30d,d.company_news_30d,d.external_signals_30d,d.completeness_score,
      jsonb_build_object(
        'contract','powerhouse-daily-all-connection-enrichment-v1',
        'linkedin_ingest',jsonb_build_object('events_30d',d.linkedin_events_30d,'last_seen_at',d.linkedin_last_seen_at),
        'company_news',jsonb_build_object('items_30d',d.company_news_30d,'last_seen_at',d.company_news_last_seen_at),
        'external_signals',jsonb_build_object('signals_30d',d.external_signals_30d,'last_seen_at',d.external_signal_last_seen_at),
        'provider_policy','use_all_available_allowed_ingested_evidence'
      ),
      jsonb_build_object(
        'person_name',d.naam,'linkedin_url',d.linkedin_url,'company_name',d.bedrijf,'role',d.rol,
        'segment',d.segment,'relationship_status',d.status,'email_present',nullif(trim(d.email),'') is not null,
        'phone_present',nullif(trim(d.telefoon),'') is not null,'completeness_score',d.completeness_score
      ),
      now()
    from due d
    on conflict(person_key) do update set
      linkedin_url=excluded.linkedin_url,person_name=excluded.person_name,company_name=excluded.company_name,
      role=excluded.role,enrichment_date=excluded.enrichment_date,last_enriched_at=excluded.last_enriched_at,
      linkedin_last_seen_at=excluded.linkedin_last_seen_at,company_news_last_seen_at=excluded.company_news_last_seen_at,
      external_signal_last_seen_at=excluded.external_signal_last_seen_at,linkedin_events_30d=excluded.linkedin_events_30d,
      company_news_30d=excluded.company_news_30d,external_signals_30d=excluded.external_signals_30d,
      completeness_score=excluded.completeness_score,source_summary=excluded.source_summary,
      snapshot=excluded.snapshot,updated_at=now()
    returning person_key
  )
  select count(*) into v_touched from upserted;

  update public.bg_connecties c
  set extra=coalesce(c.extra,'{}'::jsonb) || jsonb_build_object(
    'powerhouse_enrichment',
    jsonb_build_object(
      'contract','powerhouse-daily-all-connection-enrichment-v1',
      'enrichment_date',s.enrichment_date,
      'last_enriched_at',s.last_enriched_at,
      'completeness_score',s.completeness_score,
      'linkedin_events_30d',s.linkedin_events_30d,
      'company_news_30d',s.company_news_30d,
      'external_signals_30d',s.external_signals_30d,
      'linkedin_last_seen_at',s.linkedin_last_seen_at,
      'company_news_last_seen_at',s.company_news_last_seen_at,
      'external_signal_last_seen_at',s.external_signal_last_seen_at
    )
  )
  from public.powerhouse_connection_enrichment_state_v1 s
  where s.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))
    and s.enrichment_date=p_run_date
    and (
      coalesce(c.extra->'powerhouse_enrichment'->>'last_enriched_at','')<>coalesce(s.last_enriched_at::text,'')
    );

  return jsonb_build_object(
    'contract','powerhouse-daily-all-connection-enrichment-v1',
    'run_date',p_run_date,
    'total_connections',v_total,
    'connections_touched',v_touched,
    'missing_core_fields_filled',v_core_filled,
    'daily_full_coverage_required',true,
    'incremental_refresh_when_new_evidence_arrives',true,
    'linkedin_policy','all available allowed ingested LinkedIn evidence',
    'sensitive_inference_allowed',false,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_refresh_all_connection_enrichment_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_all_connection_enrichment_v1(date) to service_role;

create or replace view public.powerhouse_connection_enrichment_coverage_v1
with (security_invoker=true) as
select
  count(*)::integer as total_connections,
  count(*) filter(where s.enrichment_date=(now() at time zone 'Europe/Amsterdam')::date)::integer as enriched_today,
  count(*) filter(where s.person_key is null)::integer as never_enriched,
  count(*) filter(where nullif(trim(c.naam),'') is null)::integer as missing_name,
  count(*) filter(where nullif(trim(c.bedrijf),'') is null)::integer as missing_company,
  count(*) filter(where nullif(trim(c.rol),'') is null)::integer as missing_role,
  count(*) filter(where nullif(trim(c.email),'') is null)::integer as missing_email,
  round(avg(coalesce(s.completeness_score,0)),4) as avg_completeness,
  max(s.last_enriched_at) as last_enrichment_at
from public.bg_connecties c
left join public.powerhouse_connection_enrichment_state_v1 s
  on s.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''));

revoke all on public.powerhouse_connection_enrichment_coverage_v1 from public,anon,authenticated;
grant select on public.powerhouse_connection_enrichment_coverage_v1 to service_role;

comment on function public.powerhouse_refresh_all_connection_enrichment_v1(date) is
'Runs the canonical daily full-connection enrichment and incremental evidence refresh. Every connection is touched at least once per day; newly ingested LinkedIn/company/external evidence can refresh it again the same day.';
comment on view public.powerhouse_connection_enrichment_coverage_v1 is
'Coverage and completeness proof for the daily all-connection enrichment contract.';

-- Wire full-connection enrichment into the existing single commercial scheduler.
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
  v_connection_enrichment:=public.powerhouse_refresh_all_connection_enrichment_v1(p_run_date);
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
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;
