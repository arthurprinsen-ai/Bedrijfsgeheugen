-- Powerhouse Commercial Learning Hardening v1
-- EXISTING-STATE-FIRST: all outputs are derived from canonical Powerhouse state.

create or replace view public.powerhouse_counterfactual_candidate_v1 as
with base as (
  select
    o.opportunity_key,
    o.person_key,
    o.company_key,
    o.topic_key,
    o.stage,
    o.status,
    o.expected_value_eur,
    o.probability,
    o.confidence,
    o.last_evidence_at,
    mod(abs(hashtextextended(o.opportunity_key, 0)), 10) as stable_bucket,
    exists (
      select 1 from public.powerhouse_sales_actions a
      where a.opportunity_key = o.opportunity_key
        and a.status = 'executed'
        and a.executed_at >= now() - interval '30 days'
    ) as recently_treated
  from public.powerhouse_opportunities o
  where o.status in ('open','active','suggested','qualified')
)
select
  *,
  (stable_bucket = 0 and not recently_treated) as prospective_holdout_candidate,
  case when stable_bucket = 0 and not recently_treated then 'candidate_holdout' else 'candidate_treatment' end as experiment_arm_candidate,
  'not_proven'::text as causal_status,
  jsonb_build_object(
    'assignment','stable_hash_candidate_only',
    'window','30 days',
    'truth_boundary','prospective candidate is not causal proof; persist experiment assignment before treatment for valid inference'
  ) as evidence
from base;
alter view public.powerhouse_counterfactual_candidate_v1 set (security_invoker = true);

create or replace view public.powerhouse_unit_economics_v1 as
with action_cost as (
  select
    a.action_id,
    a.channel,
    a.action_type,
    a.opportunity_key,
    a.executed_at,
    case when coalesce(a.evidence->>'cost_eur','') ~ '^-?[0-9]+(\.[0-9]+)?$' then (a.evidence->>'cost_eur')::numeric end as observed_cost_eur,
    case when coalesce(a.evidence->>'human_minutes','') ~ '^[0-9]+(\.[0-9]+)?$' then (a.evidence->>'human_minutes')::numeric end as human_minutes
  from public.powerhouse_sales_actions a
  where a.status = 'executed'
), outcome as (
  select action_id, count(*) as outcome_count, coalesce(sum(revenue_eur),0)::numeric as realized_revenue_eur
  from public.powerhouse_sales_outcomes
  group by action_id
)
select
  ac.channel,
  ac.action_type,
  count(*) as executed_actions,
  count(*) filter (where o.outcome_count > 0) as actions_with_outcome,
  coalesce(sum(ac.observed_cost_eur),0)::numeric as observed_cost_eur,
  coalesce(sum(ac.human_minutes),0)::numeric as observed_human_minutes,
  coalesce(sum(o.realized_revenue_eur),0)::numeric as realized_revenue_eur,
  case when sum(ac.observed_cost_eur) > 0 then round(sum(o.realized_revenue_eur) / sum(ac.observed_cost_eur),4) end as revenue_per_cost_eur,
  case when count(ac.observed_cost_eur) = 0 then 'insufficient_evidence' else 'observed' end as cost_data_state,
  max(ac.executed_at) as last_action_at
from action_cost ac
left join outcome o using (action_id)
group by ac.channel, ac.action_type;
alter view public.powerhouse_unit_economics_v1 set (security_invoker = true);

create or replace view public.powerhouse_customer_expansion_v1 as
with customer_value as (
  select company_key,
         coalesce(sum(revenue_eur),0)::numeric as realized_revenue_eur,
         count(*) filter (where revenue_eur > 0) as revenue_outcomes,
         max(occurred_at) as last_revenue_at
  from public.powerhouse_sales_outcomes
  where company_key is not null
  group by company_key
), open_pipeline as (
  select company_key,
         count(*) as open_opportunities,
         coalesce(sum(expected_value_eur),0)::numeric as open_expected_value_eur,
         max(confidence) as max_opportunity_confidence
  from public.powerhouse_opportunities
  where company_key is not null and status in ('open','active','suggested','qualified')
  group by company_key
)
select
  c.company_key,
  c.realized_revenue_eur,
  c.revenue_outcomes,
  c.last_revenue_at,
  coalesce(p.open_opportunities,0) as open_opportunities,
  coalesce(p.open_expected_value_eur,0)::numeric as expansion_pipeline_eur,
  p.max_opportunity_confidence,
  case
    when c.realized_revenue_eur > 0 and coalesce(p.open_opportunities,0) > 0 then 'expansion_candidate'
    when c.realized_revenue_eur > 0 then 'customer_no_open_expansion'
    else 'not_customer'
  end as expansion_state,
  jsonb_build_object('truth','customer status is based only on observed positive revenue outcomes') as evidence
