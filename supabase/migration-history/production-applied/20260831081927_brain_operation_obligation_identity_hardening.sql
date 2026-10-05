-- P0 hardening: immutable logical identity + controlled CAS lifecycle transitions.
-- Create RPCs keep idempotency/uniqueness ownership. Lifecycle updates are command-boundary only.

alter table public.brain_obligations
  add column if not exists version bigint not null default 1;

do $$ begin
  alter table public.brain_obligations
    add constraint brain_obligations_version_positive check(version > 0);
exception when duplicate_object then null;
end $$;

create or replace function public.brain_guard_operation_identity()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.id is distinct from old.id
     or new.capability_id is distinct from old.capability_id
     or new.operation_type is distinct from old.operation_type
     or new.idempotency_key is distinct from old.idempotency_key
     or new.payload_sha256 is distinct from old.payload_sha256
     or new.change_id is distinct from old.change_id
     or new.correlation_id is distinct from old.correlation_id
     or new.created_at is distinct from old.created_at then
    raise exception 'OPERATION_IDENTITY_IMMUTABLE';
  end if;
  return new;
end;
$$;

drop trigger if exists brain_guard_operation_identity_trigger on public.brain_operations;
create trigger brain_guard_operation_identity_trigger
before update on public.brain_operations
for each row execute function public.brain_guard_operation_identity();

create or replace function public.brain_guard_obligation_identity()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  if new.id is distinct from old.id
     or new.obligation_type is distinct from old.obligation_type
     or new.capability_id is distinct from old.capability_id
     or new.business_entity is distinct from old.business_entity
     or new.business_period is distinct from old.business_period
     or new.business_timezone is distinct from old.business_timezone
     or new.payload_sha256 is distinct from old.payload_sha256
     or new.change_id is distinct from old.change_id
     or new.created_at is distinct from old.created_at then
    raise exception 'OBLIGATION_IDENTITY_IMMUTABLE';
  end if;
  return new;
end;
$$;

drop trigger if exists brain_guard_obligation_identity_trigger on public.brain_obligations;
create trigger brain_guard_obligation_identity_trigger
before update on public.brain_obligations
for each row execute function public.brain_guard_obligation_identity();

create or replace function public.brain_transition_operation(
  p_operation_id uuid,
  p_expected_version bigint,
  p_status text,
  p_dispatch_generation bigint default null,
  p_remote_ref text default null,
  p_evidence jsonb default null
)
returns public.brain_operations
language plpgsql
security definer
set search_path=public
as $$
declare
  v_row public.brain_operations;
begin
  if p_operation_id is null or p_expected_version is null or p_expected_version < 1
     or p_status not in ('PLANNED','DISPATCHED','OBSERVED_SUCCEEDED','VERIFIED','RESULT_UNKNOWN','FAILED','COMPENSATED')
     or (p_dispatch_generation is not null and p_dispatch_generation < 0) then
    raise exception 'VALIDATION_ERROR';
  end if;

  update public.brain_operations
     set status=p_status,
         dispatch_generation=coalesce(p_dispatch_generation,dispatch_generation),
         remote_ref=coalesce(p_remote_ref,remote_ref),
         evidence=coalesce(p_evidence,evidence),
         version=version+1,
         updated_at=now()
   where id=p_operation_id and version=p_expected_version
   returning * into v_row;

  if found then return v_row; end if;
  if not exists(select 1 from public.brain_operations where id=p_operation_id) then
    raise exception 'OPERATION_NOT_FOUND';
  end if;
  raise exception 'STATE_VERSION_CONFLICT';
end;
$$;

create or replace function public.brain_transition_obligation(
  p_obligation_id uuid,
  p_expected_version bigint,
  p_state text,
  p_owner text default null,
  p_evidence jsonb default null
)
returns public.brain_obligations
language plpgsql
security definer
set search_path=public
as $$
declare
  v_row public.brain_obligations;
begin
  if p_obligation_id is null or p_expected_version is null or p_expected_version < 1
     or p_state not in ('OPEN','READY','RUNNING','BLOCKED','FULFILLED','BREACHED','CANCELLED') then
    raise exception 'VALIDATION_ERROR';
  end if;

  update public.brain_obligations
     set state=p_state,
         owner=coalesce(p_owner,owner),
         evidence=coalesce(p_evidence,evidence),
         version=version+1,
         updated_at=now()
   where id=p_obligation_id and version=p_expected_version
   returning * into v_row;

  if found then return v_row; end if;
  if not exists(select 1 from public.brain_obligations where id=p_obligation_id) then
    raise exception 'OBLIGATION_NOT_FOUND';
  end if;
  raise exception 'STATE_VERSION_CONFLICT';
end;
$$;

revoke update on table public.brain_operations from service_role;
revoke update on table public.brain_obligations from service_role;

revoke all on function public.brain_transition_operation(uuid,bigint,text,bigint,text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.brain_transition_operation(uuid,bigint,text,bigint,text,jsonb) to service_role;
grant execute on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) to service_role;

comment on function public.brain_transition_operation(uuid,bigint,text,bigint,text,jsonb) is
  'CAS lifecycle boundary for brain_operations. Logical identity and payload are immutable.';
comment on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) is
  'CAS lifecycle boundary for brain_obligations. Logical business identity and payload are immutable.';
