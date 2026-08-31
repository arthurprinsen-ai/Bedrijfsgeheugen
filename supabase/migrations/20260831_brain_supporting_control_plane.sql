-- Supporting Wave-1 control plane: Reconciliation, Failure/Learning Registry and Minimal Command API.

-- 1) Durable reconciliation --------------------------------------------------
create table if not exists public.brain_reconciliation_jobs (
  id uuid primary key default gen_random_uuid(),
  job_key text not null unique,
  operation_id uuid not null references public.brain_operations(id),
  reason text not null,
  state text not null default 'PENDING',
  attempt_count integer not null default 0,
  max_attempts integer not null default 5,
  no_progress_signature text,
  no_progress_count integer not null default 0,
  claimed_by text,
  claim_until timestamptz,
  next_attempt_at timestamptz not null default now(),
  last_observation jsonb,
  evidence jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  constraint brain_recon_key_nonempty check(length(btrim(job_key))>0),
  constraint brain_recon_reason_nonempty check(length(btrim(reason))>0),
  constraint brain_recon_state_valid check(state in ('PENDING','CLAIMED','RESOLVED','ESCALATED')),
  constraint brain_recon_attempts_valid check(attempt_count>=0 and max_attempts between 1 and 20),
  constraint brain_recon_no_progress_nonnegative check(no_progress_count>=0)
);
create index if not exists brain_reconciliation_claim_idx on public.brain_reconciliation_jobs(state,next_attempt_at,claim_until,created_at);

create or replace function public.brain_schedule_reconciliation(
  p_job_key text,p_operation_id uuid,p_reason text,p_max_attempts integer default 5,p_evidence jsonb default null
) returns public.brain_reconciliation_jobs
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_reconciliation_jobs;
begin
  if nullif(btrim(p_job_key),'') is null or p_operation_id is null or nullif(btrim(p_reason),'') is null
     or p_max_attempts<1 or p_max_attempts>20 then raise exception 'VALIDATION_ERROR'; end if;
  insert into public.brain_reconciliation_jobs(job_key,operation_id,reason,max_attempts,evidence)
  values(p_job_key,p_operation_id,p_reason,p_max_attempts,p_evidence)
  on conflict(job_key) do nothing returning * into v_row;
  if found then return v_row; end if;
  select * into v_row from public.brain_reconciliation_jobs where job_key=p_job_key;
  if v_row.operation_id is distinct from p_operation_id or v_row.reason is distinct from p_reason or v_row.max_attempts is distinct from p_max_attempts then
    raise exception 'RECONCILIATION_JOB_IDENTITY_CONFLICT';
  end if;
  return v_row;
end; $$;

create or replace function public.brain_claim_reconciliation(
  p_worker_id text,p_limit integer default 10,p_lease_seconds integer default 60
) returns setof public.brain_reconciliation_jobs
language plpgsql security definer set search_path=public as $$
begin
  if nullif(btrim(p_worker_id),'') is null or p_limit<1 or p_limit>100 or p_lease_seconds<1 or p_lease_seconds>3600 then raise exception 'VALIDATION_ERROR'; end if;
  return query
  with candidates as (
    select id from public.brain_reconciliation_jobs
    where ((state='PENDING' and next_attempt_at<=now()) or (state='CLAIMED' and claim_until<now()))
      and attempt_count<max_attempts
    order by next_attempt_at,created_at
    for update skip locked
    limit p_limit
  )
  update public.brain_reconciliation_jobs j set
    state='CLAIMED',claimed_by=p_worker_id,claim_until=now()+make_interval(secs=>p_lease_seconds),
    attempt_count=attempt_count+1,updated_at=now()
  from candidates c where j.id=c.id returning j.*;
end; $$;