from customer_value c
left join open_pipeline p using (company_key)
where c.realized_revenue_eur > 0;
alter view public.powerhouse_customer_expansion_v1 set (security_invoker = true);

create or replace view public.powerhouse_lost_deal_intelligence_v1 as
select
  coalesce(nullif(lower(trim(o.evidence->>'reason')),''),'unknown') as loss_reason,
  coalesce(o.channel,'unknown') as channel,
  count(*) as observed_losses,
  count(distinct o.company_key) filter (where o.company_key is not null) as companies,
  max(o.occurred_at) as last_observed_at,
  jsonb_agg(jsonb_build_object('outcome_id',o.outcome_id,'outcome_type',o.outcome_type,'company_key',o.company_key,'opportunity_key',o.opportunity_key,'observed_at',o.occurred_at) order by o.occurred_at desc) as evidence
from public.powerhouse_sales_outcomes o
where lower(o.outcome_type) in ('lost','rejected','declined','no_fit','not_interested')
group by coalesce(nullif(lower(trim(o.evidence->>'reason')),''),'unknown'), coalesce(o.channel,'unknown');
alter view public.powerhouse_lost_deal_intelligence_v1 set (security_invoker = true);

create or replace view public.powerhouse_competitor_intelligence_v1 as
with competitor_mentions as (
  select
    nullif(lower(trim(coalesce(e.evidence->>'competitor', e.context->>'competitor'))),'') as competitor_key,
    e.company_key,
    e.opportunity_key,
    e.occurred_at,
    e.event_type,
    e.source
  from public.powerhouse_runtime_events e
  where nullif(trim(coalesce(e.evidence->>'competitor', e.context->>'competitor')),'') is not null
  union all
  select
    nullif(lower(trim(o.evidence->>'competitor')),'') as competitor_key,
    o.company_key,
    o.opportunity_key,
    o.occurred_at,
    o.outcome_type as event_type,
    'sales_outcome'::text as source
  from public.powerhouse_sales_outcomes o
  where nullif(trim(o.evidence->>'competitor'),'') is not null
)
select competitor_key,
       count(*) as observed_mentions,
       count(distinct company_key) filter (where company_key is not null) as companies,
       max(occurred_at) as last_observed_at,
       jsonb_agg(jsonb_build_object('company_key',company_key,'opportunity_key',opportunity_key,'event_type',event_type,'source',source,'observed_at',occurred_at) order by occurred_at desc) as evidence
from competitor_mentions
where competitor_key is not null
group by competitor_key;
alter view public.powerhouse_competitor_intelligence_v1 set (security_invoker = true);

create or replace view public.powerhouse_provider_health_v1 as
with recent as (
  select source,
         count(*) filter (where occurred_at >= now()-interval '24 hours') as events_24h,
         count(*) filter (where occurred_at >= now()-interval '24 hours' and state='error') as errors_24h,
         max(occurred_at) as last_event_at,
         max(occurred_at) filter (where state='error') as last_error_at
  from public.powerhouse_runtime_events
  where source is not null
  group by source
)
select
  r.source as provider_key,
  r.events_24h,
  r.errors_24h,
  r.last_event_at,
  r.last_error_at,
  sf.freshness_status,
  sf.health_checked_at,
  case
    when r.errors_24h > 0 then 'degraded'
    when sf.freshness_status in ('stale','missing') then 'degraded'
    when r.last_event_at < now()-interval '48 hours' then 'unknown'
    else 'healthy'
  end as provider_state,
  jsonb_build_object('runtime_events_24h',r.events_24h,'runtime_errors_24h',r.errors_24h,'freshness',sf.freshness_status) as evidence
from recent r
left join public.powerhouse_source_freshness_v1 sf on lower(sf.source_key)=lower(r.source);
alter view public.powerhouse_provider_health_v1 set (security_invoker = true);

create or replace view public.powerhouse_human_feedback_learning_v1 as
select
  a.action_id,
  a.opportunity_key,
  a.person_key,
  a.company_key,
  a.action_type,
  a.channel,
  a.status,
  a.reason,
  a.updated_at as observed_at,
  case
    when nullif(trim(a.reason),'') is not null then 'explicit_rejection'
    else 'implicit_skip'
  end as human_feedback_state,
  jsonb_build_object('reason',a.reason,'status',a.status,'evidence',coalesce(a.evidence,'{}'::jsonb)) as evidence
