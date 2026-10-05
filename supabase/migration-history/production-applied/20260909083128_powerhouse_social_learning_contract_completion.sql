create table if not exists public.social_experiments (
  tenant_id text not null,
  experiment_id text not null,
  hypothesis text not null,
  primary_metric text not null,
  comparison_scope jsonb not null default '{}'::jsonb,
  started_at timestamptz not null,
  ended_at timestamptz,
  status text not null check (status in ('ACTIVE','COMPLETE','ROLLED_BACK','INSUFFICIENT_EVIDENCE')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, experiment_id)
);

alter table public.social_metric_snapshots add column if not exists age_hours double precision;
alter table public.social_learnings add column if not exists baseline_definition text;
alter table public.social_learnings add column if not exists evidence_window text;
alter table public.social_learnings add column if not exists first_seen_at timestamptz;
alter table public.social_learnings add column if not exists expires_or_review_at timestamptz;

alter table public.social_experiments enable row level security;
create index if not exists social_experiments_status_idx on public.social_experiments(tenant_id,status,started_at desc);
