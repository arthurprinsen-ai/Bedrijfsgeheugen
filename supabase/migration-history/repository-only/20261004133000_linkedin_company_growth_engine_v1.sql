-- Powerhouse LinkedIn Company Page Growth Engine v1
-- Structural response to the observed company-page distribution gap on 2026-10-04.
-- Reuses the existing commercial scheduler and canonical content/revenue lineage; no parallel scheduler.

create table if not exists public.powerhouse_linkedin_company_growth_policy_v1 (
  policy_key text primary key,
  canonical_organization_urn text not null,
  target_page_views_30d integer not null check (target_page_views_30d > 0),
  target_relevant_new_followers_30d integer not null check (target_relevant_new_followers_30d > 0),
  max_company_posts_per_day integer not null default 1 check (max_company_posts_per_day between 1 and 3),
  max_growth_recommendations_per_day integer not null default 3 check (max_growth_recommendations_per_day between 1 and 5),
  personal_linkedin_commercial_bridge_forbidden boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_linkedin_company_growth_policy_v1 enable row level security;
revoke all on public.powerhouse_linkedin_company_growth_policy_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_linkedin_company_growth_policy_v1 to service_role;

insert into public.powerhouse_linkedin_company_growth_policy_v1(
  policy_key,canonical_organization_urn,target_page_views_30d,target_relevant_new_followers_30d,
  max_company_posts_per_day,max_growth_recommendations_per_day,personal_linkedin_commercial_bridge_forbidden
) values (
  'canonical','urn:li:organization:18234216',300,100,1,3,true
)
on conflict(policy_key) do update set
  canonical_organization_urn=excluded.canonical_organization_urn,
  target_page_views_30d=excluded.target_page_views_30d,
  target_relevant_new_followers_30d=excluded.target_relevant_new_followers_30d,
  max_company_posts_per_day=excluded.max_company_posts_per_day,
  max_growth_recommendations_per_day=excluded.max_growth_recommendations_per_day,
  personal_linkedin_commercial_bridge_forbidden=excluded.personal_linkedin_commercial_bridge_forbidden,
  updated_at=now();

create table if not exists public.powerhouse_linkedin_company_page_metrics_v1 (
  observed_date date not null,
  source text not null,
  page_views_30d integer,
  desktop_page_views_30d integer,
  mobile_page_views_30d integer,
  followers_total integer,
  relevant_new_followers_30d integer,
  evidence jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  primary key(observed_date,source),
  check (page_views_30d is null or page_views_30d >= 0),
  check (desktop_page_views_30d is null or desktop_page_views_30d >= 0),
  check (mobile_page_views_30d is null or mobile_page_views_30d >= 0),
  check (relevant_new_followers_30d is null or relevant_new_followers_30d >= 0)
);

alter table public.powerhouse_linkedin_company_page_metrics_v1 enable row level security;
revoke all on public.powerhouse_linkedin_company_page_metrics_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_linkedin_company_page_metrics_v1 to service_role;

insert into public.powerhouse_linkedin_company_page_metrics_v1(
  observed_date,source,page_views_30d,desktop_page_views_30d,mobile_page_views_30d,evidence,observed_at
) values (
  date '2026-10-04','user_admin_screenshot',12,10,2,
  jsonb_build_object(
    'classification','OBSERVED',
    'surface','LinkedIn Bedrijfsgeheugen bezoekersstatistieken',
    'note','Observed by the user in LinkedIn admin analytics; retained as baseline until provider page analytics supersede it.'
  ),
  timestamptz '2026-10-04 13:11:00+02'
)
on conflict(observed_date,source) do update set
  page_views_30d=excluded.page_views_30d,
  desktop_page_views_30d=excluded.desktop_page_views_30d,
  mobile_page_views_30d=excluded.mobile_page_views_30d,
  evidence=excluded.evidence,
  observed_at=excluded.observed_at;

create table if not exists public.powerhouse_linkedin_company_growth_daily_v1 (
  run_date date primary key,
  organization_urn text not null,
  page_views_30d integer,
  page_views_target_30d integer not null,
  page_view_target_progress numeric not null default 0,
  relevant_new_followers_30d integer,
  relevant_new_followers_target_30d integer not null,
  company_posts_30d integer not null default 0,
  post_impressions_30d numeric not null default 0,
  post_reach_30d numeric not null default 0,
  post_reactions_30d numeric not null default 0,
  post_comments_30d numeric not null default 0,
  post_follows_30d numeric not null default 0,
  diagnosis text not null,
  source_metric_date date,
  source_metric_age_days integer,
  status text not null,
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_linkedin_company_growth_daily_v1 enable row level security;
revoke all on public.powerhouse_linkedin_company_growth_daily_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_linkedin_company_growth_daily_v1 to service_role;

create or replace function public.powerhouse_refresh_linkedin_company_growth_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_policy public.powerhouse_linkedin_company_growth_policy_v1%rowtype;
  v_page_views integer;
  v_relevant_followers integer;
  v_metric_date date;
  v_metric_age integer;
  v_posts integer:=0;
  v_impressions numeric:=0;
  v_reach numeric:=0;
  v_reactions numeric:=0;
  v_comments numeric:=0;
  v_follows numeric:=0;
  v_progress numeric:=0;
  v_diagnosis text;
  v_status text;
  v_recommendations integer:=0;
begin
  select * into strict v_policy
  from public.powerhouse_linkedin_company_growth_policy_v1
  where policy_key='canonical';

  select
    m.page_views_30d,
    m.relevant_new_followers_30d,
    m.observed_date,
    greatest(0,p_run_date-m.observed_date)
  into v_page_views,v_relevant_followers,v_metric_date,v_metric_age
  from public.powerhouse_linkedin_company_page_metrics_v1 m
  where m.observed_date<=p_run_date
  order by m.observed_date desc,m.observed_at desc
  limit 1;

  with company_posts as (
    select distinct on (s.post_id)
      s.post_id,s.published_at
    from public.social_posts s
    where s.platform='linkedin'
      and s.channel_kind='linkedin_company'
      and s.published_at>=p_run_date::timestamptz-interval '30 days'
      and s.published_at<(p_run_date+1)::timestamptz
    order by s.post_id,s.published_at desc
  ), latest_metrics as (
    select cp.post_id,sm.metrics
    from company_posts cp
    left join lateral (
      select x.metrics
      from public.social_metric_snapshots x
      where x.post_id=cp.post_id
        and x.data_quality='OBSERVED'
      order by x.observed_at desc
      limit 1
    ) sm on true
  )
  select
    count(*)::int,
    coalesce(sum(case when coalesce(metrics->>'Impressions','') ~ '^[0-9]+([.][0-9]+)?$' then (metrics->>'Impressions')::numeric else 0 end),0),
    coalesce(sum(case when coalesce(metrics->>'Reach','') ~ '^[0-9]+([.][0-9]+)?$' then (metrics->>'Reach')::numeric else 0 end),0),
    coalesce(sum(case when coalesce(metrics->>'Reactions','') ~ '^[0-9]+([.][0-9]+)?$' then (metrics->>'Reactions')::numeric else 0 end),0),
    coalesce(sum(case when coalesce(metrics->>'Comments','') ~ '^[0-9]+([.][0-9]+)?$' then (metrics->>'Comments')::numeric else 0 end),0),
    coalesce(sum(case when coalesce(metrics->>'Follows','') ~ '^[0-9]+([.][0-9]+)?$' then (metrics->>'Follows')::numeric else 0 end),0)
  into v_posts,v_impressions,v_reach,v_reactions,v_comments,v_follows
  from latest_metrics;

  v_progress:=case
    when v_page_views is null then 0
    else round(least(1::numeric,v_page_views::numeric/v_policy.target_page_views_30d),4)
  end;

  v_diagnosis:=case
    when v_page_views is null then 'page_analytics_missing'
    when v_metric_age>7 then 'page_analytics_stale'
    when v_page_views < greatest(25,round(v_policy.target_page_views_30d*.20)) then 'critical_distribution_gap'
    when v_page_views < round(v_policy.target_page_views_30d*.60) then 'distribution_gap'
    when v_page_views < v_policy.target_page_views_30d then 'below_target'
    else 'target_met'
  end;

  v_status:=case
    when v_page_views is null or v_metric_age>7 then 'MEASURE_AND_GROW'
    when v_page_views<v_policy.target_page_views_30d then 'GROW'
    else 'OPTIMIZE'
  end;

  insert into public.powerhouse_linkedin_company_growth_daily_v1(
    run_date,organization_urn,page_views_30d,page_views_target_30d,page_view_target_progress,
    relevant_new_followers_30d,relevant_new_followers_target_30d,company_posts_30d,
    post_impressions_30d,post_reach_30d,post_reactions_30d,post_comments_30d,post_follows_30d,
    diagnosis,source_metric_date,source_metric_age_days,status,evidence,updated_at
  ) values (
    p_run_date,v_policy.canonical_organization_urn,v_page_views,v_policy.target_page_views_30d,v_progress,
    v_relevant_followers,v_policy.target_relevant_new_followers_30d,v_posts,
    v_impressions,v_reach,v_reactions,v_comments,v_follows,
    v_diagnosis,v_metric_date,v_metric_age,v_status,
    jsonb_build_object(
      'contract','powerhouse-linkedin-company-growth-v1',
      'channel','linkedin_company',
      'baseline_source','powerhouse_linkedin_company_page_metrics_v1',
      'post_metrics_source','social_posts + latest observed social_metric_snapshots',
      'personal_linkedin_commercial_bridge_forbidden',v_policy.personal_linkedin_commercial_bridge_forbidden,
      'north_star',jsonb_build_array('paid_order','realized_revenue'),
      'intermediate_only',jsonb_build_array('page_views','followers','impressions','reach','engagement'),
      'truth_boundary','Page views and followers are intermediary distribution signals, not revenue or buying intent.'
    ),
    v_now
  )
  on conflict(run_date) do update set
    organization_urn=excluded.organization_urn,
    page_views_30d=excluded.page_views_30d,
    page_views_target_30d=excluded.page_views_target_30d,
    page_view_target_progress=excluded.page_view_target_progress,
    relevant_new_followers_30d=excluded.relevant_new_followers_30d,
    relevant_new_followers_target_30d=excluded.relevant_new_followers_target_30d,
    company_posts_30d=excluded.company_posts_30d,
    post_impressions_30d=excluded.post_impressions_30d,
    post_reach_30d=excluded.post_reach_30d,
    post_reactions_30d=excluded.post_reactions_30d,
    post_comments_30d=excluded.post_comments_30d,
    post_follows_30d=excluded.post_follows_30d,
    diagnosis=excluded.diagnosis,
    source_metric_date=excluded.source_metric_date,
    source_metric_age_days=excluded.source_metric_age_days,
    status=excluded.status,
    evidence=excluded.evidence,
    updated_at=excluded.updated_at;

  if v_status in ('GROW','MEASURE_AND_GROW') then
    insert into public.powerhouse_content_recommendations(
      dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
    ) values
    (
      'linkedin-company-growth:value-asset:'||p_run_date::text,p_run_date,'linkedin-company-growth',null,
      'linkedin_company','value_asset_distribution',
      case when v_diagnosis='critical_distribution_gap' then 100 else 92 end,
      'Publish one source-backed, utility-first company-page asset that earns a visit/follow because it gives the MKB audience a concrete checklist, benchmark, diagnostic, model, template or worked example.',
      jsonb_build_object(
        'contract','powerhouse-linkedin-company-growth-v1','organization_urn',v_policy.canonical_organization_urn,
        'page_views_30d',v_page_views,'target_page_views_30d',v_policy.target_page_views_30d,
        'required_traits',jsonb_build_array('concrete_value','source_backed','standalone_useful','clear_follow_reason','commercially_relevant_without_sales_pressure'),
        'preferred_assets',jsonb_build_array('checklist','mini-benchmark','diagnostic','modelwijzer','template','worked-example'),
        'provider_readback_required',true,'duplicate_gate_required',true
      ),
      'suggested'
    ),
    (
      'linkedin-company-growth:distribution-loop:'||p_run_date::text,p_run_date,'linkedin-company-growth',null,
      'linkedin_company','company_page_distribution_loop',
      case when v_diagnosis='critical_distribution_gap' then 99 else 90 end,
      'Turn each company-page publication into a distribution loop: strong native hook, useful body, one explicit reason to follow Bedrijfsgeheugen, and a measured next step to owned value such as Bedrijfslek, Modelwijzer, benchmark or relevant article.',
      jsonb_build_object(
        'contract','powerhouse-linkedin-company-growth-v1','organization_urn',v_policy.canonical_organization_urn,
        'company_posts_30d',v_posts,'post_impressions_30d',v_impressions,'post_reach_30d',v_reach,
        'cta_order',jsonb_build_array('follow_for_recurring_value','owned_value_asset','scan_or_product_when_contextually_fit'),
        'personal_profile_commercial_bridge_forbidden',true
      ),
      'suggested'
    ),
    (
      'linkedin-company-growth:page-conversion:'||p_run_date::text,p_run_date,'linkedin-company-growth',null,
      'linkedin_company','company_page_conversion_optimization',
      88,
      'Optimize the company-page content mix for page visits and relevant follows, then connect those visits to owned-site progression and revenue learning instead of treating follower growth as terminal success.',
      jsonb_build_object(
        'contract','powerhouse-linkedin-company-growth-v1',
        'measure',jsonb_build_array('page_views_30d','relevant_new_followers_30d','post_impressions','post_reach','website_visits','scan_starts','qualified_leads','orders','revenue'),
        'max_company_posts_per_day',v_policy.max_company_posts_per_day,
        'max_growth_recommendations_per_day',v_policy.max_growth_recommendations_per_day,
        'vanity_metrics_terminal',false
      ),
      'suggested'
    )
    on conflict(dedupe_key) do update set
      priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,status=excluded.status,updated_at=v_now;
    get diagnostics v_recommendations=row_count;
  end if;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence,updated_at
  ) values (
    'linkedin-company-growth:'||p_run_date::text,
    'linkedin_company_growth_refresh',
    'powerhouse-linkedin-company-growth-v1',
    v_policy.canonical_organization_urn,
    v_now,
    jsonb_build_object(
      'page_views_30d',v_page_views,'target_page_views_30d',v_policy.target_page_views_30d,
      'target_progress',v_progress,'relevant_new_followers_30d',v_relevant_followers,
      'company_posts_30d',v_posts,'impressions_30d',v_impressions,'reach_30d',v_reach,
      'diagnosis',v_diagnosis,'recommendations_touched',v_recommendations
    ),
    jsonb_build_object('existing_state_first',true,'reuse_existing_scheduler',true,'parallel_scheduler',false),
    case when v_status='OPTIMIZE' then 'observed' else 'actioned' end,
    case when v_metric_date is null then 'partial' else 'verified' end,
    case when v_metric_date is null then .60 else 1 end,
    v_now
  )
  on conflict(dedupe_key) do update set
    evidence=excluded.evidence,context=excluded.context,state=excluded.state,
    data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=v_now;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-company-growth-v1',
    'run_date',p_run_date,
    'organization_urn',v_policy.canonical_organization_urn,
    'page_views_30d',v_page_views,
    'target_page_views_30d',v_policy.target_page_views_30d,
    'target_progress',v_progress,
    'diagnosis',v_diagnosis,
    'status',v_status,
    'company_posts_30d',v_posts,
    'post_impressions_30d',v_impressions,
    'post_reach_30d',v_reach,
    'recommendations_touched',v_recommendations,
    'personal_linkedin_commercial_bridge_forbidden',v_policy.personal_linkedin_commercial_bridge_forbidden,
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_refresh_linkedin_company_growth_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_linkedin_company_growth_v1(date) to service_role;

-- Extend the existing single commercial cycle instead of introducing another scheduler.
create or replace function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_relationship jsonb;
  v_existing_research jsonb;
  v_public_research_dispatch jsonb;
  v_trigger jsonb;
  v_linkedin_company_growth jsonb;
  v_growth_swarm jsonb;
  v_growth_activation jsonb;
  v_growth_plays_v2 jsonb;
  v_growth_executor jsonb;
  v_linkedin_sales_dispatch jsonb;
  v_outreach_prepare jsonb;
  v_persuasion jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_linkedin_company_growth:=public.powerhouse_refresh_linkedin_company_growth_v1(p_run_date);
  v_growth_swarm:=public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  v_growth_activation:=public.powerhouse_materialize_growth_swarm_v1(p_run_date);
  v_growth_plays_v2:=public.powerhouse_activate_all_growth_plays_v2(p_run_date);
  v_growth_executor:=public.powerhouse_execute_growth_play_actions_v1(p_run_date);
  v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_persuasion:=public.powerhouse_optimize_prepared_outreach_v1(p_run_date);
  v_outreach_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);

  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,
    'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger,
    'linkedin_company_growth',v_linkedin_company_growth,
    'growth_swarm',v_growth_swarm,
    'growth_swarm_activation',v_growth_activation,
    'growth_plays_v2',v_growth_plays_v2,
    'growth_play_executor',v_growth_executor,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,
    'persuasion_optimizer',v_persuasion,
    'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;
