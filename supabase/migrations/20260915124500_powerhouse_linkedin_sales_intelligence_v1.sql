-- Powerhouse LinkedIn sales intelligence v1
-- Extends the existing canonical revenue flywheel. No new CRM, graph store, queue,
-- scheduler family, analytics store or learning store is introduced.

create or replace view public.powerhouse_person_intelligence_v1
with (security_invoker = true)
as
with people as (
  select
    coalesce(nullif(trim(c.sleutel),''), nullif(trim(c.linkedin_url),'')) as person_key,
    c.linkedin_url,
    c.naam as person_name,
    c.bedrijf as company_name,
    c.rol as role,
    c.segment,
    c.status as relationship_status,
    c.prioriteit,
    c.email,
    c.telefoon,
    c.whatsapp_toegestaan,
    c.aanleiding,
    c.laatst_aangeboden_op,
    c.laatste_uitkomst,
    c.bron,
    c.extra,
    c.bijgewerkt_op
  from public.bg_connecties c
  where coalesce(nullif(trim(c.sleutel),''), nullif(trim(c.linkedin_url),'')) is not null
), event_stats as (
  select
    e.person_key,
    count(*) filter (where e.occurred_at >= now() - interval '30 days')::int as events_30d,
    max(e.occurred_at) as last_observed_at,
    array_remove(array_agg(distinct e.topic_key),null) as observed_topics,
    avg(coalesce(e.confidence,0)) filter (where e.occurred_at >= now() - interval '30 days') as avg_event_confidence_30d
  from public.powerhouse_runtime_events e
  where e.person_key is not null
    and e.occurred_at >= now() - interval '180 days'
  group by e.person_key
), action_stats as (
  select
    a.person_key,
    count(*) filter (where a.executed_at >= now() - interval '90 days')::int as actions_90d,
    count(*) filter (where a.executed_at >= now() - interval '30 days')::int as actions_30d,
    max(a.executed_at) as last_action_at
  from public.powerhouse_sales_actions a
  where a.person_key is not null
  group by a.person_key
), outcome_stats as (
  select
    o.person_key,
    count(*)::int as outcomes_total,
    count(*) filter (where lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|revenue)')::int as positive_outcomes,
    count(*) filter (where lower(o.outcome_type) ~ '(meeting|appointment)')::int as meetings,
    count(*) filter (where lower(o.outcome_type) ~ '(proposal|offerte)')::int as proposals,
    count(*) filter (where lower(o.outcome_type) ~ '(won|order|revenue)')::int as won_outcomes,
    coalesce(sum(o.revenue_eur),0) as realized_revenue_eur,
    max(o.occurred_at) as last_outcome_at
  from public.powerhouse_sales_outcomes o
  where o.person_key is not null
  group by o.person_key
), opp_stats as (
  select
    o.person_key,
    count(*) filter (where coalesce(o.status,'') not in ('closed','won','lost'))::int as open_opportunities,
    max(coalesce(o.probability,0) * coalesce(o.confidence,0)) as max_opportunity_signal,
    max(o.last_evidence_at) as last_opportunity_evidence_at
  from public.powerhouse_opportunities o
  where o.person_key is not null
  group by o.person_key
)
select
  p.person_key,
  p.linkedin_url,
  p.person_name,
  p.company_name,
  lower(regexp_replace(trim(coalesce(p.company_name,'')),'\s+',' ','g')) as company_key_normalized,
  p.role,
  p.segment,
  p.relationship_status,
  p.prioriteit,
  p.email,
  p.telefoon,
  p.whatsapp_toegestaan,
  p.aanleiding,
  array_remove(array[
    case when nullif(trim(p.linkedin_url),'') is not null then 'linkedin' end,
    case when nullif(trim(p.email),'') is not null then 'email' end,
    case when nullif(trim(p.telefoon),'') is not null and p.whatsapp_toegestaan is true then 'whatsapp' end
  ],null) as available_channels,
  coalesce(e.events_30d,0) as events_30d,
  coalesce(a.actions_30d,0) as actions_30d,
  coalesce(a.actions_90d,0) as actions_90d,
  coalesce(o.outcomes_total,0) as outcomes_total,
  coalesce(o.positive_outcomes,0) as positive_outcomes,
  coalesce(o.meetings,0) as meetings,
  coalesce(o.proposals,0) as proposals,
  coalesce(o.won_outcomes,0) as won_outcomes,
  coalesce(o.realized_revenue_eur,0) as realized_revenue_eur,
  coalesce(op.open_opportunities,0) as open_opportunities,
  e.observed_topics,
  greatest(e.last_observed_at, a.last_action_at, o.last_outcome_at, op.last_opportunity_evidence_at, p.bijgewerkt_op) as last_relevant_at,
  round(least(1,greatest(0,
    0.10
    + case when p.relationship_status='klant' then 0.55 when p.relationship_status='in_gesprek' then 0.32 when p.relationship_status='aangeboden' then 0.10 else 0 end
    + least(0.18,coalesce(e.events_30d,0)*0.025)
    + least(0.20,coalesce(o.positive_outcomes,0)*0.06)
    + least(0.12,coalesce(op.max_opportunity_signal,0)*0.12)
    - least(0.16,coalesce(a.actions_30d,0)*0.025)
  ))::numeric,4) as relationship_warmth,
  round((case
    when coalesce(p.role,'') ~* '(ceo|chief executive|eigenaar|owner|founder|oprichter|directeur|managing director)' then 1.00
    when coalesce(p.role,'') ~* '(cfo|coo|cto|cio|cdo|chief|vp|vice president|head of|partner)' then 0.88
    when coalesce(p.role,'') ~* '(manager|lead|principal|director)' then 0.68
    else 0.42
  end)::numeric,4) as decision_influence,
  jsonb_build_object(
    'source','bg_connecties+powerhouse_runtime_events+sales_lineage',
    'aanleiding',p.aanleiding,
    'laatste_uitkomst',p.laatste_uitkomst,
    'observed_topics',coalesce(to_jsonb(e.observed_topics),'[]'::jsonb),
    'last_observed_at',e.last_observed_at,
    'last_action_at',a.last_action_at,
    'last_outcome_at',o.last_outcome_at,
    'open_opportunities',coalesce(op.open_opportunities,0)
  ) as person_context
