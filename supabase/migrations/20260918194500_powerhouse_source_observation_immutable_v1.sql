create table if not exists public.powerhouse_source_observation_v1 (
 tenant_id text not null, observation_id text not null, object_id text not null,
 raw_source_revision text not null, normalized_source_revision text, source_type text not null,
 raw_payload jsonb not null, observed_at timestamptz not null default now(), created_at timestamptz not null default now(),
 primary key (tenant_id, observation_id), unique (tenant_id, raw_source_revision)
);
comment on table public.powerhouse_source_observation_v1 is 'Append-only raw source observations; derived AI interpretations belong in separate projections.';
alter table public.powerhouse_source_observation_v1 enable row level security;
revoke all on public.powerhouse_source_observation_v1 from public, anon, authenticated;
grant select, insert on public.powerhouse_source_observation_v1 to service_role;
create or replace function public.powerhouse_source_observation_immutable_v1() returns trigger language plpgsql set search_path = pg_catalog as $ begin raise exception 'powerhouse source observations are append-only'; end; $$;
drop trigger if exists powerhouse_source_observation_no_update_v1 on public.powerhouse_source_observation_v1;
create trigger powerhouse_source_observation_no_update_v1 before update or delete on public.powerhouse_source_observation_v1 for each row execute function public.powerhouse_source_observation_immutable_v1();
revoke all on function public.powerhouse_source_observation_immutable_v1() from public, anon, authenticated;
