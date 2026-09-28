-- Powerhouse external relationship intelligence v1
-- Project public internet / LinkedIn / provider evidence into the canonical relationship, company and customer intelligence graph.

create or replace view public.powerhouse_relationship_external_intelligence_v1
with (security_invoker=true) as
with e as (
  select
    event_id,
    person_key,
    lower(regexp_replace(trim(coalesce(company_key,'')),'\\s+',' ','g')) company_key,
    event_type,
    source,
    channel,
    occurred_at,
    confidence,
    evidence,
    coalesce(nullif(topic_key,''),nullif(evidence->>'trigger_type',''),nullif(evidence->>'topic',''),event_type) topic_key,
    coalesce(nullif(evidence->>'source_url',''),nullif(evidence->>'url','')) source_url,
    case
      when coalesce(channel,'') ilike '%linkedin%' or coalesce(source,'') ilike '%linkedin%' or coalesce(event_type,'') ilike '%linkedin%' then 'linkedin'
      when coalesce(source,'') ilike '%dataforseo%' or coalesce(evidence->>'provider','') ilike '%dataforseo%' then 'internet_search'
      when coalesce(source,'') ilike '%tavily%' then 'internet_search'
      when coalesce(event_type,'') ilike '%news%' then 'news'
      else 'external'
    end source_class
  from public.powerhouse_runtime_events
  where occurred_at >= now()-interval '180 days'
    and (person_key is not null or nullif(trim(company_key),'') is not null)
    and (
      event_type in ('relationship_public_research_evidence','external_signal_observed','company_news_observed','linkedin_post_observed','linkedin_engagement_observed')
      or coalesce(channel,'') ilike '%linkedin%'
      or coalesce(source,'') ~* '(linkedin|dataforseo|tavily|external|news|public.research|web)'
      or evidence ? 'source_url'
    )
)
select
  person_key,
  nullif(company_key,'') company_key,
  count(*)::int external_updates_180d,
  count(*) filter(where occurred_at>=now()-interval '30 days')::int external_updates_30d,
  count(*) filter(where source_class='linkedin' and occurred_at>=now()-interval '30 days')::int linkedin_updates_30d,
  max(occurred_at) latest_external_at,
  round(avg(coalesce(confidence,0)),4) external_confidence,
  array_remove(array_agg(distinct source_class),null) source_classes,
  array_remove(array_agg(distinct topic_key),null) topics,
  jsonb_agg(
    jsonb_build_object(
      'event_id',event_id,'occurred_at',occurred_at,'source_class',source_class,'source',source,
      'event_type',event_type,'topic',topic_key,'url',source_url,'confidence',confidence,
      'headline',coalesce(evidence->>'headline',evidence->>'trigger',evidence->>'title'),
      'summary',evidence->>'summary'
    ) order by occurred_at desc
  ) filter(where occurred_at>=now()-interval '90 days') latest_updates
from e
group by person_key,nullif(company_key,'');

revoke all on public.powerhouse_relationship_external_intelligence_v1 from public,anon,authenticated;
grant select on public.powerhouse_relationship_external_intelligence_v1 to service_role;

create or replace view public.powerhouse_customer_external_intelligence_v1
with (security_invoker=true) as
select
  k.id customer_id,
  k.organisatie_id,
  k.naam customer_name,
  k.contactpersoon,
  k.email,
  k.telefoon,
  ci.company_key,
  ci.company_intent_score,
  ci.external_signal_score,
  ci.predictive_signals_30d,
  ci.signal_topics,
  ci.last_relevant_at,
  ci.company_context,
  coalesce(x.external_updates_30d,0) external_updates_30d,
  coalesce(x.linkedin_updates_30d,0) linkedin_updates_30d,
  x.latest_external_at,
  x.external_confidence,
  x.source_classes,
  x.topics external_topics,
  x.latest_updates
from public.klanten k
left join public.powerhouse_company_intelligence_v1 ci
  on ci.company_key=lower(regexp_replace(trim(coalesce(k.naam,'')),'\\s+',' ','g'))