from people p
left join event_stats e on e.person_key=p.person_key
left join action_stats a on a.person_key=p.person_key
left join outcome_stats o on o.person_key=p.person_key
left join opp_stats op on op.person_key=p.person_key;

create or replace view public.powerhouse_company_intelligence_v1
with (security_invoker = true)
as
with person_rollup as (
  select
    company_key_normalized as company_key,
    max(company_name) as company_name,
    count(*)::int as known_people,
    count(*) filter (where decision_influence >= 0.85)::int as likely_decision_makers,
    round(avg(relationship_warmth)::numeric,4) as avg_relationship_warmth,
    round(max(relationship_warmth)::numeric,4) as max_relationship_warmth,
    round(max(decision_influence)::numeric,4) as max_decision_influence,
    max(last_relevant_at) as last_relevant_at,
    coalesce(sum(realized_revenue_eur),0) as person_linked_revenue_eur
  from public.powerhouse_person_intelligence_v1
  where nullif(company_key_normalized,'') is not null
  group by company_key_normalized
), opportunity_rollup as (
  select
    lower(regexp_replace(trim(company_key),'\s+',' ','g')) as company_key,
    count(*) filter (where coalesce(status,'') not in ('closed','won','lost'))::int as open_opportunities,
    max(coalesce(probability,0)*coalesce(confidence,0)) as max_opportunity_signal,
    coalesce(sum(expected_revenue_value) filter (where coalesce(status,'') not in ('closed','won','lost')),0) as weighted_pipeline_eur,
    max(last_evidence_at) as last_opportunity_evidence_at
  from public.powerhouse_opportunities
  where nullif(trim(company_key),'') is not null
  group by lower(regexp_replace(trim(company_key),'\s+',' ','g'))
), signal_rollup as (
  select
    lower(regexp_replace(trim(entity_key),'\s+',' ','g')) as company_key,
    round(avg(least(1,greatest(0,coalesce(strength,0))) * (0.65 + 0.35*least(1,greatest(0,coalesce(novelty,0)))))::numeric,4) as external_signal_score,
    count(*) filter (where observed_at >= now()-interval '30 days')::int as predictive_signals_30d,
    max(observed_at) as last_signal_at,
    array_remove(array_agg(distinct topic_key),null) as signal_topics
  from public.powerhouse_predictive_signals
  where nullif(trim(entity_key),'') is not null
    and observed_at >= now()-interval '90 days'
  group by lower(regexp_replace(trim(entity_key),'\s+',' ','g'))
), outcome_rollup as (
  select
    lower(regexp_replace(trim(company_key),'\s+',' ','g')) as company_key,
    count(*)::int as outcomes_total,
    coalesce(sum(revenue_eur),0) as realized_revenue_eur,
    max(occurred_at) as last_outcome_at
  from public.powerhouse_sales_outcomes
  where nullif(trim(company_key),'') is not null
  group by lower(regexp_replace(trim(company_key),'\s+',' ','g'))
)
select
  p.company_key,
  p.company_name,
  p.known_people,
  p.likely_decision_makers,
  p.avg_relationship_warmth,
  p.max_relationship_warmth,
  p.max_decision_influence,
  coalesce(o.open_opportunities,0) as open_opportunities,
  coalesce(o.weighted_pipeline_eur,0) as weighted_pipeline_eur,
  coalesce(s.predictive_signals_30d,0) as predictive_signals_30d,
  coalesce(s.external_signal_score,0) as external_signal_score,
  coalesce(ou.outcomes_total,0) as outcomes_total,
  greatest(coalesce(ou.realized_revenue_eur,0),coalesce(p.person_linked_revenue_eur,0)) as realized_revenue_eur,
  s.signal_topics,
  greatest(p.last_relevant_at,o.last_opportunity_evidence_at,s.last_signal_at,ou.last_outcome_at) as last_relevant_at,
  round(least(1,greatest(0,
      0.30*coalesce(p.max_relationship_warmth,0)
    + 0.15*coalesce(p.avg_relationship_warmth,0)
    + 0.20*coalesce(p.max_decision_influence,0)
    + 0.20*coalesce(s.external_signal_score,0)
    + 0.15*coalesce(o.max_opportunity_signal,0)
  ))::numeric,4) as company_intent_score,
  jsonb_build_object(
    'known_people',p.known_people,
    'likely_decision_makers',p.likely_decision_makers,
    'relationship_warmth',p.max_relationship_warmth,
    'predictive_signals_30d',coalesce(s.predictive_signals_30d,0),
    'signal_topics',coalesce(to_jsonb(s.signal_topics),'[]'::jsonb),
    'open_opportunities',coalesce(o.open_opportunities,0),
    'weighted_pipeline_eur',coalesce(o.weighted_pipeline_eur,0),
    'buying_committee_depth',p.likely_decision_makers
  ) as company_context
