-- predictive-first-mover-intelligence-v1
-- Canonical predictive layer before the existing Powerhouse decision/runtime chain.

create table if not exists public.powerhouse_predictive_signals (
  signal_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  source_type text not null check (source_type in ('external','search','social','website','sales','company_intelligence','learning')),
  source_ref text not null,
  topic_key text not null,
  segment_key text,
  signal_statement text not null,
  freshness numeric not null default 0.5 check (freshness between 0 and 1),
  novelty numeric not null default 0.5 check (novelty between 0 and 1),
  velocity numeric not null default 0 check (velocity between -1 and 1),
  acceleration numeric not null default 0 check (acceleration between -1 and 1),
  strategic_fit numeric not null default 0.5 check (strategic_fit between 0 and 1),
  evidence_quality numeric not null default 0.5 check (evidence_quality between 0 and 1),
  evidence_refs jsonb not null default '[]'::jsonb,
  observed_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(evidence_refs) = 'array')
);

create table if not exists public.powerhouse_forecasts (
  forecast_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  topic_key text not null,
  subject_key text,
  segment_key text,
  forecast_statement text not null,
  expected_problem text,
  expected_search_intent text,
  expected_buying_trigger text,
  horizon_days integer not null check (horizon_days in (7,30,90)),
  expected_by timestamptz not null,
  probability numeric not null check (probability between 0 and 1),
  confidence numeric not null check (confidence between 0 and 1),
  expected_lead_days numeric not null default 0 check (expected_lead_days >= 0),
  market_saturation numeric not null default 0.5 check (market_saturation between 0 and 1),
  strategic_fit numeric not null default 0.5 check (strategic_fit between 0 and 1),
  commercial_potential numeric not null default 0.5 check (commercial_potential between 0 and 1),
  signal_acceleration numeric not null default 0 check (signal_acceleration between -1 and 1),
  whitespace numeric not null default 0.5 check (whitespace between 0 and 1),
  first_mover_score numeric not null default 0 check (first_mover_score between 0 and 100),
  lifecycle text not null default 'candidate' check (lifecycle in ('candidate','active','materialized','missed','expired','rejected')),
  evidence_refs jsonb not null default '[]'::jsonb,
  score_components jsonb not null default '{}'::jsonb,
  activated_at timestamptz,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(evidence_refs) = 'array'),
  check (lifecycle <> 'active' or (confidence >= 0.55 and probability >= 0.5 and jsonb_array_length(evidence_refs) >= 2))
);

create table if not exists public.powerhouse_first_mover_claims (
  claim_id uuid primary key default gen_random_uuid(),
  forecast_id uuid not null references public.powerhouse_forecasts(forecast_id) on delete cascade,
  dedupe_key text not null unique,
  prediction_mode text not null check (prediction_mode in ('reactive','anticipatory','category_creation')),
  claim_text text not null,
  frame text,
  term text,
  prediction_rationale text not null,
  evidence_refs jsonb not null default '[]'::jsonb,
  content_key text,
  status text not null default 'candidate' check (status in ('candidate','selected','published','held','rejected')),
  selected_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(evidence_refs) = 'array')
);

create table if not exists public.powerhouse_forecast_calibration (
  calibration_id uuid primary key default gen_random_uuid(),
  forecast_id uuid not null references public.powerhouse_forecasts(forecast_id) on delete cascade,
  dedupe_key text not null unique,
  outcome smallint not null check (outcome in (0,1)),
  observed_at timestamptz not null default now(),
  materialized_at timestamptz,
  actual_lead_days numeric,
  brier_component numeric not null check (brier_component between 0 and 1),
  content_lift numeric,
  leads integer not null default 0 check (leads >= 0),
  meetings integer not null default 0 check (meetings >= 0),
  proposals integer not null default 0 check (proposals >= 0),
  orders integer not null default 0 check (orders >= 0),
  revenue_eur numeric not null default 0 check (revenue_eur >= 0),
  attribution_confidence numeric not null default 0 check (attribution_confidence between 0 and 1),
  evidence_refs jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  check (jsonb_typeof(evidence_refs) = 'array')
);

