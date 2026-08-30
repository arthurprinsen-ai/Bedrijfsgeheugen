-- Durable, server-only runtime dispatch/evidence ledger for BRAIN outcome obligations.
-- GitHub remains executable SSOT. Agent Fabric remains owner of AgentWork lifecycle.

create table if not exists public.brain_outcome_obligation_dispatch (
  idempotency_key text primary key,
  record_type text not null check (record_type in ('AgentWork', 'RecoveryWork')),
  obligation_id text not null,
  owner_agent text not null,
  trace_id text not null,
  state text not null,
  record jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists brain_outcome_obligation_dispatch_obligation_created
  on public.brain_outcome_obligation_dispatch (obligation_id, created_at desc);
create index if not exists brain_outcome_obligation_dispatch_owner_created
  on public.brain_outcome_obligation_dispatch (owner_agent, created_at desc);

create table if not exists public.brain_outcome_obligation_evidence (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null,
  evidence_ref text not null,
  evidence_type text not null,
  independent boolean not null default false,
  accepted boolean not null default false,
  exact_production boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (idempotency_key, evidence_ref)
);

create index if not exists brain_outcome_obligation_evidence_key_created
  on public.brain_outcome_obligation_evidence (idempotency_key, created_at asc);

alter table public.brain_outcome_obligation_dispatch enable row level security;
alter table public.brain_outcome_obligation_evidence enable row level security;

revoke all on table public.brain_outcome_obligation_dispatch from anon, authenticated;
revoke all on table public.brain_outcome_obligation_evidence from anon, authenticated;
grant select, insert on table public.brain_outcome_obligation_dispatch to service_role;
grant select, insert on table public.brain_outcome_obligation_evidence to service_role;

create or replace function public.brain_outcome_obligation_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'brain outcome obligation runtime evidence is append-only';
end;
$$;

revoke all on function public.brain_outcome_obligation_immutable() from public, anon, authenticated;
grant execute on function public.brain_outcome_obligation_immutable() to service_role;

drop trigger if exists brain_outcome_obligation_dispatch_no_mutation on public.brain_outcome_obligation_dispatch;
create trigger brain_outcome_obligation_dispatch_no_mutation
before update or delete on public.brain_outcome_obligation_dispatch
for each row execute function public.brain_outcome_obligation_immutable();

drop trigger if exists brain_outcome_obligation_evidence_no_mutation on public.brain_outcome_obligation_evidence;
create trigger brain_outcome_obligation_evidence_no_mutation
before update or delete on public.brain_outcome_obligation_evidence
for each row execute function public.brain_outcome_obligation_immutable();

comment on table public.brain_outcome_obligation_dispatch is
  'Immutable idempotent dispatch/recovery presence ledger for BRAIN outcome obligations; Agent Fabric owns lifecycle state.';
comment on table public.brain_outcome_obligation_evidence is
  'Append-only independent outcome evidence for BRAIN outcome obligations.';
