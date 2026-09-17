-- Powerhouse closure A-F: one tenant-scoped decision/action/outcome lineage.
-- Additive, fail-closed and compatible with legacy records that do not yet carry cycle identity.

create table if not exists public.powerhouse_decision_cycles (
  tenant_id text not null,
  cycle_id uuid not null default gen_random_uuid(),
  subject_key text,
  source_signal_ref text not null,
  current_stage text not null default 'signal',
  status text not null default 'open',
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, cycle_id),
  constraint powerhouse_decision_cycles_stage_ck check (current_stage = any (array['signal','analysis','prediction','decision','execution','provider_readback','outcome','realized_value','calibration','next_decision'])),
  constraint powerhouse_decision_cycles_status_ck check (status = any (array['open','outcome_pending','calibration_pending','complete','blocked']))
);

create table if not exists public.powerhouse_cycle_events (
  event_id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  cycle_id uuid not null,
  sequence_no integer not null,
  stage text not null,
  entity_type text,
  entity_id text,
  evidence_ref text not null,
  idempotency_key text not null,
  payload jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint powerhouse_cycle_events_cycle_fk foreign key (tenant_id, cycle_id)
    references public.powerhouse_decision_cycles(tenant_id, cycle_id) on delete cascade,
  constraint powerhouse_cycle_events_stage_ck check (stage = any (array['signal','analysis','prediction','decision','execution','provider_readback','outcome','realized_value','calibration','next_decision'])),
  constraint powerhouse_cycle_events_sequence_ck check (sequence_no > 0),
  constraint powerhouse_cycle_events_evidence_ck check (length(btrim(evidence_ref)) > 0),
  unique (tenant_id, cycle_id, sequence_no),
  unique (tenant_id, idempotency_key)
);

create table if not exists public.powerhouse_realized_values (
  observation_id uuid primary key default gen_random_uuid(),
  tenant_id text not null,
  cycle_id uuid not null,
  value_type text not null,
  truth_class text not null default 'realized',
  numeric_value numeric not null,
  unit text,
  currency text,
  evidence_ref text not null,
  source_entity_type text,
  source_entity_id text,
  observed_at timestamptz not null,
  provenance jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint powerhouse_realized_values_cycle_fk foreign key (tenant_id, cycle_id)
    references public.powerhouse_decision_cycles(tenant_id, cycle_id) on delete cascade,
  constraint powerhouse_realized_values_truth_ck check (truth_class = 'realized'),
  constraint powerhouse_realized_values_type_ck check (value_type = any (array['revenue','cost_saving','hours_saved','risk_reduction','conversion','custom'])),
  constraint powerhouse_realized_values_evidence_ck check (length(btrim(evidence_ref)) > 0)
);

create table if not exists public.powerhouse_obligation_reconciliations (
  fingerprint text primary key,
  source_kind text not null,
  source_ref text not null,
  status text not null,
  conditions jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  superseded_by text,
  first_seen_at timestamptz not null default now(),
  reconciled_at timestamptz not null default now(),
  constraint powerhouse_obligation_reconciliations_status_ck check (status = any (array['open','resolved','superseded','stale_reconciled','blocked']))
);

create table if not exists public.powerhouse_legacy_learning_migrations (
  fingerprint text primary key,
  legacy_route text not null,
  canonical_writer text not null,
  superseded_by text not null,
  source_issue integer,
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'superseded',
  migrated_at timestamptz not null default now(),
  constraint powerhouse_legacy_learning_no_make_writer_ck check (canonical_writer !~* '(^|[^a-z])make([^a-z]|$)'),
  constraint powerhouse_legacy_learning_status_ck check (status = any (array['superseded','migrated','historical_only']))
);

create table if not exists public.powerhouse_quality_events (
  fingerprint text primary key,
  capability_id text,
  escaped_to_production boolean not null default false,
  production_evidence_ref text,
  root_cause text,
  regression_guard_ref text,
  performance_evidence jsonb not null default '{}'::jsonb,
  fault_injection_evidence jsonb not null default '{}'::jsonb,
  status text not null default 'detected',
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint powerhouse_quality_events_status_ck check (status = any (array['detected','investigating','guard_required','guarded','verified','blocked']))
);

create or replace function public.powerhouse_cycle_stage_rank_v1(p_stage text)
returns integer
language sql
immutable
set search_path = public, pg_catalog
as $$
  select case p_stage
    when 'signal' then 1 when 'analysis' then 2 when 'prediction' then 3
    when 'decision' then 4 when 'execution' then 5 when 'provider_readback' then 6
    when 'outcome' then 7 when 'realized_value' then 8 when 'calibration' then 9
    when 'next_decision' then 10 else null end;
