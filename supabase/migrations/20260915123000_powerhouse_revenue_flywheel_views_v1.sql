create or replace view public.powerhouse_revenue_flywheel_v1 as
with opp as (
select count(*) filter (where coalesce(status,'') not in ('closed','won','lost'))::int open_opportunities,
coalesce(sum(expected_revenue_value) filter (where coalesce(status,'') not in ('closed','won','lost')),0)::numeric weighted_pipeline_eur,
coalesce(sum(expected_value_eur*probability) filter (where coalesce(status,'') not in ('closed','won','lost')),0)::numeric expected_value_eur
from public.powerhouse_opportunities),
actions as (
select count(*) filter (where status in ('pending','queued','ready'))::int pending_actions,
count(*) filter (where executed_at is not null)::int executed_actions,
count(*) filter (where executed_at is not null and outcome_id is null)::int executed_without_outcome,
coalesce(sum(expected_value_eur) filter (where status in ('pending','queued','ready')),0)::numeric pending_action_value_eur
from public.powerhouse_sales_actions),
outcomes as (
select count(*)::int outcome_count,count(*) filter (where coalesce(revenue_eur,0)>0)::int revenue_outcomes,coalesce(sum(revenue_eur),0)::numeric realized_revenue_eur
from public.powerhouse_sales_outcomes),
forecasts as (
select count(*)::int forecast_count,count(*) filter (where status in ('active','open','predicted') or status is null)::int open_forecasts
from public.powerhouse_forecasts),
calibration as (
select count(*)::int calibration_count,coalesce(avg(brier_component),0)::numeric avg_brier_component,coalesce(avg(attribution_confidence),0)::numeric avg_attribution_confidence
from public.powerhouse_forecast_calibration),
experiments as (
select count(*) filter (where status in ('active','running','planned'))::int active_experiments,count(*) filter (where ended_at is not null and besluit is null)::int experiments_awaiting_decision
from public.social_experiments)
select now() measured_at,opp.*,actions.*,outcomes.*,forecasts.*,calibration.*,experiments.*,
(actions.executed_without_outcome>0) outcome_gap,(forecasts.forecast_count>calibration.calibration_count) calibration_gap,(experiments.experiments_awaiting_decision>0) experiment_decision_gap
from opp,actions,outcomes,forecasts,calibration,experiments;

create or replace view public.powerhouse_action_value_rank_v1 as
select a.action_id,a.dedupe_key,a.opportunity_key,a.subject_key,a.person_key,a.company_key,a.action_type,a.channel,a.status,a.due_at,
coalesce(a.expected_value_eur,0) expected_value_eur,coalesce(o.probability,0) opportunity_probability,coalesce(o.confidence,0) opportunity_confidence,
coalesce(o.expected_revenue_value,0) opportunity_expected_revenue_value,
greatest(0,coalesce(a.expected_value_eur,0))*greatest(0,least(1,coalesce(o.probability,0)))*greatest(0.05,least(1,coalesce(o.confidence,0))) revenue_quality_score,
a.evidence,a.reason
from public.powerhouse_sales_actions a left join public.powerhouse_opportunities o on o.opportunity_key=a.opportunity_key
where a.status in ('pending','queued','ready');

create or replace view public.powerhouse_outcome_sweep_queue_v1 as
select a.action_id,a.dedupe_key,a.opportunity_key,a.subject_key,a.person_key,a.company_key,a.action_type,a.channel,a.executed_at,
extract(epoch from (now()-a.executed_at))/3600.0 age_hours,
case when now()>=a.executed_at+interval '30 days' then 'T+30d' when now()>=a.executed_at+interval '7 days' then 'T+7d' when now()>=a.executed_at+interval '24 hours' then 'T+24h' when now()>=a.executed_at+interval '1 hour' then 'T+1h' else 'T+<1h' end measurement_horizon,a.evidence
from public.powerhouse_sales_actions a
where a.executed_at is not null and (a.outcome_id is null or not exists(select 1 from public.powerhouse_sales_outcomes so where so.action_id=a.action_id and so.occurred_at>=now()-interval '35 days'));

create or replace view public.powerhouse_experiment_decision_queue_v1 as
select experiment_id,hypothesis,commercial_hypothesis,primary_metric,comparison_scope,recipe,target_channels,started_at,ended_at,status,variant,controle,meetpunt,min_steekproef,looptijd_dagen,basislijn,resultaat,advies,besluit
from public.social_experiments where status in ('active','running','planned') or (ended_at is not null and besluit is null);