left join lateral (
  select
    sum(r.external_updates_30d)::int external_updates_30d,
    sum(r.linkedin_updates_30d)::int linkedin_updates_30d,
    max(r.latest_external_at) latest_external_at,
    round(avg(r.external_confidence),4) external_confidence,
    array(
      select distinct s
      from public.powerhouse_relationship_external_intelligence_v1 rs
      cross join lateral unnest(coalesce(rs.source_classes,array[]::text[])) s
      where rs.company_key=ci.company_key
    ) source_classes,
    array(
      select distinct t
      from public.powerhouse_relationship_external_intelligence_v1 rt
      cross join lateral unnest(coalesce(rt.topics,array[]::text[])) t
      where rt.company_key=ci.company_key
    ) topics,
    (select jsonb_agg(u order by (u->>'occurred_at') desc)
       from (select jsonb_array_elements(coalesce(r2.latest_updates,'[]'::jsonb)) u
             from public.powerhouse_relationship_external_intelligence_v1 r2
             where r2.company_key=ci.company_key
             limit 20) q) latest_updates
  from public.powerhouse_relationship_external_intelligence_v1 r
  where r.company_key=ci.company_key
) x on true;

revoke all on public.powerhouse_customer_external_intelligence_v1 from public,anon,authenticated;
grant select on public.powerhouse_customer_external_intelligence_v1 to service_role;

create or replace function public.powerhouse_project_external_relationship_intelligence_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_signals integer:=0;
  v_connections integer:=0;
  v_result jsonb;
begin
  insert into public.powerhouse_predictive_signals(
    signal_key,observed_at,source_type,source_ref,entity_scope,entity_key,topic_key,signal_type,direction,strength,novelty,lead_time_days,evidence
  )
  select
    'external-runtime:'||e.event_id::text,
    e.occurred_at,
    case when coalesce(e.channel,'') ilike '%linkedin%' or coalesce(e.source,'') ilike '%linkedin%' or coalesce(e.event_type,'') ilike '%linkedin%' then 'linkedin' else 'external_public' end,
    coalesce(nullif(e.evidence->>'source_url',''),nullif(e.evidence->>'url',''),e.dedupe_key),
    'company',
    lower(regexp_replace(trim(e.company_key),'\\s+',' ','g')),
    coalesce(nullif(e.topic_key,''),nullif(e.evidence->>'trigger_type',''),nullif(e.evidence->>'topic',''),e.event_type),
    'external_context_update',
    'emerging',
    least(1::numeric,greatest(0::numeric,coalesce(e.confidence,.60))),
    least(1::numeric,greatest(.10::numeric,1-(extract(epoch from (now()-e.occurred_at))/86400/90)::numeric)),
    30,
    jsonb_build_object(
      'contract','powerhouse-external-relationship-intelligence-v1',
      'runtime_event_id',e.event_id,'person_key',e.person_key,'company_key',e.company_key,
      'source',e.source,'event_type',e.event_type,'channel',e.channel,'source_evidence',e.evidence
    )
  from public.powerhouse_runtime_events e
  where e.occurred_at>=now()-interval '90 days'
    and nullif(trim(e.company_key),'') is not null
    and (
      e.event_type in ('relationship_public_research_evidence','external_signal_observed','company_news_observed','linkedin_post_observed','linkedin_engagement_observed')
      or coalesce(e.channel,'') ilike '%linkedin%'
      or coalesce(e.source,'') ~* '(linkedin|dataforseo|tavily|external|news|public.research|web)'
      or e.evidence ? 'source_url'
    )
  on conflict(signal_key) do update set
    observed_at=excluded.observed_at,source_type=excluded.source_type,source_ref=excluded.source_ref,
    entity_key=excluded.entity_key,topic_key=excluded.topic_key,strength=excluded.strength,novelty=excluded.novelty,evidence=excluded.evidence;
  get diagnostics v_signals=row_count;

  with latest as (
    select
      c.sleutel,
      jsonb_build_object(
        'contract','powerhouse-external-relationship-intelligence-v1',
        'updated_at',now(),
        'external_updates_30d',coalesce(sum(x.external_updates_30d),0),
        'linkedin_updates_30d',coalesce(sum(x.linkedin_updates_30d),0),
        'latest_external_at',max(x.latest_external_at),
        'external_confidence',round(avg(x.external_confidence),4),
        'source_classes',to_jsonb(array_remove(array_agg(distinct s),null)),
        'topics',to_jsonb(array_remove(array_agg(distinct t),null))
      ) snapshot
    from public.bg_connecties c
    join public.powerhouse_relationship_external_intelligence_v1 x
      on x.person_key=coalesce(nullif(trim(c.sleutel),''),nullif(trim(c.linkedin_url),''))
      or x.company_key=lower(regexp_replace(trim(coalesce(c.bedrijf,'')),'\\s+',' ','g'))
    left join lateral unnest(coalesce(x.source_classes,array[]::text[])) s on true
    left join lateral unnest(coalesce(x.topics,array[]::text[])) t on true
    where c.sleutel is not null
    group by c.sleutel
  )
  update public.bg_connecties c
  set extra=coalesce(c.extra,'{}'::jsonb)||jsonb_build_object('powerhouse_external_intelligence',l.snapshot),
      bijgewerkt_op=now()
  from latest l
  where c.sleutel=l.sleutel;
  get diagnostics v_connections=row_count;

  v_result=jsonb_build_object(
    'contract','powerhouse-external-relationship-intelligence-v1',
    'run_date',p_run_date,
    'predictive_signals_touched',v_signals,
    'connections_enriched',v_connections,
    'customer_projection','public.powerhouse_customer_external_intelligence_v1',
    'company_projection','public.powerhouse_company_intelligence_v1',
    'no_parallel_crm',true,
    'executed_at',now()
  );

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'external-relationship-intelligence:'||p_run_date::text,
    'external_relationship_intelligence_projected',
    'powerhouse-external-relationship-intelligence-v1',
    'growth-revenue-os',now(),v_result,
    jsonb_build_object('sources',jsonb_build_array('internet','linkedin','external_public'),'reuse_existing_company_intelligence',true),
    'actioned','VERIFIED',1
  )
  on conflict(dedupe_key) do update set occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now();

  return v_result;
