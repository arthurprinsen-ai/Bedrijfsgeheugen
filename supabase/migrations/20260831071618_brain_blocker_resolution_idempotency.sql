-- P0 blocker hardening: resolution delivery is at-least-once.
-- Every resolution command therefore requires a stable resolution_id in addition to expected-version CAS.

create table if not exists public.brain_blocker_resolutions (
  id uuid primary key default gen_random_uuid(),
  resolution_id text not null,
  blocker_id uuid not null references public.brain_blockers(id),
  expected_version bigint not null,
  resolution_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint brain_blocker_resolutions_resolution_id_unique unique (resolution_id),
  constraint brain_blocker_resolutions_id_nonempty check (length(btrim(resolution_id)) > 0),
  constraint brain_blocker_resolutions_expected_version_positive check (expected_version > 0)
);

create index if not exists brain_blocker_resolutions_blocker_idx
  on public.brain_blocker_resolutions (blocker_id, created_at);

-- Unsafe because transport replay cannot be distinguished from a second logical resolver.
drop function if exists public.brain_resolve_blocker(uuid,bigint,jsonb);

create or replace function public.brain_resolve_blocker(
  p_resolution_id text,
  p_blocker_id uuid,
  p_expected_version bigint,
  p_resolution_evidence jsonb default '{}'::jsonb
)
returns public.brain_blockers
language plpgsql
as $$
declare
  v_resolution public.brain_blocker_resolutions;
  v_blocker public.brain_blockers;
begin
  if nullif(btrim(p_resolution_id), '') is null
     or p_blocker_id is null
     or p_expected_version is null
     or p_expected_version <= 0 then
    raise exception 'VALIDATION_ERROR';
  end if;

  insert into public.brain_blocker_resolutions (
    resolution_id,
    blocker_id,
    expected_version,
    resolution_evidence
  ) values (
    p_resolution_id,
    p_blocker_id,
    p_expected_version,
    coalesce(p_resolution_evidence, '{}'::jsonb)
  )
  on conflict (resolution_id) do nothing
  returning * into v_resolution;

  if not found then
    select * into v_resolution
      from public.brain_blocker_resolutions
     where resolution_id = p_resolution_id;

    if not found then
      raise exception 'BLOCKER_RESOLUTION_STATE_UNKNOWN';
    end if;

    if v_resolution.blocker_id is distinct from p_blocker_id
       or v_resolution.expected_version is distinct from p_expected_version
       or v_resolution.resolution_evidence is distinct from coalesce(p_resolution_evidence, '{}'::jsonb) then
      raise exception 'BLOCKER_RESOLUTION_IDENTITY_CONFLICT';
    end if;

    select * into v_blocker
      from public.brain_blockers
     where id = v_resolution.blocker_id;

    if not found or v_blocker.resolved_at is null or v_blocker.state <> 'RESOLVED' then
      raise exception 'BLOCKER_RESOLUTION_STATE_UNKNOWN';
    end if;

    return v_blocker;
  end if;

  update public.brain_blockers
     set state = 'RESOLVED',
         resolved_at = clock_timestamp(),
         resolution_evidence = coalesce(p_resolution_evidence, '{}'::jsonb),
         updated_at = clock_timestamp(),
         version = version + 1
   where id = p_blocker_id
     and resolved_at is null
     and version = p_expected_version
  returning * into v_blocker;

  if found then
    return v_blocker;
  end if;

  if not exists (select 1 from public.brain_blockers where id = p_blocker_id) then
    raise exception 'BLOCKER_NOT_FOUND';
  end if;

  -- The resolution inbox insert and this failure are in one transaction; raising rolls the new inbox row back.
  raise exception 'STATE_VERSION_CONFLICT';
end;
$$;

alter table public.brain_blocker_resolutions enable row level security;

revoke all on table public.brain_blocker_resolutions from public, anon, authenticated, service_role;
grant select, insert on table public.brain_blocker_resolutions to service_role;

alter function public.brain_resolve_blocker(text,uuid,bigint,jsonb)
  set search_path = public;
revoke all on function public.brain_resolve_blocker(text,uuid,bigint,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.brain_resolve_blocker(text,uuid,bigint,jsonb)
  to service_role;

comment on table public.brain_blocker_resolutions is
  'Append-only blocker resolution command inbox. Stable resolution_id makes at-least-once transport replay idempotent while expected_version protects against stale logical resolvers.';

comment on function public.brain_resolve_blocker(text,uuid,bigint,jsonb) is
  'CAS-resolves once. Replay of the same resolution_id returns the already resolved blocker; reuse for different blocker/version/evidence fails closed.';