create or replace function public.brain_record_reconciliation(
  p_job_key text,p_worker_id text,p_result text,p_observation jsonb,p_progress_signature text default null,
  p_next_attempt_seconds integer default 60,p_evidence jsonb default null
) returns public.brain_reconciliation_jobs
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_reconciliation_jobs; v_no_progress integer;
begin
  if nullif(btrim(p_job_key),'') is null or nullif(btrim(p_worker_id),'') is null
     or p_result not in ('RESOLVED','PROGRESS','NO_PROGRESS','RETRYABLE_ERROR')
     or p_next_attempt_seconds<1 or p_next_attempt_seconds>86400 then raise exception 'VALIDATION_ERROR'; end if;
  select * into v_row from public.brain_reconciliation_jobs where job_key=p_job_key for update;
  if not found then raise exception 'RECONCILIATION_JOB_NOT_FOUND'; end if;
  if v_row.state<>'CLAIMED' or v_row.claimed_by is distinct from p_worker_id then raise exception 'RECONCILIATION_CLAIM_OWNERSHIP_CONFLICT'; end if;

  if p_result='RESOLVED' then
    update public.brain_reconciliation_jobs set state='RESOLVED',resolved_at=now(),claimed_by=null,claim_until=null,
      last_observation=p_observation,evidence=coalesce(p_evidence,evidence),updated_at=now()
    where id=v_row.id returning * into v_row;
    return v_row;
  end if;

  v_no_progress := case when p_result='NO_PROGRESS' then
      case when v_row.no_progress_signature is not distinct from p_progress_signature then v_row.no_progress_count+1 else 1 end
    else 0 end;

  update public.brain_reconciliation_jobs set
    state=case when attempt_count>=max_attempts or v_no_progress>=3 then 'ESCALATED' else 'PENDING' end,
    no_progress_signature=case when p_result='NO_PROGRESS' then p_progress_signature else null end,
    no_progress_count=v_no_progress,
    next_attempt_at=now()+make_interval(secs=>p_next_attempt_seconds),
    claimed_by=null,claim_until=null,last_observation=p_observation,evidence=coalesce(p_evidence,evidence),updated_at=now()
  where id=v_row.id returning * into v_row;
  return v_row;
end; $$;

-- 2) Canonical failure/learning registry ------------------------------------
create table if not exists public.brain_failure_registry (
  fingerprint text primary key,
  maturity text not null default 'OBSERVED',
  root_cause text,
  proven_fix text,
  prevention_rule text,
  regression_ref text,
  occurrence_count bigint not null default 0,
  version bigint not null default 1,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  evidence jsonb,
  constraint brain_failure_fingerprint_nonempty check(length(btrim(fingerprint))>0),
  constraint brain_failure_maturity_valid check(maturity in ('OBSERVED','VALIDATED','PROVEN','PREFERRED','DEPRECATED','RETIRED')),
  constraint brain_failure_counts_valid check(occurrence_count>=0 and version>=1)
);
create table if not exists public.brain_failure_occurrences (
  occurrence_id text primary key,
  fingerprint text not null references public.brain_failure_registry(fingerprint),
  payload_sha256 text not null,
  observed_at timestamptz not null default now(),
  evidence jsonb,
  constraint brain_failure_occurrence_nonempty check(length(btrim(occurrence_id))>0 and length(btrim(payload_sha256))>0)
);

