-- P0 Control Plane: canonical business Obligation Registry.
-- One logical business obligation per type/capability/entity/period/timezone.

create table if not exists public.brain_obligations (
  id uuid primary key default gen_random_uuid(),
  obligation_type text not null,
  capability_id text not null,
  business_entity text not null,
  business_period text not null,
  business_timezone text not null,
  payload_sha256 text not null,
  change_id text,
  owner text,
  state text not null default 'OPEN',
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brain_obligations_logical_key_unique unique (
    obligation_type,
    capability_id,
    business_entity,
    business_period,
    business_timezone
  ),
  constraint brain_obligations_state_check check (
    state in ('OPEN','READY','RUNNING','BLOCKED','FULFILLED','BREACHED','CANCELLED')
  ),
  constraint brain_obligations_type_nonempty check (length(btrim(obligation_type)) > 0),
  constraint brain_obligations_capability_nonempty check (length(btrim(capability_id)) > 0),
  constraint brain_obligations_entity_nonempty check (length(btrim(business_entity)) > 0),
  constraint brain_obligations_period_nonempty check (length(btrim(business_period)) > 0),
  constraint brain_obligations_timezone_nonempty check (length(btrim(business_timezone)) > 0),
  constraint brain_obligations_payload_hash_nonempty check (length(btrim(payload_sha256)) > 0)
);

create index if not exists brain_obligations_state_idx
  on public.brain_obligations (state, business_period, updated_at);

create or replace function public.brain_create_obligation(
  p_obligation_type text,
  p_capability_id text,
  p_business_entity text,
  p_business_period text,
  p_business_timezone text,
  p_payload_sha256 text,
  p_change_id text default null,
  p_owner text default null
)
returns public.brain_obligations
language plpgsql
as $$
declare
  v_obligation public.brain_obligations;
begin
  if nullif(btrim(p_obligation_type), '') is null
     or nullif(btrim(p_capability_id), '') is null
     or nullif(btrim(p_business_entity), '') is null
     or nullif(btrim(p_business_period), '') is null
     or nullif(btrim(p_business_timezone), '') is null
     or nullif(btrim(p_payload_sha256), '') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  if not exists (
    select 1 from pg_timezone_names where name = p_business_timezone
  ) then
    raise exception 'INVALID_BUSINESS_TIMEZONE';
  end if;

  insert into public.brain_obligations (
    obligation_type,
    capability_id,
    business_entity,
    business_period,
    business_timezone,
    payload_sha256,
    change_id,
    owner
  ) values (
    p_obligation_type,
    p_capability_id,
    p_business_entity,
    p_business_period,
    p_business_timezone,
    p_payload_sha256,
    p_change_id,
    p_owner
  )
  on conflict (
    obligation_type,
    capability_id,
    business_entity,
    business_period,
    business_timezone
  ) do nothing
  returning * into v_obligation;

  if found then
    return v_obligation;
  end if;

  select *
    into v_obligation
    from public.brain_obligations
   where obligation_type = p_obligation_type
     and capability_id = p_capability_id
     and business_entity = p_business_entity
     and business_period = p_business_period
     and business_timezone = p_business_timezone;

  if not found then
    raise exception 'OBLIGATION_UNIQUENESS_STATE_UNKNOWN';
  end if;

  if v_obligation.payload_sha256 is distinct from p_payload_sha256 then
    raise exception 'OBLIGATION_PAYLOAD_CONFLICT';
  end if;

  return v_obligation;
end;
$$;

alter table public.brain_obligations enable row level security;

revoke all on table public.brain_obligations from public, anon, authenticated, service_role;
grant select, insert, update on table public.brain_obligations to service_role;

alter function public.brain_create_obligation(text,text,text,text,text,text,text,text)
  set search_path = public;
revoke all on function public.brain_create_obligation(text,text,text,text,text,text,text,text)
  from public, anon, authenticated, service_role;
grant execute on function public.brain_create_obligation(text,text,text,text,text,text,text,text)
  to service_role;

comment on table public.brain_obligations is
  'Canonical P0 business obligation registry. Logical uniqueness includes explicit business timezone so scheduler misses cannot create duplicate or DST-ambiguous obligations.';

comment on function public.brain_create_obligation(text,text,text,text,text,text,text,text) is
  'Creates one logical obligation. Same logical key + same payload returns existing obligation; payload drift raises OBLIGATION_PAYLOAD_CONFLICT.';
