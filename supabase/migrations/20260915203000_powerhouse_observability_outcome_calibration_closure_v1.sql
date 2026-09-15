-- powerhouse-observability-outcome-calibration-closure-v1
-- Evidence-only projections. Existing usage, economics, outcome, forecast and NBA stores remain authoritative.

create or replace view public.powerhouse_action_evidence_maturity_v1
with (security_invoker = true)
as
with constants as (
  select 5::bigint as minimum_comparable_outcomes
),
forecast_calibration as (
  select
    fc.forecast_id,
    count(*)::bigint as calibration_observations,
    max(fc.measured_at) as latest_calibration_at,
    avg(abs(fc.probability_error)) filter (where fc.probability_error is not null) as mean_absolute_probability_error
  from public.powerhouse_forecast_calibration fc
  group by fc.forecast_id
),
base as (
  select
    bv.*,
    nba.forecast_id,
    coalesce(cal.calibration_observations, 0::bigint) as calibration_observations,
    cal.latest_calibration_at,
    cal.mean_absolute_probability_error,
    case
      when coalesce(bv.resource_observations, 0) = 0 then 'unknown'
      when cardinality(coalesce(bv.tenant_ids, array[]::text[])) = 1 then 'measured'
      else 'partial'
    end as resource_evidence_status,
    case
      when coalesce(bv.economics_observations, 0) = 0 then 'unknown'
      when bv.observed_cost_eur is not null then 'measured'
      else 'partial'
    end as economics_evidence_status,
    case
      when coalesce(bv.outcome_observations, 0) = 0 then 'unknown'
      else 'measured'
    end as outcome_evidence_status,
    case
      when nba.forecast_id is null then 'unknown'
      when coalesce(cal.calibration_observations, 0) > 0 then 'measured'
      else 'partial'
    end as forecast_evidence_status
  from public.powerhouse_action_business_value_v1 bv
  left join public.powerhouse_commercial_next_best_action_v4 nba
    on nba.opportunity_key = bv.opportunity_key
  left join forecast_calibration cal
    on cal.forecast_id = nba.forecast_id
),
channel_counts as (
  select
    channel,
    count(*) filter (
      where forecast_evidence_status = 'measured'
        and outcome_evidence_status = 'measured'
    )::bigint as comparable_outcomes
  from base
  group by channel
)
select
  b.*,
  c.minimum_comparable_outcomes,
  coalesce(cc.comparable_outcomes, 0::bigint) as comparable_outcomes,
  case
    when b.resource_evidence_status = 'measured'
     and b.economics_evidence_status = 'measured'
     and b.outcome_evidence_status = 'measured'
     and b.forecast_evidence_status = 'measured' then 'measured'
    when b.resource_evidence_status <> 'unknown'
      or b.economics_evidence_status <> 'unknown'
      or b.outcome_evidence_status <> 'unknown'
      or b.forecast_evidence_status <> 'unknown' then 'partial'
    else 'unknown'
  end as evidence_maturity,
  case
    when b.forecast_evidence_status <> 'measured' then false
    when b.outcome_evidence_status <> 'measured' then false
    when coalesce(cc.comparable_outcomes, 0) < c.minimum_comparable_outcomes then false
    else true
  end as calibration_eligible,
  case
    when b.forecast_evidence_status = 'unknown' then 'missing_pre_action_forecast'
    when b.forecast_evidence_status = 'partial' then 'forecast_not_calibrated'
    when b.outcome_evidence_status <> 'measured' then 'missing_observed_outcome'
    when coalesce(cc.comparable_outcomes, 0) < c.minimum_comparable_outcomes then 'insufficient_comparable_outcomes'
    else 'eligible'
  end as calibration_eligibility_reason,
  case
    when b.observed_cost_eur is null then null
    when b.realized_revenue_eur is null then null
    else b.realized_revenue_eur - b.observed_cost_eur
  end as verified_net_realized_value_eur,
  case
    when b.observed_cost_eur is null or b.observed_cost_eur <= 0 then null
    when b.realized_revenue_eur is null then null
    else (b.realized_revenue_eur - b.observed_cost_eur) / b.observed_cost_eur
  end as verified_roi_ratio
from base b
cross join constants c
left join channel_counts cc on cc.channel = b.channel;

alter view public.powerhouse_action_evidence_maturity_v1 set (security_invoker = true);
revoke all on public.powerhouse_action_evidence_maturity_v1 from public, anon, authenticated;
grant select on public.powerhouse_action_evidence_maturity_v1 to service_role;

create or replace view public.powerhouse_commercial_next_best_action_v5
with (security_invoker = true)
as
with constants as (
  select 5::bigint as minimum_comparable_outcomes
),
channel_evidence as (
  select
    channel,
    count(*) filter (where calibration_eligible)::bigint as calibration_eligible_actions,
    count(*) filter (where forecast_evidence_status = 'measured' and outcome_evidence_status = 'measured')::bigint as comparable_outcomes,
    count(*) filter (where resource_evidence_status = 'measured')::bigint as measured_resource_actions,
    count(*) filter (where economics_evidence_status = 'measured')::bigint as measured_economics_actions,
    count(*) filter (where outcome_evidence_status = 'measured')::bigint as measured_outcome_actions
  from public.powerhouse_action_evidence_maturity_v1
  group by channel
)
select
  nba.*,
  c.minimum_comparable_outcomes,
  coalesce(e.comparable_outcomes, 0::bigint) as comparable_outcomes,
  coalesce(e.calibration_eligible_actions, 0::bigint) as calibration_eligible_actions,
  coalesce(e.measured_resource_actions, 0::bigint) as measured_resource_actions,
  coalesce(e.measured_economics_actions, 0::bigint) as measured_economics_actions,
  coalesce(e.measured_outcome_actions, 0::bigint) as measured_outcome_actions,
  case
    when coalesce(e.comparable_outcomes, 0) < c.minimum_comparable_outcomes then null
    when coalesce(e.measured_resource_actions, 0) < c.minimum_comparable_outcomes then null
    else nba.cost_efficiency_evidence
  end as cost_resource_efficiency_evidence,
  case
    when coalesce(e.comparable_outcomes, 0) < c.minimum_comparable_outcomes then 'insufficient_comparable_outcomes'
    when coalesce(e.measured_resource_actions, 0) < c.minimum_comparable_outcomes then 'insufficient_resource_evidence'
    when nba.business_efficiency_evidence_status <> 'observed' then nba.business_efficiency_evidence_status
    else 'observed_evidence_ready'
  end as evidence_gated_business_efficiency_status
from public.powerhouse_commercial_next_best_action_v4 nba
cross join constants c
left join channel_evidence e on e.channel = nba.recommended_channel;

alter view public.powerhouse_commercial_next_best_action_v5 set (security_invoker = true);
revoke all on public.powerhouse_commercial_next_best_action_v5 from public, anon, authenticated;
grant select on public.powerhouse_commercial_next_best_action_v5 to service_role;
