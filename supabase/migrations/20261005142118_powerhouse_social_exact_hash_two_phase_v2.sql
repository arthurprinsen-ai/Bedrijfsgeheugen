create or replace function public.powerhouse_social_message_quality_ready_v1(p_action_id uuid)
returns boolean
language sql
stable
set search_path='public','pg_catalog','extensions'
as $$
  select coalesce((
    select
      a.action_type='reply_post'
      and a.channel='linkedin_personal'
      and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
      and nullif(trim(coalesce(a.message_draft,'')),'') is not null
      and coalesce(a.evidence#>>'{commercial_intelligence,message_strategy}','')<>''
      and coalesce(a.evidence#>>'{commercial_intelligence,quality_passed}','false')='true'
      and coalesce(a.evidence#>>'{commercial_intelligence,message_hash}','')=
          encode(extensions.digest(a.message_draft,'sha256'),'hex')
      and exists(
        select 1
        from public.powerhouse_message_quality_v1 q
        where q.action_id=a.action_id
          and q.message_hash=encode(extensions.digest(a.message_draft,'sha256'),'hex')
          and q.passed=true
      )
    from public.powerhouse_sales_actions a
    where a.action_id=p_action_id
  ),false)
$$;
revoke execute on function public.powerhouse_social_message_quality_ready_v1(uuid) from public,anon,authenticated;
grant execute on function public.powerhouse_social_message_quality_ready_v1(uuid) to service_role;

create or replace function public.powerhouse_dispatch_social_comment_composer_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb
language plpgsql
security definer
set search_path='pg_catalog','public'
as $$
declare v_token text; v_request_id bigint; v_pending int:=0;
begin
  select count(*)::int into v_pending
  from public.powerhouse_sales_actions a
  where a.action_type='reply_post'
    and a.channel='linkedin_personal'
    and a.status='prepared'
    and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
    and (
      a.dedupe_key like 'command-social:'||p_run_date::text||':%'
      or (
        a.dedupe_key like 'research-social:%'
        and exists(
          select 1
          from public.powerhouse_sales_actions r
          where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
            and r.executed_at>=now()-interval '24 hours'
        )
      )
    )
    and not public.powerhouse_social_message_quality_ready_v1(a.action_id);

  if v_pending=0 then
    return jsonb_build_object(
      'contract','powerhouse-social-comment-composer-dispatch-v1',
      'dispatched',false,'reason','NO_SOCIAL_COMPOSER_CANDIDATES'
    );
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object(
      'contract','powerhouse-social-comment-composer-dispatch-v1',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','pending',v_pending
    );
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-commercial-message-composer',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('limit',least(v_pending,10),'channels',jsonb_build_array('linkedin_personal')),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-social-comment-composer-dispatch-v1',
    'dispatched',true,'pending',v_pending,'request_id',v_request_id,'run_date',p_run_date
  );
end $$;
revoke execute on function public.powerhouse_dispatch_social_comment_composer_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_social_comment_composer_v1(date) to service_role;

with ranked as (
  select action_id,
         row_number() over(partition by lower(trim(source_url))
                           order by priority desc,created_at asc,action_id) rn
  from public.powerhouse_sales_actions
  where action_type='reply_post'
    and channel='linkedin_personal'
    and status in ('prepared','suggested','waiting')
    and source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
    and (dedupe_key like 'research-social:%' or dedupe_key like 'command-social:%')
)
update public.powerhouse_sales_actions a
set status='expired',
    evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'commercial_closure',jsonb_build_object(
        'contract','powerhouse-linkedin-target-dedupe-v1',
        'decision','OBSERVE',
        'reason','Duplicate active action for same LinkedIn target post.',
        'terminalized_at',now()
      )
    ),
    updated_at=now()
from ranked r
where a.action_id=r.action_id and r.rn>1;

create or replace function public.powerhouse_prepare_quality_social_comments_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare v_ready int:=0; v_done_today int:=0; v_already_released int:=0; v_slots int:=0;
begin
  select count(*)::int into v_done_today
  from public.powerhouse_sales_actions
  where action_type='reply_post' and channel='linkedin_personal'
    and status='done'
    and executed_at>=date_trunc('day',now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';

  select count(*)::int into v_already_released
  from public.powerhouse_sales_actions a
  where a.action_type='reply_post'
    and a.channel='linkedin_personal'
    and a.status in ('suggested','waiting')
    and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
    and (
      a.dedupe_key like 'command-social:'||p_run_date::text||':%'
      or (
        a.dedupe_key like 'research-social:%'
        and exists(
          select 1 from public.powerhouse_sales_actions r
          where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
            and r.executed_at>=now()-interval '24 hours'
        )
      )
    );

  v_slots:=greatest(0,3-v_done_today-v_already_released);

  with candidates as (
    select a.action_id,
           row_number() over(partition by lower(trim(a.source_url))
                             order by a.priority desc,a.created_at asc,a.action_id) target_rank
    from public.powerhouse_sales_actions a
    where a.action_type='reply_post'
      and a.channel='linkedin_personal'
      and a.status='prepared'
      and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
      and (
        a.dedupe_key like 'command-social:'||p_run_date::text||':%'
        or (
          a.dedupe_key like 'research-social:%'
          and exists(
            select 1 from public.powerhouse_sales_actions r
            where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
              and r.executed_at>=now()-interval '24 hours'
          )
        )
      )
      and public.powerhouse_social_message_quality_ready_v1(a.action_id)
  ), bounded as (
    select action_id from candidates where target_rank=1
    order by action_id
    limit v_slots
  )
  update public.powerhouse_sales_actions a
  set status='suggested',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'social_execution_gate',jsonb_build_object(
          'contract','powerhouse-exact-quality-social-gate-v4',
          'quality_passed',true,'exact_message_hash_verified',true,
          'linkedin_post_context_verified',true,'target_post_deduplicated',true,
          'daily_cap',3,'released_at',now()
        )
      ),
      updated_at=now()
  from bounded c
  where a.action_id=c.action_id;
  get diagnostics v_ready=row_count;

  return jsonb_build_object(
    'contract','powerhouse-exact-quality-social-gate-v4',
    'released_to_social_publisher',v_ready,'exact_message_quality_required',true,
    'linkedin_post_url_required',true,'target_post_dedupe_required',true,
    'daily_cap',3,'done_today',v_done_today,'already_released',v_already_released,
    'slots_before_release',v_slots,'run_date',p_run_date,'executed_at',now()
  );
end $$;
revoke execute on function public.powerhouse_prepare_quality_social_comments_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_prepare_quality_social_comments_v1(date) to service_role;

create or replace function public.powerhouse_dispatch_linkedin_comment_autopilot_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='pg_catalog','public' as $$
declare v_token text; v_request_id bigint; v_ready int:=0;
begin
  select count(*)::int into v_ready
  from public.powerhouse_sales_actions a
  where a.action_type='reply_post'
    and a.channel='linkedin_personal'
    and a.status='suggested'
    and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
    and (
      a.dedupe_key like 'command-social:'||p_run_date::text||':%'
      or (
        a.dedupe_key like 'research-social:%'
        and exists(
          select 1 from public.powerhouse_sales_actions r
          where r.action_id=nullif(a.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
            and r.executed_at>=now()-interval '24 hours'
        )
      )
    )
    and public.powerhouse_social_message_quality_ready_v1(a.action_id);

  if v_ready=0 then
    return jsonb_build_object(
      'contract','powerhouse-linkedin-comment-autopilot-dispatch-v3',
      'dispatched',false,'reason','NO_CANONICAL_QUALITY_READY_LINKEDIN_POST_COMMENTS'
    );
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object(
      'contract','powerhouse-linkedin-comment-autopilot-dispatch-v3',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','ready',v_ready
    );
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-social-publisher',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('runDate',p_run_date,'mode','cockpit_autopilot'),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-comment-autopilot-dispatch-v3',
    'dispatched',true,'ready',v_ready,'request_id',v_request_id,'run_date',p_run_date
  );
end $$;
revoke execute on function public.powerhouse_dispatch_linkedin_comment_autopilot_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_linkedin_comment_autopilot_v1(date) to service_role;
