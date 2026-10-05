create or replace view public.powerhouse_revenue_flywheel_v1 as
with opp as (
  select
    count(*) filter (where coalesce(status,'') not in ('closed','won','lost'))::int as open_opportunities,
    coalesce(sum(expected_revenue_value) filter (where coalesce(status,'') not in ('closed','won','lost')),0)::numeric as weighted_pipeline_eur,
    coalesce(sum(expected_value_eur * probability) filter (where coalesce(status,'') not in ('closed','won','lost')),0)::numeric as expected_value_eur
  from public.powerhouse_opportunities
), actions as (
  select
    count(*) filter (where status in ('pending','queued','ready'))::int as pending_actions,
    count(*) filter (where executed_at is not null)::int as executed_actions,
    count(*) filter (where executed_at is not null and outcome_id is null)::int as executed_without_outcome,
    coalesce(sum(expected_value_eur) filter (where status in ('pending','queued','ready')),0)::numeric as pending_action_value_eur
  from public.powerhouse_sales_actions
), outcomes as (
  select
    count(*)::int as outcome_count,
    count(*) filter (where coalesce(revenue_eur,0)>0)::int as revenue_outcomes,
    coalesce(sum(revenue_eur),0)::numeric as realized_revenue_eur
  from public.powerhouse_sales_outcomes
), forecasts as (
  select
    count(*)::int as forecast_count,
    count(*) filter (where status in ('active','open','predicted') or status is null)::int as open_forecasts
  from public.powerhouse_forecasts
), calibration as (
  select
    count(*)::int as calibration_count,
    coalesce(avg(brier_component),0)::numeric as avg_brier_component,
    coalesce(avg(attribution_confidence),0)::numeric as avg_attribution_confidence
  from public.powerhouse_forecast_calibration
), experiments as (
  select
    count(*) filter (where status in ('active','running','planned'))::int as active_experiments,
    count(*) filter (where ended_at is not null and besluit is null)::int as experiments_awaiting_decision
  from public.social_experiments
)
select now() as measured_at, opp.*, actions.*, outcomes.*, forecasts.*, calibration.*, experiments.*,
  case when actions.executed_without_outcome>0 then true else false end as outcome_gap,
  case when forecasts.forecast_count>calibration.calibration_count then true else false end as calibration_gap,
  case when experiments.experiments_awaiting_decision>0 then true else false end as experiment_decision_gap
from opp,actions,outcomes,forecasts,calibration,experiments;

create or replace view public.powerhouse_action_value_rank_v1 as
select
  a.action_id,a.dedupe_key,a.opportunity_key,a.subject_key,a.person_key,a.company_key,a.action_type,a.channel,a.status,a.due_at,
  coalesce(a.expected_value_eur,0) as expected_value_eur,
  coalesce(o.probability,0) as opportunity_probability,
  coalesce(o.confidence,0) as opportunity_confidence,
  coalesce(o.expected_revenue_value,0) as opportunity_expected_revenue_value,
  greatest(0,coalesce(a.expected_value_eur,0)) * greatest(0,least(1,coalesce(o.probability,0))) * greatest(0.05,least(1,coalesce(o.confidence,0))) as revenue_quality_score,
  a.evidence,a.reason
from public.powerhouse_sales_actions a
left join public.powerhouse_opportunities o on o.opportunity_key=a.opportunity_key
where a.status in ('pending','queued','ready');

create or replace view public.powerhouse_outcome_sweep_queue_v1 as
select
  a.action_id,a.dedupe_key,a.opportunity_key,a.subject_key,a.person_key,a.company_key,a.action_type,a.channel,a.executed_at,
  extract(epoch from (now()-a.executed_at))/3600.0 as age_hours,
  case
    when a.executed_at is null then null
    when now() >= a.executed_at + interval '30 days' then 'T+30d'
    when now() >= a.executed_at + interval '7 days' then 'T+7d'
    when now() >= a.executed_at + interval '24 hours' then 'T+24h'
    when now() >= a.executed_at + interval '1 hour' then 'T+1h'
    else 'T+<1h'
  end as measurement_horizon,
  a.evidence
from public.powerhouse_sales_actions a
where a.executed_at is not null
  and (a.outcome_id is null or not exists (select 1 from public.powerhouse_sales_outcomes so where so.action_id=a.action_id and so.occurred_at >= now()-interval '35 days'));

create or replace view public.powerhouse_experiment_decision_queue_v1 as
select experiment_id,hypothesis,commercial_hypothesis,primary_metric,comparison_scope,recipe,target_channels,started_at,ended_at,status,variant,controle,meetpunt,min_steekproef,looptijd_dagen,basislijn,resultaat,advies,besluit
from public.social_experiments
where status in ('active','running','planned') or (ended_at is not null and besluit is null);

create or replace function public.powerhouse_record_flywheel_health_v1()
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid;
begin
  insert into public.powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence)
  select
    'revenue-flywheel-health-'||to_char(now() at time zone 'UTC','YYYYMMDDHH24'),
    'revenue_flywheel_health',
    'powerhouse_revenue_flywheel_v1',
    'powerhouse',
    now(),
    jsonb_build_object(
      'open_opportunities',open_opportunities,
      'weighted_pipeline_eur',weighted_pipeline_eur,
      'expected_value_eur',expected_value_eur,
      'pending_actions',pending_actions,
      'executed_without_outcome',executed_without_outcome,
      'realized_revenue_eur',realized_revenue_eur,
      'forecast_count',forecast_count,
      'calibration_count',calibration_count,
      'active_experiments',active_experiments,
      'experiments_awaiting_decision',experiments_awaiting_decision
    ),
    jsonb_build_object('outcome_gap',outcome_gap,'calibration_gap',calibration_gap,'experiment_decision_gap',experiment_decision_gap),
    case when outcome_gap or calibration_gap or experiment_decision_gap then 'needs_attention' else 'observed' end,
    'system',1
  from public.powerhouse_revenue_flywheel_v1
  on conflict (dedupe_key) do update set evidence=excluded.evidence,context=excluded.context,state=excluded.state,updated_at=now()
  returning event_id into v_id;
  return v_id;
end $$;

revoke all on function public.powerhouse_record_flywheel_health_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_record_flywheel_health_v1() to service_role;

create index if not exists powerhouse_sales_actions_event_id_idx on public.powerhouse_sales_actions(event_id);
create index if not exists powerhouse_sales_actions_outcome_id_idx on public.powerhouse_sales_actions(outcome_id);
create index if not exists powerhouse_sales_outcomes_action_id_idx on public.powerhouse_sales_outcomes(action_id);
