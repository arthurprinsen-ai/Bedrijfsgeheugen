
update public.powerhouse_sales_actions s
set status='expired',
    evidence=coalesce(s.evidence,'{}'::jsonb)||jsonb_build_object(
      'commercial_closure',jsonb_build_object(
        'contract','powerhouse-fresh-research-promotion-v1',
        'decision','OBSERVE',
        'reason','Historical research backlog may not be rematerialized as fresh social outreach.',
        'terminalized_at',now()
      )
    ),
    updated_at=now()
from public.powerhouse_sales_actions r
where s.dedupe_key like 'research-social:%'
  and s.status in ('prepared','suggested','waiting')
  and r.action_id=nullif(s.evidence#>>'{commercial_intelligence,research_action_id}','')::uuid
  and (r.executed_at is null or r.executed_at<now()-interval '24 hours');

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
      and nullif(trim(coalesce(a.source_url,'')),'') is not null
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
    'Fresh verified public research promoted into a value-adding LinkedIn context action.',
    coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
      'headline',a.evidence#>>'{public_research_execution,headline}',
      'summary',a.evidence#>>'{public_research_execution,summary}',
      'source_ref','powerhouse_sales_action:'||a.action_id::text,
      'commercial_intelligence',
        coalesce(a.evidence->'commercial_intelligence','{}'::jsonb)||
        jsonb_build_object(
          'research_promoted',true,
          'research_action_id',a.action_id,
          'research_executed_at',a.executed_at,
          'source_context_ready',true,
          'freshness_window_hours',24
        )
    ),
    '',coalesce(a.source_url,''),'prepared',now(),a.opportunity_key,a.expected_value_eur,
    a.person_name,a.company_name,a.role
  from candidates a
  on conflict(dedupe_key) do nothing;
  get diagnostics v_n=row_count;

  return jsonb_build_object(
    'contract','powerhouse-fresh-research-promotion-v1',
    'promoted',v_n,'daily_cap',3,'already_sent_today',v_sent_today,'slots_available',v_slots,
    'freshness_window_hours',24,'executed_at',now()
  );
end $$;
revoke execute on function public.powerhouse_promote_research_to_social_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_promote_research_to_social_v1() to service_role;
