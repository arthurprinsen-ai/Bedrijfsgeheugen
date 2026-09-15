create or replace view public.powerhouse_contact_pressure_v1 as
with outbound as (
  select person_key,
    max(executed_at) as last_outbound_at,
    count(*) filter (where executed_at >= now()-interval '7 days')::int as outbound_7d,
    count(*) filter (where executed_at >= now()-interval '30 days')::int as outbound_30d,
    count(*) filter (where executed_at >= now()-interval '90 days')::int as outbound_90d
  from public.powerhouse_sales_actions
  where person_key is not null and executed_at is not null
  group by person_key
), inbound as (
  select person_key,
    max(occurred_at) as last_inbound_at,
    count(*) filter (where occurred_at >= now()-interval '30 days')::int as inbound_30d
  from public.powerhouse_runtime_events
  where person_key is not null and lower(event_type) in ('dm_inbound','linkedin_post_replied')
  group by person_key
), noresp as (
  select person_key,
    count(*) filter (where occurred_at >= now()-interval '30 days' and lower(outcome_type)='no_response')::int as no_response_30d,
    count(*) filter (where occurred_at >= now()-interval '90 days' and lower(outcome_type)='no_response')::int as no_response_90d,
    max(occurred_at) filter (where lower(outcome_type)='no_response') as last_no_response_at
  from public.powerhouse_sales_outcomes
  where person_key is not null
  group by person_key
), base as (
  select p.person_key,p.person_name,p.company_name,p.role,p.available_channels,p.relationship_warmth,p.decision_influence,
    coalesce(o.outbound_7d,0) outbound_7d,coalesce(o.outbound_30d,0) outbound_30d,coalesce(o.outbound_90d,0) outbound_90d,
    o.last_outbound_at,i.last_inbound_at,coalesce(i.inbound_30d,0) inbound_30d,
    coalesce(n.no_response_30d,0) no_response_30d,coalesce(n.no_response_90d,0) no_response_90d,n.last_no_response_at
  from public.powerhouse_person_intelligence_v1 p
  left join outbound o on o.person_key=p.person_key
  left join inbound i on i.person_key=p.person_key
  left join noresp n on n.person_key=p.person_key
), scored as (
  select b.*,
    least(1::numeric,greatest(0::numeric,
      0.14*least(4,outbound_7d)::numeric + 0.05*least(8,outbound_30d)::numeric + 0.22*least(3,no_response_30d)::numeric
      - 0.16*least(3,inbound_30d)::numeric)) as pressure_score,
    case
      when no_response_30d >= 2 and last_outbound_at is not null then last_outbound_at + interval '14 days'
      when outbound_7d >= 3 and last_outbound_at is not null then last_outbound_at + interval '7 days'
      when outbound_7d >= 2 and last_outbound_at is not null then last_outbound_at + interval '3 days'
      else null end as cooldown_until
  from base b
)
select s.*,
  case when cooldown_until > now() then 'cooldown'
       when pressure_score >= .70 then 'high'
       when pressure_score >= .35 then 'medium'
       else 'low' end as pressure_state,
  (last_outbound_at is not null and (last_inbound_at is null or last_inbound_at < last_outbound_at)) as pending_response,
  case when cooldown_until > now() then cooldown_until
       when last_outbound_at is not null and (last_inbound_at is null or last_inbound_at < last_outbound_at) then last_outbound_at + interval '5 days'
       else null end as next_follow_up_at
from scored s;

