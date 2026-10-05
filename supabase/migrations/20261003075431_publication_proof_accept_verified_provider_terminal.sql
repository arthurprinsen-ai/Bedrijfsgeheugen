create or replace function public.powerhouse_publication_proof_health(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language sql
stable
set search_path to 'public','pg_catalog'
as $function$
with o as (
  select
    count(*) filter (where channel in ('linkedin_personal','linkedin_company','instagram','blog'))::int as expected_count,
    count(*) filter (
      where channel in ('linkedin_personal','linkedin_company','instagram','blog')
        and (
          status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
          or (
            status='PUBLISHED'
            and external_id is not null
            and coalesce((evidence->>'terminal_provider_side_effect')::boolean,false)=true
            and coalesce((evidence->>'provider_publication_ack_verified')::boolean,false)=true
            and coalesce((evidence->>'provider_truth_verified')::boolean,false)=true
          )
        )
    )::int as terminal_count,
    count(*) filter (
      where channel in ('linkedin_personal','linkedin_company','instagram','blog')
        and not (
          status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
          or (
            status='PUBLISHED'
            and external_id is not null
            and coalesce((evidence->>'terminal_provider_side_effect')::boolean,false)=true
            and coalesce((evidence->>'provider_publication_ack_verified')::boolean,false)=true
            and coalesce((evidence->>'provider_truth_verified')::boolean,false)=true
          )
        )
    )::int as blocking_count,
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'channel',channel,
          'status',status,
          'content_id',content_id,
          'canonical_url',canonical_url,
          'external_id',external_id,
          'last_error',last_error,
          'next_action',next_action
        ) order by channel
      ) filter (
        where channel in ('linkedin_personal','linkedin_company','instagram','blog')
          and not (
            status in ('LIVE_PROVEN','MEASURED','LEARNED','SKIPPED')
            or (
              status='PUBLISHED'
              and external_id is not null
              and coalesce((evidence->>'terminal_provider_side_effect')::boolean,false)=true
              and coalesce((evidence->>'provider_publication_ack_verified')::boolean,false)=true
              and coalesce((evidence->>'provider_truth_verified')::boolean,false)=true
            )
          )
      ),
      '[]'::jsonb
    ) as blocking
  from public.content_publication_obligations
  where tenant_id='canonical'
    and publication_date=p_run_date
)
select jsonb_build_object(
  'contract','publication-terminal-provider-proof-v2',
  'run_date',p_run_date,
  'expected_count',expected_count,
  'terminal_count',terminal_count,
  'blocking_count',blocking_count,
  'blocking',blocking,
  'healthy',expected_count=4 and terminal_count=4 and blocking_count=0
)
from o;
$function$;
