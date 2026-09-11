create table if not exists public.powerhouse_event_idempotency (
  event_id text primary key,
  fingerprint text not null,
  producer_id text,
  claimed_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists powerhouse_event_idempotency_expires_idx
  on public.powerhouse_event_idempotency (expires_at);

create or replace function public.claim_powerhouse_event(
  p_event_id text,
  p_fingerprint text,
  p_producer_id text default null,
  p_ttl_hours integer default 168
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted boolean;
begin
  delete from public.powerhouse_event_idempotency
   where expires_at is not null and expires_at < now();

  insert into public.powerhouse_event_idempotency(event_id, fingerprint, producer_id, expires_at)
  values (p_event_id, p_fingerprint, p_producer_id,
          case when p_ttl_hours is null then null else now() + make_interval(hours => p_ttl_hours) end)
  on conflict (event_id) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

revoke all on function public.claim_powerhouse_event(text,text,text,integer) from public;
grant execute on function public.claim_powerhouse_event(text,text,text,integer) to authenticated, service_role;