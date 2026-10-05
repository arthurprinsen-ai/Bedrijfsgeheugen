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
  -- 1) Freeze exact executed copy as learning input.
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
    and coalesce(a.evidence->>'sent_message_hash','')='';
  get diagnostics v_snapshots=row_count;

  -- 2) Observe no reply at 24h on the original action, not as a revenue-cycle outcome.
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'no_reply_24h_observed',true,
        'no_reply_24h_observed_at',now(),
        'no_reply_24h_interpretation','No observed reply yet; not equivalent to rejection.'
      ),
      updated_at=now()
  where a.status='done'
    and a.executed_at <= now()-interval '24 hours'
    and a.channel in ('email','LinkedIn DM','linkedin','linkedin_dm')
    and coalesce((a.evidence->>'no_reply_24h_observed')::boolean,false)=false
    and not exists(
      select 1 from public.powerhouse_email_reply_events e
      where e.action_id=a.action_id
        and e.occurred_at <= a.executed_at+interval '24 hours'
    )
    and not exists(
      select 1 from public.powerhouse_sales_outcomes o
      where o.action_id=a.action_id
        and (
          o.outcome_type like 'reply%'
          or o.outcome_type in ('positive','question','negative','unsubscribe','meeting','proposal','order')
        )
        and o.occurred_at <= a.executed_at+interval '24 hours'
    );
  get diagnostics v_nr24=row_count;

  -- 3) Observe no reply at 72h.
  update public.powerhouse_sales_actions a
  set evidence=coalesce(a.evidence,'{}'::jsonb) || jsonb_build_object(
        'no_reply_72h_observed',true,
        'no_reply_72h_observed_at',now(),
        'no_reply_72h_interpretation','No observed reply by 72h; response-rate evidence only.'
      ),
      updated_at=now()
  where a.status='done'
    and a.executed_at <= now()-interval '72 hours'
    and a.channel in ('email','LinkedIn DM','linkedin','linkedin_dm')
    and coalesce((a.evidence->>'no_reply_72h_observed')::boolean,false)=false
    and not exists(
      select 1 from public.powerhouse_email_reply_events e
      where e.action_id=a.action_id
        and e.occurred_at <= a.executed_at+interval '72 hours'
    )
    and not exists(
      select 1 from public.powerhouse_sales_outcomes o
      where o.action_id=a.action_id
        and (
          o.outcome_type like 'reply%'
          or o.outcome_type in ('positive','question','negative','unsubscribe','meeting','proposal','order')
        )
        and o.occurred_at <= a.executed_at+interval '72 hours'
    );
  get diagnostics v_nr72=row_count;

  -- 4) One learning row per exact message variant + channel.
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
      'subject',max(a.evidence->>'email_subject'),
      'persuasion_strategy',max(a.evidence->>'persuasion_strategy'),
      'give_asset',max(a.evidence->>'give_asset'),
      'get_ask',max(a.evidence->>'get_ask'),
      'trigger_type',max(a.evidence->>'trigger_type'),
      'provider',max(a.evidence->>'provider')
    ),
    jsonb_build_object(
      'sent',count(distinct a.action_id)::int,
      'replies',count(distinct e.reply_event_id)::int
          + count(distinct o.outcome_id) filter(where o.outcome_type like 'reply%')::int,
      'no_reply_24h',count(distinct a.action_id) filter(
          where coalesce((a.evidence->>'no_reply_24h_observed')::boolean,false)
      )::int,
      'no_reply_72h',count(distinct a.action_id) filter(
          where coalesce((a.evidence->>'no_reply_72h_observed')::boolean,false)
      )::int,
      'meetings',count(distinct o.outcome_id) filter(where o.outcome_type='meeting')::int,
      'proposals',count(distinct o.outcome_id) filter(where o.outcome_type='proposal')::int,
      'orders',count(distinct o.outcome_id) filter(where o.outcome_type='order')::int,
      'realized_revenue_eur',coalesce(sum(distinct o.revenue_eur) filter(where o.revenue_eur>0),0)
    ),
    case when count(distinct a.action_id)>=5 then .70 else .35 end,
    case when count(distinct a.action_id)>=5 then 'TESTING' else 'OBSERVING' end,
    max(a.content_key),max(a.topic_key),a.channel,count(distinct a.action_id)::int,
    now(),now()
  from public.powerhouse_sales_actions a
  left join public.powerhouse_email_reply_events e on e.action_id=a.action_id
  left join public.powerhouse_sales_outcomes o on o.action_id=a.action_id
  where a.status='done'
    and a.executed_at is not null
    and a.channel in ('email','LinkedIn DM','linkedin','linkedin_dm')
  group by a.channel,md5(coalesce(a.message_draft,'')),a.message_draft
  on conflict (fingerprint) do update set
    evidence=excluded.evidence,
    effect=excluded.effect,
    confidence=excluded.confidence,
    status=excluded.status,
    sample_size=excluded.sample_size,
    updated_at=now();
  get diagnostics v_learnings=row_count;

  return jsonb_build_object(
    'contract','unified-outbound-copy-reply-learning-v2',
    'copy_snapshots_written',v_snapshots,
    'no_reply_24h_observed',v_nr24,
    'no_reply_72h_observed',v_nr72,
    'learning_rows_refreshed',v_learnings,
    'refreshed_at',now()
  );
end
$$;
