-- P0 Control Plane: canonical Operation + Idempotency Registry.
-- One logical external mutation keeps one operation identity across retries/reconciliation.

create table if not exists public.brain_operations (
  id uuid primary key default gen_random_uuid(),
  capability_id text not null,
  operation_type text not null,
  idempotency_key text not null,
  payload_sha256 text not null,
  change_id text,
  correlation_id text,
  status text not null default 'PLANNED',
  version bigint not null default 1,
  dispatch_generation bigint not null default 0,
  remote_ref text,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brain_operations_logical_key_unique unique (capability_id, operation_type, idempotency_key),
  constraint brain_operations_status_check check (
    status in (
      'PLANNED',
      'DISPATCHED',
      'OBSERVED_SUCCEEDED',
      'VERIFIED',
      'RESULT_UNKNOWN',
      'FAILED',
      'COMPENSATED'
    )
  ),
  constraint brain_operations_version_positive check (version > 0),
  constraint brain_operations_dispatch_generation_nonnegative check (dispatch_generation >= 0),
  constraint brain_operations_capability_nonempty check (length(btrim(capability_id)) > 0),
  constraint brain_operations_type_nonempty check (length(btrim(operation_type)) > 0),
  constraint brain_operations_idempotency_nonempty check (length(btrim(idempotency_key)) > 0),
  constraint brain_operations_payload_hash_nonempty check (length(btrim(payload_sha256)) > 0)
);

create index if not exists brain_operations_status_idx
  on public.brain_operations (status, updated_at);

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
as $$
declare
  v_operation public.brain_operations;
begin
  if nullif(btrim(p_capability_id), '') is null
     or nullif(btrim(p_operation_type), '') is null
     or nullif(btrim(p_idempotency_key), '') is null
     or nullif(btrim(p_payload_sha256), '') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  insert into public.brain_operations (
    capability_id,
    operation_type,
    idempotency_key,
    payload_sha256,
    change_id,
    correlation_id
  ) values (
    p_capability_id,
    p_operation_type,
    p_idempotency_key,
    p_payload_sha256,
    p_change_id,
    p_correlation_id
  )
  on conflict (capability_id, operation_type, idempotency_key) do nothing
  returning * into v_operation;

  if found then
    return v_operation;
  end if;

  select *
    into v_operation
    from public.brain_operations
   where capability_id = p_capability_id
     and operation_type = p_operation_type
     and idempotency_key = p_idempotency_key;

  if not found then
    raise exception 'OPERATION_IDEMPOTENCY_STATE_UNKNOWN';
  end if;

  if v_operation.payload_sha256 is distinct from p_payload_sha256 then
    raise exception 'IDEMPOTENCY_PAYLOAD_CONFLICT';
  end if;

  return v_operation;
end;
$$;

comment on table public.brain_operations is
  'Canonical P0 operation/idempotency registry. RESULT_UNKNOWN is reconciled by readback using the same operation identity; never create a fresh key for a blind retry.';

comment on function public.brain_create_operation(text,text,text,text,text,text) is
  'Creates one logical operation. Same key + same payload returns existing operation; same key + different payload raises IDEMPOTENCY_PAYLOAD_CONFLICT.';
