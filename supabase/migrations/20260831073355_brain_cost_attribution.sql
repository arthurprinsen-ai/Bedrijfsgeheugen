-- P0 Cost Attribution: append-only usage facts linked to canonical operations.
-- Corrections are new ADJUSTMENT facts; existing usage facts are never overwritten.

create table if not exists public.brain_budget_usage (
  id uuid primary key default gen_random_uuid(),
  usage_id text not null,
  operation_id uuid not null references public.brain_operations(id),
  source text not null,
  usage_type text not null,
  unit text not null,
  amount numeric not null,
  entry_kind text not null default 'USAGE',
  adjusts_usage_id text references public.brain_budget_usage(usage_id),
  provider_usage_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint brain_budget_usage_usage_id_unique unique (usage_id),
  constraint brain_budget_usage_usage_id_nonempty check (length(btrim(usage_id)) > 0),
  constraint brain_budget_usage_source_nonempty check (length(btrim(source)) > 0),
  constraint brain_budget_usage_type_nonempty check (length(btrim(usage_type)) > 0),
  constraint brain_budget_usage_unit_nonempty check (length(btrim(unit)) > 0),
  constraint brain_budget_usage_entry_kind_valid check (entry_kind in ('USAGE','ADJUSTMENT')),
  constraint brain_budget_usage_amount_valid check (
    (entry_kind='USAGE' and amount >= 0)
    or (entry_kind='ADJUSTMENT' and amount <> 0)
  ),
  constraint brain_budget_usage_adjustment_reference check (
    (entry_kind='USAGE' and adjusts_usage_id is null)
    or (entry_kind='ADJUSTMENT' and adjusts_usage_id is not null)
  )
);

create unique index if not exists brain_budget_usage_provider_usage_unique
  on public.brain_budget_usage (source, provider_usage_id)
  where provider_usage_id is not null;

create index if not exists brain_budget_usage_operation_idx
  on public.brain_budget_usage (operation_id, occurred_at);

create or replace function public.brain_record_usage(
  p_usage_id text,
  p_operation_id uuid,
  p_source text,
  p_usage_type text,
  p_unit text,
  p_amount numeric,
  p_entry_kind text default 'USAGE',
  p_adjusts_usage_id text default null,
  p_provider_usage_id text default null,
  p_metadata jsonb default '{}'::jsonb,
  p_occurred_at timestamptz default now()
)
returns public.brain_budget_usage
language plpgsql
as $$
declare
  v_usage public.brain_budget_usage;
  v_original public.brain_budget_usage;
begin
  if nullif(btrim(p_usage_id),'') is null
     or p_operation_id is null
     or nullif(btrim(p_source),'') is null
     or nullif(btrim(p_usage_type),'') is null
     or nullif(btrim(p_unit),'') is null
     or p_amount is null
     or p_entry_kind not in ('USAGE','ADJUSTMENT') then
    raise exception 'VALIDATION_ERROR';
  end if;

  if p_entry_kind='USAGE' and (p_amount < 0 or p_adjusts_usage_id is not null) then
    raise exception 'INVALID_USAGE_AMOUNT_OR_ADJUSTMENT';
  end if;

  if p_entry_kind='ADJUSTMENT' then
    if nullif(btrim(p_adjusts_usage_id),'') is null then
      raise exception 'ADJUSTMENT_REQUIRES_ORIGINAL_USAGE';
    end if;
    select * into v_original from public.brain_budget_usage where usage_id=p_adjusts_usage_id;
    if not found then raise exception 'ADJUSTMENT_REQUIRES_ORIGINAL_USAGE'; end if;
    if v_original.operation_id is distinct from p_operation_id
       or v_original.unit is distinct from p_unit then
      raise exception 'ADJUSTMENT_IDENTITY_CONFLICT';
    end if;
    if p_amount=0 then raise exception 'INVALID_USAGE_AMOUNT_OR_ADJUSTMENT'; end if;
  end if;

  begin
    insert into public.brain_budget_usage(
      usage_id,operation_id,source,usage_type,unit,amount,entry_kind,
      adjusts_usage_id,provider_usage_id,metadata,occurred_at
    ) values (
      p_usage_id,p_operation_id,p_source,p_usage_type,p_unit,p_amount,p_entry_kind,
      p_adjusts_usage_id,p_provider_usage_id,coalesce(p_metadata,'{}'::jsonb),coalesce(p_occurred_at,now())
    )
    on conflict (usage_id) do nothing
    returning * into v_usage;
  exception
    when unique_violation then
      if p_provider_usage_id is not null then
        select * into v_usage
          from public.brain_budget_usage
         where source=p_source and provider_usage_id=p_provider_usage_id;
        if found then raise exception 'PROVIDER_USAGE_IDENTITY_CONFLICT'; end if;
      end if;
      raise;
  end;

  if found then return v_usage; end if;

  select * into v_usage from public.brain_budget_usage where usage_id=p_usage_id;
  if not found then raise exception 'USAGE_STATE_UNKNOWN'; end if;

  if v_usage.operation_id is distinct from p_operation_id
     or v_usage.source is distinct from p_source
     or v_usage.usage_type is distinct from p_usage_type
     or v_usage.unit is distinct from p_unit
     or v_usage.amount is distinct from p_amount
     or v_usage.entry_kind is distinct from p_entry_kind
     or v_usage.adjusts_usage_id is distinct from p_adjusts_usage_id
     or v_usage.provider_usage_id is distinct from p_provider_usage_id
     or v_usage.metadata is distinct from coalesce(p_metadata,'{}'::jsonb)
     or v_usage.occurred_at is distinct from coalesce(p_occurred_at,v_usage.occurred_at) then
    raise exception 'USAGE_IDENTITY_CONFLICT';
  end if;

  return v_usage;
end;
$$;

create or replace view public.brain_cost_by_operation
with (security_invoker=true)
as
select
  u.operation_id,
  o.capability_id,
  o.change_id,
  u.source,
  u.usage_type,
  u.unit,
  sum(u.amount) as net_amount,
  count(*) as fact_count,
  min(u.occurred_at) as first_usage_at,
  max(u.occurred_at) as last_usage_at
from public.brain_budget_usage u
join public.brain_operations o on o.id=u.operation_id
group by u.operation_id,o.capability_id,o.change_id,u.source,u.usage_type,u.unit;

alter table public.brain_budget_usage enable row level security;

revoke all on table public.brain_budget_usage from public, anon, authenticated, service_role;
grant select, insert on table public.brain_budget_usage to service_role;

revoke all on table public.brain_cost_by_operation from public, anon, authenticated, service_role;
grant select on table public.brain_cost_by_operation to service_role;

alter function public.brain_record_usage(text,uuid,text,text,text,numeric,text,text,text,jsonb,timestamptz)
  set search_path=public;
revoke all on function public.brain_record_usage(text,uuid,text,text,text,numeric,text,text,text,jsonb,timestamptz)
  from public, anon, authenticated, service_role;
grant execute on function public.brain_record_usage(text,uuid,text,text,text,numeric,text,text,text,jsonb,timestamptz)
  to service_role;

comment on table public.brain_budget_usage is
  'Append-only cost and resource usage facts. Every material usage fact links to one canonical brain operation; corrections are separate ADJUSTMENT facts.';

comment on function public.brain_record_usage(text,uuid,text,text,text,numeric,text,text,text,jsonb,timestamptz) is
  'Idempotently records one usage fact. usage_id replay is a no-op, provider identity reuse fails closed, and corrections are append-only adjustments.';