from public.powerhouse_sales_actions a
where a.status in ('skipped','cancelled');
alter view public.powerhouse_human_feedback_learning_v1 set (security_invoker = true);

create or replace view public.powerhouse_revenue_truth_v1 as
with outcomes as (
  select opportunity_key,
         coalesce(sum(revenue_eur),0)::numeric as realized_revenue_eur,
         coalesce(sum(revenue_eur) filter (where action_id is not null or content_key is not null or campaign_key is not null),0)::numeric as attributed_revenue_eur,
         count(*) as observed_outcomes,
         max(occurred_at) as last_outcome_at
  from public.powerhouse_sales_outcomes
  where opportunity_key is not null
  group by opportunity_key
), forecasts as (
  select scope_key as opportunity_key,
         max(revenue_potential)::numeric as forecast_revenue_eur,
         max(probability) as forecast_probability,
         max(confidence) as forecast_confidence,
         max(created_at) as last_forecast_at
  from public.powerhouse_forecasts
  where scope='opportunity'
  group by scope_key
)
select
  o.opportunity_key,
  o.company_key,
  o.person_key,
  coalesce(f.forecast_revenue_eur,o.expected_revenue_value,o.expected_value_eur,0)::numeric as forecast_revenue_eur,
  coalesce(x.attributed_revenue_eur,0)::numeric as attributed_revenue_eur,
  coalesce(x.realized_revenue_eur,0)::numeric as realized_revenue_eur,
  f.forecast_probability,
  f.forecast_confidence,
  coalesce(x.observed_outcomes,0) as observed_outcomes,
  x.last_outcome_at,
  case when coalesce(x.realized_revenue_eur,0) <> 0 then 'observed_realized' when coalesce(x.observed_outcomes,0)>0 then 'observed_zero_revenue' else 'forecast_only' end as revenue_truth_state,
  jsonb_build_object('rule','forecast != attributed != realized; realized comes only from sales outcomes') as evidence
from public.powerhouse_opportunities o
left join outcomes x using (opportunity_key)
left join forecasts f using (opportunity_key);
alter view public.powerhouse_revenue_truth_v1 set (security_invoker = true);

create or replace view public.powerhouse_decision_explainability_v1 as
select
  c.revenue_rank,
  c.opportunity_key,
  c.person_key,
  c.company_key,
  c.recommended_action,
  c.recommended_channel,
  c.why_now,
  c.account_thesis,
  c.recommended_account_move,
  c.prediction_reply,
  c.prediction_meeting,
  c.prediction_proposal,
  c.prediction_win,
  c.prediction_confidence,
  c.expected_commercial_value_eur,
  c.buying_window_score,
  c.buying_window_confidence,
  c.evidence_density,
  c.research_reason,
  c.missing_evidence,
  c.identity_conflict,
  c.structural_lineage_gap,
  case
    when c.identity_conflict or c.structural_lineage_gap then 'blocked'
    when c.research_reason is not null then 'research_required'
    when c.prediction_confidence < 0.35 then 'low_confidence'
    else 'explainable'
  end as explanation_state,
  jsonb_build_object(
    'why_now',c.why_now,
    'account_thesis',c.account_thesis,
    'prediction_model_version',c.prediction_model_version,
    'prediction_sample_size',c.prediction_sample_size,
    'evidence_density',c.evidence_density,
    'command_evidence',c.command_evidence
  ) as explanation_evidence,
  c.refreshed_at
from public.powerhouse_revenue_command_center_snapshot_v1 c;
alter view public.powerhouse_decision_explainability_v1 set (security_invoker = true);

create or replace view public.powerhouse_contact_permission_guard_v1 as
with optout as (
  select person_key,
         max(occurred_at) as optout_at,
         max(event_type) as optout_event
  from public.powerhouse_runtime_events
  where person_key is not null
    and lower(event_type) in ('optout','opt_out','unsubscribe','do_not_contact','contact_blocked')
  group by person_key
)
select
  a.action_id,
  a.person_key,
  a.company_key,
  a.channel,
  a.action_type,
  o.optout_at,
  o.optout_event,
  case when o.person_key is not null then false else true end as contact_allowed_by_observed_optout,
  case when o.person_key is not null then 'blocked_observed_optout' else 'no_observed_optout' end as permission_state,
  jsonb_build_object('truth_boundary','absence of observed opt-out is not legal-consent proof; channel-specific legal basis remains required') as evidence
from public.powerhouse_sales_actions a
left join optout o on o.person_key=a.person_key
where a.status in ('suggested','prepared','waiting');
alter view public.powerhouse_contact_permission_guard_v1 set (security_invoker = true);

