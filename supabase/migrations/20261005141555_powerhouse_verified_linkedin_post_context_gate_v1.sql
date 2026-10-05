update public.powerhouse_sales_actions
set status='expired',
    evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
      'commercial_closure',jsonb_build_object(
        'contract','powerhouse-linkedin-post-context-gate-v1',
        'decision','OBSERVE',
        'reason','Public research URL is not a concrete LinkedIn post/feed/pulse URL; do not publish a LinkedIn reply.',
        'terminalized_at',now()
      )
    ),
    updated_at=now()
where dedupe_key like 'research-social:%'
  and status in ('prepared','suggested','waiting')
  and not (source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)');

create or replace function public.powerhouse_promote_research_to_social_v1()
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare v_n int:=0; v_sent_today int:=0; v_slots int:=0;
begin
  select count(*)::int into v_sent_today
  from public.powerhouse_sales_actions
  where action_type='reply_post' and channel='linkedin_personal'
    and status='done'
    and executed_at>=date_trunc('day',now() at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam';

  v_slots:=greatest(0,3-v_sent_today);

  with candidates as (
    select a.*
    from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment'
      and a.channel='internal'
      and a.status='done'
      and a.executed_at>=now()-interval '24 hours'
      and a.source_url ~* '^https://(www[.])?linkedin[.]com/(posts/|feed/update/|pulse/)'
      and nullif(trim(coalesce(
        a.evidence#>>'{public_research_execution,headline}',
        a.evidence#>>'{public_research_execution,summary}',''
      )),'') is not null
      and not exists(
        select 1 from public.powerhouse_sales_actions x
        where x.dedupe_key='research-social:'||a.action_id::text
      )
    order by a.priority desc,a.executed_at desc
    limit v_slots
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
    source_url,status,due_at,opportunity_key,expected_value_eur,person_name,company_name,role
  )
  select
    'research-social:'||a.action_id::text,a.subject_key,a.person_key,a.company_key,
    'reply_post','linkedin_personal',a.priority,
    'Fresh verified LinkedIn post research promoted into a value-adding reply action.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'headline',a.evidence#>>'{public_research_execution,headline}',
      'summary',a.evidence#>>'{public_research_execution,summary}',
      'source_ref','powerhouse_sales_action:'||a.action_id::text,
      'commercial_intelligence',
        coalesce(a.evidence->'commercial_intelligence','{}'::jsonb)||
        jsonb_build_object(
          'research_promoted',true,'research_action_id',a.action_id,'research_executed_at',a.executed_at,
          'source_context_ready',true,'linkedin_post_context_verified',true,'freshness_window_hours',24
        )
    ),
    '',coalesce(a.source_url,''),'prepared',now(),a.opportunity_key,a.expected_value_eur,
    a.person_name,a.company_name,a.role
  from candidates a
  on conflict(dedupe_key) do nothing;
  get diagnostics v_n=row_count;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-post-research-promotion-v2',
    'promoted',v_n,'daily_cap',3,'already_sent_today',v_sent_today,'slots_available',v_slots,
    'freshness_window_hours',24,'linkedin_post_url_required',true,'executed_at',now()
  );
end $$;
revoke execute on function public.powerhouse_promote_research_to_social_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_promote_research_to_social_v1() to service_role;

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
  where a.action_type='reply_post' and a.channel='linkedin_personal' and a.status in ('suggested','waiting')
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
    select a.action_id
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
      and public.powerhouse_outbound_message_quality_ready_v1(a.action_id)
    order by a.priority desc,a.created_at asc
    limit v_slots
  )
  update public.powerhouse_sales_actions a
  set status='suggested',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'social_execution_gate',jsonb_build_object(
          'contract','powerhouse-exact-quality-social-gate-v3',
          'quality_passed',true,'exact_message_hash_verified',true,
          'linkedin_post_context_verified',true,'daily_cap',3,'released_at',now()
        )
      ),
      updated_at=now()
  from candidates c
  where a.action_id=c.action_id;
  get diagnostics v_ready=row_count;

  return jsonb_build_object(
    'contract','powerhouse-exact-quality-social-gate-v3',
    'released_to_social_publisher',v_ready,'exact_message_quality_required',true,
    'linkedin_post_url_required',true,'daily_cap',3,'done_today',v_done_today,
    'already_released',v_already_released,'slots_before_release',v_slots,
    'run_date',p_run_date,'executed_at',now()
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
    and public.powerhouse_outbound_message_quality_ready_v1(a.action_id);

  if v_ready=0 then
    return jsonb_build_object('contract','powerhouse-linkedin-comment-autopilot-dispatch-v2',
      'dispatched',false,'reason','NO_CANONICAL_QUALITY_READY_LINKEDIN_POST_COMMENTS');
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object('contract','powerhouse-linkedin-comment-autopilot-dispatch-v2',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','ready',v_ready);
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-social-publisher',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('runDate',p_run_date,'mode','cockpit_autopilot'),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-comment-autopilot-dispatch-v2',
    'dispatched',true,'ready',v_ready,'request_id',v_request_id,'run_date',p_run_date
  );
end $$;
revoke execute on function public.powerhouse_dispatch_linkedin_comment_autopilot_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_linkedin_comment_autopilot_v1(date) to service_role;
