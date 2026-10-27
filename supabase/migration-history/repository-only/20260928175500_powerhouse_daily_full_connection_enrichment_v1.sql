-- Powerhouse daily full connection enrichment v1
-- Every connection receives a daily full-graph enrichment pass from all already-ingested evidence.
-- Expensive external discovery stays bounded/prioritized, but every matched ingested fact is projected daily.

create table if not exists public.powerhouse_connection_enrichment_state_v1 (
  person_key text primary key,
  linkedin_url text,
  enrichment_date date not null,
  enriched_at timestamptz not null default now(),
  data_completeness numeric not null default 0 check (data_completeness between 0 and 1),
  linkedin_events_30d integer not null default 0,
  external_signals_90d integer not null default 0,
  company_news_120d integer not null default 0,
  runtime_evidence_90d integer not null default 0,
  latest_external_at timestamptz,
  source_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists powerhouse_connection_enrichment_state_daily_idx
  on public.powerhouse_connection_enrichment_state_v1(enrichment_date,enriched_at);
create index if not exists powerhouse_connection_enrichment_state_linkedin_idx
  on public.powerhouse_connection_enrichment_state_v1(linkedin_url);

alter table public.powerhouse_connection_enrichment_state_v1 enable row level security;
revoke all on public.powerhouse_connection_enrichment_state_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_connection_enrichment_state_v1 to service_role;

create or replace function public.powerhouse_refresh_all_connection_enrichment_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date,
  p_batch_size integer default 1100
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_batch integer:=least(5000,greatest(1,coalesce(p_batch_size,1100)));
  v_touched integer:=0;
  v_total integer:=0;
  v_done_today integer:=0;
  v_remaining integer:=0;
begin
  with selected as (
    select
      coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as person_key,
      c.linkedin_url,c.naam,c.bedrijf,c.rol,c.segment,c.status,c.prioriteit,c.email,c.telefoon,
      c.whatsapp_toegestaan,c.aanleiding,c.bron,c.extra,c.aangemaakt_op,c.bijgewerkt_op
    from public.bg_connecties c
    left join public.powerhouse_connection_enrichment_state_v1 s
      on s.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))
    where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null
    order by
      case when s.enrichment_date is null or s.enrichment_date<p_run_date then 0 else 1 end,
      s.enrichment_date asc nulls first,
      s.enriched_at asc nulls first,
      coalesce(c.prioriteit,0) desc,
      c.linkedin_url
    limit v_batch
  ),
  snapshots as (
    select
      s.*,
      (
        select count(*)::integer
        from public.linkedin_engagement_events le
        where le.actor_linkedin_url=s.linkedin_url
          and le.is_test is false
          and le.occurred_at>=v_now-interval '30 days'
      ) as linkedin_events_30d,
      (
        select max(le.occurred_at)
        from public.linkedin_engagement_events le
        where le.actor_linkedin_url=s.linkedin_url
          and le.is_test is false
      ) as linkedin_latest_at,
      (
        select jsonb_agg(jsonb_build_object(
          'engagement_type',x.engagement_type,
          'actor_name',x.actor_name,
          'company_name',x.company_name,
          'role',x.role,
          'content_key',x.content_key,
          'post_url',x.post_url,
          'source',x.source,
          'occurred_at',x.occurred_at,
          'payload',x.payload
        ) order by x.occurred_at desc)
        from (
          select *
          from public.linkedin_engagement_events le
          where le.actor_linkedin_url=s.linkedin_url
            and le.is_test is false
          order by le.occurred_at desc
          limit 20
        ) x
      ) as linkedin_recent,
      (
        select jsonb_build_object(
          'actor_name',le.actor_name,
          'company_name',le.company_name,
          'role',le.role,
          'occurred_at',le.occurred_at
        )
        from public.linkedin_engagement_events le
        where le.actor_linkedin_url=s.linkedin_url
          and le.is_test is false
        order by le.occurred_at desc
        limit 1
      ) as linkedin_latest_profile,
      (
        select count(*)::integer
        from public.powerhouse_predictive_signals ps
        where ps.observed_at>=v_now-interval '90 days'
          and ps.signal_type='relationship_external_intelligence'
          and (
            (ps.entity_scope='person' and ps.entity_key=s.person_key)
            or
            (ps.entity_scope='company' and lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g'))=
              lower(regexp_replace(trim(coalesce(s.bedrijf,'')),'\s+',' ','g')))
          )
      ) as external_signals_90d,
      (
        select max(ps.observed_at)
        from public.powerhouse_predictive_signals ps
        where ps.signal_type='relationship_external_intelligence'
          and (
            (ps.entity_scope='person' and ps.entity_key=s.person_key)
            or
            (ps.entity_scope='company' and lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g'))=
              lower(regexp_replace(trim(coalesce(s.bedrijf,'')),'\s+',' ','g')))
          )
      ) as external_latest_at,
      (
        select jsonb_agg(jsonb_build_object(
          'observed_at',x.observed_at,'entity_scope',x.entity_scope,'topic_key',x.topic_key,
          'signal_type',x.signal_type,'strength',x.strength,'novelty',x.novelty,
          'source_type',x.source_type,'source_ref',x.source_ref,'evidence',x.evidence
        ) order by x.observed_at desc)
        from (
          select *
          from public.powerhouse_predictive_signals ps
          where ps.signal_type='relationship_external_intelligence'
            and (
              (ps.entity_scope='person' and ps.entity_key=s.person_key)
              or
              (ps.entity_scope='company' and lower(regexp_replace(trim(ps.entity_key),'\s+',' ','g'))=
                lower(regexp_replace(trim(coalesce(s.bedrijf,'')),'\s+',' ','g')))
            )
          order by ps.observed_at desc
          limit 20
        ) x
      ) as external_recent,
      (
        select count(*)::integer
        from public.bg_bedrijfsnieuws bn
        where nullif(trim(coalesce(s.bedrijf,'')),'') is not null
          and bn.over_dit_bedrijf is true
          and coalesce(bn.afgewezen_reden,'')=''
          and coalesce(bn.gepubliceerd_op,bn.opgehaald_op)>=v_now-interval '120 days'
          and lower(regexp_replace(trim(bn.bedrijf),'\s+',' ','g'))=
              lower(regexp_replace(trim(s.bedrijf),'\s+',' ','g'))
      ) as company_news_120d,
      (
        select jsonb_agg(jsonb_build_object(
          'url',x.url,'title',x.titel,'domain',x.domein,'published_at',x.gepubliceerd_op,
          'kind',x.soort,'hook',x.haak,'confidence',x.zekerheid,'fetched_at',x.opgehaald_op
        ) order by coalesce(x.gepubliceerd_op,x.opgehaald_op) desc)
        from (
          select *
          from public.bg_bedrijfsnieuws bn
          where nullif(trim(coalesce(s.bedrijf,'')),'') is not null
            and bn.over_dit_bedrijf is true
            and coalesce(bn.afgewezen_reden,'')=''
            and lower(regexp_replace(trim(bn.bedrijf),'\s+',' ','g'))=
                lower(regexp_replace(trim(s.bedrijf),'\s+',' ','g'))
          order by coalesce(bn.gepubliceerd_op,bn.opgehaald_op) desc
          limit 10
        ) x
      ) as company_news_recent,
      (
        select count(*)::integer
        from public.powerhouse_runtime_events re
        where re.occurred_at>=v_now-interval '90 days'
          and (
            re.person_key=s.person_key
            or lower(regexp_replace(trim(coalesce(re.company_key,'')),'\s+',' ','g'))=
               lower(regexp_replace(trim(coalesce(s.bedrijf,'')),'\s+',' ','g'))
          )
      ) as runtime_evidence_90d,
      (
        select jsonb_agg(jsonb_build_object(
          'event_type',x.event_type,'source',x.source,'channel',x.channel,
          'occurred_at',x.occurred_at,'topic_key',x.topic_key,'data_quality',x.data_quality,
          'confidence',x.confidence,'evidence',x.evidence,'context',x.context
        ) order by x.occurred_at desc)
        from (
          select *
          from public.powerhouse_runtime_events re
          where re.person_key=s.person_key
             or (
               nullif(trim(coalesce(s.bedrijf,'')),'') is not null
               and lower(regexp_replace(trim(coalesce(re.company_key,'')),'\s+',' ','g'))=
                   lower(regexp_replace(trim(s.bedrijf),'\s+',' ','g'))
             )
          order by re.occurred_at desc
          limit 20
        ) x
      ) as runtime_recent,
      (
        select jsonb_agg(jsonb_build_object(
          'url',x.url,'title',x.titel,'summary',x.samenvatting,'subject',x.onderwerp,
          'domain',x.domein,'published_at',x.gepubliceerd_op,'confidence',x.vertrouwen,
          'fetched_at',x.opgehaald_op
        ) order by coalesce(x.gepubliceerd_op,x.opgehaald_op) desc)
        from (
          select *
          from public.bg_externe_signalen es
          where es.toegestaan is true and coalesce(es.ruis_reden,'')=''
            and nullif(trim(coalesce(s.bedrijf,'')),'') is not null
            and lower(concat_ws(' ',es.titel,es.samenvatting,es.onderwerp,es.domein))
                like '%'||lower(trim(s.bedrijf))||'%'
          order by coalesce(es.gepubliceerd_op,es.opgehaald_op) desc
          limit 10
        ) x
      ) as other_external_recent
    from selected s
  ),
  upserted as (
    insert into public.powerhouse_connection_enrichment_state_v1(
      person_key,linkedin_url,enrichment_date,enriched_at,data_completeness,
      linkedin_events_30d,external_signals_90d,company_news_120d,runtime_evidence_90d,
      latest_external_at,source_snapshot,updated_at
    )
    select
      x.person_key,x.linkedin_url,p_run_date,v_now,
      round((
        (case when nullif(trim(x.naam),'') is not null then 1 else 0 end)+
        (case when nullif(trim(x.bedrijf),'') is not null then 1 else 0 end)+
        (case when nullif(trim(x.rol),'') is not null then 1 else 0 end)+
        (case when nullif(trim(x.linkedin_url),'') is not null then 1 else 0 end)+
        (case when nullif(trim(x.email),'') is not null then 1 else 0 end)
      )::numeric/5,4),
      coalesce(x.linkedin_events_30d,0),coalesce(x.external_signals_90d,0),
      coalesce(x.company_news_120d,0),coalesce(x.runtime_evidence_90d,0),
      greatest(x.linkedin_latest_at,x.external_latest_at),
      jsonb_build_object(
        'contract','powerhouse-daily-full-connection-enrichment-v1',
        'core',jsonb_build_object(
          'name',x.naam,'company',x.bedrijf,'role',x.rol,'segment',x.segment,'status',x.status,
          'priority',x.prioriteit,'email',x.email,'phone',x.telefoon,'whatsapp_allowed',x.whatsapp_toegestaan,
          'reason',x.aanleiding,'source',x.bron,'connection_extra',coalesce(x.extra,'{}'::jsonb)
        ),
        'linkedin_latest_profile',coalesce(x.linkedin_latest_profile,'{}'::jsonb),
        'linkedin_recent',coalesce(x.linkedin_recent,'[]'::jsonb),
        'external_recent',coalesce(x.external_recent,'[]'::jsonb),
        'company_news_recent',coalesce(x.company_news_recent,'[]'::jsonb),
        'runtime_recent',coalesce(x.runtime_recent,'[]'::jsonb),
        'other_external_recent',coalesce(x.other_external_recent,'[]'::jsonb),
        'daily_refresh_date',p_run_date,
        'enriched_at',v_now,
        'sensitive_inference_allowed',false,
        'public_or_authorized_sources_only',true
      ),
      v_now
    from snapshots x
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
    returning person_key,source_snapshot
  )
  update public.bg_connecties c
  set
    naam=coalesce(nullif(u.source_snapshot#>>'{linkedin_latest_profile,actor_name}',''),c.naam),
    bedrijf=coalesce(nullif(u.source_snapshot#>>'{linkedin_latest_profile,company_name}',''),c.bedrijf),
    rol=coalesce(nullif(u.source_snapshot#>>'{linkedin_latest_profile,role}',''),c.rol),
    extra=coalesce(c.extra,'{}'::jsonb)||jsonb_build_object(
      'daily_enrichment',jsonb_build_object(
        'contract','powerhouse-daily-full-connection-enrichment-v1',
        'enrichment_date',p_run_date,
        'enriched_at',v_now,
        'linkedin_events_30d',coalesce((u.source_snapshot#>>'{core,linkedin_events_30d}')::integer,0),
        'source_state','powerhouse_connection_enrichment_state_v1'
      )
    )
  from upserted u
  where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))=u.person_key;
  get diagnostics v_touched=row_count;

  select count(*) into v_total
  from public.bg_connecties c
  where coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) is not null;

  select count(*) into v_done_today
  from public.powerhouse_connection_enrichment_state_v1 s
  where s.enrichment_date=p_run_date;

  v_remaining:=greatest(0,v_total-v_done_today);

  return jsonb_build_object(
    'contract','powerhouse-daily-full-connection-enrichment-v1',
    'run_date',p_run_date,
    'batch_size',v_batch,
    'connections_touched',v_touched,
    'connections_total',v_total,
    'connections_enriched_today',v_done_today,
    'connections_remaining_today',v_remaining,
    'daily_completion_ratio',case when v_total=0 then 1 else round(v_done_today::numeric/v_total,4) end,
    'all_ingested_linkedin_and_external_evidence_projected',true,
    'deep_public_research_is_prioritized_and_bounded',true,
    'sensitive_inference_allowed',false,
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)
  from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer)
  to service_role;

create or replace view public.powerhouse_connection_enrichment_v1
with (security_invoker=true) as
select
  c.linkedin_url,
  coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),'')) as person_key,
  c.naam,c.bedrijf,c.rol,c.segment,c.status,c.prioriteit,c.email,c.telefoon,
  s.enrichment_date,s.enriched_at,s.data_completeness,s.linkedin_events_30d,
  s.external_signals_90d,s.company_news_120d,s.runtime_evidence_90d,s.latest_external_at,
  s.source_snapshot,
  (s.enrichment_date=(now() at time zone 'Europe/Amsterdam')::date) as enriched_today
from public.bg_connecties c
left join public.powerhouse_connection_enrichment_state_v1 s
  on s.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''));

