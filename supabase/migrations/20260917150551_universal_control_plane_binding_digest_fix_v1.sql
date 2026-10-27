create or replace function public.brain_create_operation(
  p_capability_id text,
  p_operation_type text,
  p_idempotency_key text,
  p_payload_sha256 text,
  p_change_id text default null,
  p_correlation_id text default null
)
returns public.brain_operations
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_operation public.brain_operations;
  v_actor_kind text;
  v_session_key text;
begin
  if nullif(btrim(p_capability_id), '') is null
     or nullif(btrim(p_operation_type), '') is null
     or nullif(btrim(p_idempotency_key), '') is null
     or nullif(btrim(p_payload_sha256), '') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  v_actor_kind := case
    when p_capability_id like 'agent:%' then 'agent'
    when coalesce(p_correlation_id,'') like 'chat-%' then 'chat'
    else 'runtime'
  end;
  v_session_key := coalesce(
    nullif(btrim(p_correlation_id),''),
    'op:'||encode(extensions.digest(p_capability_id||'|'||p_operation_type||'|'||p_idempotency_key,'sha256'),'hex')
  );

  perform set_config('powerhouse.control_plane_admission','brain_create_operation_v2',true);

  insert into public.brain_operations (
    capability_id, operation_type, idempotency_key, payload_sha256, change_id, correlation_id
  ) values (
    p_capability_id, p_operation_type, p_idempotency_key, p_payload_sha256, p_change_id, p_correlation_id
  )
  on conflict (capability_id, operation_type, idempotency_key) do nothing
  returning * into v_operation;

  if not found then
    select * into v_operation
      from public.brain_operations
     where capability_id=p_capability_id
       and operation_type=p_operation_type
       and idempotency_key=p_idempotency_key;
    if not found then raise exception 'OPERATION_IDEMPOTENCY_STATE_UNKNOWN'; end if;
    if v_operation.payload_sha256 is distinct from p_payload_sha256 then
      raise exception 'IDEMPOTENCY_PAYLOAD_CONFLICT';
    end if;
  end if;

  insert into public.brain_control_plane_bindings(operation_id,actor_kind,actor_id,session_key,admitted_via,admitted_by,evidence)
  values (
    v_operation.id,
    v_actor_kind,
    p_capability_id,
    v_session_key,
    'brain_create_operation_v2',
    session_user,
    jsonb_build_object('contract','universal-agent-chat-control-plane-binding-proof-v1','change_id',p_change_id,'correlation_id',p_correlation_id)
  )
  on conflict (operation_id) do nothing;

  if not exists(select 1 from public.brain_control_plane_bindings b where b.operation_id=v_operation.id) then
    raise exception 'CONTROL_PLANE_BINDING_MISSING';
  end if;

  return v_operation;
end;
$function$;

revoke all on function public.brain_create_operation(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.brain_create_operation(text,text,text,text,text,text) to service_role;
