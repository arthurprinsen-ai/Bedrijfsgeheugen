create table if not exists public.powerhouse_opportunity_signals (
  signal_id uuid primary key default gen_random_uuid(),
  signal_key text not null unique,
  opportunity_key text not null,
  event_id uuid references public.powerhouse_runtime_events(event_id) on delete set null,
  source text not null,
  source_url text,
  topic text not null,
  audience text not null default 'unknown',
  observed_at timestamptz not null default now(),
  features jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.powerhouse_opportunities (
  opportunity_id uuid primary key default gen_random_uuid(),
  opportunity_key text not null unique,
  topic text not null,
  audience text not null default 'unknown',
  market text,
  score numeric not null default 0 check (score >= 0 and score <= 100),
  components jsonb not null default '{}'::jsonb,
  penalties jsonb not null default '{}'::jsonb,
  decision jsonb not null default '{}'::jsonb,
  content_brief jsonb not null default '{}'::jsonb,
  source_count integer not null default 1 check (source_count >= 0),
  exploration boolean not null default false,
  status text not null default 'observing' check (status in ('observing','open','queued','actioned','converted','dismissed','expired')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists powerhouse_opportunity_signals_topic_idx on public.powerhouse_opportunity_signals(topic,audience,observed_at desc);
create index if not exists powerhouse_opportunity_signals_source_idx on public.powerhouse_opportunity_signals(source,observed_at desc);
create index if not exists powerhouse_opportunities_queue_idx on public.powerhouse_opportunities(status,score desc,last_seen_at desc);
create index if not exists powerhouse_opportunities_topic_idx on public.powerhouse_opportunities(topic,audience,last_seen_at desc);

alter table public.powerhouse_opportunity_signals enable row level security;
alter table public.powerhouse_opportunities enable row level security;
revoke all on public.powerhouse_opportunity_signals from anon, authenticated;
revoke all on public.powerhouse_opportunities from anon, authenticated;
grant all on public.powerhouse_opportunity_signals to service_role;
grant all on public.powerhouse_opportunities to service_role;

create or replace function public.powerhouse_opportunity_queue(p_limit integer default 25)
returns setof public.powerhouse_opportunities language sql stable security definer set search_path=public as $$
  select * from public.powerhouse_opportunities
  where status in ('observing','open','queued')
  order by score desc,last_seen_at desc
  limit greatest(1,least(coalesce(p_limit,25),100));
$$;
revoke all on function public.powerhouse_opportunity_queue(integer) from public,anon,authenticated;
grant execute on function public.powerhouse_opportunity_queue(integer) to service_role;
