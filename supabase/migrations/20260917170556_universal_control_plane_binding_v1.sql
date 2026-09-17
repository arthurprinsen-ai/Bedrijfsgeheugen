-- Canonical closure for universal-agent-chat-control-plane-binding-proof-v1
-- Production was repaired first; this migration records reproducible repository parity.

create table if not exists public.brain_control_plane_bindings (
  id uuid primary key default gen_random_uuid(),
  operation_id uuid not null unique references public.brain_operations(id) on delete restrict,
  actor_kind text not null check (actor_kind in ('agent','chat','runtime','legacy')),
  actor_id text not null,
  session_key text not null,
  admitted_via text not null,
  admitted_by text not null default current_user,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.brain_control_plane_bindings enable row level security;
revoke all on table public.brain_control_plane_bindings from public, anon, authenticated, service_role;
grant select on table public.brain_control_plane_bindings to service_role;

create or replace function public.brain_control_plane_binding_immutable()
returns trigger language plpgsql set search_path=public,pg_catalog as $function$
begin
  raise exception 'CONTROL_PLANE_BINDING_IMMUTABLE';
end;
$function$;
revoke all on function public.brain_control_plane_binding_immutable() from public, anon, authenticated, service_role;

drop trigger if exists brain_control_plane_binding_no_mutation on public.brain_control_plane_bindings;
create trigger brain_control_plane_binding_no_mutation
before update or delete on public.brain_control_plane_bindings
for each row execute function public.brain_control_plane_binding_immutable();

insert into public.brain_control_plane_bindings(operation_id,actor_kind,actor_id,session_key,admitted_via,admitted_by,evidence)
select o.id,
       case when o.capability_id like 'agent:%' then 'agent'
            when coalesce(o.correlation_id,'') like 'chat-%' then 'chat'
            else 'legacy' end,
       o.capability_id,
       coalesce(nullif(btrim(o.correlation_id),''),'legacy:'||o.id::text),
       'legacy-backfill','migration',
       jsonb_build_object('contract','universal-agent-chat-control-plane-binding-proof-v1','backfilled',true,'source_created_at',o.created_at)
from public.brain_operations o
on conflict (operation_id) do nothing;

create or replace function public.brain_require_control_plane_admission()
returns trigger language plpgsql set search_path=public,pg_catalog as $function$
begin
  if coalesce(current_setting('powerhouse.control_plane_admission',true),'') <> 'brain_create_operation_v2' then
    raise exception 'CONTROL_PLANE_ADMISSION_REQUIRED';
  end if;
  return new;
end;
$function$;
revoke all on function public.brain_require_control_plane_admission() from public, anon, authenticated, service_role;

drop trigger if exists brain_operations_require_control_plane_admission on public.brain_operations;
create trigger brain_operations_require_control_plane_admission
before insert on public.brain_operations
for each row execute function public.brain_require_control_plane_admission();

create or replace function public.brain_create_operation(
  p_capability_id text,
  p_operation_type text,
  p_idempotency_key text,
  p_payload_sha256 text,
  p_change_id text default null,
  p_correlation_id text default null
)
returns public.brain_operations
language plpgsql security definer set search_path=public,pg_catalog
as $function$
declare
  v_operation public.brain_operations;
  v_actor_kind text;
  v_session_key text;
begin
  if nullif(btrim(p_capability_id),'') is null
     or nullif(btrim(p_operation_type),'') is null
     or nullif(btrim(p_idempotency_key),'') is null
     or nullif(btrim(p_payload_sha256),'') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  v_actor_kind := case when p_capability_id like 'agent:%' then 'agent'
                       when coalesce(p_correlation_id,'') like 'chat-%' then 'chat'
                       else 'runtime' end;
  v_session_key := coalesce(nullif(btrim(p_correlation_id),''),
    'op:'||encode(extensions.digest(p_capability_id||'|'||p_operation_type||'|'||p_idempotency_key,'sha256'),'hex'));

  perform set_config('powerhouse.control_plane_admission','brain_create_operation_v2',true);

  insert into public.brain_operations(capability_id,operation_type,idempotency_key,payload_sha256,change_id,correlation_id)
  values(p_capability_id,p_operation_type,p_idempotency_key,p_payload_sha256,p_change_id,p_correlation_id)
  on conflict (capability_id,operation_type,idempotency_key) do nothing
  returning * into v_operation;

  if not found then
    select * into v_operation from public.brain_operations
     where capability_id=p_capability_id and operation_type=p_operation_type and idempotency_key=p_idempotency_key;
    if not found then raise exception 'OPERATION_IDEMPOTENCY_STATE_UNKNOWN'; end if;
    if v_operation.payload_sha256 is distinct from p_payload_sha256 then raise exception 'IDEMPOTENCY_PAYLOAD_CONFLICT'; end if;
  end if;

  insert into public.brain_control_plane_bindings(operation_id,actor_kind,actor_id,session_key,admitted_via,admitted_by,evidence)
  values(v_operation.id,v_actor_kind,p_capability_id,v_session_key,'brain_create_operation_v2',session_user,
         jsonb_build_object('contract','universal-agent-chat-control-plane-binding-proof-v1','change_id',p_change_id,'correlation_id',p_correlation_id))
  on conflict (operation_id) do nothing;

  if not exists(select 1 from public.brain_control_plane_bindings where operation_id=v_operation.id) then
    raise exception 'CONTROL_PLANE_BINDING_MISSING';
  end if;
  return v_operation;
end;
$function$;
revoke all on function public.brain_create_operation(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.brain_create_operation(text,text,text,text,text,text) to service_role;
revoke insert on table public.brain_operations from service_role;

create or replace function public.brain_transition_operation(
  p_operation_id uuid,
  p_expected_version bigint,
  p_status text,
  p_dispatch_generation bigint default null,
  p_remote_ref text default null,
  p_evidence jsonb default null
)
returns public.brain_operations
language plpgsql security definer set search_path=public,pg_catalog
as $function$
declare
  v_current public.brain_operations;
  v_row public.brain_operations;
begin
  if p_operation_id is null or p_expected_version is null or p_expected_version < 1
     or p_status not in ('PLANNED','DISPATCHED','OBSERVED_SUCCEEDED','VERIFIED','RESULT_UNKNOWN','FAILED','COMPENSATED')
     or (p_dispatch_generation is not null and p_dispatch_generation < 0) then raise exception 'VALIDATION_ERROR'; end if;
  if not exists(select 1 from public.brain_control_plane_bindings where operation_id=p_operation_id) then raise exception 'CONTROL_PLANE_BINDING_REQUIRED'; end if;
  select * into v_current from public.brain_operations where id=p_operation_id for update;
  if not found then raise exception 'OPERATION_NOT_FOUND'; end if;
  if v_current.version is distinct from p_expected_version then raise exception 'STATE_VERSION_CONFLICT'; end if;
  update public.brain_operations
     set status=p_status,
         dispatch_generation=coalesce(p_dispatch_generation,dispatch_generation),
         remote_ref=coalesce(p_remote_ref,remote_ref),
         evidence=coalesce(p_evidence,evidence),
         version=version+1,
         updated_at=now()
   where id=p_operation_id returning * into v_row;
  return v_row;
end;
$function$;
revoke all on function public.brain_transition_operation(uuid,bigint,text,bigint,text,jsonb) from public, anon, authenticated;
grant execute on function public.brain_transition_operation(uuid,bigint,text,bigint,text,jsonb) to service_role;

create or replace function public.powerhouse_control_plane_binding_selftest_v1()
returns jsonb
language plpgsql security definer set search_path=public,pg_catalog
as $function$
declare
  v_direct_blocked boolean := false;
  v_err text;
  v_op public.brain_operations;
  v_binding public.brain_control_plane_bindings;
  v_key text := 'control-plane-binding-selftest-'||to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
begin
  begin
    insert into public.brain_operations(capability_id,operation_type,idempotency_key,payload_sha256,correlation_id)
    values('agent:bypass-probe','SELFTEST',v_key,repeat('0',64),'chat-bypass-probe');
  exception when others then
    v_direct_blocked := (sqlerrm='CONTROL_PLANE_ADMISSION_REQUIRED');
    v_err := sqlerrm;
  end;
  if not v_direct_blocked then raise exception 'BYPASS_SELFTEST_FAILED:%',coalesce(v_err,'direct insert unexpectedly succeeded'); end if;
  v_op := public.brain_create_operation('agent:binding-selftest','SELFTEST',v_key||'-canonical',repeat('1',64),
    'universal-agent-chat-control-plane-binding-proof-v1','chat-binding-selftest');
  select * into v_binding from public.brain_control_plane_bindings where operation_id=v_op.id;
  if not found then raise exception 'CANONICAL_BINDING_SELFTEST_FAILED'; end if;
  return jsonb_build_object('contract','universal-agent-chat-control-plane-binding-proof-v1',
    'direct_insert_fail_closed',v_direct_blocked,'direct_insert_error',v_err,
    'canonical_operation_id',v_op.id,'binding_id',v_binding.id,'actor_kind',v_binding.actor_kind,
    'session_key',v_binding.session_key,'admitted_via',v_binding.admitted_via,'tested_at',clock_timestamp());
end;
$function$;
revoke all on function public.powerhouse_control_plane_binding_selftest_v1() from public, anon, authenticated, service_role;