from person_rollup p
left join opportunity_rollup o on o.company_key=p.company_key
left join signal_rollup s on s.company_key=p.company_key
left join outcome_rollup ou on ou.company_key=p.company_key;

create or replace view public.powerhouse_buying_window_v2
with (security_invoker = true)
as
with base as (
  select
    o.*,
    p.person_name,
    p.company_name as person_company_name,
    p.role,
    p.linkedin_url,
    p.email,
    p.available_channels,
    coalesce(p.relationship_warmth,0) as relationship_warmth,
    coalesce(p.decision_influence,0.35) as decision_influence,
    p.aanleiding,
    coalesce(c.company_intent_score,0) as company_intent_score,
    coalesce(c.known_people,0) as known_people,
    coalesce(c.likely_decision_makers,0) as likely_decision_makers,
    coalesce(c.external_signal_score,0) as company_external_signal_score,
    f.probability as forecast_probability,
    f.confidence as forecast_confidence,
    f.predicted_problem,
    f.predicted_buying_trigger,
    f.forecast_id,
    case when p.person_key is not null then 1 else 0 end as person_evidence,
    case when c.company_key is not null then 1 else 0 end as company_evidence,
    case when f.forecast_id is not null then 1 else 0 end as forecast_evidence
  from public.powerhouse_opportunities o
  left join public.powerhouse_person_intelligence_v1 p on p.person_key=o.person_key
  left join public.powerhouse_company_intelligence_v1 c
    on c.company_key=lower(regexp_replace(trim(coalesce(o.company_key,p.company_name,'')),'\s+',' ','g'))
  left join lateral (
    select f1.*
    from public.powerhouse_forecasts f1
    where f1.status in ('active','claimed')
      and (
        (o.company_key is not null and lower(f1.scope_key)=lower(o.company_key))
        or (o.topic_key is not null and f1.topic_key=o.topic_key)
        or (o.person_key is not null and lower(f1.scope_key)=lower(o.person_key))
      )
    order by (coalesce(f1.probability,0)*coalesce(f1.confidence,0)*greatest(coalesce(f1.first_mover_score,1),1)) desc, f1.updated_at desc
    limit 1
  ) f on true
  where coalesce(o.status,'') not in ('closed','won','lost')
), scored as (
  select
    b.*,
    least(1,greatest(0,
      0.22*coalesce(b.probability,0)
      + 0.15*coalesce(b.confidence,0)
      + 0.18*b.relationship_warmth
      + 0.12*b.decision_influence
      + 0.16*b.company_intent_score
      + 0.10*coalesce(b.forecast_probability,0)
      + 0.07*coalesce(b.forecast_confidence,0)
    )) as buying_window_score_raw,
    least(1,greatest(0,
      0.35*coalesce(b.confidence,0)
      + 0.20*b.person_evidence
      + 0.15*b.company_evidence
      + 0.15*b.forecast_evidence
      + 0.15*case when b.last_evidence_at >= now()-interval '30 days' then 1 else 0 end
    )) as buying_window_confidence_raw
  from base b
)
select
  s.*,
  round(s.buying_window_score_raw::numeric,4) as buying_window_score,
  round(s.buying_window_confidence_raw::numeric,4) as buying_window_confidence,
  round((s.buying_window_score_raw*s.buying_window_confidence_raw)::numeric,4) as commercial_progression_probability,
  round(greatest(0,coalesce(s.expected_value_eur,0)*s.buying_window_score_raw*s.buying_window_confidence_raw)::numeric,2) as expected_commercial_value_eur,
  round(((s.person_evidence+s.company_evidence+s.forecast_evidence
    + case when nullif(trim(coalesce(s.aanleiding,'')),'') is not null then 1 else 0 end
    + case when s.last_evidence_at >= now()-interval '30 days' then 1 else 0 end)::numeric/5.0),4) as evidence_density,
  coalesce(nullif(trim(s.predicted_problem),''),nullif(trim(s.aanleiding),''),nullif(trim(s.predicted_buying_trigger),''),'') as best_context,
  case
    when s.buying_window_score_raw >= 0.72 then 'hot'
    when s.buying_window_score_raw >= 0.55 then 'warm'
    when s.buying_window_score_raw >= 0.38 then 'developing'
    else 'research'
  end as buying_window_state
