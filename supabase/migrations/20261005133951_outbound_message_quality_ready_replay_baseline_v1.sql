-- Replay baseline for production state that pre-existed its first ledger-complete capture.
-- The table shape is copied from repository-only commercial runtime SQL already reflected in production.
-- The function contract is copied from production migration 20261005142034.
-- Production must reconcile this timestamp with supported Supabase migration repair --status applied.
-- Its SQL must not be re-executed in production.

create table if not exists public.powerhouse_message_quality_v1 (
  quality_id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.powerhouse_sales_actions(action_id) on delete cascade,
  composer_version text not null,
  play_key text not null,
  channel text not null,
  message_hash text not null,
  passed boolean not null,
  score numeric(8,4) not null check(score between 0 and 1),
  checks jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  evaluated_at timestamptz not null default now(),
  unique(action_id,message_hash)
);
alter table public.powerhouse_message_quality_v1 enable row level security;
revoke all on public.powerhouse_message_quality_v1 from public,anon,authenticated;
grant select,insert,update,delete on public.powerhouse_message_quality_v1 to service_role;
drop policy if exists powerhouse_message_quality_service_v1 on public.powerhouse_message_quality_v1;
create policy powerhouse_message_quality_service_v1 on public.powerhouse_message_quality_v1
for all to service_role using(true) with check(true);

create or replace function public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid)
returns boolean
language sql
stable
set search_path = public, pg_catalog, extensions
as $$
  select coalesce((
    select case
      when nullif(trim(coalesce(a.message_draft,'')),'') is null then false
      when lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
        or (a.channel='linkedin_personal' and a.action_type='reply_post')
      then
        coalesce(a.evidence#>>'{commercial_intelligence,quality_passed}','false')='true'
        and coalesce(a.evidence#>>'{commercial_intelligence,message_hash}','')<>''
        and a.evidence#>>'{commercial_intelligence,message_hash}'
              = encode(extensions.digest(a.message_draft::bytea,'sha256'),'hex')
        and exists(
          select 1
          from public.powerhouse_message_quality_v1 q
          where q.action_id=a.action_id
            and q.message_hash=a.evidence#>>'{commercial_intelligence,message_hash}'
            and q.passed=true
        )
      else false
    end
    from public.powerhouse_sales_actions a
    where a.action_id=p_action_id
  ),false)
$$;

revoke execute on function public.powerhouse_outbound_message_quality_ready_v1(uuid) from public,anon,authenticated;
grant execute on function public.powerhouse_outbound_message_quality_ready_v1(uuid) to service_role;
