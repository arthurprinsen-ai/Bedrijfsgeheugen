create table if not exists public.connector_definitions (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null,
  naam text not null,
  template_id text,
  status text not null default 'Draft',
  versie integer not null default 1,
  configuratie jsonb not null default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);
create index if not exists connector_definitions_organisatie_idx on public.connector_definitions(organisatie_id, bijgewerkt_op desc);

create table if not exists public.connector_executions (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null,
  connector_id uuid not null references public.connector_definitions(id) on delete cascade,
  connector_versie integer not null,
  dedupe_key text,
  status text not null,
  evidence jsonb not null default '{}'::jsonb,
  fout jsonb,
  gestart_op timestamptz not null default now(),
  afgerond_op timestamptz
);
create unique index if not exists connector_execution_dedupe_idx on public.connector_executions(organisatie_id,connector_id,dedupe_key) where dedupe_key is not null;
create index if not exists connector_executions_lookup_idx on public.connector_executions(organisatie_id,connector_id,gestart_op desc);

create table if not exists public.connector_reviews (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null,
  connector_id uuid not null references public.connector_definitions(id) on delete cascade,
  execution_id uuid references public.connector_executions(id) on delete cascade,
  status text not null default 'pending',
  payload jsonb not null default '{}'::jsonb,
  beslissing jsonb,
  aangemaakt_op timestamptz not null default now(),
  afgehandeld_op timestamptz
);
create index if not exists connector_reviews_queue_idx on public.connector_reviews(organisatie_id,status,aangemaakt_op desc);

alter table public.connector_definitions enable row level security;
alter table public.connector_executions enable row level security;
alter table public.connector_reviews enable row level security;
