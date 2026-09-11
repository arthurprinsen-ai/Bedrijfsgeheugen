-- Canonical whole-brain data plane. Additive only: no legacy tables are altered or removed.
create table if not exists public.brain_records (
  tenant_id text not null,
  record_id text not null,
  record_type text not null,
  record_kind text not null,
  subject_id text not null,
  correlation_id text,
  predecessor_ids text[] not null default '{}',
  owner_id text,
  status text not null default 'OBSERVED',
  observed_at timestamptz not null,
  executed boolean not null default false,
  verified boolean not null default false,
  result jsonb,
  evidence_ids text[] not null default '{}',
  provenance jsonb not null default '{}'::jsonb,
  payload jsonb not null default '{}'::jsonb,
  idempotency_key text not null,
  source_revision text,
  stored_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (tenant_id, record_id),
  constraint brain_records_tenant_nonempty check (length(btrim(tenant_id)) > 0),
  constraint brain_records_id_nonempty check (length(btrim(record_id)) > 0),
  constraint brain_records_subject_nonempty check (length(btrim(subject_id)) > 0),
  constraint brain_records_idempotency_nonempty check (length(btrim(idempotency_key)) > 0),
  constraint brain_records_type_check check (record_type in ('Evidence','Signal','Opportunity','Impact','Decision','Action','Execution','Verification','Outcome','Value','Learning','Memory','Entity','Relation','CurrentState')),
  constraint brain_records_kind_check check (record_kind in ('evidence','signal','opportunity','impact','decision','action','execution','verification','outcome','value','learning','memory','entity','relation','current_state'))
);

create unique index if not exists brain_records_tenant_idempotency_uq
  on public.brain_records (tenant_id, idempotency_key);
create index if not exists brain_records_tenant_correlation_idx
  on public.brain_records (tenant_id, correlation_id, observed_at)
  where correlation_id is not null;
create index if not exists brain_records_tenant_subject_idx
  on public.brain_records (tenant_id, subject_id, observed_at desc);
create index if not exists brain_records_type_idx
  on public.brain_records (tenant_id, record_type, observed_at desc);
create index if not exists brain_records_predecessor_gin_idx
  on public.brain_records using gin (predecessor_ids);
create index if not exists brain_records_evidence_gin_idx
  on public.brain_records using gin (evidence_ids);

alter table public.brain_records enable row level security;
revoke all on table public.brain_records from public, anon, authenticated, service_role;
grant select, insert, update on table public.brain_records to service_role;

create or replace function public.brain_append_record(
  p_tenant_id text,
  p_record_id text,
  p_record_type text,
  p_record_kind text,
  p_subject_id text,
  p_correlation_id text,
  p_predecessor_ids text[],
  p_owner_id text,
  p_status text,
  p_observed_at timestamptz,
  p_executed boolean,
  p_verified boolean,
  p_result jsonb,
  p_evidence_ids text[],
  p_provenance jsonb,
  p_payload jsonb,
  p_idempotency_key text,
  p_source_revision text default null
)
returns public.brain_records
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_existing public.brain_records;
  v_inserted public.brain_records;
begin
  if nullif(btrim(p_tenant_id),'') is null or nullif(btrim(p_record_id),'') is null
     or nullif(btrim(p_subject_id),'') is null or nullif(btrim(p_idempotency_key),'') is null then
    raise exception 'VALIDATION_ERROR';
  end if;

  select * into v_existing
    from public.brain_records
   where tenant_id = p_tenant_id and record_id = p_record_id;

  if found then
    if v_existing.idempotency_key <> p_idempotency_key then
      raise exception 'BRAIN_RECORD_CONFLICT';
    end if;
    return v_existing;
  end if;

  insert into public.brain_records (
    tenant_id, record_id, record_type, record_kind, subject_id, correlation_id,
    predecessor_ids, owner_id, status, observed_at, executed, verified, result,
    evidence_ids, provenance, payload, idempotency_key, source_revision
  ) values (
    p_tenant_id, p_record_id, p_record_type, p_record_kind, p_subject_id, p_correlation_id,
    coalesce(p_predecessor_ids,'{}'), p_owner_id, coalesce(p_status,'OBSERVED'), p_observed_at,
    coalesce(p_executed,false), coalesce(p_verified,false), p_result,
    coalesce(p_evidence_ids,'{}'), coalesce(p_provenance,'{}'::jsonb), coalesce(p_payload,'{}'::jsonb),
    p_idempotency_key, p_source_revision
  ) returning * into v_inserted;

  return v_inserted;
exception
  when unique_violation then
    select * into v_existing
      from public.brain_records
     where tenant_id = p_tenant_id and idempotency_key = p_idempotency_key;
    if found then return v_existing; end if;
    raise;
end;
$$;

revoke all on function public.brain_append_record(text,text,text,text,text,text,text[],text,text,timestamptz,boolean,boolean,jsonb,text[],jsonb,jsonb,text,text)
  from public, anon, authenticated;
grant execute on function public.brain_append_record(text,text,text,text,text,text,text[],text,text,timestamptz,boolean,boolean,jsonb,text[],jsonb,jsonb,text,text)
  to service_role;
