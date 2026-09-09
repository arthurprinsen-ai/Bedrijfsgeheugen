create table if not exists public.social_posts (
  tenant_id text not null,
  post_id text not null,
  platform text not null,
  external_post_id text not null,
  published_at timestamptz,
  content_hash text,
  topic text,
  content_pillar text,
  audience text,
  funnel_stage text,
  format text,
  hook_type text,
  narrative_type text,
  emotion text,
  cta_type text,
  source_campaign_id text,
  learning_status text,
  learning_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, post_id),
  unique (tenant_id, platform, external_post_id)
);

create table if not exists public.social_metric_snapshots (
  tenant_id text not null,
  snapshot_id text not null,
  post_id text not null,
  observed_at timestamptz not null,
  source text not null,
  source_event_id text not null,
  data_quality text not null default 'OBSERVED',
  metrics jsonb not null,
  created_at timestamptz not null default now(),
  primary key (tenant_id, snapshot_id),
  unique (tenant_id, source_event_id)
);

create table if not exists public.social_learning_evaluations (
  tenant_id text not null,
  evaluation_id text not null,
  post_id text not null,
  window_hours integer not null check (window_hours in (24,48,72)),
  observed_at timestamptz not null,
  metric_vector jsonb not null,
  cohort_size integer not null default 0,
  evidence jsonb,
  created_at timestamptz not null default now(),
  primary key (tenant_id, evaluation_id)
);

create table if not exists public.social_learnings (
  tenant_id text not null,
  learning_id text not null,
  fingerprint text not null,
  component_scope text not null,
  claim text not null,
  effect_metric text,
  effect_size double precision,
  sample_size integer not null default 0,
  confidence double precision not null default 0,
  status text not null check (status in ('CANDIDATE','TESTING','PROVEN','WEAKENING','RETIRED')),
  last_validated_at timestamptz,
  evidence_refs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, learning_id),
  unique (tenant_id, fingerprint)
);

create table if not exists public.social_learning_applications (
  tenant_id text not null,
  application_id text not null,
  post_id text not null,
  learning_id text not null,
  decision_id text,
  applied_at timestamptz not null,
  application_role text not null,
  expected_effect double precision,
  actual_effect double precision,
  verification_status text not null default 'PENDING',
  updated_at timestamptz not null default now(),
  primary key (tenant_id, application_id)
);

create table if not exists public.social_learning_decisions (
  tenant_id text not null,
  decision_id text not null,
  post_id text not null,
  decision jsonb not null,
  recorded_at timestamptz not null default now(),
  primary key (tenant_id, decision_id)
);

create table if not exists public.social_learning_projections (
  tenant_id text primary key,
  version text not null,
  projection jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.social_learning_obligations (
  tenant_id text not null default 'default',
  obligation_id text not null,
  type text not null,
  owner text not null,
  post_id text,
  window_hours integer,
  due_at timestamptz,
  status text not null default 'OPEN',
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, obligation_id)
);

create index if not exists social_snapshots_post_observed_idx on public.social_metric_snapshots(tenant_id,post_id,observed_at desc);
create index if not exists social_posts_published_idx on public.social_posts(tenant_id,published_at desc);
create index if not exists social_learnings_status_idx on public.social_learnings(tenant_id,status,confidence desc);
create index if not exists social_applications_post_idx on public.social_learning_applications(tenant_id,post_id);

alter table public.social_posts enable row level security;
alter table public.social_metric_snapshots enable row level security;
alter table public.social_learning_evaluations enable row level security;
alter table public.social_learnings enable row level security;
alter table public.social_learning_applications enable row level security;
alter table public.social_learning_decisions enable row level security;
alter table public.social_learning_projections enable row level security;
alter table public.social_learning_obligations enable row level security;
