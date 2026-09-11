create table if not exists public.deferred_brain_writebacks (
  fingerprint text primary key,
  source text not null,
  payload jsonb not null,
  status text not null default 'OPEN',
  blocker text,
  owner text,
  replay_target text not null default 'BG168->BG166',
  replay_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_attempt_at timestamptz,
  completed_at timestamptz
);
create index if not exists deferred_brain_writebacks_status_idx on public.deferred_brain_writebacks(status);