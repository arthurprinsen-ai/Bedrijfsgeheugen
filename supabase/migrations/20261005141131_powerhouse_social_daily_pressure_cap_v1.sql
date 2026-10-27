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
      and public.powerhouse_outbound_message_quality_ready_v1(a.action_id)
    order by a.priority desc,a.created_at asc
    limit v_slots
  )
  update public.powerhouse_sales_actions a
  set status='suggested',
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'social_execution_gate',jsonb_build_object(
          'contract','powerhouse-exact-quality-social-gate-v2',
          'quality_passed',true,'exact_message_hash_verified',true,
          'daily_cap',3,'released_at',now()
        )
      ),
      updated_at=now()
  from candidates c
  where a.action_id=c.action_id;
  get diagnostics v_ready=row_count;

  return jsonb_build_object(
    'contract','powerhouse-exact-quality-social-gate-v2',
    'released_to_social_publisher',v_ready,'exact_message_quality_required',true,
    'daily_cap',3,'done_today',v_done_today,'already_released',v_already_released,'slots_before_release',v_slots,
    'run_date',p_run_date,'executed_at',now()
  );
end $$;
revoke execute on function public.powerhouse_prepare_quality_social_comments_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_prepare_quality_social_comments_v1(date) to service_role;