from scored s;

create or replace view public.powerhouse_sales_strategy_performance_v1
with (security_invoker = true)
as
select
  a.channel,
  a.action_type,
  coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','unknown') as message_strategy,
  coalesce(a.evidence#>>'{commercial_intelligence,recommended_asset}','none') as recommended_asset,
  count(distinct a.action_id)::int as executed_actions,
  count(distinct o.outcome_id)::int as observed_outcomes,
  count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|revenue)')::int as positive_outcomes,
  round((count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|revenue)')::numeric / nullif(count(distinct a.action_id),0)),4) as positive_outcome_rate,
  coalesce(sum(o.revenue_eur),0) as realized_revenue_eur,
  round((
    coalesce(count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|revenue)')::numeric / nullif(count(distinct a.action_id),0),0)
    + least(1,coalesce(sum(o.revenue_eur),0)/10000.0)
  )::numeric,4) as strategy_performance
from public.powerhouse_sales_actions a
left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
where a.executed_at >= now()-interval '180 days'
group by a.channel,a.action_type,coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','unknown'),coalesce(a.evidence#>>'{commercial_intelligence,recommended_asset}','none');

create or replace view public.powerhouse_commercial_next_best_action_v2
with (security_invoker = true)
as
with prepared as (
  select
    b.*,
    lower(coalesce(b.best_context,'')) as context_lower,
    case
      when b.buying_window_score >= 0.62 and 'linkedin'=any(coalesce(b.available_channels,array[]::text[])) then 'linkedin_dm'
      when b.buying_window_score >= 0.62 and 'email'=any(coalesce(b.available_channels,array[]::text[])) then 'email'
      when b.buying_window_score >= 0.38 and 'linkedin'=any(coalesce(b.available_channels,array[]::text[])) then 'linkedin_comment'
      else 'internal_research'
    end as recommended_channel,
    case
      when b.buying_window_score >= 0.72 then 'direct_problem_value'
      when b.buying_window_score >= 0.55 then 'permission_first_evidence'
      when b.buying_window_score >= 0.38 then 'insight_nurture'
      else 'research_enrichment'
    end as message_strategy,
    case
      when lower(coalesce(b.best_context,'')) ~ '(m&a|merger|acquisition|due diligence|overname)' then 'ma_due_diligence_onepager'
      when lower(coalesce(b.best_context,'')) ~ '(ai|artificial intelligence|kunstmatige intelligentie)' then 'ai_ready_organisation_onepager'
      when b.buying_window_score >= 0.76 then 'frisse_blik_scan'
      when b.buying_window_score >= 0.55 then 'frisse_blik_diagnostic'
      when b.buying_window_score >= 0.38 then 'relevant_case_or_onepager'
      else 'none'
    end as recommended_asset,
    case
      when b.buying_window_score >= 0.76 then 'propose_short_diagnostic_call'
      when b.buying_window_score >= 0.55 then 'ask_permission_to_share_evidence'
      when b.buying_window_score >= 0.38 then 'ask_one_contextual_question'
      else 'gather_more_evidence'
    end as recommended_cta
  from public.powerhouse_buying_window_v2 b
), with_asset as (
  select
    p.*,
    ca.title as evidence_asset_title,
    ca.artifact_type as evidence_asset_type,
    ca.channel as evidence_asset_channel,
    ca.run_date as evidence_asset_run_date
  from prepared p
  left join lateral (
    select a.title,a.artifact_type,a.channel,a.run_date
    from public.powerhouse_content_artifacts a
    where a.status in ('published','content_ready')
      and p.topic_key is not null
      and position(lower(p.topic_key) in lower(coalesce(a.title,'')||' '||coalesce(a.content_brief,'')||' '||coalesce(a.body,''))) > 0
    order by a.run_date desc, a.updated_at desc
    limit 1
  ) ca on true
)
select
  w.*,
  (w.evidence_asset_title is not null) as asset_ready,
  case when w.evidence_asset_title is not null then w.evidence_asset_title else null end as recommended_asset_reference,
  round((w.commercial_progression_probability * greatest(0.25,w.evidence_density))::numeric,4) as action_confidence,
  jsonb_build_object(
    'person',jsonb_build_object('person_key',w.person_key,'name',w.person_name,'role',w.role,'relationship_warmth',w.relationship_warmth,'decision_influence',w.decision_influence),
    'company',jsonb_build_object('company_key',w.company_key,'intent_score',w.company_intent_score,'known_people',w.known_people,'likely_decision_makers',w.likely_decision_makers),
    'prediction',jsonb_build_object('buying_window_score',w.buying_window_score,'confidence',w.buying_window_confidence,'commercial_progression',w.commercial_progression_probability,'forecast_id',w.forecast_id),
    'strategy',jsonb_build_object('recommended_channel',w.recommended_channel,'message_strategy',w.message_strategy,'recommended_asset',w.recommended_asset,'recommended_cta',w.recommended_cta),
    'evidence',jsonb_build_object('best_context',w.best_context,'evidence_density',w.evidence_density,'asset_ready',(w.evidence_asset_title is not null),'asset_reference',w.evidence_asset_title)
  ) as commercial_intelligence
from with_asset w;

create or replace function public.powerhouse_refresh_linkedin_sales_intelligence_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_opportunities int := 0;
  v_actions int := 0;
  v_forecasts int := 0;
  v_calibrations int := 0;
  v_strategy_samples int := 0;
  v_result jsonb;
begin
  update public.powerhouse_opportunities o
  set
    expected_revenue_value=greatest(coalesce(o.expected_revenue_value,0),coalesce(n.expected_commercial_value_eur,0)),
    score_components=coalesce(o.score_components,'{}'::jsonb) || jsonb_build_object(
      'commercial_intelligence',n.commercial_intelligence,
      'buying_window_v2',jsonb_build_object(
        'score',n.buying_window_score,
        'confidence',n.buying_window_confidence,
        'state',n.buying_window_state,
        'commercial_progression',n.commercial_progression_probability
      ),
      'next_best_action_v2',jsonb_build_object(
        'recommended_channel',n.recommended_channel,
        'message_strategy',n.message_strategy,
        'recommended_asset',n.recommended_asset,
        'recommended_cta',n.recommended_cta,
        'action_confidence',n.action_confidence
      )
    ),
    evidence=coalesce(o.evidence,'{}'::jsonb) || jsonb_build_object(
      'linkedin_sales_intelligence',jsonb_build_object('refreshed_at',v_now,'contract','powerhouse-linkedin-sales-intelligence-v1')
    ),
    updated_at=v_now
  from public.powerhouse_commercial_next_best_action_v2 n
  where o.opportunity_id=n.opportunity_id;
  get diagnostics v_opportunities=row_count;

  with ranked as (
    select n.*,row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc,n.buying_window_score desc,n.updated_at desc) as rn
    from public.powerhouse_commercial_next_best_action_v2 n
    where n.buying_window_score >= 0.30
      and n.buying_window_confidence >= 0.25
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,status,due_at,
    content_key,topic_key,campaign_key,opportunity_key,expected_value_eur,person_name,company_name,role
  )
  select
    'autonomy:'||p_run_date::text||':'||r.opportunity_key,
    r.subject_key,r.person_key,r.company_key,
    case when r.recommended_channel='linkedin_comment' then 'expert_comment'
         when r.recommended_channel in ('linkedin_dm','email') then 'commercial_outreach'
         else 'research_enrichment' end,
    r.recommended_channel,
    round(least(100,greatest(0,100*r.commercial_progression_probability))::numeric,2),
    'Contextual Powerhouse next-best-action selected from person, company, predictive, relationship and commercial outcome evidence.',
    coalesce(r.evidence,'{}'::jsonb) || jsonb_build_object(
      'commercial_intelligence',jsonb_build_object(
        'contract','powerhouse-linkedin-sales-intelligence-v1',
        'relationship_warmth',r.relationship_warmth,
        'decision_influence',r.decision_influence,
        'company_intent_score',r.company_intent_score,
        'buying_window_score',r.buying_window_score,
        'buying_window_confidence',r.buying_window_confidence,
        'commercial_progression',r.commercial_progression_probability,
        'recommended_channel',r.recommended_channel,
        'message_strategy',r.message_strategy,
        'recommended_asset',r.recommended_asset,
        'recommended_asset_reference',r.recommended_asset_reference,
        'asset_ready',r.asset_ready,
        'recommended_cta',r.recommended_cta,
        'best_context',r.best_context,
        'policy','Never attach or claim evidence that is not verified; permission-first when asset_ready=false or intent is not high.'
      )
    ),
    case
      when r.recommended_channel='linkedin_comment' then 'Reageer inhoudelijk op het concrete signaal: '||left(coalesce(r.best_context,'relevant business context'),240)||'. Voeg één scherpe observatie toe vanuit Bedrijfsgeheugen; geen pitch.'
      when r.recommended_channel in ('linkedin_dm','email') and nullif(trim(coalesce(r.best_context,'')),'') is not null then
        'Hoi '||coalesce(nullif(trim(r.person_name),''),'daar')||', ik zag het signaal rond '||left(r.best_context,180)||'. Dat raakt vaak aan hoe kennis, werkwijze en besluitvorming in de praktijk zijn georganiseerd. '||
        case when r.asset_ready then 'Ik heb daar een kort relevant bewijsstuk bij. Zal ik het delen?'
             else 'Als het relevant is, denk ik graag kort mee over waar de grootste frictie zit.' end
      else ''
    end,
    'suggested',v_now,
    r.content_key,r.topic_key,r.campaign_key,r.opportunity_key,r.expected_commercial_value_eur,
    r.person_name,coalesce(r.person_company_name,r.company_key),r.role
  from ranked r
  where r.rn <= 20
  on conflict (dedupe_key) do update
    set action_type=excluded.action_type,
        channel=excluded.channel,
        priority=excluded.priority,
        reason=excluded.reason,
        evidence=excluded.evidence,
        message_draft=excluded.message_draft,
        expected_value_eur=excluded.expected_value_eur,
        person_name=coalesce(excluded.person_name,public.powerhouse_sales_actions.person_name),
        company_name=coalesce(excluded.company_name,public.powerhouse_sales_actions.company_name),
        role=coalesce(excluded.role,public.powerhouse_sales_actions.role),
        updated_at=v_now;
  get diagnostics v_actions=row_count;

  with ranked as (
    select n.*,row_number() over(order by n.expected_commercial_value_eur desc,n.action_confidence desc) as rn
    from public.powerhouse_commercial_next_best_action_v2 n
    where n.buying_window_confidence >= 0.35
      and n.buying_window_score >= 0.35
  )
  insert into public.powerhouse_forecasts(
    forecast_key,horizon_start,horizon_end,expected_by,scope,scope_key,topic_key,
    predicted_event,predicted_problem,predicted_question,predicted_search_intent,predicted_buying_trigger,
    probability,confidence,expected_lead_days,first_mover_score,strategic_fit,revenue_potential,
    signal_acceleration,market_saturation,whitespace_score,prediction_mode,evidence,status,last_scored_at,updated_at
  )
  select
    'commercial:'||p_run_date::text||':'||r.opportunity_key,
    p_run_date,
    p_run_date + (case when r.buying_window_score>=0.72 then 7 when r.buying_window_score>=0.55 then 14 else 30 end),
    p_run_date + (case when r.buying_window_score>=0.72 then 7 when r.buying_window_score>=0.55 then 14 else 30 end),
    case when r.person_key is not null then 'person' else 'company' end,
    coalesce(r.person_key,r.company_key,r.opportunity_key),
    r.topic_key,
    'commercial_progression',
    nullif(r.best_context,''),
    'Will this relationship progress to a positive reply, meeting, qualified opportunity, proposal or observed revenue inside the horizon?',
    'commercial_intent',
    r.recommended_cta,
    r.commercial_progression_probability,
    r.buying_window_confidence,
    case when r.buying_window_score>=0.72 then 7 when r.buying_window_score>=0.55 then 14 else 30 end,
    round(100*r.buying_window_score,2),
    r.buying_window_score,
    least(1,coalesce(r.expected_commercial_value_eur,0)/25000.0),
    least(1,greatest(0,r.company_intent_score)),
    greatest(0,1-r.company_intent_score),
    least(1,greatest(0,r.evidence_density)),
    'commercial_sales',
    jsonb_build_object(
      'contract','powerhouse-linkedin-sales-intelligence-v1',
      'opportunity_key',r.opportunity_key,
      'person_key',r.person_key,
      'company_key',r.company_key,
      'buying_window_score',r.buying_window_score,
      'relationship_warmth',r.relationship_warmth,
      'company_intent_score',r.company_intent_score,
      'message_strategy',r.message_strategy,
      'recommended_channel',r.recommended_channel,
      'recommended_asset',r.recommended_asset,
      'recommended_cta',r.recommended_cta
    ),
    'active',v_now,v_now
  from ranked r
  where r.rn <= 20
  on conflict (forecast_key) do update
    set probability=excluded.probability,
        confidence=excluded.confidence,
        predicted_problem=excluded.predicted_problem,
        predicted_buying_trigger=excluded.predicted_buying_trigger,
        strategic_fit=excluded.strategic_fit,
        revenue_potential=excluded.revenue_potential,
        evidence=excluded.evidence,
        last_scored_at=v_now,
        updated_at=v_now;
  get diagnostics v_forecasts=row_count;

  with due as (
    select f.*,
      f.evidence->>'opportunity_key' as opportunity_key_from_evidence
    from public.powerhouse_forecasts f
    where f.prediction_mode='commercial_sales'
      and f.status in ('active','claimed')
      and f.expected_by < p_run_date
      and not exists (select 1 from public.powerhouse_forecast_calibration c where c.forecast_id=f.forecast_id)
  ), measured as (
    select
      d.*,
      exists(
        select 1 from public.powerhouse_sales_outcomes o
        where o.opportunity_key=d.opportunity_key_from_evidence
          and o.occurred_at>=d.created_at
          and o.occurred_at<(d.horizon_end+1)::timestamptz
          and lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|revenue)'
      ) as occurred,
      (select min(o.occurred_at) from public.powerhouse_sales_outcomes o
        where o.opportunity_key=d.opportunity_key_from_evidence
          and o.occurred_at>=d.created_at
          and o.occurred_at<(d.horizon_end+1)::timestamptz
          and lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|revenue)') as actual_event_at,
      coalesce((select sum(o.revenue_eur) from public.powerhouse_sales_outcomes o
        where o.opportunity_key=d.opportunity_key_from_evidence
          and o.occurred_at>=d.created_at
          and o.occurred_at<(d.horizon_end+1)::timestamptz),0) as revenue_eur_observed
    from due d
  )
  insert into public.powerhouse_forecast_calibration(
    forecast_id,measured_at,actual_event_occurred,actual_event_at,timing_error_days,probability_error,
    first_mover_advantage_score,content_lift,revenue_influence,evidence,outcome_value,brier_component,
    actual_lead_days,attribution_confidence,revenue_eur,content_ids
  )
  select
    m.forecast_id,v_now,m.occurred,m.actual_event_at,
    case when m.actual_event_at is null then null else round((extract(epoch from (m.actual_event_at-m.created_at))/86400.0 - m.expected_lead_days)::numeric,2) end,
    public.powerhouse_forecast_brier(m.probability,case when m.occurred then 1 else 0 end),
    case when m.occurred then m.first_mover_score else 0 end,
    null,m.revenue_eur_observed,
    jsonb_build_object('contract','powerhouse-linkedin-sales-intelligence-v1','opportunity_key',m.opportunity_key_from_evidence,'measurement','observed_sales_outcome'),
    case when m.occurred then 1 else 0 end,
    public.powerhouse_forecast_brier(m.probability,case when m.occurred then 1 else 0 end),
    case when m.actual_event_at is null then null else round((extract(epoch from (m.actual_event_at-m.created_at))/86400.0)::numeric,2) end,
    1.0,m.revenue_eur_observed,array[]::text[]
  from measured m;
  get diagnostics v_calibrations=row_count;

  update public.powerhouse_forecasts f
  set status=case when c.actual_event_occurred then 'materialized' else 'expired' end,
      materialized_at=case when c.actual_event_occurred then c.actual_event_at else null end,
      outcome=jsonb_build_object('actual_event_occurred',c.actual_event_occurred,'brier_component',c.brier_component,'revenue_eur',c.revenue_eur,'contract','powerhouse-linkedin-sales-intelligence-v1'),
      updated_at=v_now
  from public.powerhouse_forecast_calibration c
  where c.forecast_id=f.forecast_id
    and f.prediction_mode='commercial_sales'
    and f.status in ('active','claimed')
    and c.measured_at=v_now;

  select coalesce(sum(executed_actions),0)::int into v_strategy_samples
  from public.powerhouse_sales_strategy_performance_v1;

  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,content_key,topic_key,channel,sample_size,expires_at
  )
  select
    'linkedin-sales-strategy-performance-v1',
    'powerhouse',
    'linkedin_sales',
    'Commercial decisions improve when person/company intelligence, buying-window predictions, evidence selection and observed outcomes share one lineage.',
    jsonb_build_object(
      'contract','powerhouse-linkedin-sales-intelligence-v1',
      'measured_at',v_now,
      'strategy_performance',coalesce((select jsonb_agg(to_jsonb(s) order by s.strategy_performance desc) from public.powerhouse_sales_strategy_performance_v1 s),'[]'::jsonb),
      'person_intelligence_count',(select count(*) from public.powerhouse_person_intelligence_v1),
      'company_intelligence_count',(select count(*) from public.powerhouse_company_intelligence_v1),
      'buying_window_count',(select count(*) from public.powerhouse_buying_window_v2)
    ),
    jsonb_build_object('primary_objective','realized_revenue','secondary_objectives',jsonb_build_array('positive_reply','meeting','proposal','calibration_quality'),'anti_objective','outreach_volume_without_outcome'),
    least(0.95,greatest(0.25,0.25+least(v_strategy_samples,70)*0.01)),
    'active',null,null,null,greatest(1,v_strategy_samples),v_now+interval '30 days'
  on conflict (fingerprint) do update
    set evidence=excluded.evidence,effect=excluded.effect,confidence=excluded.confidence,status='active',sample_size=excluded.sample_size,expires_at=excluded.expires_at,updated_at=v_now;

  v_result=jsonb_build_object(
    'contract','powerhouse-linkedin-sales-intelligence-v1',
    'run_date',p_run_date,
    'healthy',true,
    'opportunities_enriched',v_opportunities,
    'daily_actions_upserted',v_actions,
    'commercial_forecasts_upserted',v_forecasts,
    'commercial_forecasts_calibrated',v_calibrations,
    'strategy_samples',v_strategy_samples,
    'person_intelligence_count',(select count(*) from public.powerhouse_person_intelligence_v1),
    'company_intelligence_count',(select count(*) from public.powerhouse_company_intelligence_v1),
    'buying_window_count',(select count(*) from public.powerhouse_buying_window_v2),
    'loop',jsonb_build_array('OBSERVE','UNDERSTAND_PERSON','UNDERSTAND_COMPANY','PREDICT','DECIDE','EXECUTE','READBACK','CALIBRATE','LEARN','ADAPT')
  );

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(v_now,'powerhouse-linkedin-sales-intelligence','closed-loop-sales-intelligence','ok','Person/company intelligence, buying-window prediction, next-best-action, evidence selection and commercial calibration refreshed.',v_result);

  return v_result;