create or replace function public.brain_observe_failure(
  p_occurrence_id text,p_fingerprint text,p_payload_sha256 text,p_evidence jsonb default null
) returns public.brain_failure_registry
language plpgsql security definer set search_path=public as $$
declare v_existing public.brain_failure_occurrences; v_row public.brain_failure_registry;
begin
  if nullif(btrim(p_occurrence_id),'') is null or nullif(btrim(p_fingerprint),'') is null or nullif(btrim(p_payload_sha256),'') is null then raise exception 'VALIDATION_ERROR'; end if;

  select * into v_existing from public.brain_failure_occurrences where occurrence_id=p_occurrence_id;
  if found then
    if v_existing.fingerprint is distinct from p_fingerprint or v_existing.payload_sha256 is distinct from p_payload_sha256 then
      raise exception 'FAILURE_OCCURRENCE_IDENTITY_CONFLICT';
    end if;
    select * into v_row from public.brain_failure_registry where fingerprint=p_fingerprint;
    return v_row;
  end if;

  insert into public.brain_failure_registry(fingerprint,occurrence_count,evidence)
  values(p_fingerprint,0,p_evidence)
  on conflict(fingerprint) do nothing;

  insert into public.brain_failure_occurrences(occurrence_id,fingerprint,payload_sha256,evidence)
  values(p_occurrence_id,p_fingerprint,p_payload_sha256,p_evidence);

  update public.brain_failure_registry set occurrence_count=occurrence_count+1,last_seen_at=now(),evidence=coalesce(p_evidence,evidence)
   where fingerprint=p_fingerprint returning * into v_row;
  return v_row;
exception when unique_violation then
  select * into v_existing from public.brain_failure_occurrences where occurrence_id=p_occurrence_id;
  if v_existing.fingerprint is distinct from p_fingerprint or v_existing.payload_sha256 is distinct from p_payload_sha256 then
    raise exception 'FAILURE_OCCURRENCE_IDENTITY_CONFLICT';
  end if;
  select * into v_row from public.brain_failure_registry where fingerprint=p_fingerprint;
  return v_row;
end; $$;

create or replace function public.brain_promote_failure(
  p_fingerprint text,p_expected_version bigint,p_maturity text,p_root_cause text default null,p_proven_fix text default null,
  p_prevention_rule text default null,p_regression_ref text default null,p_evidence jsonb default null
) returns public.brain_failure_registry
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_failure_registry; v_old_rank int; v_new_rank int;
begin
  if nullif(btrim(p_fingerprint),'') is null or p_expected_version<1 or p_maturity not in ('OBSERVED','VALIDATED','PROVEN','PREFERRED','DEPRECATED','RETIRED') then raise exception 'VALIDATION_ERROR'; end if;
  select * into v_row from public.brain_failure_registry where fingerprint=p_fingerprint for update;
  if not found then raise exception 'FAILURE_NOT_FOUND'; end if;
  if v_row.version is distinct from p_expected_version then raise exception 'FAILURE_VERSION_CONFLICT'; end if;
  v_old_rank := case v_row.maturity when 'OBSERVED' then 1 when 'VALIDATED' then 2 when 'PROVEN' then 3 when 'PREFERRED' then 4 when 'DEPRECATED' then 5 when 'RETIRED' then 6 end;
  v_new_rank := case p_maturity when 'OBSERVED' then 1 when 'VALIDATED' then 2 when 'PROVEN' then 3 when 'PREFERRED' then 4 when 'DEPRECATED' then 5 when 'RETIRED' then 6 end;
  if v_new_rank<v_old_rank then raise exception 'KNOWLEDGE_MATURITY_DOWNGRADE_FORBIDDEN'; end if;
  update public.brain_failure_registry set maturity=p_maturity,root_cause=coalesce(p_root_cause,root_cause),proven_fix=coalesce(p_proven_fix,proven_fix),
    prevention_rule=coalesce(p_prevention_rule,prevention_rule),regression_ref=coalesce(p_regression_ref,regression_ref),evidence=coalesce(p_evidence,evidence),version=version+1
   where fingerprint=p_fingerprint returning * into v_row;
  return v_row;
end; $$;

-- 3) Minimal agent-facing Command API ---------------------------------------
create table if not exists public.brain_commands (
  command_id text primary key,
  command_type text not null,
  payload_sha256 text not null,
  payload jsonb not null,
  state text not null default 'PENDING',
  attempt_count integer not null default 0,
  claimed_by text,
  claim_until timestamptz,
  result jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brain_command_identity_nonempty check(length(btrim(command_id))>0 and length(btrim(payload_sha256))>0),
  constraint brain_command_type_valid check(command_type in ('CREATE_OPERATION','TRANSITION_OPERATION','CREATE_OBLIGATION','TRANSITION_OBLIGATION','CLAIM_MUTATION_OWNER','TRANSFER_MUTATION_OWNER','ENQUEUE_OUTBOX','SCHEDULE_RECONCILIATION','OBSERVE_FAILURE')),
  constraint brain_command_state_valid check(state in ('PENDING','CLAIMED','SUCCEEDED','FAILED')),
  constraint brain_command_attempt_nonnegative check(attempt_count>=0)
);
create index if not exists brain_commands_claim_idx on public.brain_commands(state,claim_until,created_at);

