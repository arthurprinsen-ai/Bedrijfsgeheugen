update public.powerhouse_sales_actions s
set status='prepared',
    evidence=(coalesce(s.evidence,'{}'::jsonb)-'comment_generation') ||
      jsonb_build_object('recovery',jsonb_build_object(
        'contract','powerhouse-comment-composer-fallback-v1',
        'reason','Anthropic-only comment generation replaced by canonical human commercial composer with governed fallback.',
        'recovered_at',now()
      )),
    updated_at=now()
where s.action_type='reply_post'
  and s.channel='linkedin_personal'
  and s.status='error'
  and s.dedupe_key like 'research-social:%'
  and coalesce(s.evidence#>>'{comment_generation,error}','') ilike '%credit balance is too low%'
  and exists(
    select 1 from public.powerhouse_sales_actions r
    where r.action_id=nullif(s.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
      and r.executed_at>=now()-interval '24 hours'
  );

create or replace function public.powerhouse_prepare_quality_social_comments_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam'))::date
)
returns jsonb language plpgsql security definer set search_path='public','pg_catalog' as $$
declare v_ready int:=0;
begin
  update public.powerhouse_sales_actions a
  set status='suggested',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'social_execution_gate',jsonb_build_object(
          'contract','powerhouse-exact-quality-social-gate-v1',
          'quality_passed',true,
          'exact_message_hash_verified',true,
          'released_at',now()
        )
      ),
      updated_at=now()
  where a.action_type='reply_post'
    and a.channel='linkedin_personal'
    and a.status='prepared'
    and nullif(trim(coalesce(a.source_url,'')),'') is not null
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
  get diagnostics v_ready=row_count;

  return jsonb_build_object(
    'contract','powerhouse-exact-quality-social-gate-v1',
    'released_to_social_publisher',v_ready,
    'exact_message_quality_required',true,
    'run_date',p_run_date,
    'executed_at',now()
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
    return jsonb_build_object('contract','powerhouse-linkedin-comment-autopilot-dispatch-v1',
      'dispatched',false,'reason','NO_CANONICAL_QUALITY_READY_COMMENTS');
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object('contract','powerhouse-linkedin-comment-autopilot-dispatch-v1',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','ready',v_ready);
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-social-publisher',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('runDate',p_run_date,'mode','cockpit_autopilot'),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-comment-autopilot-dispatch-v1',
    'dispatched',true,'ready',v_ready,'request_id',v_request_id,'run_date',p_run_date
  );
end $$;
revoke execute on function public.powerhouse_dispatch_linkedin_comment_autopilot_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_linkedin_comment_autopilot_v1(date) to service_role;
