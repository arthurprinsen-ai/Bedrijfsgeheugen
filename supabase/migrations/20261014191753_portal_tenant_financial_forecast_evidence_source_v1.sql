-- Applied as Supabase migration 20261014191753.
-- Historical accounting measurements are not interchangeable with revenue potential,
-- marketing-event probabilities, or generic model/supplier evidence.
create table if not exists public.portal_financial_forecasts_v1 (
  tenant_id text not null check (length(btrim(tenant_id)) between 1 and 180),
  forecast_id text not null check (length(btrim(forecast_id)) between 1 and 120),
  metric text not null check (metric in ('revenue','cashflow','margin','customers','capacity','risk','goal','custom')),
  title text not null check (length(btrim(title)) between 1 and 200),
  unit text not null default '',
  source_name text not null check (length(btrim(source_name)) > 0),
  source_evidence_ref text not null check (length(btrim(source_evidence_ref)) > 0),
  model_version text not null check (length(btrim(model_version)) > 0),
  source_updated_at timestamptz not null,
  historical_points jsonb not null check (jsonb_typeof(historical_points)='array' and jsonb_array_length(historical_points) between 3 and 120),
  forecast_points jsonb not null check (jsonb_typeof(forecast_points)='array' and jsonb_array_length(forecast_points) between 1 and 120),
  lower_points jsonb check (lower_points is null or jsonb_typeof(lower_points)='array'),
  upper_points jsonb check (upper_points is null or jsonb_typeof(upper_points)='array'),
  backtest jsonb not null default '{}'::jsonb check (jsonb_typeof(backtest)='object'),
  verification_status text not null default 'pending' check (verification_status in ('pending','passed','failed')),
  verified_by text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id,forecast_id),
  constraint financial_forecast_verified_evidence_required check (
    verification_status <> 'passed' or (
      verified_at is not null
      and length(btrim(coalesce(verified_by,''))) > 0
      and backtest->>'status'='passed'
      and length(btrim(coalesce(backtest->>'method',''))) > 0
      and source_updated_at <= verified_at
    )
  )
);
create index if not exists portal_financial_forecasts_tenant_validated_idx
  on public.portal_financial_forecasts_v1 (tenant_id,verified_at desc)
  where verification_status='passed';
alter table public.portal_financial_forecasts_v1 enable row level security;
revoke all on table public.portal_financial_forecasts_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.portal_financial_forecasts_v1 to service_role;
comment on table public.portal_financial_forecasts_v1 is 'Only source-evidenced tenant financial time series. Market-signal forecasts are not eligible. No anonymous or ordinary browser Data API permissions.';
