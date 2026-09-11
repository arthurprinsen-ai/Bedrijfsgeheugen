-- Transactional Inbox/Outbox supporting primitive.
-- Persist intent/state in DB; provider I/O occurs outside DB transactions.

create table if not exists public.brain_inbox (
  message_id text primary key,
  message_type text not null,
  payload_sha256 text not null,
  payload jsonb not null,
  source text,
  received_at timestamptz not null default now(),
  constraint brain_inbox_message_id_nonempty check(length(btrim(message_id))>0),
  constraint brain_inbox_message_type_nonempty check(length(btrim(message_type))>0),
  constraint brain_inbox_payload_hash_nonempty check(length(btrim(payload_sha256))>0)
);

create table if not exists public.brain_outbox (
  id uuid primary key default gen_random_uuid(),
  message_id text not null unique,
  operation_id uuid not null references public.brain_operations(id),
  destination text not null,
  payload_sha256 text not null,
  payload jsonb not null,
  state text not null default 'PENDING',
  attempt_count bigint not null default 0,
  claimed_by text,
  claim_until timestamptz,
  delivered_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brain_outbox_message_id_nonempty check(length(btrim(message_id))>0),
  constraint brain_outbox_destination_nonempty check(length(btrim(destination))>0),
  constraint brain_outbox_payload_hash_nonempty check(length(btrim(payload_sha256))>0),
  constraint brain_outbox_state_valid check(state in ('PENDING','CLAIMED','DELIVERED','FAILED')),
  constraint brain_outbox_attempt_nonnegative check(attempt_count>=0)
);
create index if not exists brain_outbox_claim_idx on public.brain_outbox(state,claim_until,created_at);

create or replace function public.brain_receive_inbox(
  p_message_id text,p_message_type text,p_payload_sha256 text,p_payload jsonb,p_source text default null
) returns public.brain_inbox
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_inbox;
begin
  if nullif(btrim(p_message_id),'') is null or nullif(btrim(p_message_type),'') is null
     or nullif(btrim(p_payload_sha256),'') is null or p_payload is null then raise exception 'VALIDATION_ERROR'; end if;
  insert into public.brain_inbox(message_id,message_type,payload_sha256,payload,source)
  values(p_message_id,p_message_type,p_payload_sha256,p_payload,p_source)
  on conflict(message_id) do nothing returning * into v_row;
  if found then return v_row; end if;
  select * into v_row from public.brain_inbox where message_id=p_message_id;
  if v_row.message_type is distinct from p_message_type or v_row.payload_sha256 is distinct from p_payload_sha256
     or v_row.payload is distinct from p_payload or v_row.source is distinct from p_source then
    raise exception 'INBOX_MESSAGE_IDENTITY_CONFLICT';
  end if;
  return v_row;
end; $$;

create or replace function public.brain_enqueue_outbox(
  p_message_id text,p_operation_id uuid,p_destination text,p_payload_sha256 text,p_payload jsonb
) returns public.brain_outbox
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_outbox;
begin
  if nullif(btrim(p_message_id),'') is null or p_operation_id is null or nullif(btrim(p_destination),'') is null
     or nullif(btrim(p_payload_sha256),'') is null or p_payload is null then raise exception 'VALIDATION_ERROR'; end if;
  insert into public.brain_outbox(message_id,operation_id,destination,payload_sha256,payload)
  values(p_message_id,p_operation_id,p_destination,p_payload_sha256,p_payload)
  on conflict(message_id) do nothing returning * into v_row;
  if found then return v_row; end if;
  select * into v_row from public.brain_outbox where message_id=p_message_id;
  if v_row.operation_id is distinct from p_operation_id or v_row.destination is distinct from p_destination
     or v_row.payload_sha256 is distinct from p_payload_sha256 or v_row.payload is distinct from p_payload then
    raise exception 'OUTBOX_MESSAGE_IDENTITY_CONFLICT';
  end if;
  return v_row;
end; $$;

create or replace function public.brain_claim_outbox(
  p_worker_id text,p_limit integer default 10,p_lease_seconds integer default 60
) returns setof public.brain_outbox
language plpgsql security definer set search_path=public as $$
begin
  if nullif(btrim(p_worker_id),'') is null or p_limit<1 or p_limit>100 or p_lease_seconds<1 or p_lease_seconds>3600 then
    raise exception 'VALIDATION_ERROR';
  end if;
  return query
  with candidates as (
    select id from public.brain_outbox
    where state in ('PENDING','FAILED') or (state='CLAIMED' and claim_until<now())
    order by created_at
    for update skip locked
    limit p_limit
  )
  update public.brain_outbox o
     set state='CLAIMED',claimed_by=p_worker_id,claim_until=now()+make_interval(secs=>p_lease_seconds),
         attempt_count=attempt_count+1,updated_at=now()
    from candidates c where o.id=c.id
  returning o.*;
end; $$;

create or replace function public.brain_ack_outbox(
  p_message_id text,p_worker_id text,p_success boolean,p_error text default null
) returns public.brain_outbox
language plpgsql security definer set search_path=public as $$
declare v_row public.brain_outbox;
begin
  if nullif(btrim(p_message_id),'') is null or nullif(btrim(p_worker_id),'') is null or p_success is null then
    raise exception 'VALIDATION_ERROR';
  end if;
  select * into v_row from public.brain_outbox where message_id=p_message_id for update;
  if not found then raise exception 'OUTBOX_MESSAGE_NOT_FOUND'; end if;
  if v_row.state<>'CLAIMED' or v_row.claimed_by is distinct from p_worker_id then raise exception 'OUTBOX_CLAIM_OWNERSHIP_CONFLICT'; end if;
  update public.brain_outbox set
    state=case when p_success then 'DELIVERED' else 'FAILED' end,
    delivered_at=case when p_success then now() else null end,
    last_error=case when p_success then null else coalesce(p_error,'DELIVERY_FAILED') end,
    claimed_by=null,claim_until=null,updated_at=now()
  where id=v_row.id returning * into v_row;
  return v_row;
end; $$;

alter table public.brain_inbox enable row level security;
alter table public.brain_outbox enable row level security;
revoke all on table public.brain_inbox from public,anon,authenticated,service_role;
revoke all on table public.brain_outbox from public,anon,authenticated,service_role;
grant select on table public.brain_inbox to service_role;
grant select on table public.brain_outbox to service_role;

revoke all on function public.brain_receive_inbox(text,text,text,jsonb,text) from public,anon,authenticated,service_role;
revoke all on function public.brain_enqueue_outbox(text,uuid,text,text,jsonb) from public,anon,authenticated,service_role;
revoke all on function public.brain_claim_outbox(text,integer,integer) from public,anon,authenticated,service_role;
revoke all on function public.brain_ack_outbox(text,text,boolean,text) from public,anon,authenticated,service_role;
grant execute on function public.brain_receive_inbox(text,text,text,jsonb,text) to service_role;
grant execute on function public.brain_enqueue_outbox(text,uuid,text,text,jsonb) to service_role;
grant execute on function public.brain_claim_outbox(text,integer,integer) to service_role;
grant execute on function public.brain_ack_outbox(text,text,boolean,text) to service_role;

comment on table public.brain_outbox is 'Durable provider-dispatch intent. Claim/ack is DB-only; provider network I/O must occur after claim and outside DB transactions.';
