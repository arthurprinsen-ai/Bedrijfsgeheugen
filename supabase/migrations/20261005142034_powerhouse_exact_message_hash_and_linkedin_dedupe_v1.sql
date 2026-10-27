
create or replace function public.powerhouse_outbound_message_quality_ready_v1(p_action_id uuid)
returns boolean
language sql
stable
set search_path='public','pg_catalog','extensions'
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

with ranked as (
  select action_id,source_url,
         row_number() over(partition by source_url order by priority desc,created_at asc,action_id) rn
  from public.powerhouse_sales_actions
  where action_type='reply_post'
    and channel='linkedin_personal'
    and status in ('prepared','suggested','waiting')
    and source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
)
update public.powerhouse_sales_actions a
set status='expired',
    evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'commercial_closure',jsonb_build_object(
        'contract','powerhouse-linkedin-target-dedupe-v1',
        'decision','OBSERVE',
        'reason','Duplicate open action for the same LinkedIn target post; only highest-priority oldest canonical action remains executable.',
        'terminalized_at',now()
      )
    ),
    updated_at=now()
from ranked r
where a.action_id=r.action_id and r.rn>1;

update public.powerhouse_sales_actions a
set status='prepared',
    message_draft='',
    evidence=jsonb_set(
      jsonb_set(
        jsonb_set(coalesce(a.evidence,'{}'::jsonb),'{commercial_intelligence,quality_passed}','false'::jsonb,true),
        '{commercial_intelligence,message_hash}','""'::jsonb,true
      ),
      '{recovery}',
      jsonb_build_object(
        'contract','powerhouse-exact-message-recompose-v1',
        'reason','Previous social gate was not content-bound; recomposition required under exact SHA-256 quality contract.',
        'recovered_at',now()
      ),
      true
    ),
    updated_at=now()
where a.action_type='reply_post'
  and a.channel='linkedin_personal'
  and a.status in ('suggested','prepared')
  and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
  and not public.powerhouse_outbound_message_quality_ready_v1(a.action_id);
