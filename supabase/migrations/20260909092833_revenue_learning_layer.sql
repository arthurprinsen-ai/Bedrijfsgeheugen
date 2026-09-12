create table if not exists public.revenue_learning_evidence (
  tenant_id text not null default 'canonical',
  evidence_id text not null,
  content_id text not null,
  channel text not null,
  canonical text,
  attribution_key text not null,
  data_quality text not null default 'OBSERVED',
  published_at timestamptz,
  publication_date date,
  window_hours integer not null default 0,
  component_fingerprint text not null,
  exposures numeric,
  clicks numeric,
  substantive_interactions numeric,
  leads numeric,
  qualified_leads numeric,
  meetings numeric,
  proposals numeric,
  orders numeric,
  revenue_eur numeric,
  attributes jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  evaluated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, evidence_id)
);
create index if not exists revenue_learning_evidence_content_idx on public.revenue_learning_evidence(tenant_id,content_id,window_hours);
create index if not exists revenue_learning_evidence_channel_idx on public.revenue_learning_evidence(tenant_id,channel,published_at desc);
create index if not exists revenue_learning_evidence_attribution_idx on public.revenue_learning_evidence(tenant_id,attribution_key);
alter table public.revenue_learning_evidence enable row level security;

create table if not exists public.revenue_learnings (
  tenant_id text not null default 'canonical',
  learning_id text not null,
  fingerprint text not null,
  component_scope text not null,
  claim text not null,
  effect_metric text,
  effect_size double precision,
  sample_size integer not null default 0,
  confidence double precision not null default 0,
  status text not null default 'CANDIDATE',
  baseline_definition text,
  evidence_window text,
  first_seen_at timestamptz,
  last_validated_at timestamptz,
  expires_or_review_at timestamptz,
  evidence_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, learning_id)
);
create unique index if not exists revenue_learnings_fingerprint_idx on public.revenue_learnings(tenant_id,fingerprint);
create index if not exists revenue_learnings_status_idx on public.revenue_learnings(tenant_id,status,confidence desc);
alter table public.revenue_learnings enable row level security;

create table if not exists public.revenue_learning_applications (
  tenant_id text not null default 'canonical',
  application_id text not null,
  content_id text not null,
  channel text,
  learning_id text not null,
  decision_id text,
  applied_at timestamptz not null default now(),
  application_role text not null default 'PRIMARY',
  expected_effect double precision,
  actual_effect double precision,
  verification_status text not null default 'PENDING',
  updated_at timestamptz not null default now(),
  primary key (tenant_id, application_id)
);
create index if not exists revenue_learning_applications_content_idx on public.revenue_learning_applications(tenant_id,content_id);
create index if not exists revenue_learning_applications_learning_idx on public.revenue_learning_applications(tenant_id,learning_id);
alter table public.revenue_learning_applications enable row level security;

create table if not exists public.revenue_learning_decisions (
  tenant_id text not null default 'canonical',
  decision_id text not null,
  content_id text not null,
  channel text,
  decision jsonb not null default '{}'::jsonb,
  recorded_at timestamptz not null default now(),
  primary key (tenant_id, decision_id)
);
alter table public.revenue_learning_decisions enable row level security;

create table if not exists public.revenue_learning_projections (
  tenant_id text primary key default 'canonical',
  version text not null,
  projection jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.revenue_learning_projections enable row level security;

create table if not exists public.revenue_learning_obligations (
  tenant_id text not null default 'canonical',
  obligation_id text not null,
  type text not null,
  content_id text,
  window_hours integer,
  status text not null default 'OPEN',
  payload jsonb not null default '{}'::jsonb,
  due_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, obligation_id)
);
create index if not exists revenue_learning_obligations_status_idx on public.revenue_learning_obligations(tenant_id,status,updated_at desc);
alter table public.revenue_learning_obligations enable row level security;