end;
$$;

revoke execute on function public.powerhouse_project_external_relationship_intelligence_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_project_external_relationship_intelligence_v1(date) to service_role;

create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_external_relationship_intelligence jsonb;
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
  v_external_relationship_intelligence:=public.powerhouse_project_external_relationship_intelligence_v1(p_run_date);
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
    'external_relationship_intelligence',v_external_relationship_intelligence,
    'relationship_revenue',v_relationship,'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,'trigger_acquisition',v_trigger,
    'growth_swarm',v_growth_swarm,'growth_swarm_activation',v_growth_activation,'all_growth_plays',v_all_plays,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,'autonomous_outreach_prepare',v_outreach_prepare,
    'growth_play_email_promotion',v_growth_email_promotion,'persuasion_optimizer',v_persuasion,
    'autonomous_outreach_dispatch',v_outreach_dispatch,'commercial_learning',v_learning,
    'run_date',p_run_date,'executed_at',now()
  );
end;
$$;

comment on function public.powerhouse_project_external_relationship_intelligence_v1(date) is
'Projects verified internet, public-source and LinkedIn runtime evidence into the canonical person/company/customer relationship graph, existing predictive signals, connection profiles and downstream revenue intelligence.';

insert into public.brain_failure_registry(
  fingerprint,maturity,root_cause,proven_fix,prevention_rule,regression_ref,occurrence_count,version,first_seen_at,last_seen_at,evidence
) values (
  'external-relationship-context-not-standardly-projected-v1','OBSERVED',
  'External web and LinkedIn evidence could exist as isolated runtime events without being standard profile context for connection, company and customer intelligence.',
  'Project verified external runtime evidence into existing predictive signals, bg_connecties.extra and a customer intelligence view before the canonical commercial cycle scores opportunities and next-best-actions.',
  'Every verified external update about a known connection or its company must attach to the canonical relationship graph and become reusable intelligence; never create a parallel CRM or leave relevant evidence report-only.',
  'tests/powerhouse-external-relationship-intelligence-v1.test.mjs|powerhouse-external-relationship-intelligence-v1',
  1,1,now(),now(),jsonb_build_object('no_parallel_crm',true,'linkedin_is_signal_not_buying_proof',true)
) on conflict(fingerprint) do update set
  root_cause=excluded.root_cause,proven_fix=excluded.proven_fix,prevention_rule=excluded.prevention_rule,
  regression_ref=excluded.regression_ref,occurrence_count=public.brain_failure_registry.occurrence_count+1,
  version=greatest(public.brain_failure_registry.version,excluded.version),last_seen_at=now(),
  evidence=coalesce(public.brain_failure_registry.evidence,'{}'::jsonb)||excluded.evidence;