create or replace function public.brain_submit_command(
  p_command_id text,p_command_type text,p_payload_sha256 text,p_payload jsonb
) returns public.brain_commands
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_commands;
begin
  if nullif(btrim(p_command_id),'') is null or nullif(btrim(p_payload_sha256),'') is null or p_payload is null
     or p_command_type not in ('CREATE_OPERATION','TRANSITION_OPERATION','CREATE_OBLIGATION','TRANSITION_OBLIGATION','CLAIM_MUTATION_OWNER','TRANSFER_MUTATION_OWNER','ENQUEUE_OUTBOX','SCHEDULE_RECONCILIATION','OBSERVE_FAILURE') then raise exception 'VALIDATION_ERROR'; end if;
  insert into public.brain_commands(command_id,command_type,payload_sha256,payload)
  values(p_command_id,p_command_type,p_payload_sha256,p_payload)
  on conflict(command_id) do nothing returning * into v_row;
  if found then return v_row; end if;
  select * into v_row from public.brain_commands where command_id=p_command_id;
  if v_row.command_type is distinct from p_command_type or v_row.payload_sha256 is distinct from p_payload_sha256 or v_row.payload is distinct from p_payload then
    raise exception 'COMMAND_IDENTITY_CONFLICT';
  end if;
  return v_row;
end; $$;

create or replace function public.brain_claim_commands(
  p_worker_id text,p_limit integer default 10,p_lease_seconds integer default 60
) returns setof public.brain_commands
language plpgsql security definer set search_path=public as $$
begin
  if nullif(btrim(p_worker_id),'') is null or p_limit<1 or p_limit>100 or p_lease_seconds<1 or p_lease_seconds>3600 then raise exception 'VALIDATION_ERROR'; end if;
  return query with candidates as (
    select command_id from public.brain_commands
     where state='PENDING' or (state='CLAIMED' and claim_until<now())
     order by created_at for update skip locked limit p_limit
  ) update public.brain_commands c set state='CLAIMED',claimed_by=p_worker_id,claim_until=now()+make_interval(secs=>p_lease_seconds),
      attempt_count=attempt_count+1,updated_at=now()
    from candidates x where c.command_id=x.command_id returning c.*;
end; $$;

create or replace function public.brain_ack_command(
  p_command_id text,p_worker_id text,p_success boolean,p_result jsonb default null,p_error text default null
) returns public.brain_commands
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_commands;
begin
  if nullif(btrim(p_command_id),'') is null or nullif(btrim(p_worker_id),'') is null or p_success is null then raise exception 'VALIDATION_ERROR'; end if;
  select * into v_row from public.brain_commands where command_id=p_command_id for update;
  if not found then raise exception 'COMMAND_NOT_FOUND'; end if;
  if v_row.state<>'CLAIMED' or v_row.claimed_by is distinct from p_worker_id then raise exception 'COMMAND_CLAIM_OWNERSHIP_CONFLICT'; end if;
  update public.brain_commands set state=case when p_success then 'SUCCEEDED' else 'FAILED' end,result=p_result,
    last_error=case when p_success then null else coalesce(p_error,'COMMAND_FAILED') end,claimed_by=null,claim_until=null,updated_at=now()
   where command_id=p_command_id returning * into v_row;
  return v_row;
end; $$;

-- Server-only tables and RPC mutation boundaries ----------------------------
foreach_table: begin end;
