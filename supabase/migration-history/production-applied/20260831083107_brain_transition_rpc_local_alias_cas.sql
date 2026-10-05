-- Fix transition RPC CAS false conflicts observed in production.
-- Bind parameters to typed locals, lock the canonical row, compare version explicitly, then mutate by id.

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
  v_operation_id uuid := p_operation_id;
  v_expected_version bigint := p_expected_version;
  v_status text := p_status;
  v_dispatch_generation bigint := p_dispatch_generation;
  v_remote_ref text := p_remote_ref;
  v_evidence jsonb := p_evidence;
  v_current public.brain_operations;
  v_row public.brain_operations;
begin
  if v_operation_id is null or v_expected_version is null or v_expected_version < 1
     or v_status not in ('PLANNED','DISPATCHED','OBSERVED_SUCCEEDED','VERIFIED','RESULT_UNKNOWN','FAILED','COMPENSATED')
     or (v_dispatch_generation is not null and v_dispatch_generation < 0) then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_current
    from public.brain_operations
   where id=v_operation_id
   for update;

  if not found then raise exception 'OPERATION_NOT_FOUND'; end if;
  if v_current.version is distinct from v_expected_version then
    raise exception 'STATE_VERSION_CONFLICT';
  end if;

  update public.brain_operations
     set status=v_status,
         dispatch_generation=coalesce(v_dispatch_generation,dispatch_generation),
         remote_ref=coalesce(v_remote_ref,remote_ref),
         evidence=coalesce(v_evidence,evidence),
         version=version+1,
         updated_at=now()
   where id=v_operation_id
   returning * into v_row;

  return v_row;
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
  v_obligation_id uuid := p_obligation_id;
  v_expected_version bigint := p_expected_version;
  v_state text := p_state;
  v_owner text := p_owner;
  v_evidence jsonb := p_evidence;
  v_current public.brain_obligations;
  v_row public.brain_obligations;
begin
  if v_obligation_id is null or v_expected_version is null or v_expected_version < 1
     or v_state not in ('OPEN','READY','RUNNING','BLOCKED','FULFILLED','BREACHED','CANCELLED') then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_current
    from public.brain_obligations
   where id=v_obligation_id
   for update;

  if not found then raise exception 'OBLIGATION_NOT_FOUND'; end if;
  if v_current.version is distinct from v_expected_version then
    raise exception 'STATE_VERSION_CONFLICT';
  end if;

  update public.brain_obligations
     set state=v_state,
         owner=coalesce(v_owner,owner),
         evidence=coalesce(v_evidence,evidence),
         version=version+1,
         updated_at=now()
   where id=v_obligation_id
   returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.brain_transition_operation(uuid,bigint,text,bigint,text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.brain_transition_operation(uuid,bigint,text,bigint,text,jsonb) to service_role;
grant execute on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) to service_role;
