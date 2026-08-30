-- BRAIN-DELIVERY-v2 persistent delivery evidence and idempotency ledger.
-- GitHub remains executable SSOT; this table is runtime evidence only.

create table if not exists public.brain_delivery_evidence (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  change_id text not null,
  component_id text not null,
  target text not null check (target in ('notion', 'make', 'supabase', 'dataforseo')),
  status text not null check (status in ('GREEN', 'RED')),
  error_class text check (error_class is null or error_class in ('AUTH', 'TRANSIENT', 'VALIDATION', 'POLICY', 'REMOTE')),
  remote_status integer,
  remote_ref text,
  candidate_identity text,
  tested_identity text,
  payload_sha256 text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists brain_delivery_evidence_change_created
  on public.brain_delivery_evidence (change_id, created_at desc);
create index if not exists brain_delivery_evidence_target_created
  on public.brain_delivery_evidence (target, created_at desc);

alter table public.brain_delivery_evidence enable row level security;

-- Runtime evidence is never exposed through anon/authenticated API roles.
-- The server-side service_role is the only SQL API principal allowed to append/read.
revoke all on table public.brain_delivery_evidence from anon, authenticated;
grant select, insert on table public.brain_delivery_evidence to service_role;

create or replace function public.brain_delivery_evidence_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'brain_delivery_evidence is append-only';
end;
$$;

drop trigger if exists brain_delivery_evidence_no_mutation on public.brain_delivery_evidence;
create trigger brain_delivery_evidence_no_mutation
before update or delete on public.brain_delivery_evidence
for each row execute function public.brain_delivery_evidence_immutable();

comment on table public.brain_delivery_evidence is
  'Append-only runtime evidence for BRAIN-DELIVERY-v2 external application delivery. GitHub is executable SSOT.';