exception when others then
  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(now(),'powerhouse-linkedin-sales-intelligence','closed-loop-sales-intelligence','fout','Commercial intelligence refresh failed closed: '||sqlerrm,jsonb_build_object('contract','powerhouse-linkedin-sales-intelligence-v1','sqlstate',sqlstate,'run_date',p_run_date));
  return jsonb_build_object('contract','powerhouse-linkedin-sales-intelligence-v1','healthy',false,'error',sqlerrm,'sqlstate',sqlstate,'run_date',p_run_date);
end
$$;

revoke all on public.powerhouse_person_intelligence_v1 from anon,authenticated;
revoke all on public.powerhouse_company_intelligence_v1 from anon,authenticated;
revoke all on public.powerhouse_buying_window_v2 from anon,authenticated;
revoke all on public.powerhouse_commercial_next_best_action_v2 from anon,authenticated;
revoke all on public.powerhouse_sales_strategy_performance_v1 from anon,authenticated;
grant select on public.powerhouse_person_intelligence_v1 to service_role;
grant select on public.powerhouse_company_intelligence_v1 to service_role;
grant select on public.powerhouse_buying_window_v2 to service_role;
grant select on public.powerhouse_commercial_next_best_action_v2 to service_role;
grant select on public.powerhouse_sales_strategy_performance_v1 to service_role;

