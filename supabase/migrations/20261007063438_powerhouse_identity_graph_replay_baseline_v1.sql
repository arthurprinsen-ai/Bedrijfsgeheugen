-- Lossless replay baseline for the canonical Identity Graph.
-- Production already owns this table with ~47k rows. Never copy production data.
-- This new additive, dependency-ordered migration restores fresh-branch replay
-- before 20261007063440_bound_commercial_identity_graph_runtime_v2.sql.
-- No direct migration-ledger mutation. All guards are idempotent.
create table if not exists public.powerhouse_identity_graph_v1 (
  graph_id uuid primary key default gen_random_uuid(),
  entity_type text not null
    constraint powerhouse_identity_graph_v1_entity_type_check
      check (entity_type in ('person','company')),
  entity_key text not null,
  person_key text,
  company_key text,
  identifier_type text not null,
  identifier_hash text not null,
  source text not null,
  confidence numeric not null default 0.5
    constraint powerhouse_identity_graph_v1_confidence_check
      check (confidence >= 0 and confidence <= 1),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  constraint powerhouse_identity_graph_v1_entity_type_identifier_type_id_key
    unique (entity_type,identifier_type,identifier_hash)
);

create index if not exists idx_powerhouse_identity_graph_company
  on public.powerhouse_identity_graph_v1(company_key) where company_key is not null;
create index if not exists idx_powerhouse_identity_graph_entity
  on public.powerhouse_identity_graph_v1(entity_type,entity_key);
create index if not exists idx_powerhouse_identity_graph_person
  on public.powerhouse_identity_graph_v1(person_key) where person_key is not null;

alter table public.powerhouse_identity_graph_v1 enable row level security;
revoke all on table public.powerhouse_identity_graph_v1 from public, anon, authenticated;
grant all on table public.powerhouse_identity_graph_v1 to service_role;

do $policy$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public'
      and tablename='powerhouse_identity_graph_v1'
      and policyname='powerhouse_identity_graph_service_v1'
  ) then
    create policy powerhouse_identity_graph_service_v1
    on public.powerhouse_identity_graph_v1
    for all to service_role using (true) with check (true);
  end if;
end;
$policy$;
