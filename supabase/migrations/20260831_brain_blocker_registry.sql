-- P0 Control Plane: canonical Persistent Blocker State.
-- One active blocker per fingerprint/scope/environment; resolved history remains immutable evidence.

create table if not exists public.brain_blockers (
  id uuid primary key default gen_random_uuid(),
  fingerprint text not null,
  scope text not null,
  environment text not null,
  owner text,
  severity text not null default 'MEDIUM',
  state text not null default 'ACTIVE',
  occurrence_count bigint not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolution_evidence jsonb not null default '{}'::jsonb,
  last_evidence jsonb not null default '{}'::jsonb,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brain_blockers_fingerprint_nonempty check (length(btrim(fingerprint)) > 0),
  constraint brain_blockers_scope_nonempty check (length(btrim(scope)) > 0),
  constraint brain_blockers_environment_nonempty check (length(btrim(environment)) > 0),
  constraint brain_blockers_occurrence_positive check (occurrence_count > 0),
  constraint brain_blockers_version_positive check (version > 0),
  constraint brain_blockers_state_check check (state in ('ACTIVE','WAITING_EXTERNAL','ESCALATED','RESOLVED'))
);

create unique index if not exists brain_blockers_one_active_logical_blocker
  on public.brain_blockers (fingerprint, scope, environment)
  where resolved_at is null;

create index if not exists brain_blockers_active_last_seen_idx
  on public.brain_blockers (environment, last_seen_at desc)
  where resolved_at is null;

create or replace function public.brain_register_blocker_occurrence(
  p_fingerprint text,
  p_scope text,
  p_environment text,
  p_owner text default null,
  p_severity text default 'MEDIUM',
  p_evidence jsonb default '{}'::jsonb
)
returns public.brain_blockers
language plpgsql
as $$
declare
  v_blocker public.brain_blockers;
begin
  if nullif(btrim(p_fingerprint), '') is null
     or nullif(btrim(p_scope), '') is null
     or nullif(btrim(p_environment), '') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  if p_severity not in ('LOW','MEDIUM','HIGH','CRITICAL') then
    raise exception 'INVALID_BLOCKER_SEVERITY';
  end if;

  insert into public.brain_blockers (
    fingerprint,
    scope,
    environment,
    owner,
    severity,
    last_evidence
  ) values (
    p_fingerprint,
    p_scope,
    p_environment,
    p_owner,
    p_severity,
    coalesce(p_evidence, '{}'::jsonb)
  )
  on conflict (fingerprint, scope, environment) where resolved_at is null
  do update set
    occurrence_count = brain_blockers.occurrence_count + 1,
    last_seen_at = now(),
    updated_at = now(),
    version = brain_blockers.version + 1,
    owner = coalesce(excluded.owner, brain_blockers.owner),
    severity = case
      when brain_blockers.severity = 'CRITICAL' or excluded.severity = 'CRITICAL' then 'CRITICAL'
      when brain_blockers.severity = 'HIGH' or excluded.severity = 'HIGH' then 'HIGH'
      when brain_blockers.severity = 'MEDIUM' or excluded.severity = 'MEDIUM' then 'MEDIUM'
      else 'LOW'
    end,
    last_evidence = coalesce(excluded.last_evidence, '{}'::jsonb)
  returning * into v_blocker;

  return v_blocker;
end;
$$;

create or replace function public.brain_resolve_blocker(
  p_blocker_id uuid,
  p_expected_version bigint,
  p_resolution_evidence jsonb default '{}'::jsonb
)
returns public.brain_blockers
language plpgsql
as $$
declare
  v_blocker public.brain_blockers;
begin
  if p_blocker_id is null or p_expected_version is null or p_expected_version <= 0 then
    raise exception 'VALIDATION_ERROR';
  end if;

  update public.brain_blockers
     set state = 'RESOLVED',
         resolved_at = now(),
         resolution_evidence = coalesce(p_resolution_evidence, '{}'::jsonb),
         updated_at = now(),
         version = version + 1
   where id = p_blocker_id
     and resolved_at is null
     and version = p_expected_version
  returning * into v_blocker;

  if found then
    return v_blocker;
  end if;

  if exists (select 1 from public.brain_blockers where id = p_blocker_id and resolved_at is not null) then
    raise exception 'BLOCKER_ALREADY_RESOLVED';
  end if;

  if exists (select 1 from public.brain_blockers where id = p_blocker_id) then
    raise exception 'STATE_VERSION_CONFLICT';
  end if;

  raise exception 'BLOCKER_NOT_FOUND';
end;
$$;

alter table public.brain_blockers enable row level security;

revoke all on table public.brain_blockers from public, anon, authenticated, service_role;
grant select, insert, update on table public.brain_blockers to service_role;

alter function public.brain_register_blocker_occurrence(text,text,text,text,text,jsonb)
  set search_path = public;
revoke all on function public.brain_register_blocker_occurrence(text,text,text,text,text,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.brain_register_blocker_occurrence(text,text,text,text,text,jsonb)
  to service_role;

alter function public.brain_resolve_blocker(uuid,bigint,jsonb)
  set search_path = public;
revoke all on function public.brain_resolve_blocker(uuid,bigint,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.brain_resolve_blocker(uuid,bigint,jsonb)
  to service_role;

comment on table public.brain_blockers is
  'Canonical P0 persistent blocker registry. Repeated occurrences fan into one active fingerprint/scope/environment record; resolved blockers remain as historical evidence.';

comment on function public.brain_register_blocker_occurrence(text,text,text,text,text,jsonb) is
  'Atomically creates or increments one active blocker. first_seen_at is preserved; last_seen_at, occurrence_count and version advance on recurrence.';

comment on function public.brain_resolve_blocker(uuid,bigint,jsonb) is
  'CAS-resolves an active blocker and preserves the historical row. A future recurrence creates a new active blocker rather than mutating resolved history.';
