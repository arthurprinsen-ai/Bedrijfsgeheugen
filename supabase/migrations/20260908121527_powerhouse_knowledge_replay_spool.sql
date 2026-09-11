create table if not exists public.powerhouse_knowledge_replay_spool (
  dedupe_key text primary key,
  event_id text not null,
  fingerprint text,
  event_json jsonb not null,
  reason text not null,
  state text not null default 'OPEN' check (state in ('OPEN','CLAIMED','WRITTEN','VERIFIED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  bg168_ref text,
  bg166_ref text,
  bg167_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  verified_at timestamptz,
  constraint powerhouse_knowledge_replay_verified_requires_readback
    check (state <> 'VERIFIED' or (bg167_ref is not null and verified_at is not null))
);
create index if not exists powerhouse_knowledge_replay_state_created on public.powerhouse_knowledge_replay_spool (state, created_at asc);
create index if not exists powerhouse_knowledge_replay_event_id on public.powerhouse_knowledge_replay_spool (event_id);
create index if not exists powerhouse_knowledge_replay_fingerprint on public.powerhouse_knowledge_replay_spool (fingerprint) where fingerprint is not null;
alter table public.powerhouse_knowledge_replay_spool enable row level security;
revoke all on table public.powerhouse_knowledge_replay_spool from public, anon, authenticated;
revoke all on table public.powerhouse_knowledge_replay_spool from service_role;
grant select, insert, update on table public.powerhouse_knowledge_replay_spool to service_role;
comment on table public.powerhouse_knowledge_replay_spool is 'Server-only deduplicated transport/recovery obligations for Universal Knowledge Capture; VERIFIED requires BG167 readback.';