create or replace view public.powerhouse_account_strategy_v1 as
with committee as (
  select company_key,
    count(*)::int as committee_people,
    count(*) filter (where inferred_buying_role in ('economic_buyer','economic_buyer_or_blocker'))::int as economic_buyers,
    count(*) filter (where inferred_buying_role='technical_evaluator')::int as technical_evaluators,
    count(*) filter (where inferred_buying_role='champion_or_influencer')::int as champions,
    max(committee_priority) as committee_strength,
    max(person_key) filter (where committee_priority=(select max(b2.committee_priority) from public.powerhouse_buying_committee_v1 b2 where b2.company_key=b.company_key)) as best_relationship_person_key
  from public.powerhouse_buying_committee_v1 b group by company_key
), windows as (
  select lower(regexp_replace(trim(coalesce(company_key,person_company_name,'')),'\s+',' ','g')) company_key,
    count(*) filter (where buying_window_state='hot')::int hot_windows,
    count(*) filter (where buying_window_state='warm')::int warm_windows,
    max(buying_window_score) max_buying_window_score,
    max(buying_window_confidence) max_buying_window_confidence,
    sum(expected_commercial_value_eur) expected_account_value_eur,
    (array_agg(best_context order by expected_commercial_value_eur desc nulls last))[1] best_context
  from public.powerhouse_buying_window_v2
  where nullif(trim(coalesce(company_key,person_company_name,'')),'') is not null
  group by 1
)
select c.company_key,c.company_name,c.known_people,c.likely_decision_makers,c.company_intent_score,c.external_signal_score,c.signal_topics,c.last_relevant_at,
  coalesce(k.committee_people,0) committee_people,coalesce(k.economic_buyers,0) economic_buyers,coalesce(k.technical_evaluators,0) technical_evaluators,coalesce(k.champions,0) champions,
  coalesce(k.committee_strength,0) committee_strength,k.best_relationship_person_key,
  coalesce(w.hot_windows,0) hot_windows,coalesce(w.warm_windows,0) warm_windows,coalesce(w.max_buying_window_score,0) max_buying_window_score,
  coalesce(w.max_buying_window_confidence,0) max_buying_window_confidence,coalesce(w.expected_account_value_eur,0) expected_account_value_eur,w.best_context,
  case when nullif(trim(w.best_context),'') is not null then concat('Actuele accountthese op basis van geobserveerde context: ',w.best_context)
       when coalesce(c.predictive_signals_30d,0)>0 then 'Account heeft recente voorspellende signalen; eerst context verifiëren.'
       else 'Onvoldoende bewijs voor een specifieke accountthese; aanvullende research nodig.' end as account_thesis,
  case when coalesce(w.max_buying_window_score,0)>=.65 and coalesce(k.economic_buyers,0)>0 then 'engage_economic_buyer'
       when coalesce(w.max_buying_window_score,0)>=.55 and k.best_relationship_person_key is not null then 'warm_intro_or_champion'
       when coalesce(k.economic_buyers,0)=0 then 'map_economic_buyer'
       when coalesce(c.company_intent_score,0)<.30 then 'research'
       else 'nurture' end as recommended_account_move,
  jsonb_build_object('economic_buyers',coalesce(k.economic_buyers,0),'technical_evaluators',coalesce(k.technical_evaluators,0),'champions',coalesce(k.champions,0),'committee_strength',coalesce(k.committee_strength,0)) as buying_committee_summary
from public.powerhouse_company_intelligence_v1 c
left join committee k on k.company_key=c.company_key
left join windows w on w.company_key=c.company_key;

create or replace view public.powerhouse_research_queue_v1 as
select b.opportunity_key,b.person_key,b.company_key,b.topic_key,b.person_name,b.role,b.expected_commercial_value_eur,b.buying_window_score,b.buying_window_confidence,b.evidence_density,
  f.freshness_state,f.contradiction_detected,
  case when b.person_evidence=0 then 'identity_or_person_context_missing'
       when b.company_evidence=0 then 'company_context_missing'
       when b.forecast_evidence=0 then 'forecast_missing'
       when f.contradiction_detected then 'contradictory_evidence'
       when f.freshness_state='stale' then 'stale_evidence'
       when b.buying_window_confidence<.55 then 'low_confidence'
       when b.evidence_density<.60 then 'evidence_density_low'
       else 'no_research_needed' end as research_reason,
  array_remove(array[
    case when b.person_evidence=0 then 'person_evidence' end,
    case when b.company_evidence=0 then 'company_evidence' end,
    case when b.forecast_evidence=0 then 'forecast_evidence' end,
    case when f.contradiction_detected then 'contradiction_resolution' end,
    case when f.freshness_state='stale' then 'fresh_evidence' end
  ],null)::text[] as missing_evidence,
  least(100::numeric,greatest(0::numeric,40 + coalesce(b.expected_commercial_value_eur,0)/1000 + (1-coalesce(b.buying_window_confidence,0))*30)) as research_priority
from public.powerhouse_buying_window_v2 b
left join public.powerhouse_freshness_contradiction_v1 f on f.opportunity_key=b.opportunity_key
where b.person_evidence=0 or b.company_evidence=0 or b.forecast_evidence=0 or coalesce(f.contradiction_detected,false) or coalesce(f.freshness_state,'stale')='stale' or b.buying_window_confidence<.55 or b.evidence_density<.60;