create table if not exists public.powerhouse_predictive_runs (
  run_id uuid primary key default gen_random_uuid(),
  run_date date not null default current_date,
  run_type text not null check (run_type in ('engine','calibrator')),
  state text not null default 'started' check (state in ('started','completed','degraded','failed')),
  input_count integer not null default 0 check (input_count >= 0),
  output_count integer not null default 0 check (output_count >= 0),
  evidence jsonb not null default '{}'::jsonb,
  degraded_reason text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists powerhouse_predictive_signals_topic_idx on public.powerhouse_predictive_signals(topic_key, observed_at desc);
create index if not exists powerhouse_forecasts_active_idx on public.powerhouse_forecasts(lifecycle, first_mover_score desc, expected_by);
create index if not exists powerhouse_forecasts_due_idx on public.powerhouse_forecasts(expected_by) where lifecycle = 'active';
create index if not exists powerhouse_claims_forecast_idx on public.powerhouse_first_mover_claims(forecast_id, status);
create index if not exists powerhouse_calibration_forecast_idx on public.powerhouse_forecast_calibration(forecast_id, observed_at desc);
create index if not exists powerhouse_predictive_runs_date_idx on public.powerhouse_predictive_runs(run_date desc, run_type, started_at desc);

create or replace function public.powerhouse_first_mover_score(
  p_probability numeric,
  p_confidence numeric,
  p_acceleration numeric,
  p_strategic_fit numeric,
  p_commercial_potential numeric,
  p_whitespace numeric,
  p_market_saturation numeric,
  p_expected_lead_days numeric
) returns numeric
language sql immutable parallel safe
as $$
  select round((
    greatest(0, least(1, coalesce(p_probability,0))) *
    greatest(0, least(1, coalesce(p_confidence,0))) *
    greatest(0, least(1, (coalesce(p_acceleration,0) + 1) / 2)) *
    greatest(0, least(1, coalesce(p_strategic_fit,0))) *
    greatest(0, least(1, coalesce(p_commercial_potential,0))) *
    greatest(0, least(1, coalesce(p_whitespace,0))) *
    (1 - greatest(0, least(1, coalesce(p_market_saturation,1)))) *
    (0.5 + 0.5 * least(1, greatest(0, coalesce(p_expected_lead_days,0)) / 90.0))
  ) * 100, 4)
$$;

create or replace function public.powerhouse_set_forecast_score()
returns trigger language plpgsql as $$
begin
  new.first_mover_score := public.powerhouse_first_mover_score(
    new.probability,new.confidence,new.signal_acceleration,new.strategic_fit,
    new.commercial_potential,new.whitespace,new.market_saturation,new.expected_lead_days
  );
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists powerhouse_forecast_score_trigger on public.powerhouse_forecasts;
create trigger powerhouse_forecast_score_trigger
before insert or update of probability,confidence,signal_acceleration,strategic_fit,commercial_potential,whitespace,market_saturation,expected_lead_days
on public.powerhouse_forecasts
for each row execute function public.powerhouse_set_forecast_score();

create or replace view public.powerhouse_first_mover_queue as
select
  f.forecast_id,
  c.claim_id,
  f.topic_key,
  f.segment_key,
  f.forecast_statement,
  f.expected_problem,
  f.expected_search_intent,
  f.expected_buying_trigger,
  f.horizon_days,
  f.expected_by,
  f.probability,
  f.confidence,
  f.expected_lead_days,
  f.market_saturation,
  f.strategic_fit,
  f.commercial_potential,
  f.signal_acceleration,
  f.whitespace,
  f.first_mover_score,
  f.evidence_refs,
  c.prediction_mode,
  c.claim_text,
  c.prediction_rationale,
  c.evidence_refs as claim_evidence_refs
from public.powerhouse_forecasts f
left join lateral (
  select c0.* from public.powerhouse_first_mover_claims c0
  where c0.forecast_id = f.forecast_id and c0.status in ('candidate','selected','held')
  order by case c0.status when 'selected' then 0 when 'candidate' then 1 else 2 end, c0.created_at
  limit 1
) c on true
where f.lifecycle = 'active'
  and f.expected_by > now()
  and f.probability >= 0.5
  and f.confidence >= 0.55
  and jsonb_array_length(f.evidence_refs) >= 2
order by f.first_mover_score desc, f.expected_by asc;

create or replace view public.powerhouse_forecasts_due_calibration as
select f.*
from public.powerhouse_forecasts f
where f.lifecycle = 'active'
  and f.expected_by <= now()
  and not exists (
    select 1 from public.powerhouse_forecast_calibration c where c.forecast_id = f.forecast_id
  )
order by f.expected_by;

create or replace view public.powerhouse_predictive_health as
with engine as (
  select max(completed_at) filter (where state = 'completed') as last_completed,
         max(started_at) as last_started,
         count(*) filter (where run_date = current_date and state = 'completed') as completed_today
  from public.powerhouse_predictive_runs where run_type = 'engine'
), calibrator as (
  select max(completed_at) filter (where state = 'completed') as last_completed,
         count(*) filter (where run_date = current_date and state = 'completed') as completed_today
  from public.powerhouse_predictive_runs where run_type = 'calibrator'
), counts as (
  select
    (select count(*) from public.powerhouse_forecasts where lifecycle='active') as active_forecasts,
    (select count(*) from public.powerhouse_first_mover_queue) as queue_size,
    (select count(*) from public.powerhouse_forecasts_due_calibration) as due_calibrations
)
select
  engine.last_completed as last_predictive_run,
  calibrator.last_completed as last_calibration_run,
  counts.active_forecasts,
  counts.queue_size,
  counts.due_calibrations,
  case
    when engine.completed_today = 0 then 'degraded'
    when counts.due_calibrations > 0 and calibrator.completed_today = 0 then 'degraded'
    else 'healthy'
  end as state,
  case
    when engine.completed_today = 0 then 'missing_predictive_execution_evidence'
    when counts.due_calibrations > 0 and calibrator.completed_today = 0 then 'overdue_calibration_without_execution_evidence'
    else null
  end as degraded_reason
from engine, calibrator, counts;

alter table public.powerhouse_predictive_signals enable row level security;
alter table public.powerhouse_forecasts enable row level security;
alter table public.powerhouse_first_mover_claims enable row level security;
alter table public.powerhouse_forecast_calibration enable row level security;
alter table public.powerhouse_predictive_runs enable row level security;

revoke all on public.powerhouse_predictive_signals from anon, authenticated;
revoke all on public.powerhouse_forecasts from anon, authenticated;
revoke all on public.powerhouse_first_mover_claims from anon, authenticated;
revoke all on public.powerhouse_forecast_calibration from anon, authenticated;
revoke all on public.powerhouse_predictive_runs from anon, authenticated;
grant all on public.powerhouse_predictive_signals to service_role;
grant all on public.powerhouse_forecasts to service_role;
grant all on public.powerhouse_first_mover_claims to service_role;
grant all on public.powerhouse_forecast_calibration to service_role;
grant all on public.powerhouse_predictive_runs to service_role;
grant select on public.powerhouse_first_mover_queue to service_role;
grant select on public.powerhouse_forecasts_due_calibration to service_role;
grant select on public.powerhouse_predictive_health to service_role;

comment on table public.powerhouse_forecasts is 'Canonical predictive-first-mover-intelligence-v1 forecasts. Active forecasts require pre-registered probability/confidence and >=2 evidence refs.';
comment on view public.powerhouse_first_mover_queue is 'Canonical predictive input for the existing Powerhouse content/runtime chain; saturation lowers ranking by construction.';
comment on view public.powerhouse_predictive_health is 'Fail-closed predictive health: no healthy state without engine execution evidence and due calibration evidence.';
