-- Powerhouse LinkedIn sales machine v1
-- Converts relationship intelligence into a bounded multi-touch LinkedIn + email motion.
-- Public LinkedIn comments are context-first and non-promotional; company-page posts provide anonymized air cover.

create or replace function public.powerhouse_prepare_linkedin_sales_machine_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_now timestamptz:=now();
  v_intent_events integer:=0;
  v_comment_actions integer:=0;
  v_aircover integer:=0;
begin
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,occurred_at,evidence,context,state,data_quality,confidence
  )
  select
    'linkedin-inbound:'||md5(e.event_key),
    'linkedin_inbound_engagement',
    'powerhouse-linkedin-sales-machine-v1',
    'relationship:'||p.person_key,
    p.person_key,p.company_key_normalized,e.occurred_at,
    jsonb_build_object(
      'engagement_type',e.engagement_type,
      'post_url',e.post_url,
      'actor_linkedin_url',e.actor_linkedin_url,
      'content_key',e.content_key,
      'source',e.source,
      'intent_weight',case e.engagement_type when 'comment' then .90 when 'repost' then .80 when 'share' then .80 when 'like' then .55 else .40 end
    ),
    jsonb_build_object('actor_name',e.actor_name,'company_name',e.company_name,'role',e.role),
    'observed','VERIFIED',
    case e.engagement_type when 'comment' then .90 when 'repost' then .80 when 'share' then .80 when 'like' then .55 else .40 end
  from public.linkedin_engagement_events e
  join public.powerhouse_person_intelligence_v1 p
    on lower(trim(p.linkedin_url))=lower(trim(e.actor_linkedin_url))
  where e.is_test is not true
    and e.occurred_at>=v_now-interval '30 days'
  on conflict(dedupe_key) do nothing;
  get diagnostics v_intent_events=row_count;

  with daily as (
    select count(*)::int n
    from public.powerhouse_sales_actions
    where action_type='reply_post'
      and channel='linkedin_personal'
      and status='done'
      and executed_at >= date_trunc('day',v_now at time zone 'Europe/Amsterdam') at time zone 'Europe/Amsterdam'
  ), candidates as (
    select
      ev.event_id,
      ev.person_key,
      ev.company_key,
      p.person_name,
      p.company_name,
      p.role,
      r.relationship_revenue_score,
      ev.evidence->>'source_url' source_url,
      ev.evidence->>'headline' headline,
      ev.evidence->>'summary' summary,
      ev.occurred_at,
      t.trigger_key,
      t.trigger_type,
      t.confidence trigger_confidence,
      row_number() over(
        partition by ev.person_key
        order by t.confidence desc,ev.occurred_at desc
      ) person_rn
    from public.powerhouse_runtime_events ev
    join public.powerhouse_person_intelligence_v1 p on p.person_key=ev.person_key
    join public.powerhouse_relationship_revenue_intelligence_v1 r on r.person_key=ev.person_key
    join public.powerhouse_mkb_trigger_intelligence_v1 t
      on t.company_key=ev.company_key
     and t.do_not_contact_reason is null
     and t.observed_at>=v_now-interval '30 days'
     and t.confidence>=.60
    where ev.source='powerhouse-relationship-public-research-v1'
      and ev.occurred_at>=v_now-interval '14 days'
      and ev.evidence->>'source_url' ~* 'https://[^ ]*linkedin\.com/(posts/|feed/update/)'
      and r.relationship_revenue_score>=.55
      and r.actions_30d<3
      and (
        lower(coalesce(ev.evidence->>'headline','')||' '||coalesce(ev.evidence->>'summary',''))
          like '%'||lower(trim(coalesce(p.company_name,'')))||'%'
        or (
          length(trim(coalesce(ev.company_key,'')))>=4
          and lower(coalesce(ev.evidence->>'source_url','')) like '%'||replace(lower(trim(ev.company_key)),' ','-')||'%'
        )
      )
      and not exists (
        select 1
        from public.powerhouse_sales_actions a
        where a.person_key=ev.person_key
          and a.action_type='reply_post'
          and a.channel='linkedin_personal'
          and a.status='done'
          and a.executed_at>=v_now-interval '14 days'
      )
  ), ranked as (
    select c.*,row_number() over(
      order by c.relationship_revenue_score desc,c.trigger_confidence desc,c.occurred_at desc,c.person_key
    ) rn
    from candidates c where c.person_rn=1
  ), budget as (
    select greatest(0,3-(select n from daily))::int slots
  )
  insert into public.powerhouse_sales_actions(
    event_id,dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,
    message_draft,source_url,status,due_at,expected_value_eur,person_name,company_name,role
  )
  select
    r.event_id,
    'linkedin-context-comment:'||md5(r.person_key)||':'||md5(r.source_url),
    'relationship:'||r.person_key,
    r.person_key,r.company_key,'reply_post','linkedin_personal',
    round((100*(.60*r.relationship_revenue_score+.40*r.trigger_confidence))::numeric,2),
    'Context-first LinkedIn engagement on a fresh company-specific post before or alongside direct outreach.',
    jsonb_build_object(
      'contract','powerhouse-linkedin-sales-machine-v1',
      'touch_type','context_comment',
      'headline',r.headline,
      'summary',r.summary,
      'trigger_key',r.trigger_key,
      'trigger_type',r.trigger_type,
      'trigger_confidence',r.trigger_confidence,
      'relationship_revenue_score',r.relationship_revenue_score,
      'source_company_specific',true,
      'generation_required',true,
      'guardrails',jsonb_build_object(
        'max_daily_comments',3,
        'per_person_cooldown_days',14,
        'no_sales_pitch',true,
        'no_fake_facts',true,
        'no_generic_praise',true,
        'public_comment_must_add_value',true
      )
    ),
    '',r.source_url,'prepared',v_now,0,r.person_name,r.company_name,r.role
  from ranked r cross join budget b
  where r.rn<=b.slots
  on conflict(dedupe_key) do nothing;
  get diagnostics v_comment_actions=row_count;

  with theme as (
    select
      t.trigger_type,
      count(*)::int signal_count,
      round(avg(t.confidence)::numeric,3) avg_confidence
    from public.powerhouse_mkb_trigger_intelligence_v1 t
    join public.powerhouse_relationship_revenue_intelligence_v1 r on r.company_key=t.company_key
    where t.do_not_contact_reason is null
      and t.observed_at>=v_now-interval '14 days'
      and t.confidence>=.60
      and r.relationship_revenue_score>=.50
    group by t.trigger_type
    order by count(*) desc,avg(t.confidence) desc,t.trigger_type
    limit 1
  )
  insert into public.powerhouse_content_recommendations(
    dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status
  )
  select
    'linkedin-sales-aircover:'||p_run_date::text||':'||theme.trigger_type,
    p_run_date,
    'sales-aircover:'||theme.trigger_type,
    null,
    'linkedin_company',
    'sales_air_cover',
    98,
    'Maak een inhoudelijke bedrijfspost over het patroon "'||replace(theme.trigger_type,'_',' ')||'" dat momenteel terugkomt in actuele commerciële signalen. Leg het probleem uit, geef 2-3 concrete observaties en een bruikbare eerste stap. Noem geen individuele prospects, bedrijven of private relatiegegevens.',
    jsonb_build_object(
      'contract','powerhouse-linkedin-sales-machine-v1',
      'trigger_type',theme.trigger_type,
      'signal_count',theme.signal_count,
      'avg_confidence',theme.avg_confidence,
      'commercial_value',98,
      'anonymized',true,
      'sales_air_cover',true,
      'prospect_names_forbidden',true
    ),
    'suggested'
  from theme
  on conflict(dedupe_key) do update set
    priority=excluded.priority,reason=excluded.reason,evidence=excluded.evidence,updated_at=v_now;
  get diagnostics v_aircover=row_count;

  return jsonb_build_object(
    'contract','powerhouse-linkedin-sales-machine-v1',
    'linkedin_intent_events_added',v_intent_events,
    'context_comments_prepared',v_comment_actions,
    'sales_aircover_recommendations_touched',v_aircover,
    'comment_daily_cap',3,
    'dm_capability','UNAVAILABLE',
    'dm_fallback','email',
    'executed_at',v_now
  );
end;
$$;

revoke execute on function public.powerhouse_prepare_linkedin_sales_machine_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_prepare_linkedin_sales_machine_v1(date) to service_role;

create or replace function public.powerhouse_dispatch_linkedin_sales_machine_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_token text;
  v_request_id bigint;
begin
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc
  limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object('contract','powerhouse-linkedin-sales-machine-dispatch-v1','dispatched',false,'reason','scheduler_token_missing');
  end if;

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-linkedin-sales-machine',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := jsonb_build_object('run_date',p_run_date),
    timeout_milliseconds := 120000
  ) into v_request_id;

  return jsonb_build_object('contract','powerhouse-linkedin-sales-machine-dispatch-v1','dispatched',true,'request_id',v_request_id,'run_date',p_run_date);
end;
$$;

revoke execute on function public.powerhouse_dispatch_linkedin_sales_machine_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_linkedin_sales_machine_v1(date) to service_role;