$$;

create or replace function public.powerhouse_validate_cycle_event_v1()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_previous public.powerhouse_cycle_events%rowtype;
  v_rank integer;
  v_previous_rank integer;
begin
  if new.tenant_id is null or btrim(new.tenant_id) = '' then
    raise exception 'tenant_id is required';
  end if;
  if new.evidence_ref is null or btrim(new.evidence_ref) = '' then
    raise exception 'evidence_ref is required';
  end if;

  select * into v_previous
  from public.powerhouse_cycle_events
  where tenant_id = new.tenant_id and cycle_id = new.cycle_id
  order by sequence_no desc
  limit 1;

  if found then
    if new.sequence_no <> v_previous.sequence_no + 1 then
      raise exception 'cycle sequence must be contiguous';
    end if;
    v_rank := public.powerhouse_cycle_stage_rank_v1(new.stage);
    v_previous_rank := public.powerhouse_cycle_stage_rank_v1(v_previous.stage);
    if v_rank is null or v_rank <= v_previous_rank then
      raise exception 'cycle stage must move forward';
    end if;
  elsif new.sequence_no <> 1 or new.stage <> 'signal' then
    raise exception 'first cycle event must be signal sequence 1';
  end if;
  return new;
end;
$$;

drop trigger if exists powerhouse_cycle_events_validate on public.powerhouse_cycle_events;
create trigger powerhouse_cycle_events_validate
before insert on public.powerhouse_cycle_events
for each row execute function public.powerhouse_validate_cycle_event_v1();

create or replace function public.powerhouse_advance_cycle_v1()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
begin
  update public.powerhouse_decision_cycles
     set current_stage = new.stage,
         status = case
           when new.stage = 'outcome' then 'outcome_pending'
           when new.stage = 'realized_value' then 'calibration_pending'
           when new.stage = 'next_decision' then 'complete'
           else status
         end,
         closed_at = case when new.stage = 'next_decision' then coalesce(closed_at, new.occurred_at) else closed_at end,
         updated_at = now()
   where tenant_id = new.tenant_id and cycle_id = new.cycle_id;
  return new;
end;
$$;

drop trigger if exists powerhouse_cycle_events_advance on public.powerhouse_cycle_events;
create trigger powerhouse_cycle_events_advance
after insert on public.powerhouse_cycle_events
for each row execute function public.powerhouse_advance_cycle_v1();

create or replace function public.powerhouse_realized_value_event_v1()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
declare
  v_next integer;
begin
  select coalesce(max(sequence_no),0)+1 into v_next
  from public.powerhouse_cycle_events
  where tenant_id=new.tenant_id and cycle_id=new.cycle_id;

  insert into public.powerhouse_cycle_events(
    tenant_id,cycle_id,sequence_no,stage,entity_type,entity_id,evidence_ref,idempotency_key,payload,occurred_at
  ) values (
    new.tenant_id,new.cycle_id,v_next,'realized_value','powerhouse_realized_values',new.observation_id::text,
    new.evidence_ref,'realized-value:'||new.observation_id::text,
    jsonb_build_object('value_type',new.value_type,'numeric_value',new.numeric_value,'unit',new.unit,'currency',new.currency,'truth_class','realized'),new.observed_at
  );
  return new;
end;
$$;

drop trigger if exists powerhouse_realized_values_event on public.powerhouse_realized_values;
create trigger powerhouse_realized_values_event
after insert on public.powerhouse_realized_values
for each row execute function public.powerhouse_realized_value_event_v1();

create or replace view public.powerhouse_cycle_status_v1
with (security_invoker=true)
as
select
  c.tenant_id,
  c.cycle_id,
  c.subject_key,
  c.source_signal_ref,
  c.current_stage,
  c.status,
  c.opened_at,
  c.closed_at,
  count(e.event_id) as event_count,
  count(*) filter (where e.stage='provider_readback') > 0 as has_provider_readback,
  count(*) filter (where e.stage='outcome') > 0 as has_outcome,
  count(*) filter (where e.stage='realized_value') > 0 as has_realized_value,
  count(*) filter (where e.stage='calibration') > 0 as has_calibration,
  count(*) filter (where e.stage='next_decision') > 0 as has_next_decision,
  (array_agg(e.stage order by e.sequence_no) filter (where e.stage is not null)) as observed_stages
from public.powerhouse_decision_cycles c
left join public.powerhouse_cycle_events e
  on e.tenant_id=c.tenant_id and e.cycle_id=c.cycle_id