create or replace view public.powerhouse_commercial_next_best_action_v3 as
with funnel as (
  select coalesce(a.channel,'unknown') channel,
    count(distinct a.action_id)::numeric actions,
    count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|order|revenue)')::numeric positive,
    count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(meeting|appointment)')::numeric meetings,
    count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(proposal|offerte)')::numeric proposals,
    count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(won|order|revenue)')::numeric wins
  from public.powerhouse_sales_actions a left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
  where a.created_at >= now()-interval '180 days'
  group by coalesce(a.channel,'unknown')
), base as (
  select n.*,cp.pressure_state,cp.cooldown_until,cp.next_follow_up_at,cp.pending_response,
    ac.account_thesis,ac.recommended_account_move,ac.committee_strength,ac.economic_buyers,
    rq.research_reason,rq.missing_evidence,rq.research_priority,
    coalesce(fn.actions,0) prediction_sample_size,
    least(1::numeric,greatest(0::numeric,(coalesce(fn.positive,0)+2)/(coalesce(fn.actions,0)+8))) empirical_reply_rate,
    least(1::numeric,greatest(0::numeric,(coalesce(fn.meetings,0)+1)/(coalesce(fn.actions,0)+12))) empirical_meeting_rate,
    least(1::numeric,greatest(0::numeric,(coalesce(fn.proposals,0)+1)/(coalesce(fn.actions,0)+16))) empirical_proposal_rate,
    least(1::numeric,greatest(0::numeric,(coalesce(fn.wins,0)+1)/(coalesce(fn.actions,0)+24))) empirical_win_rate
  from public.powerhouse_commercial_next_best_action_v2 n
  left join public.powerhouse_contact_pressure_v1 cp on cp.person_key=n.person_key
  left join public.powerhouse_account_strategy_v1 ac on ac.company_key=lower(regexp_replace(trim(coalesce(n.company_key,n.person_company_name,'')),'\s+',' ','g'))
  left join public.powerhouse_research_queue_v1 rq on rq.opportunity_key=n.opportunity_key
  left join funnel fn on lower(fn.channel)=lower(n.recommended_channel)
)
select b.*,
  case when pressure_state='cooldown' then 'wait'
       when research_reason is not null then 'research'
       when recommended_account_move='warm_intro_or_champion' and relationship_warmth>=.55 then 'warm_intro_request'
       when recommended_channel='linkedin_dm' then 'linkedin_dm'
       when recommended_channel='email' then 'email'
       when recommended_channel='linkedin_comment' then 'linkedin_comment'
       else 'research' end as recommended_action,
  case when pressure_state='cooldown' then cooldown_until
       when research_reason is not null then now()
       else next_follow_up_at end as next_follow_up_at_v3,
  case when asset_ready then recommended_asset_reference else null end as verified_asset_reference,
  case when asset_ready then recommended_asset else 'none' end as effective_recommended_asset,
  least(.98::numeric,greatest(.01::numeric,empirical_reply_rate*(.60+.40*commercial_progression_probability))) as prediction_reply,
  least(.98::numeric,greatest(.005::numeric,least(empirical_reply_rate,empirical_meeting_rate*(.65+.35*commercial_progression_probability)))) as prediction_meeting,
  least(.95::numeric,greatest(.002::numeric,least(empirical_meeting_rate,empirical_proposal_rate*(.65+.35*commercial_progression_probability)))) as prediction_proposal,
  least(.90::numeric,greatest(.001::numeric,least(empirical_proposal_rate,empirical_win_rate*(.65+.35*commercial_progression_probability)))) as prediction_win,
  'nba-v3-empirical-smoothed'::text as prediction_model_version,
  least(1::numeric,greatest(.15::numeric,coalesce(b.buying_window_confidence,0)*least(1::numeric,(prediction_sample_size+5)/25))) as prediction_confidence
from base b;

create or replace view public.powerhouse_revenue_attribution_v1 as
select o.outcome_id,o.action_id,o.opportunity_key,o.person_key,o.company_key,o.content_key,o.topic_key,o.campaign_key,o.channel,o.outcome_type,o.revenue_eur,o.occurred_at,
  a.action_type,a.message_draft,a.evidence as action_evidence,
  case when a.action_id is not null then 'observed' else 'correlated' end as attribution_type,
  case when a.action_id is not null then 1.0::numeric else .55::numeric end as attribution_confidence,
  case when a.action_id is not null then 'Exact action_id lineage.' else 'No exact action_id; shared commercial context only.' end as attribution_reason
from public.powerhouse_sales_outcomes o
left join public.powerhouse_sales_actions a on a.action_id=o.action_id
union all
select o.outcome_id,null::uuid,o.opportunity_key,o.person_key,o.company_key,o.content_key,o.topic_key,o.campaign_key,o.channel,o.outcome_type,o.revenue_eur,o.occurred_at,
  a.action_type,a.message_draft,a.evidence,
  'correlated'::text,.45::numeric,'Shared opportunity/content lineage without exact action_id.'::text
from public.powerhouse_sales_outcomes o
join lateral (
  select a1.* from public.powerhouse_sales_actions a1
  where o.action_id is null and ((o.opportunity_key is not null and a1.opportunity_key=o.opportunity_key) or (o.content_key is not null and a1.content_key=o.content_key))
  order by a1.created_at desc limit 1
) a on true;

