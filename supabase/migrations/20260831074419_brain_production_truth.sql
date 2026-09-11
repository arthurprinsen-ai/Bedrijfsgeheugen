-- P0 Production Truth: desired state + append-only observations + derived truth.
-- No caller can set GREEN directly. Truth is reconciled from desired state, latest observation and freshness.

create table if not exists public.brain_desired_states (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id text not null,
  environment text not null,
  desired_state jsonb not null,
  artifact_version text,
  version bigint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brain_desired_states_scope_unique unique(subject_type,subject_id,environment),
  constraint brain_desired_states_subject_type_nonempty check(length(btrim(subject_type))>0),
  constraint brain_desired_states_subject_id_nonempty check(length(btrim(subject_id))>0),
  constraint brain_desired_states_environment_nonempty check(length(btrim(environment))>0)
);

create table if not exists public.brain_observed_states (
  id uuid primary key default gen_random_uuid(),
  observation_id text not null unique,
  subject_type text not null,
  subject_id text not null,
  environment text not null,
  observed_state jsonb not null,
  artifact_version text,
  evidence jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null,
  valid_until timestamptz not null,
  created_at timestamptz not null default now(),
  constraint brain_observed_states_observation_id_nonempty check(length(btrim(observation_id))>0),
  constraint brain_observed_states_subject_type_nonempty check(length(btrim(subject_type))>0),
  constraint brain_observed_states_subject_id_nonempty check(length(btrim(subject_id))>0),
  constraint brain_observed_states_environment_nonempty check(length(btrim(environment))>0),
  constraint brain_observed_states_freshness_valid check(valid_until>=observed_at)
);
comment on table public.brain_observed_states is 'Append-only production observations. Replays use stable observation_id; existing observations are never updated or deleted.';

create index if not exists brain_observed_states_latest_idx
  on public.brain_observed_states(subject_type,subject_id,environment,observed_at desc,created_at desc);

create table if not exists public.brain_production_truth (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null,
  subject_id text not null,
  environment text not null,
  desired_state_id uuid references public.brain_desired_states(id),
  desired_version bigint,
  observation_id text references public.brain_observed_states(observation_id),
  status text not null,
  reason text not null,
  observed_at timestamptz,
  valid_until timestamptz,
  reconciled_at timestamptz not null default now(),
  version bigint not null default 1,
  constraint brain_production_truth_scope_unique unique(subject_type,subject_id,environment),
  constraint brain_production_truth_status_valid check(status in ('GREEN_VERIFIED','GREEN_STALE','DRIFTED','UNKNOWN'))
);

create or replace function public.brain_register_desired_state(
  p_subject_type text,
  p_subject_id text,
  p_environment text,
  p_desired_state jsonb,
  p_artifact_version text default null,
  p_expected_version bigint default null
)
returns public.brain_desired_states
language plpgsql
as $$
declare
  v_row public.brain_desired_states;
begin
  if nullif(btrim(p_subject_type),'') is null
     or nullif(btrim(p_subject_id),'') is null
     or nullif(btrim(p_environment),'') is null
     or p_desired_state is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_row from public.brain_desired_states
   where subject_type=p_subject_type and subject_id=p_subject_id and environment=p_environment
   for update;

  if found then
    if p_expected_version is null or v_row.version<>p_expected_version then
      raise exception 'STATE_VERSION_CONFLICT';
    end if;
    update public.brain_desired_states
       set desired_state=p_desired_state,
           artifact_version=p_artifact_version,
           version=version+1,
           updated_at=now()
     where id=v_row.id
     returning * into v_row;
    return v_row;
  end if;

  if p_expected_version is not null and p_expected_version<>0 then
    raise exception 'STATE_VERSION_CONFLICT';
  end if;

  insert into public.brain_desired_states(subject_type,subject_id,environment,desired_state,artifact_version)
  values(p_subject_type,p_subject_id,p_environment,p_desired_state,p_artifact_version)
  returning * into v_row;
  return v_row;
end;
$$;

create or replace function public.brain_observe_production_state(
  p_observation_id text,
  p_subject_type text,
  p_subject_id text,
  p_environment text,
  p_observed_state jsonb,
  p_observed_at timestamptz,
  p_valid_until timestamptz,
  p_artifact_version text default null,
  p_evidence jsonb default '{}'::jsonb
)
returns public.brain_observed_states
language plpgsql
as $$
declare
  v_row public.brain_observed_states;
