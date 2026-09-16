create table if not exists public.powerhouse_predictive_signals (
  signal_id uuid primary key default gen_random_uuid(),
  signal_key text not null unique,
  observed_at timestamptz not null default now(),
  source_type text not null,
  source_ref text,
  entity_scope text not null check (entity_scope in ('person','company','segment','market','technology','regulation','behavior')),
  entity_key text,
  topic_key text not null,
  signal_type text not null,
  direction text not null check (direction in ('rising','falling','emerging','shifting','converging','breaking')),
  strength numeric not null check (strength between 0 and 1),
  novelty numeric not null check (novelty between 0 and 1),
  lead_time_days integer,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.powerhouse_forecasts (
  forecast_id uuid primary key default gen_random_uuid(),
  forecast_key text not null unique,
  created_at timestamptz not null default now(),
  horizon_start date not null,
  horizon_end date not null,
  scope text not null check (scope in ('person','company','segment','market','technology','regulation','behavior')),
  scope_key text,
  topic_key text not null,
  predicted_event text not null,
  predicted_problem text,
  predicted_question text,
  predicted_search_intent text,
  predicted_buying_trigger text,
  probability numeric not null check (probability between 0 and 1),
  confidence numeric not null check (confidence between 0 and 1),
  expected_lead_days integer,
  first_mover_score numeric not null check (first_mover_score between 0 and 100),
  strategic_fit numeric not null check (strategic_fit between 0 and 1),
  revenue_potential numeric not null default 0,
  evidence_signal_ids uuid[] not null default '{}'::uuid[],
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','claimed','materialized','expired','invalidated')),
  claimed_at timestamptz,
  materialized_at timestamptz,
  outcome jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.powerhouse_first_mover_claims (
  claim_id uuid primary key default gen_random_uuid(),
  forecast_id uuid not null references public.powerhouse_forecasts(forecast_id) on delete cascade,
  content_key text not null,
  channel text not null,
  claim_angle text not null,
  claim_language text not null,
  published_at timestamptz,
  delivery_ref text,
  ownership_window_start timestamptz not null default now(),
  ownership_window_end timestamptz,
  seo_target text,
  market_phrase text,
  status text not null default 'planned' check (status in ('planned','published','measured','won','lost','retired')),
  performance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(forecast_id,channel,content_key)
);

create table if not exists public.powerhouse_forecast_calibration (
  calibration_id uuid primary key default gen_random_uuid(),
  forecast_id uuid not null references public.powerhouse_forecasts(forecast_id) on delete cascade,
  measured_at timestamptz not null default now(),
  actual_event_occurred boolean,
  actual_event_at timestamptz,
  timing_error_days numeric,
  probability_error numeric,
  first_mover_advantage_score numeric,
  content_lift numeric,
  revenue_influence numeric,
  evidence jsonb not null default '{}'::jsonb
);

alter table public.powerhouse_predictive_signals enable row level security;
alter table public.powerhouse_forecasts enable row level security;
alter table public.powerhouse_first_mover_claims enable row level security;
alter table public.powerhouse_forecast_calibration enable row level security;

revoke all on table public.powerhouse_predictive_signals from anon, authenticated;
revoke all on table public.powerhouse_forecasts from anon, authenticated;
revoke all on table public.powerhouse_first_mover_claims from anon, authenticated;
revoke all on table public.powerhouse_forecast_calibration from anon, authenticated;
grant all on table public.powerhouse_predictive_signals to service_role;
grant all on table public.powerhouse_forecasts to service_role;
grant all on table public.powerhouse_first_mover_claims to service_role;
grant all on table public.powerhouse_forecast_calibration to service_role;

create index if not exists powerhouse_predictive_signals_topic_idx on public.powerhouse_predictive_signals(topic_key,observed_at desc);
create index if not exists powerhouse_forecasts_rank_idx on public.powerhouse_forecasts(status,first_mover_score desc,probability desc,confidence desc);
create index if not exists powerhouse_first_mover_claims_forecast_idx on public.powerhouse_first_mover_claims(forecast_id,status);

create or replace view public.powerhouse_first_mover_queue
with (security_invoker=true) as
select f.forecast_id,f.forecast_key,f.scope,f.scope_key,f.topic_key,f.predicted_event,f.predicted_problem,f.predicted_question,
       f.predicted_search_intent,f.predicted_buying_trigger,f.probability,f.confidence,f.expected_lead_days,
       f.first_mover_score,f.strategic_fit,f.revenue_potential,f.horizon_start,f.horizon_end,
       round((f.first_mover_score * f.confidence * f.probability * greatest(f.strategic_fit,0.01))::numeric,2) as action_score
from public.powerhouse_forecasts f
where f.status='active'
  and f.horizon_end >= current_date
order by action_score desc, f.first_mover_score desc;

revoke all on table public.powerhouse_first_mover_queue from anon, authenticated;
grant select on table public.powerhouse_first_mover_queue to service_role;

create or replace function public.powerhouse_forecast_priority(p_forecast_id uuid)
returns numeric
language sql
stable
set search_path = public, pg_catalog
as $$
  select round((first_mover_score * confidence * probability * greatest(strategic_fit,0.01))::numeric,2)
  from public.powerhouse_forecasts where forecast_id=p_forecast_id;
$$;