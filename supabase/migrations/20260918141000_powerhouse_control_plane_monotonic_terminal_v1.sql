-- powerhouse control-plane monotonic terminal guard v1
-- Prevents terminal truth from being reopened by callers while preserving existing nonterminal recovery routes.

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
set search_path to 'public','pg_catalog'
as $function$
declare
  v_current public.brain_operations;
  v_row public.brain_operations;
begin
  if p_operation_id is null or p_expected_version is null or p_expected_version < 1
     or p_status not in ('PLANNED','DISPATCHED','OBSERVED_SUCCEEDED','VERIFIED','RESULT_UNKNOWN','FAILED','COMPENSATED')
     or (p_dispatch_generation is not null and p_dispatch_generation < 0) then
    raise exception 'VALIDATION_ERROR';
  end if;

  if not exists(select 1 from public.brain_control_plane_bindings b where b.operation_id=p_operation_id) then
    raise exception 'CONTROL_PLANE_BINDING_REQUIRED';
  end if;

  select * into v_current
  from public.brain_operations
  where id=p_operation_id
  for update;

  if not found then
    raise exception 'OPERATION_NOT_FOUND';
  end if;

  if v_current.version is distinct from p_expected_version then
    raise exception 'STATE_VERSION_CONFLICT';
  end if;

  -- Terminal truth is monotonic. Replay may refresh evidence only by repeating the same terminal state.
  if v_current.status='VERIFIED' and p_status<>'VERIFIED' then
    raise exception 'TERMINAL_STATE_REOPEN_FORBIDDEN:VERIFIED';
  end if;

  if v_current.status='COMPENSATED' and p_status<>'COMPENSATED' then
    raise exception 'TERMINAL_STATE_REOPEN_FORBIDDEN:COMPENSATED';
  end if;

  update public.brain_operations
     set status=p_status,
         dispatch_generation=coalesce(p_dispatch_generation,dispatch_generation),
         remote_ref=coalesce(p_remote_ref,remote_ref),
         evidence=coalesce(p_evidence,evidence),
         version=version+1,
         updated_at=now()
   where id=p_operation_id
   returning * into v_row;

  return v_row;
end;
$function$;

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
set search_path to 'public','pg_catalog'
as $function$
declare
  v_current public.brain_obligations;
  v_row public.brain_obligations;
begin
  if p_obligation_id is null or p_expected_version is null or p_expected_version < 1
     or p_state not in ('OPEN','READY','RUNNING','BLOCKED','FULFILLED','BREACHED','CANCELLED') then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_current
  from public.brain_obligations
  where id=p_obligation_id
  for update;

  if not found then
    raise exception 'OBLIGATION_NOT_FOUND';
  end if;

  if v_current.version is distinct from p_expected_version then
    raise exception 'STATE_VERSION_CONFLICT';
  end if;

  -- Canonical terminal states are monotonic. Same-state replays are allowed for evidence refresh.
  if v_current.state='FULFILLED' and p_state<>'FULFILLED' then
    raise exception 'TERMINAL_STATE_REOPEN_FORBIDDEN:FULFILLED';
  end if;

  if v_current.state='CANCELLED' and p_state<>'CANCELLED' then
    raise exception 'TERMINAL_STATE_REOPEN_FORBIDDEN:CANCELLED';
  end if;

  if v_current.state='BREACHED' and p_state<>'BREACHED' then
    raise exception 'TERMINAL_STATE_REOPEN_FORBIDDEN:BREACHED';
  end if;

  update public.brain_obligations as bo
     set state=p_state,
         owner=coalesce(p_owner,bo.owner),
         evidence=coalesce(p_evidence,bo.evidence),
         version=bo.version+1,
         updated_at=now()
   where bo.id=p_obligation_id
   returning * into v_row;

  return v_row;
end;
$function$;

comment on function public.brain_transition_operation(uuid,bigint,text,bigint,text,jsonb) is
  'Canonical operation transition authority. Terminal VERIFIED/COMPENSATED truth is monotonic; same-state replay may refresh evidence.';

comment on function public.brain_transition_obligation(uuid,bigint,text,text,jsonb) is
  'Canonical obligation transition authority. FULFILLED/CANCELLED/BREACHED truth is monotonic; same-state replay may refresh evidence.';