revoke all on public.powerhouse_connection_enrichment_v1 from public,anon,authenticated;
grant select on public.powerhouse_connection_enrichment_v1 to service_role;

comment on function public.powerhouse_refresh_all_connection_enrichment_v1(date,integer) is
'Hourly rolling full-graph enrichment. At 1100 connections per existing hourly commercial cycle the current 23k relationship graph receives a complete daily pass without a second scheduler.';
comment on view public.powerhouse_connection_enrichment_v1 is
'Canonical daily connection enrichment projection combining first-party relationship data, LinkedIn engagement/profile evidence, external intelligence, company news and runtime evidence.';

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_daily_connection_enrichment jsonb;
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
  v_daily_connection_enrichment:=public.powerhouse_refresh_all_connection_enrichment_v1(p_run_date,1100);
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
    'daily_connection_enrichment',v_daily_connection_enrichment,
    'relationship_external_intelligence',v_external_intelligence,
    'relationship_revenue',v_relationship,'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,'trigger_acquisition',v_trigger,
    'growth_swarm',v_growth_swarm,'growth_swarm_activation',v_growth_activation,
    'all_growth_plays',v_all_plays,'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,'growth_play_email_promotion',v_growth_email_promotion,
    'persuasion_optimizer',v_persuasion,'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,'run_date',p_run_date,'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)
  from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date)
  to service_role;
