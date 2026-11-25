-- Powerhouse Growth Swarm v1
-- One cross-domain revenue intelligence layer that connects scans, benchmarks, public signals,
-- relationship intelligence, LinkedIn, content, workshops, M&A risk, referrals and realized outcomes.

create table if not exists public.powerhouse_growth_swarm_accounts_v1 (
  company_key text primary key,
  company_name text,
  best_person_key text,
  best_person_name text,
  best_person_role text,
  relationship_score numeric not null default 0,
  trigger_score numeric not null default 0,
  dark_funnel_score numeric not null default 0,
  friction_score numeric not null default 0,
  knowledge_risk_score numeric not null default 0,
  ma_risk_score numeric not null default 0,
  expected_value_eur numeric not null default 0,
  expected_revenue_eur numeric not null default 0,
  swarm_score numeric not null default 0,
  next_best_action text,
  next_best_channel text,
  play_keys text[] not null default '{}'::text[],
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_growth_swarm_accounts_v1 enable row level security;
revoke all on public.powerhouse_growth_swarm_accounts_v1 from public, anon, authenticated;
grant select,insert,update,delete on public.powerhouse_growth_swarm_accounts_v1 to service_role;

create or replace view public.powerhouse_friction_index_v1
with (security_invoker=true) as
with scored as (
  select
    nullif(trim(branche),'') as branche,
    case
      when score is null then null
      when score > 1 then least(1,greatest(0,score/100.0))
      else least(1,greatest(0,score))
    end as score_norm
  from public.scan_inzendingen
  where scan_datum >= current_date - 365
)
select
  branche,
  count(*)::int as sample_size,
  round(avg(score_norm),4) as maturity_score,
  round(1-avg(score_norm),4) as friction_index,
  round(percentile_cont(.5) within group(order by score_norm)::numeric,4) as median_maturity,
  round(percentile_cont(.75) within group(order by score_norm)::numeric,4) as upper_quartile_maturity,
  case
    when avg(score_norm) < .40 then 'high_friction'
    when avg(score_norm) < .60 then 'material_friction'
    when avg(score_norm) < .75 then 'moderate_friction'
    else 'lower_friction'
  end as friction_band
from scored
where branche is not null and score_norm is not null
group by branche
having count(*) >= 5;

revoke all on public.powerhouse_friction_index_v1 from public,anon,authenticated;
grant select on public.powerhouse_friction_index_v1 to service_role;

create or replace view public.powerhouse_workshop_leaderboard_v1
with (security_invoker=true) as
with base as (
  select
    coalesce(nullif(payload->>'workshop_key',''),nullif(payload->>'event_key',''),nullif(trim(bron),'')) as workshop_key,
    submission_key,
    branche,
    case
      when score is null then null
      when score > 1 then least(1,greatest(0,score/100.0))
      else least(1,greatest(0,score))
    end as score_norm,
    aangemaakt
  from public.scan_inzendingen
  where submission_key is not null
), ranked as (
  select
    b.*,
    count(*) over(partition by workshop_key) as workshop_size,
    avg(score_norm) over(partition by workshop_key) as workshop_avg,
    percent_rank() over(partition by workshop_key order by score_norm) as percentile_rank
  from base b
  where workshop_key is not null and score_norm is not null
)
select
  workshop_key,
  submission_key,
  branche,
  workshop_size,
  round(score_norm,4) as score,
  round(workshop_avg,4) as workshop_average,
  round(score_norm-workshop_avg,4) as delta_to_workshop,
  round(percentile_rank::numeric,4) as percentile_rank,
  aangemaakt
from ranked
where workshop_size >= 5;

revoke all on public.powerhouse_workshop_leaderboard_v1 from public,anon,authenticated;
grant select on public.powerhouse_workshop_leaderboard_v1 to service_role;

create or replace view public.powerhouse_dark_funnel_intent_v1
with (security_invoker=true) as
with web as (
  select
    nullif(trim(payload->>'company_key'),'') as company_key,
    count(*) filter(where occurred_at>=now()-interval '30 days')::int as web_events_30d,
    count(*) filter(where occurred_at>=now()-interval '30 days' and funnel_stage in ('lead','consideration','conversion'))::int as deep_events_30d,
    max(occurred_at) as last_web_at
  from public.growth_events
  where is_robot is not true
    and occurred_at>=now()-interval '90 days'
    and nullif(trim(payload->>'company_key'),'') is not null
  group by nullif(trim(payload->>'company_key'),'')
), scans as (
  select
    company_key,
    count(*) filter(where aangemaakt>=now()-interval '90 days')::int as scans_90d,
    max(aangemaakt) as last_scan_at
  from public.scan_inzendingen
  where company_key is not null
  group by company_key
), social as (
  select
    c.company_key,
    count(*) filter(where e.occurred_at>=now()-interval '30 days')::int as linkedin_events_30d,
    count(*) filter(where e.occurred_at>=now()-interval '30 days' and e.engagement_type in ('comment','share','repost'))::int as linkedin_deep_events_30d,
    max(e.occurred_at) as last_linkedin_at
  from public.linkedin_engagement_events e
  join public.powerhouse_company_intelligence_v1 c
    on lower(trim(c.company_name))=lower(trim(e.company_name))
  where e.is_test is not true
    and e.occurred_at>=now()-interval '90 days'
  group by c.company_key
)
select
  c.company_key,
  c.company_name,
  coalesce(w.web_events_30d,0) as web_events_30d,
  coalesce(w.deep_events_30d,0) as deep_events_30d,
  coalesce(s.scans_90d,0) as scans_90d,
  coalesce(so.linkedin_events_30d,0) as linkedin_events_30d,
  coalesce(so.linkedin_deep_events_30d,0) as linkedin_deep_events_30d,
  greatest(w.last_web_at,s.last_scan_at,so.last_linkedin_at,c.last_relevant_at) as last_intent_at,
  round(least(1::numeric,
      .06*coalesce(w.web_events_30d,0)
    + .12*coalesce(w.deep_events_30d,0)
    + .25*coalesce(s.scans_90d,0)
    + .05*coalesce(so.linkedin_events_30d,0)
    + .12*coalesce(so.linkedin_deep_events_30d,0)
    + .30*coalesce(c.company_intent_score,0)
  ),4) as dark_funnel_score,
  jsonb_build_object(
    'web_events_30d',coalesce(w.web_events_30d,0),
    'deep_events_30d',coalesce(w.deep_events_30d,0),
    'scans_90d',coalesce(s.scans_90d,0),
    'linkedin_events_30d',coalesce(so.linkedin_events_30d,0),
    'linkedin_deep_events_30d',coalesce(so.linkedin_deep_events_30d,0),
    'company_intent_score',coalesce(c.company_intent_score,0)
  ) as evidence
from public.powerhouse_company_intelligence_v1 c
left join web w on w.company_key=c.company_key
left join scans s on s.company_key=c.company_key
left join social so on so.company_key=c.company_key;

revoke all on public.powerhouse_dark_funnel_intent_v1 from public,anon,authenticated;
grant select on public.powerhouse_dark_funnel_intent_v1 to service_role;

create or replace function public.powerhouse_lost_knowledge_value_v1(
  p_employees integer,
  p_turnover_rate numeric,
  p_avg_loaded_cost_eur numeric,
  p_critical_knowledge_share numeric default .25,
  p_recovery_months numeric default 4
) returns jsonb
language sql
immutable
set search_path = pg_catalog, public
as $$
  select jsonb_build_object(
    'contract','powerhouse-lost-knowledge-value-v1',
    'classification','SCENARIO_ESTIMATE',
    'employees',greatest(0,coalesce(p_employees,0)),
    'turnover_rate',least(1,greatest(0,coalesce(p_turnover_rate,0))),
    'avg_loaded_cost_eur',greatest(0,coalesce(p_avg_loaded_cost_eur,0)),
    'critical_knowledge_share',least(1,greatest(0,coalesce(p_critical_knowledge_share,.25))),
    'recovery_months',greatest(0,coalesce(p_recovery_months,4)),
    'estimated_people_leaving',
      round(greatest(0,coalesce(p_employees,0))*least(1,greatest(0,coalesce(p_turnover_rate,0))),2),
    'estimated_annual_knowledge_loss_eur',
      round(
        greatest(0,coalesce(p_employees,0))
        * least(1,greatest(0,coalesce(p_turnover_rate,0)))
        * greatest(0,coalesce(p_avg_loaded_cost_eur,0))
        * least(1,greatest(0,coalesce(p_critical_knowledge_share,.25)))
        * least(1,greatest(0,coalesce(p_recovery_months,4))/12.0)
      ,2),
    'truth_boundary','Scenario estimate only. Replace assumptions with tenant evidence before using as observed financial impact.'
  );
$$;

revoke execute on function public.powerhouse_lost_knowledge_value_v1(integer,numeric,numeric,numeric,numeric) from public,anon,authenticated;
grant execute on function public.powerhouse_lost_knowledge_value_v1(integer,numeric,numeric,numeric,numeric) to service_role;

create or replace function public.powerhouse_ma_knowledge_execution_risk_v1(
  p_key_person_dependency numeric,
  p_process_documentation_gap numeric,
  p_management_information_gap numeric,
  p_system_fragmentation numeric,
  p_knowledge_concentration numeric
) returns jsonb
language sql
immutable
set search_path = pg_catalog, public
as $$
  with x as (
    select least(1,greatest(0,.28*coalesce(p_key_person_dependency,0)
      +.22*coalesce(p_process_documentation_gap,0)
      +.18*coalesce(p_management_information_gap,0)
      +.14*coalesce(p_system_fragmentation,0)
      +.18*coalesce(p_knowledge_concentration,0))) risk
  )
  select jsonb_build_object(
    'contract','powerhouse-ma-knowledge-execution-risk-v1',
    'classification','ESTIMATED_RISK',
    'risk_score',round(risk,4),
    'risk_band',case when risk>=.75 then 'critical'
                     when risk>=.55 then 'high'
                     when risk>=.35 then 'medium'
                     else 'lower' end,
    'due_diligence_questions',jsonb_build_array(
      'Welke processen vallen stil als één sleutelpersoon vertrekt?',
      'Welke stuurinformatie kan niet reproduceerbaar uit bronsystemen worden opgebouwd?',
      'Welke cruciale werkwijzen bestaan alleen in hoofden, mailboxen of spreadsheets?',
      'Welke systeemkoppelingen of handmatige overdrachten vormen operationeel risico?',
      'Hoe snel kan een nieuwe eigenaar of manager de organisatie zelfstandig doorgronden?'
    ),
    'truth_boundary','Risk estimate; not a valuation, legal opinion or transaction recommendation.'
  ) from x;
$$;

revoke execute on function public.powerhouse_ma_knowledge_execution_risk_v1(numeric,numeric,numeric,numeric,numeric) from public,anon,authenticated;
grant execute on function public.powerhouse_ma_knowledge_execution_risk_v1(numeric,numeric,numeric,numeric,numeric) to service_role;

create or replace function public.powerhouse_refresh_growth_swarm_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_accounts integer:=0;
  v_dossiers integer:=0;
  v_content integer:=0;
  v_referrals integer:=0;
begin
  with best_people as (
    select distinct on (p.company_key_normalized)
      p.company_key_normalized company_key,
      p.person_key,p.person_name,p.role,
      least(1::numeric,greatest(0::numeric,
        .55*coalesce(p.relationship_warmth,0)+.45*coalesce(p.decision_influence,0)
      )) relationship_score
    from public.powerhouse_person_intelligence_v1 p
    where nullif(trim(p.company_key_normalized),'') is not null
    order by p.company_key_normalized,
      (.55*coalesce(p.relationship_warmth,0)+.45*coalesce(p.decision_influence,0)) desc,
      p.last_relevant_at desc nulls last
  ), triggers as (
    select distinct on (company_key)
      company_key,trigger_key,trigger_type,confidence,observed_at,problem_hypothesis,trigger_evidence_ref
    from public.powerhouse_mkb_trigger_intelligence_v1
    where do_not_contact_reason is null
      and observed_at>=v_now-interval '90 days'
    order by company_key,confidence desc,observed_at desc
  ), opp as (
    select company_key,
      max(coalesce(expected_value_eur,0)) expected_value_eur,
      max(coalesce(expected_revenue_value,0)) expected_revenue_eur,
      count(*) filter(where coalesce(status,'') not in ('closed','won','lost'))::int open_opportunities
    from public.powerhouse_opportunities
    where company_key is not null
    group by company_key
  ), latest_scan as (
    select distinct on (company_key)
      company_key,branche,score,payload,aangemaakt
    from public.scan_inzendingen
    where company_key is not null
    order by company_key,aangemaakt desc
  ), source as (
    select
      c.company_key,c.company_name,
      bp.person_key,bp.person_name,bp.role,coalesce(bp.relationship_score,0) relationship_score,
      coalesce(t.confidence,0) trigger_score,
      t.trigger_key,t.trigger_type,t.problem_hypothesis,t.trigger_evidence_ref,t.observed_at trigger_observed_at,
      coalesce(df.dark_funnel_score,0) dark_funnel_score,
      case
        when ls.score is null then 0
        when ls.score>1 then 1-least(1,greatest(0,ls.score/100.0))
        else 1-least(1,greatest(0,ls.score))
      end friction_score,
      least(1::numeric,greatest(0::numeric,
        .45*(case when ls.score is null then 0
                  when ls.score>1 then 1-least(1,greatest(0,ls.score/100.0))
                  else 1-least(1,greatest(0,ls.score)) end)
        +.30*coalesce(c.external_signal_score,0)
        +.25*coalesce(c.max_relationship_warmth,0)
      )) knowledge_risk_score,
      least(1::numeric,greatest(0::numeric,
        .40*(case when coalesce(t.trigger_type,'') in ('buy_sell_ma','post_merger_integration','investor_pe') then coalesce(t.confidence,0) else 0 end)
        +.30*(case when ls.score is null then 0
                   when ls.score>1 then 1-least(1,greatest(0,ls.score/100.0))
                   else 1-least(1,greatest(0,ls.score)) end)
        +.30*coalesce(c.external_signal_score,0)
      )) ma_risk_score,
      greatest(coalesce(o.expected_value_eur,0),case when coalesce(t.confidence,0)>=.60 and coalesce(bp.relationship_score,0)>=.50 then 2900 else 0 end) expected_value_eur,
      greatest(coalesce(o.expected_revenue_eur,0),coalesce(c.weighted_pipeline_eur,0)) expected_revenue_eur,
      coalesce(o.open_opportunities,0) open_opportunities,
      ls.branche,ls.payload scan_payload,ls.aangemaakt last_scan_at,
      df.evidence dark_funnel_evidence
    from public.powerhouse_company_intelligence_v1 c
    left join best_people bp on bp.company_key=c.company_key
    left join triggers t on t.company_key=c.company_key
    left join opp o on o.company_key=c.company_key
    left join latest_scan ls on ls.company_key=c.company_key
    left join public.powerhouse_dark_funnel_intent_v1 df on df.company_key=c.company_key
  )
  insert into public.powerhouse_growth_swarm_accounts_v1(
    company_key,company_name,best_person_key,best_person_name,best_person_role,
    relationship_score,trigger_score,dark_funnel_score,friction_score,knowledge_risk_score,ma_risk_score,
    expected_value_eur,expected_revenue_eur,swarm_score,next_best_action,next_best_channel,play_keys,evidence,updated_at
  )
  select
    s.company_key,s.company_name,s.person_key,s.person_name,s.role,
    round(s.relationship_score,4),round(s.trigger_score,4),round(s.dark_funnel_score,4),
    round(s.friction_score,4),round(s.knowledge_risk_score,4),round(s.ma_risk_score,4),
    s.expected_value_eur,s.expected_revenue_eur,
    round(least(1::numeric,
       .24*s.relationship_score
      +.24*s.trigger_score
      +.18*s.dark_funnel_score
      +.12*s.friction_score
      +.10*s.knowledge_risk_score
      +.12*least(1,greatest(s.expected_value_eur,s.expected_revenue_eur)/25000.0)
    ),4) swarm_score,
    case
      when s.ma_risk_score>=.60 then 'ma_knowledge_execution_risk_brief'
      when s.trigger_score>=.70 and s.relationship_score>=.55 then 'prebuilt_prospect_dossier_and_direct_followup'
      when s.dark_funnel_score>=.55 and s.relationship_score>=.45 then 'dark_funnel_context_followup'
      when s.friction_score>=.50 then 'benchmark_friction_teardown'
      when s.knowledge_risk_score>=.50 then 'lost_knowledge_value_hypothesis'
      when s.relationship_score>=.65 then 'relationship_nurture'
      else 'research_and_wait'
    end,
    case
      when s.trigger_score>=.70 and s.relationship_score>=.55 then 'linkedin_or_email'
      when s.dark_funnel_score>=.55 then 'linkedin_or_email'
      when s.ma_risk_score>=.60 then 'partner_or_email'
      else 'internal'
    end,
    array_remove(array[
      case when s.friction_score>=.35 then 'mkb-friction-index' end,
      case when s.knowledge_risk_score>=.40 then 'lost-knowledge-calculator' end,
      case when s.ma_risk_score>=.40 then 'ma-knowledge-risk' end,
      case when s.dark_funnel_score>=.35 then 'dark-funnel' end,
      case when s.trigger_score>=.55 then 'trigger-hijacking' end,
      case when s.relationship_score>=.55 then 'prebuilt-prospect-dossier' end,
      'revenue-swarm'
    ],null),
    jsonb_build_object(
      'contract','powerhouse-growth-swarm-v1',
      'trigger',jsonb_build_object(
        'trigger_key',s.trigger_key,'trigger_type',s.trigger_type,'confidence',s.trigger_score,
        'problem_hypothesis',s.problem_hypothesis,'evidence_ref',s.trigger_evidence_ref,'observed_at',s.trigger_observed_at),
      'dark_funnel',coalesce(s.dark_funnel_evidence,'{}'::jsonb),
      'scan',jsonb_build_object('branche',s.branche,'last_scan_at',s.last_scan_at),
      'open_opportunities',s.open_opportunities,
      'entry_offer_floor_eur',2900,
      'truth_boundary','Expected value and risk values are hypotheses until supported by tenant or transactional evidence.'
    ),
    v_now
  from source s
  on conflict(company_key) do update set
    company_name=excluded.company_name,
    best_person_key=excluded.best_person_key,
    best_person_name=excluded.best_person_name,
    best_person_role=excluded.best_person_role,
    relationship_score=excluded.relationship_score,
    trigger_score=excluded.trigger_score,
    dark_funnel_score=excluded.dark_funnel_score,
    friction_score=excluded.friction_score,
    knowledge_risk_score=excluded.knowledge_risk_score,
    ma_risk_score=excluded.ma_risk_score,
    expected_value_eur=excluded.expected_value_eur,
    expected_revenue_eur=excluded.expected_revenue_eur,
    swarm_score=excluded.swarm_score,
    next_best_action=excluded.next_best_action,
    next_best_channel=excluded.next_best_channel,
    play_keys=excluded.play_keys,
    evidence=excluded.evidence,
    updated_at=excluded.updated_at;
  get diagnostics v_accounts=row_count;

  with ranked as (
    select g.*,row_number() over(order by swarm_score desc,expected_revenue_eur desc,expected_value_eur desc,company_key) rn
    from public.powerhouse_growth_swarm_accounts_v1 g
    where swarm_score>=.55
      and best_person_key is not null
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-swarm-dossier:'||md5(r.company_key)||':'||p_run_date::text,
    'company:'||r.company_key,r.best_person_key,r.company_key,
    'growth_swarm_dossier','internal',round(100*r.swarm_score,2),
    'Build a pre-contact commercial dossier that connects relationship, trigger, dark-funnel, benchmark, knowledge-risk and expected-value evidence.',
    r.evidence||jsonb_build_object(
      'swarm_score',r.swarm_score,
      'next_best_action',r.next_best_action,
      'next_best_channel',r.next_best_channel,
      'play_keys',r.play_keys,
      'expected_value_eur',r.expected_value_eur,
      'expected_revenue_eur',r.expected_revenue_eur,
      'output_contract',jsonb_build_object(
        'three_observations',true,
        'two_opportunities',true,
        'one_value_hypothesis',true,
        'one_next_best_action',true,
        'public_or_first_party_evidence_only',true
      )
    ),
    '', '', 'suggested',v_now,r.expected_value_eur,r.best_person_name,r.company_name,r.best_person_role
  from ranked r
  where rn<=20
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,due_at=excluded.due_at,
    expected_value_eur=excluded.expected_value_eur,updated_at=v_now;
  get diagnostics v_dossiers=row_count;

  with dominant as (
    select trigger_type,count(*)::int n,round(avg(confidence)::numeric,3) avg_confidence
    from public.powerhouse_mkb_trigger_intelligence_v1
    where do_not_contact_reason is null
      and observed_at>=v_now-interval '14 days'
      and confidence>=.60
    group by trigger_type
    order by count(*) desc,avg(confidence) desc,trigger_type
    limit 3
  )
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'growth-swarm-contrarian:'||p_run_date::text||':'||d.trigger_type,
    p_run_date,'growth-swarm:'||d.trigger_type,null,'linkedin_company','contrarian_demand_creation',
    99,
    'Maak evidence-backed contrarian content rond "'||replace(d.trigger_type,'_',' ')||'": start met een scherpe tegenintuïtieve stelling, onderbouw met actuele patronen, geef een praktische check en stuur naar Frisse Blik/benchmark zonder individuele prospects te noemen.',
    jsonb_build_object(
      'contract','powerhouse-growth-swarm-v1','trigger_type',d.trigger_type,'signal_count',d.n,'avg_confidence',d.avg_confidence,
      'plays',jsonb_build_array('we-disagree-content','trigger-hijacking','prospect-generated-content-loop','sales-air-cover'),
      'anonymized',true,'prospect_names_forbidden',true
    ),
    'suggested'
  from dominant d
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_content=row_count;

  with positive as (
    select distinct on (o.person_key)
      o.person_key,o.company_key,o.occurred_at,p.person_name,p.company_name,p.role
    from public.powerhouse_sales_outcomes o
    join public.powerhouse_person_intelligence_v1 p on p.person_key=o.person_key
    where o.occurred_at>=v_now-interval '45 days'
      and lower(coalesce(o.outcome_type,'')) in ('won','paid','meeting_completed','scan_completed','positive_reply')
      and p.relationship_warmth>=.60
    order by o.person_key,o.occurred_at desc
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    'growth-referral:'||md5(p.person_key)||':'||to_char(p.occurred_at,'YYYYMM'),
    'relationship:'||p.person_key,p.person_key,p.company_key,
    'referral_activation','internal',88,
    'Positive commercial outcome creates a high-trust referral moment. Ask for one specific peer who has the same problem; do not use a generic referral-program pitch.',
    jsonb_build_object(
      'contract','powerhouse-growth-swarm-v1',
      'play','referral-without-referral-program',
      'positive_outcome_at',p.occurred_at,
      'draft_intent','Which entrepreneur in your network has this same problem? Create a short forwardable introduction only after context validation.',
      'external_side_effect_allowed',false
    ),
    '', '', 'suggested',v_now,0,p.person_name,p.company_name,p.role
  from positive p
  on conflict(dedupe_key) do nothing;
  get diagnostics v_referrals=row_count;

  return jsonb_build_object(
    'contract','powerhouse-growth-swarm-v1',
    'run_date',p_run_date,
    'accounts_touched',v_accounts,
    'dossiers_touched',v_dossiers,
    'content_recommendations_touched',v_content,
    'referral_actions_touched',v_referrals,
    'friction_index_segments',(select count(*) from public.powerhouse_friction_index_v1),
    'workshop_leaderboard_rows',(select count(*) from public.powerhouse_workshop_leaderboard_v1),
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_refresh_growth_swarm_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_growth_swarm_v1(date) to service_role;

create or replace view public.powerhouse_revenue_swarm_v1
with (security_invoker=true) as
select
  row_number() over(order by swarm_score desc,expected_revenue_eur desc,expected_value_eur desc,company_key) as revenue_rank,
  company_key,company_name,best_person_key,best_person_name,best_person_role,
  relationship_score,trigger_score,dark_funnel_score,friction_score,knowledge_risk_score,ma_risk_score,
  expected_value_eur,expected_revenue_eur,swarm_score,next_best_action,next_best_channel,play_keys,evidence,updated_at
from public.powerhouse_growth_swarm_accounts_v1
where swarm_score>=.35;

revoke all on public.powerhouse_revenue_swarm_v1 from public,anon,authenticated;
grant select on public.powerhouse_revenue_swarm_v1 to service_role;

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
  v_growth_swarm jsonb;
  v_linkedin_sales_dispatch jsonb;
  v_outreach_prepare jsonb;
  v_outreach_dispatch jsonb;
  v_learning jsonb;
begin
  v_relationship:=public.powerhouse_refresh_relationship_revenue_v1(p_run_date);
  v_existing_research:=public.powerhouse_execute_relationship_research_v1(p_run_date);
  v_public_research_dispatch:=public.powerhouse_dispatch_relationship_public_research_v1(p_run_date);
  v_trigger:=public.powerhouse_refresh_trigger_based_mkb_acquisition_v1(p_run_date);
  v_growth_swarm:=public.powerhouse_refresh_growth_swarm_v1(p_run_date);
  v_linkedin_sales_dispatch:=public.powerhouse_dispatch_linkedin_sales_machine_v1(p_run_date);
  v_outreach_prepare:=public.powerhouse_prepare_autonomous_outreach_v1(p_run_date);
  v_outreach_dispatch:=public.powerhouse_dispatch_autonomous_outreach_v1(p_run_date);
  v_learning:=public.powerhouse_commercial_learning_cycle_v1(p_run_date);

  return jsonb_build_object(
    'contract','powerhouse-trigger-based-mkb-acquisition-cycle-v1',
    'relationship_revenue',v_relationship,
    'existing_evidence_research',v_existing_research,
    'public_research_dispatch',v_public_research_dispatch,
    'trigger_acquisition',v_trigger,
    'growth_swarm',v_growth_swarm,
    'linkedin_sales_dispatch',v_linkedin_sales_dispatch,
    'autonomous_outreach_prepare',v_outreach_prepare,
    'autonomous_outreach_dispatch',v_outreach_dispatch,
    'commercial_learning',v_learning,
    'run_date',p_run_date,
    'executed_at',now()
  );
end;
$$;

revoke execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_trigger_based_mkb_acquisition_cycle_v1(date) to service_role;

comment on table public.powerhouse_growth_swarm_accounts_v1 is
'Derived cross-domain account intelligence for Powerhouse growth/revenue. Not a parallel CRM: canonical relationships, opportunities, outcomes and source evidence remain authoritative.';
comment on function public.powerhouse_refresh_growth_swarm_v1(date) is
'Connects first-party relationships, triggers, scans, benchmarks, dark-funnel signals, content and outcomes into one revenue-first next-best-action layer.';
