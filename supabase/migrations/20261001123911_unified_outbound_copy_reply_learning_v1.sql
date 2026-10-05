
create or replace function public.powerhouse_refresh_outbound_learning_v1()
returns jsonb
language plpgsql
security definer
set search_path='public','pg_catalog'
as $$
declare
  v_snapshots int:=0;
  v_nr24 int:=0;
  v_nr72 int:=0;
  v_learnings int:=0;
begin
  -- 1) Freeze the exact executed copy as learning input for every provider-confirmed outbound action.
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'sent_message_text',a.message_draft,
        'sent_message_hash',md5(coalesce(a.message_draft,'')),
        'sent_subject',coalesce(a.evidence->>'email_subject',''),
        'copy_snapshot_at',coalesce(a.executed_at,a.updated_at),
        'learning_input_ready',true
      ),
      updated_at=now()
  where a.status='done'
    and a.executed_at is not null
    and a.channel in ('email','LinkedIn DM','linkedin','linkedin_dm')
    and coalesce(a.evidence->>'provider_send_ack_verified',
                 a.evidence->>'provider_ack_verified',
                 case when nullif(a.evidence->>'provider_message_id','') is not null then 'true' else null end
        )='true'
    and coalesce(a.evidence->>'sent_message_hash','')='';
  get diagnostics v_snapshots=row_count;

  -- 2) 24h no-reply observation. This is not a negative outcome; it is timing/response evidence.
  insert into public.powerhouse_sales_outcomes(
    action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,
    evidence,occurred_at,content_key,topic_key,campaign_key,opportunity_key,channel
  )
  select
    a.action_id,
    'no-reply-24h:'||a.action_id::text,
    'no_reply_24h',
    a.subject_key,a.person_key,a.company_key,0,
    jsonb_build_object(
      'provider',coalesce(a.evidence->>'provider','unknown'),
      'provider_message_id',a.evidence->>'provider_message_id',
      'provider_thread_id',a.evidence->>'provider_thread_id',
      'sent_message_hash',md5(coalesce(a.message_draft,'')),
      'sent_message_text',a.message_draft,
      'observation_window_hours',24,
      'interpretation','No observed reply yet; not equivalent to rejection.'
    ),
    a.executed_at + interval '24 hours',
    a.content_key,a.topic_key,a.campaign_key,a.opportunity_key,a.channel
  from public.powerhouse_sales_actions a
  where a.status='done'
    and a.executed_at <= now()-interval '24 hours'
    and a.channel in ('email','LinkedIn DM','linkedin','linkedin_dm')
    and not exists(
      select 1 from public.powerhouse_sales_outcomes o
      where o.action_id=a.action_id
        and (
          o.outcome_type like 'reply%'
          or o.outcome_type in ('positive','question','negative','unsubscribe','meeting','proposal','order')
        )
        and o.occurred_at <= a.executed_at+interval '24 hours'
    )
  on conflict (dedupe_key) do nothing;
  get diagnostics v_nr24=row_count;

  -- 3) 72h no-reply observation.
  insert into public.powerhouse_sales_outcomes(
    action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,
    evidence,occurred_at,content_key,topic_key,campaign_key,opportunity_key,channel
  )
  select
    a.action_id,
    'no-reply-72h:'||a.action_id::text,
    'no_reply_72h',
    a.subject_key,a.person_key,a.company_key,0,
    jsonb_build_object(
      'provider',coalesce(a.evidence->>'provider','unknown'),
      'provider_message_id',a.evidence->>'provider_message_id',
      'provider_thread_id',a.evidence->>'provider_thread_id',
      'sent_message_hash',md5(coalesce(a.message_draft,'')),
      'sent_message_text',a.message_draft,
      'observation_window_hours',72,
      'interpretation','No observed reply by 72h; use as response-rate evidence, not proof of disinterest.'
    ),
    a.executed_at + interval '72 hours',
    a.content_key,a.topic_key,a.campaign_key,a.opportunity_key,a.channel
  from public.powerhouse_sales_actions a
  where a.status='done'
    and a.executed_at <= now()-interval '72 hours'
    and a.channel in ('email','LinkedIn DM','linkedin','linkedin_dm')
    and not exists(
      select 1 from public.powerhouse_sales_outcomes o
      where o.action_id=a.action_id
        and (
          o.outcome_type like 'reply%'
          or o.outcome_type in ('positive','question','negative','unsubscribe','meeting','proposal','order')
        )
        and o.occurred_at <= a.executed_at+interval '72 hours'
    )
  on conflict (dedupe_key) do nothing;
  get diagnostics v_nr72=row_count;

  -- 4) Maintain one learning row per exact message variant + channel.
  insert into public.powerhouse_sales_learnings(
    fingerprint,subject_key,scope,hypothesis,evidence,effect,confidence,status,
    content_key,topic_key,channel,sample_size,created_at,updated_at
  )
  select
    'outbound-copy:'||a.channel||':'||md5(coalesce(a.message_draft,'')),
    null,
    'outbound_copy_variant',
    'Measure this exact outbound copy by observed reply progression and downstream commercial outcomes.',
    jsonb_build_object(
      'sent_message_hash',md5(coalesce(a.message_draft,'')),
      'sent_message_text',a.message_draft,
      'subject',a.evidence->>'email_subject',
      'persuasion_strategy',a.evidence->>'persuasion_strategy',
      'give_asset',a.evidence->>'give_asset',
      'get_ask',a.evidence->>'get_ask',
      'trigger_type',a.evidence->>'trigger_type',
      'provider',a.evidence->>'provider'
    ),
    jsonb_build_object(
      'sent',count(*)::int,
      'replies',count(distinct o.outcome_id) filter(where o.outcome_type like 'reply%')::int,
      'no_reply_24h',count(distinct o.outcome_id) filter(where o.outcome_type='no_reply_24h')::int,
      'no_reply_72h',count(distinct o.outcome_id) filter(where o.outcome_type='no_reply_72h')::int,
      'meetings',count(distinct o.outcome_id) filter(where o.outcome_type='meeting')::int,
      'proposals',count(distinct o.outcome_id) filter(where o.outcome_type='proposal')::int,
      'orders',count(distinct o.outcome_id) filter(where o.outcome_type='order')::int,
      'realized_revenue_eur',coalesce(sum(o.revenue_eur) filter(where o.revenue_eur>0),0)
    ),
    case when count(*)>=5 then .70 else .35 end,
    case when count(*)>=5 then 'TESTING' else 'OBSERVING' end,
    max(a.content_key),max(a.topic_key),a.channel,count(*)::int,
    now(),now()
  from public.powerhouse_sales_actions a
  left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
  where a.status='done'
    and a.executed_at is not null
    and a.channel in ('email','LinkedIn DM','linkedin','linkedin_dm')
  group by a.channel,md5(coalesce(a.message_draft,'')),a.message_draft,
           a.evidence->>'email_subject',
           a.evidence->>'persuasion_strategy',
           a.evidence->>'give_asset',
           a.evidence->>'get_ask',
           a.evidence->>'trigger_type',
           a.evidence->>'provider'
  on conflict (fingerprint) do update set
    evidence=excluded.evidence,
    effect=excluded.effect,
    confidence=excluded.confidence,
    status=excluded.status,
    sample_size=excluded.sample_size,
    updated_at=now();
  get diagnostics v_learnings=row_count;

  return jsonb_build_object(
    'contract','unified-outbound-copy-reply-learning-v1',
    'copy_snapshots_written',v_snapshots,
    'no_reply_24h_written',v_nr24,
    'no_reply_72h_written',v_nr72,
    'learning_rows_refreshed',v_learnings,
    'refreshed_at',now()
  );
end
$$;
