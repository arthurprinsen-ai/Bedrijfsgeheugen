create table if not exists public.bg_ga4_csv_batches (
  run_id uuid primary key,
  period_start date not null,
  period_end date not null,
  csv_sha256 text not null,
  csv_bytes integer not null,
  csv_text text not null,
  source text not null default 'composio',
  status text not null default 'RECEIVED' check (status in ('RECEIVED','IMPORTED','PARTIAL','FAILED')),
  rows_total integer not null default 0,
  rows_attributed integer not null default 0,
  rows_unmatched integer not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz null,
  detail jsonb not null default '{}'::jsonb
);

alter table public.bg_ga4_csv_batches enable row level security;
revoke all on table public.bg_ga4_csv_batches from public, anon, authenticated;
grant select, insert, update on table public.bg_ga4_csv_batches to service_role;

create index if not exists bg_ga4_csv_batches_period_idx
  on public.bg_ga4_csv_batches(period_end desc, created_at desc);
