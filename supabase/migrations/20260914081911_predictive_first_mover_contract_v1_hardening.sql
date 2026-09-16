alter table public.powerhouse_forecasts
  add column if not exists expected_by date,
  add column if not exists signal_acceleration numeric not null default 0.5 check (signal_acceleration between 0 and 1),
  add column if not exists market_saturation numeric not null default 0.5 check (market_saturation between 0 and 1),
  add column if not exists whitespace_score numeric not null default 0.5 check (whitespace_score between 0 and 1),
  add column if not exists prediction_mode text not null default 'anticipatory' check (prediction_mode in ('reactive','anticipatory','category_creation')),
  add column if not exists last_scored_at timestamptz not null default now();

alter table public.powerhouse_first_mover_claims
  add column if not exists prediction_mode text not null default 'anticipatory' check (prediction_mode in ('reactive','anticipatory','category_creation')),
  add column if not exists rationale text,
  add column if not exists evidence_refs jsonb not null default '[]'::jsonb;

alter table public.powerhouse_forecast_calibration
  add column if not exists outcome_value integer check (outcome_value in (0,1)),
  add column if not exists brier_component numeric,
  add column if not exists actual_lead_days numeric,
  add column if not exists attribution_confidence numeric check (attribution_confidence between 0 and 1),
  add column if not exists revenue_eur numeric not null default 0,
  add column if not exists content_ids text[] not null default '{}'::text[];

create index if not exists idx_powerhouse_forecasts_active_score on public.powerhouse_forecasts(status, first_mover_score desc, confidence desc, probability desc);
create index if not exists idx_powerhouse_forecasts_due on public.powerhouse_forecasts(status, expected_by, horizon_end);
create index if not exists idx_powerhouse_calibration_forecast_measured on public.powerhouse_forecast_calibration(forecast_id, measured_at desc);

create or replace view public.powerhouse_first_mover_queue as
select
  f.forecast_id,
  f.forecast_key,
  f.scope,
  f.scope_key,
  f.topic_key,
  f.predicted_event,
  f.predicted_problem,
  f.predicted_question,
  f.predicted_search_intent,
  f.predicted_buying_trigger,
  f.probability,
  f.confidence,
  f.expected_lead_days,
  f.first_mover_score,
  f.strategic_fit,
  f.revenue_potential,
  f.horizon_start,
  f.horizon_end,
  round(
    100 * f.probability * f.confidence
    * greatest(f.signal_acceleration,0.01)
    * greatest(f.strategic_fit,0.01)
    * greatest(f.revenue_potential,0.01)
    * greatest(f.whitespace_score,0.01)
    * greatest(1 - f.market_saturation,0.01)
    * least(greatest(coalesce(f.expected_lead_days,1),1)::numeric / 30, 1.5)
  ,2) as action_score,
  f.signal_acceleration,
  f.market_saturation,
  f.whitespace_score,
  f.prediction_mode,
  f.expected_by
from public.powerhouse_forecasts f
where f.status='active'
  and f.horizon_end >= current_date
  and f.probability >= 0.45
  and f.confidence >= 0.50
order by action_score desc, f.first_mover_score desc;

create or replace function public.powerhouse_recompute_first_mover_score(
  p_probability numeric,
  p_confidence numeric,
  p_acceleration numeric,
  p_strategic_fit numeric,
  p_revenue_potential numeric,
  p_whitespace numeric,
  p_market_saturation numeric,
  p_expected_lead_days integer
) returns numeric
language sql immutable as $$
  select round(least(100::numeric,
    100 * greatest(least(coalesce(p_probability,0),1),0)
        * greatest(least(coalesce(p_confidence,0),1),0)
        * greatest(least(coalesce(p_acceleration,0),1),0)
        * greatest(least(coalesce(p_strategic_fit,0),1),0)
        * greatest(least(coalesce(p_revenue_potential,0),1),0)
        * greatest(least(coalesce(p_whitespace,0),1),0)
        * greatest(1-greatest(least(coalesce(p_market_saturation,1),1),0),0)
        * least(greatest(coalesce(p_expected_lead_days,1),1)::numeric/30,1.5)
  ),2)
$$;

create or replace function public.powerhouse_forecast_brier(p_probability numeric,p_outcome integer)
returns numeric language sql immutable as $$
  select round(power(greatest(least(coalesce(p_probability,0),1),0) - case when p_outcome=1 then 1 else 0 end,2),4)
$$;