create or replace view public.powerhouse_model_health_v1 as
with joined as (
  select f.forecast_id,f.predicted_event,f.scope,f.scope_key,f.probability,f.confidence,f.created_at,
    c.measured_at,c.actual_event_occurred,c.brier_component,
    case when c.actual_event_occurred then 1 else 0 end::numeric actual
  from public.powerhouse_forecasts f join public.powerhouse_forecast_calibration c on c.forecast_id=f.forecast_id
), grouped as (
  select predicted_event,scope,
    count(*)::int sample_size,
    avg(coalesce(brier_component,power(probability-actual,2))) brier_score,
    abs(avg(probability)-avg(actual)) calibration_error,
    count(*) filter (where probability>=.5 and actual=0)::int false_positives,
    count(*) filter (where probability<.5 and actual=1)::int false_negatives,
    avg(probability) filter (where measured_at>=now()-interval '30 days') recent_probability,
    avg(probability) filter (where measured_at<now()-interval '30 days' and measured_at>=now()-interval '60 days') prior_probability,
    max(measured_at) last_measured_at
  from joined group by predicted_event,scope
)
select *,abs(coalesce(recent_probability,0)-coalesce(prior_probability,recent_probability,0)) as probability_drift,
  case when sample_size<10 then 'insufficient_evidence'
       when brier_score>.25 or calibration_error>.20 or abs(coalesce(recent_probability,0)-coalesce(prior_probability,recent_probability,0))>.20 then 'watch'
       else 'healthy' end as model_health
from grouped;

create or replace view public.powerhouse_experiment_learning_v2 as
with action_rollup as (
  select campaign_key,
    count(distinct action_id)::int executed_actions,
    count(distinct o.outcome_id)::int observed_outcomes,
    count(distinct o.outcome_id) filter (where lower(o.outcome_type) ~ '(meeting|appointment|proposal|offerte|won|order|revenue)')::int commercial_outcomes,
    coalesce(sum(o.revenue_eur),0) realized_revenue_eur
  from public.powerhouse_sales_actions a left join public.powerhouse_sales_outcomes o using(action_id)
  where campaign_key is not null
  group by campaign_key
)
select e.*,coalesce(a.executed_actions,0) executed_actions,coalesce(a.observed_outcomes,0) observed_outcomes,coalesce(a.commercial_outcomes,0) commercial_outcomes,coalesce(a.realized_revenue_eur,0) realized_revenue_eur,
  case when coalesce(a.executed_actions,0) < greatest(coalesce(e.min_steekproef,10),10) then 'insufficient_evidence'
       when coalesce(a.commercial_outcomes,0)=0 then 'not_proven'
       when coalesce(a.commercial_outcomes,0)>=2 and coalesce(a.executed_actions,0)>=greatest(coalesce(e.min_steekproef,10),10) then 'proven'
       else 'testing' end as promotion_status
from public.social_experiments e left join action_rollup a on a.campaign_key=e.experiment_id;

create or replace view public.powerhouse_revenue_command_center_v2 as
select row_number() over(order by (coalesce(n.expected_commercial_value_eur,0)*coalesce(n.action_confidence,.25)) desc,n.research_priority desc nulls last) as revenue_rank,
  n.opportunity_key,n.person_key,n.company_key,n.person_name,n.role,n.best_context as why_now,n.account_thesis,n.recommended_account_move,
  n.recommended_action,n.recommended_channel,n.message_strategy,n.effective_recommended_asset,n.verified_asset_reference,n.recommended_cta,n.pressure_state,n.cooldown_until,n.next_follow_up_at_v3 as next_follow_up_at,
  n.prediction_reply,n.prediction_meeting,n.prediction_proposal,n.prediction_win,n.prediction_confidence,n.prediction_model_version,n.prediction_sample_size,
  n.expected_commercial_value_eur,n.action_confidence,n.buying_window_score,n.buying_window_confidence,n.evidence_density,n.research_reason,n.missing_evidence,
  (n.person_key is null or nullif(trim(n.person_key),'') is null) as identity_conflict,
  case when n.recommended_action in ('linkedin_dm','email','warm_intro_request') and n.forecast_id is null then true else false end as structural_lineage_gap,
  jsonb_build_object('source','powerhouse-revenue-intelligence-loop-v1','forecast_id',n.forecast_id,'asset_ready',n.asset_ready,'pressure_state',n.pressure_state,'research_reason',n.research_reason) as command_evidence
from public.powerhouse_commercial_next_best_action_v3 n;
