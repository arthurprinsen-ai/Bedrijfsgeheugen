-- Replay baseline for a production function that pre-existed its first captured migration.
-- Production readback proves public.powerhouse_outbound_message_quality_ready_v1(uuid)
-- exists with this contract. This baseline exists only so fresh reconstruction can
-- satisfy historical migration 20261005133952 before 20261005142034 re-captures it.
-- Production must reconcile this timestamp with supported Supabase migration repair
-- --status applied; its SQL must not be re-executed in production.

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
