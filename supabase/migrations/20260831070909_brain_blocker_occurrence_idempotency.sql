-- P0 blocker hardening: occurrence delivery is at-least-once, so every occurrence needs its own stable identity.
-- Replaying one occurrence_id must not inflate occurrence_count or create a new blocker episode.

create table if not exists public.brain_blocker_occurrences (
  id uuid primary key default gen_random_uuid(),
  occurrence_id text not null,
  blocker_id uuid references public.brain_blockers(id),
  fingerprint text not null,
  scope text not null,
  environment text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint brain_blocker_occurrences_occurrence_id_unique unique (occurrence_id),
  constraint brain_blocker_occurrences_id_nonempty check (length(btrim(occurrence_id)) > 0),
  constraint brain_blocker_occurrences_fingerprint_nonempty check (length(btrim(fingerprint)) > 0),
  constraint brain_blocker_occurrences_scope_nonempty check (length(btrim(scope)) > 0),
  constraint brain_blocker_occurrences_environment_nonempty check (length(btrim(environment)) > 0)
);

create index if not exists brain_blocker_occurrences_blocker_idx
  on public.brain_blocker_occurrences (blocker_id, created_at);

-- Remove the unsafe entrypoint: a blocker occurrence without a stable occurrence identity
-- cannot distinguish a real recurrence from transport replay.
drop function if exists public.brain_register_blocker_occurrence(text,text,text,text,text,jsonb);

create or replace function public.brain_register_blocker_occurrence(
  p_occurrence_id text,
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
  v_occurrence_row_id uuid;
  v_existing_occurrence public.brain_blocker_occurrences;
  v_blocker public.brain_blockers;
begin
  if nullif(btrim(p_occurrence_id), '') is null
     or nullif(btrim(p_fingerprint), '') is null
     or nullif(btrim(p_scope), '') is null
     or nullif(btrim(p_environment), '') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  if p_severity not in ('LOW','MEDIUM','HIGH','CRITICAL') then
    raise exception 'INVALID_BLOCKER_SEVERITY';
  end if;

  insert into public.brain_blocker_occurrences (
    occurrence_id,
    fingerprint,
    scope,
    environment,
    evidence
  ) values (
    p_occurrence_id,
    p_fingerprint,
    p_scope,
    p_environment,
    coalesce(p_evidence, '{}'::jsonb)
  )
  on conflict (occurrence_id) do nothing
  returning id into v_occurrence_row_id;

  if not found then
    select * into v_existing_occurrence
      from public.brain_blocker_occurrences
     where occurrence_id = p_occurrence_id;

    if not found then
      raise exception 'BLOCKER_OCCURRENCE_STATE_UNKNOWN';
    end if;

    if v_existing_occurrence.fingerprint is distinct from p_fingerprint
       or v_existing_occurrence.scope is distinct from p_scope
       or v_existing_occurrence.environment is distinct from p_environment then
      raise exception 'BLOCKER_OCCURRENCE_IDENTITY_CONFLICT';
    end if;

    if v_existing_occurrence.blocker_id is null then
      raise exception 'BLOCKER_OCCURRENCE_STATE_UNKNOWN';
    end if;

    select * into v_blocker
      from public.brain_blockers
     where id = v_existing_occurrence.blocker_id;

    if not found then
      raise exception 'BLOCKER_OCCURRENCE_STATE_UNKNOWN';
    end if;

    return v_blocker;
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
    last_seen_at = clock_timestamp(),
    updated_at = clock_timestamp(),
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

  update public.brain_blocker_occurrences
     set blocker_id = v_blocker.id
   where id = v_occurrence_row_id;

  return v_blocker;
end;
$$;

alter table public.brain_blocker_occurrences enable row level security;

revoke all on table public.brain_blocker_occurrences from public, anon, authenticated, service_role;
grant select, insert on table public.brain_blocker_occurrences to service_role;

alter function public.brain_register_blocker_occurrence(text,text,text,text,text,text,jsonb)
  set search_path = public;
revoke all on function public.brain_register_blocker_occurrence(text,text,text,text,text,text,jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.brain_register_blocker_occurrence(text,text,text,text,text,text,jsonb)
  to service_role;

comment on table public.brain_blocker_occurrences is
  'Append-only blocker occurrence inbox. Stable occurrence_id deduplicates at-least-once transport replay before the canonical blocker occurrence_count is changed.';

comment on function public.brain_register_blocker_occurrence(text,text,text,text,text,text,jsonb) is
  'Registers one semantically unique blocker occurrence. Same occurrence_id is a verified no-op and returns its original blocker; reusing an occurrence_id for another blocker identity fails closed.';