create or replace view public.powerhouse_capacity_guard_v1 as
with today as (
  select
    count(*) filter (where channel in ('linkedin_dm','email') and status in ('suggested','prepared','executed','waiting')) as direct_actions_today,
    count(*) filter (where channel in ('linkedin_dm','email') and status='executed') as executed_direct_today
  from public.powerhouse_sales_actions
  where created_at >= date_trunc('day', now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
), freshness as (
  select count(*) filter (where required_for_daily_loop and freshness_status in ('stale','missing')) as stale_required_sources
  from public.powerhouse_source_freshness_v1
)
select
  5::integer as canonical_daily_direct_outbound_cap,
  t.direct_actions_today,
  t.executed_direct_today,
  greatest(0,5-t.executed_direct_today)::integer as remaining_execution_slots,
  f.stale_required_sources,
  case
    when f.stale_required_sources > 0 then 'hold_for_stale_sources'
    when t.executed_direct_today >= 5 then 'daily_cap_reached'
    else 'capacity_available'
  end as capacity_state,
  jsonb_build_object('cap_source','canonical Powerhouse direct-outbound safety rule','timezone','Europe/Amsterdam') as evidence
from today t cross join freshness f;
alter view public.powerhouse_capacity_guard_v1 set (security_invoker = true);

create or replace view public.powerhouse_north_star_v1 as
select
  count(*) filter (where o.status in ('open','active','suggested','qualified')) as open_opportunities,
  coalesce(sum(o.expected_value_eur) filter (where o.status in ('open','active','suggested','qualified')),0)::numeric as qualified_pipeline_eur,
  (select count(*) from public.powerhouse_sales_outcomes s where lower(s.outcome_type) in ('meeting','meeting_booked')) as meetings_observed,
  (select count(*) from public.powerhouse_sales_outcomes s where lower(s.outcome_type) in ('proposal','proposal_sent')) as proposals_observed,
  (select count(*) from public.powerhouse_sales_outcomes s where lower(s.outcome_type) in ('won','closed_won')) as wins_observed,
  (select coalesce(sum(s.revenue_eur),0)::numeric from public.powerhouse_sales_outcomes s) as realized_revenue_eur,
  (select count(*) from public.powerhouse_forecast_calibration) as calibration_samples,
  (select count(*) from public.powerhouse_human_feedback_learning_v1) as human_feedback_samples,
  now() as measured_at
from public.powerhouse_opportunities o;
alter view public.powerhouse_north_star_v1 set (security_invoker = true);

-- Internal intelligence is service-role only. Browser/client access stays behind the canonical runtime/API layer.
revoke all on public.powerhouse_counterfactual_candidate_v1 from anon, authenticated;
grant select on public.powerhouse_counterfactual_candidate_v1 to service_role;
revoke all on public.powerhouse_unit_economics_v1 from anon, authenticated;
grant select on public.powerhouse_unit_economics_v1 to service_role;
revoke all on public.powerhouse_customer_expansion_v1 from anon, authenticated;
grant select on public.powerhouse_customer_expansion_v1 to service_role;
revoke all on public.powerhouse_lost_deal_intelligence_v1 from anon, authenticated;
grant select on public.powerhouse_lost_deal_intelligence_v1 to service_role;
revoke all on public.powerhouse_competitor_intelligence_v1 from anon, authenticated;
grant select on public.powerhouse_competitor_intelligence_v1 to service_role;
revoke all on public.powerhouse_provider_health_v1 from anon, authenticated;
grant select on public.powerhouse_provider_health_v1 to service_role;
revoke all on public.powerhouse_human_feedback_learning_v1 from anon, authenticated;
grant select on public.powerhouse_human_feedback_learning_v1 to service_role;
revoke all on public.powerhouse_revenue_truth_v1 from anon, authenticated;
grant select on public.powerhouse_revenue_truth_v1 to service_role;
revoke all on public.powerhouse_decision_explainability_v1 from anon, authenticated;
grant select on public.powerhouse_decision_explainability_v1 to service_role;
revoke all on public.powerhouse_contact_permission_guard_v1 from anon, authenticated;
grant select on public.powerhouse_contact_permission_guard_v1 to service_role;
revoke all on public.powerhouse_capacity_guard_v1 from anon, authenticated;
grant select on public.powerhouse_capacity_guard_v1 to service_role;
revoke all on public.powerhouse_north_star_v1 from anon, authenticated;
grant select on public.powerhouse_north_star_v1 to service_role;