revoke execute on function public.powerhouse_refresh_linkedin_sales_intelligence_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_linkedin_sales_intelligence_v1(date) to service_role;

-- Canonical scheduling: after predictive engine (06:08) and before content orchestrator (06:12).
do $$ begin
  perform cron.unschedule('powerhouse-linkedin-sales-intelligence-daily');
exception when others then null;
end $$;
select cron.schedule(
  'powerhouse-linkedin-sales-intelligence-daily',
  '10 6 * * *',
  $cron$select public.powerhouse_refresh_linkedin_sales_intelligence_v1((now() at time zone 'Europe/Amsterdam')::date);$cron$
);

-- Canonical failure/prevention memory; reuse the existing Brain failure registry.
insert into public.brain_failure_registry(
  fingerprint,failure_class,symptom,root_cause,prevention,owner,status,evidence,created_at,updated_at
)
values(
  'linkedin-sales-intelligence-fragmentation-v1',
  'architecture_gap',
  'LinkedIn/feed/DM signals, person/company context and commercial outcomes existed but were not projected into one explicit sales decision and calibration surface.',
  'The canonical runtime had the data and revenue flywheel, but person/company state, buying-window prediction, contextual evidence selection and strategy performance were not joined as one reusable decision surface.',
  'Reuse the canonical Powerhouse tables; derive person/company intelligence, predict before action, upsert bounded next-best-actions on the existing autonomy dedupe key, calibrate against observed outcomes, and write strategy performance into powerhouse_sales_learnings.',
  'Bedrijfsgeheugen Powerhouse',
  'resolved',
  jsonb_build_object('contract','powerhouse-linkedin-sales-intelligence-v1','no_parallel_store',true,'max_daily_actions',20,'make_dependency',false),
  now(),now()
)
on conflict (fingerprint) do update
set prevention=excluded.prevention,status='resolved',evidence=excluded.evidence,updated_at=now();