begin
  if nullif(btrim(p_observation_id),'') is null
     or nullif(btrim(p_subject_type),'') is null
     or nullif(btrim(p_subject_id),'') is null
     or nullif(btrim(p_environment),'') is null
     or p_observed_state is null
     or p_observed_at is null
     or p_valid_until is null
     or p_valid_until<p_observed_at then
    raise exception 'VALIDATION_ERROR';
  end if;

  insert into public.brain_observed_states(
    observation_id,subject_type,subject_id,environment,observed_state,
    artifact_version,evidence,observed_at,valid_until
  ) values(
    p_observation_id,p_subject_type,p_subject_id,p_environment,p_observed_state,
    p_artifact_version,coalesce(p_evidence,'{}'::jsonb),p_observed_at,p_valid_until
  )
  on conflict(observation_id) do nothing
  returning * into v_row;

  if found then return v_row; end if;

  select * into v_row from public.brain_observed_states where observation_id=p_observation_id;
  if not found then raise exception 'OBSERVATION_STATE_UNKNOWN'; end if;

  if v_row.subject_type is distinct from p_subject_type
     or v_row.subject_id is distinct from p_subject_id
     or v_row.environment is distinct from p_environment
     or v_row.observed_state is distinct from p_observed_state
     or v_row.artifact_version is distinct from p_artifact_version
     or v_row.evidence is distinct from coalesce(p_evidence,'{}'::jsonb)
     or v_row.observed_at is distinct from p_observed_at
     or v_row.valid_until is distinct from p_valid_until then
    raise exception 'OBSERVATION_IDENTITY_CONFLICT';
  end if;

  return v_row;
end;
$$;

create or replace function public.brain_reconcile_production_truth(
  p_subject_type text,
  p_subject_id text,
  p_environment text,
  p_now timestamptz default now()
)
returns public.brain_production_truth
language plpgsql
as $$
declare
  v_desired public.brain_desired_states;
  v_observed public.brain_observed_states;
  v_status text;
  v_reason text;
  v_truth public.brain_production_truth;
begin
  if nullif(btrim(p_subject_type),'') is null
     or nullif(btrim(p_subject_id),'') is null
     or nullif(btrim(p_environment),'') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_desired from public.brain_desired_states
   where subject_type=p_subject_type and subject_id=p_subject_id and environment=p_environment;

  select * into v_observed from public.brain_observed_states
   where subject_type=p_subject_type and subject_id=p_subject_id and environment=p_environment
   order by observed_at desc, created_at desc
   limit 1;

  if v_desired.id is null then
    v_status:='UNKNOWN'; v_reason:='MISSING_DESIRED_STATE';
  elsif v_observed.id is null then
    v_status:='UNKNOWN'; v_reason:='MISSING_OBSERVATION';
  elsif v_observed.observed_state is distinct from v_desired.desired_state
        or (v_desired.artifact_version is not null and v_observed.artifact_version is distinct from v_desired.artifact_version) then
    v_status:='DRIFTED'; v_reason:='OBSERVED_DIFFERS_FROM_DESIRED';
  elsif v_observed.valid_until<p_now then
    v_status:='GREEN_STALE'; v_reason:='MATCHING_OBSERVATION_EXPIRED';
  else
    v_status:='GREEN_VERIFIED'; v_reason:='MATCHING_FRESH_OBSERVATION';
  end if;

  insert into public.brain_production_truth(
    subject_type,subject_id,environment,desired_state_id,desired_version,
    observation_id,status,reason,observed_at,valid_until,reconciled_at,version
  ) values(
    p_subject_type,p_subject_id,p_environment,v_desired.id,v_desired.version,
    v_observed.observation_id,v_status,v_reason,v_observed.observed_at,v_observed.valid_until,p_now,1
  )
  on conflict(subject_type,subject_id,environment) do update set
    desired_state_id=excluded.desired_state_id,
    desired_version=excluded.desired_version,
    observation_id=excluded.observation_id,
    status=excluded.status,
    reason=excluded.reason,
    observed_at=excluded.observed_at,
    valid_until=excluded.valid_until,
    reconciled_at=excluded.reconciled_at,
    version=public.brain_production_truth.version+1
  returning * into v_truth;

  return v_truth;
end;
$$;

alter table public.brain_desired_states enable row level security;
alter table public.brain_observed_states enable row level security;
alter table public.brain_production_truth enable row level security;

revoke all on table public.brain_desired_states from public,anon,authenticated,service_role;
revoke all on table public.brain_observed_states from public,anon,authenticated,service_role;
revoke all on table public.brain_production_truth from public,anon,authenticated,service_role;
grant select,insert,update on table public.brain_desired_states to service_role;
grant select,insert on table public.brain_observed_states to service_role;
grant select,insert,update on table public.brain_production_truth to service_role;

alter function public.brain_register_desired_state(text,text,text,jsonb,text,bigint) set search_path=public;
alter function public.brain_observe_production_state(text,text,text,text,jsonb,timestamptz,timestamptz,text,jsonb) set search_path=public;
alter function public.brain_reconcile_production_truth(text,text,text,timestamptz) set search_path=public;

revoke all on function public.brain_register_desired_state(text,text,text,jsonb,text,bigint) from public,anon,authenticated,service_role;
revoke all on function public.brain_observe_production_state(text,text,text,text,jsonb,timestamptz,timestamptz,text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.brain_reconcile_production_truth(text,text,text,timestamptz) from public,anon,authenticated,service_role;
grant execute on function public.brain_register_desired_state(text,text,text,jsonb,text,bigint) to service_role;
grant execute on function public.brain_observe_production_state(text,text,text,text,jsonb,timestamptz,timestamptz,text,jsonb) to service_role;
grant execute on function public.brain_reconcile_production_truth(text,text,text,timestamptz) to service_role;

comment on table public.brain_production_truth is 'Derived current production truth. GREEN_VERIFIED is only produced by reconciliation from desired state plus fresh matching observation; there is no direct green setter.';