group by c.tenant_id,c.cycle_id,c.subject_key,c.source_signal_ref,c.current_stage,c.status,c.opened_at,c.closed_at;

create or replace view public.powerhouse_realized_value_summary_v1
with (security_invoker=true)
as
select tenant_id, value_type, unit, currency,
       count(*) as observation_count,
       sum(numeric_value) as realized_total,
       min(observed_at) as first_observed_at,
       max(observed_at) as last_observed_at
from public.powerhouse_realized_values
group by tenant_id,value_type,unit,currency;

-- Legacy outcomes lacking explicit tenant/cycle identity are candidates only; never auto-promote them to realized tenant truth.
create or replace view public.powerhouse_unlinked_realized_value_candidates_v1
with (security_invoker=true)
as
select 'powerhouse_sales_outcomes'::text as source_entity_type,
       o.outcome_id::text as source_entity_id,
       'revenue'::text as value_type,
       o.revenue_eur as numeric_value,
       'EUR'::text as currency,
       o.occurred_at as observed_at,
       o.evidence
from public.powerhouse_sales_outcomes o
where coalesce(o.revenue_eur,0) > 0;

-- Security closure for global/internal proposal governance: proposals are not tenant-owned customer records.
-- Canonical model: global internal reference governance, server-only mutation; customers only read active published portaalblokken.
drop policy if exists voorstellen_lezen on public.cijfervoorstellen;
drop policy if exists voorstellen_beoordelen on public.cijfervoorstellen;
revoke all on table public.cijfervoorstellen from anon, authenticated;
grant select,insert,update,delete on table public.cijfervoorstellen to service_role;
revoke all on function public.voorstel_afwijzen(uuid) from public, anon, authenticated;
revoke all on function public.voorstel_overnemen(uuid,text) from public, anon, authenticated;
grant execute on function public.voorstel_afwijzen(uuid) to service_role;
grant execute on function public.voorstel_overnemen(uuid,text) to service_role;

-- Explicitly keep current Powerhouse reconciliation server-only; this is an internal mutator.
revoke all on function public.powerhouse_reconcile_daily_sales_action_set_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_reconcile_daily_sales_action_set_v1(date) to service_role;

-- New canonical control tables are server-authoritative. Portal reads should use governed projections/functions, not direct table access.
alter table public.powerhouse_decision_cycles enable row level security;
alter table public.powerhouse_cycle_events enable row level security;
alter table public.powerhouse_realized_values enable row level security;
alter table public.powerhouse_obligation_reconciliations enable row level security;
alter table public.powerhouse_legacy_learning_migrations enable row level security;
alter table public.powerhouse_quality_events enable row level security;

revoke all on table public.powerhouse_decision_cycles from anon,authenticated;
revoke all on table public.powerhouse_cycle_events from anon,authenticated;
revoke all on table public.powerhouse_realized_values from anon,authenticated;
revoke all on table public.powerhouse_obligation_reconciliations from anon,authenticated;
revoke all on table public.powerhouse_legacy_learning_migrations from anon,authenticated;
revoke all on table public.powerhouse_quality_events from anon,authenticated;
revoke all on table public.powerhouse_cycle_status_v1 from anon,authenticated;
revoke all on table public.powerhouse_realized_value_summary_v1 from anon,authenticated;
revoke all on table public.powerhouse_unlinked_realized_value_candidates_v1 from anon,authenticated;

grant select,insert,update,delete on table public.powerhouse_decision_cycles to service_role;
grant select,insert,update,delete on table public.powerhouse_cycle_events to service_role;
grant select,insert,update,delete on table public.powerhouse_realized_values to service_role;
grant select,insert,update,delete on table public.powerhouse_obligation_reconciliations to service_role;
grant select,insert,update,delete on table public.powerhouse_legacy_learning_migrations to service_role;
grant select,insert,update,delete on table public.powerhouse_quality_events to service_role;
grant select on table public.powerhouse_cycle_status_v1 to service_role;
grant select on table public.powerhouse_realized_value_summary_v1 to service_role;
grant select on table public.powerhouse_unlinked_realized_value_candidates_v1 to service_role;

revoke all on function public.powerhouse_cycle_stage_rank_v1(text) from public,anon,authenticated;
revoke all on function public.powerhouse_validate_cycle_event_v1() from public,anon,authenticated;
revoke all on function public.powerhouse_advance_cycle_v1() from public,anon,authenticated;
revoke all on function public.powerhouse_realized_value_event_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_cycle_stage_rank_v1(text) to service_role;
