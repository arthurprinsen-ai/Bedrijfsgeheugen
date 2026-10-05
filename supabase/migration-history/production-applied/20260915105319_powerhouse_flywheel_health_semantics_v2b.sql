create or replace view public.powerhouse_revenue_flywheel_v1 as
with opp as (
  select
    count(*) filter (where coalesce(status,'') not in ('closed','won','lost'))::int as open_opportunities,
    coalesce(sum(expected_revenue_value) filter (where coalesce(status,'') not in ('closed','won','lost')),0)::numeric as weighted_pipeline_eur,
    coalesce(sum(expected_value_eur*probability) filter (where coalesce(status,'') not in ('closed','won','lost')),0)::numeric as expected_value_eur
  from public.powerhouse_opportunities
), actions as (
  select
    count(*) filter (where status in ('pending','queued','ready','suggested','waiting'))::int as pending_actions,
    count(*) filter (where executed_at is not null)::int as executed_actions,
    count(*) filter (
      where executed_at is not null
        and outcome_id is null
        and not exists (select 1 from public.powerhouse_sales_outcomes so where so.action_id=powerhouse_sales_actions.action_id)
        and not exists (
          select 1 from public.powerhouse_runtime_events e
          where e.dedupe_key like 'gap:outcome-readback:'||powerhouse_sales_actions.action_id::text||':%'
        )
    )::int as executed_without_outcome,
    coalesce(sum(expected_value_eur) filter (where status in ('pending','queued','ready','suggested','waiting')),0)::numeric as pending_action_value_eur,
    count(*) filter (
      where executed_at is not null
        and outcome_id is null
        and not exists (select 1 from public.powerhouse_sales_outcomes so where so.action_id=powerhouse_sales_actions.action_id)
    )::int as pending_external_outcomes
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
    count(*) filter (where lower(coalesce(status,'')) in ('active','open','predicted','claimed') or status is null)::int as open_forecasts,
    count(*) filter (
      where horizon_end < (now() at time zone 'Europe/Amsterdam')::date
        and not exists (
          select 1 from public.powerhouse_forecast_calibration c where c.forecast_id=powerhouse_forecasts.forecast_id
        )
    )::int as due_uncalibrated_forecasts
  from public.powerhouse_forecasts
), calibration as (
  select
    count(*)::int as calibration_count,
    coalesce(avg(brier_component),0)::numeric as avg_brier_component,
    coalesce(avg(attribution_confidence),0)::numeric as avg_attribution_confidence
  from public.powerhouse_forecast_calibration
), experiments as (
  select
    count(*) filter (where upper(coalesce(status,'')) in ('ACTIVE','PLANNED'))::int as active_experiments,
    count(*) filter (where ended_at is not null and besluit is null and upper(coalesce(status,'')) in ('COMPLETE','INSUFFICIENT_EVIDENCE'))::int as experiments_awaiting_decision
  from public.social_experiments
)
select
  now() as measured_at,
  opp.open_opportunities,
  opp.weighted_pipeline_eur,
  opp.expected_value_eur,
  actions.pending_actions,
  actions.executed_actions,
  actions.executed_without_outcome,
  actions.pending_action_value_eur,
  outcomes.outcome_count,
  outcomes.revenue_outcomes,
  outcomes.realized_revenue_eur,
  forecasts.forecast_count,
  forecasts.open_forecasts,
  calibration.calibration_count,
  calibration.avg_brier_component,
  calibration.avg_attribution_confidence,
  experiments.active_experiments,
  experiments.experiments_awaiting_decision,
  (actions.executed_without_outcome>0) as outcome_gap,
  (forecasts.due_uncalibrated_forecasts>0) as calibration_gap,
  (experiments.experiments_awaiting_decision>0) as experiment_decision_gap,
  actions.pending_external_outcomes,
  forecasts.due_uncalibrated_forecasts
from opp,actions,outcomes,forecasts,calibration,experiments;

create or replace function public.powerhouse_record_flywheel_health_v1()
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare v_id uuid;
begin
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  )
  select
    'revenue-flywheel-health-'||to_char(now() at time zone 'UTC','YYYYMMDDHH24'),
    'revenue_flywheel_health','powerhouse_revenue_flywheel_v1','powerhouse',now(),
    jsonb_build_object(
      'open_opportunities',open_opportunities,
      'weighted_pipeline_eur',weighted_pipeline_eur,
      'expected_value_eur',expected_value_eur,
      'pending_actions',pending_actions,
      'pending_external_outcomes',pending_external_outcomes,
      'unmanaged_outcome_gaps',executed_without_outcome,
      'realized_revenue_eur',realized_revenue_eur,
      'forecast_count',forecast_count,
      'open_forecasts',open_forecasts,
      'due_uncalibrated_forecasts',due_uncalibrated_forecasts,
      'calibration_count',calibration_count,
      'active_experiments',active_experiments,
      'experiments_awaiting_decision',experiments_awaiting_decision
    ),
    jsonb_build_object(
      'outcome_gap',outcome_gap,
      'calibration_gap',calibration_gap,
      'experiment_decision_gap',experiment_decision_gap,
      'truth_boundary','pending external outcome is not a structural gap when an explicit readback obligation exists'
    ),
    case when outcome_gap or calibration_gap or experiment_decision_gap then 'error' else 'observed' end,
    'verified',1
  from public.powerhouse_revenue_flywheel_v1
  on conflict (dedupe_key) do update
    set evidence=excluded.evidence,context=excluded.context,state=excluded.state,data_quality=excluded.data_quality,updated_at=now()
  returning event_id into v_id;
  return v_id;
end $$;
