
create or replace function public.powerhouse_refresh_email_learning_stats()
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  delete from public.powerhouse_email_learning_stats;

  insert into public.powerhouse_email_learning_stats (
    learning_key, channel, persuasion_strategy, give_asset, trigger_type, get_ask,
    sent_count, reply_count, positive_reply_count, question_reply_count,
    objection_reply_count, unsubscribe_count, meeting_count, proposal_count,
    order_count, revenue_eur, reply_rate, positive_reply_rate,
    revenue_per_send_eur, evidence, last_recomputed_at
  )
  with action_base as (
    select
      a.action_id,
      coalesce(nullif(a.evidence->>'persuasion_strategy',''),'unknown') as persuasion_strategy,
      coalesce(nullif(a.evidence->>'give_asset',''),'none') as give_asset,
      coalesce(nullif(a.evidence->>'trigger_type',''),'unknown') as trigger_type,
      coalesce(nullif(a.evidence->>'get_ask',''),'unknown') as get_ask
    from public.powerhouse_sales_actions a
    where a.channel='email'
      and a.action_type='autonomous_email'
      and a.status='done'
      and a.executed_at >= now() - interval '180 days'
  ),
  reply_by_action as (
    select
      r.action_id,
      count(*)::int as reply_count,
      count(*) filter (where r.reply_class='positive')::int as positive_reply_count,
      count(*) filter (where r.reply_class='question')::int as question_reply_count,
      count(*) filter (where r.reply_class like 'objection_%')::int as objection_reply_count,
      count(*) filter (where r.reply_class='unsubscribe')::int as unsubscribe_count
    from public.powerhouse_email_reply_events r
    group by r.action_id
  ),
  outcome_by_action as (
    select
      o.action_id,
      count(*) filter (where o.outcome_type in ('meeting','meeting_booked','appointment'))::int as meeting_count,
      count(*) filter (where o.outcome_type in ('proposal','proposal_sent','offerte'))::int as proposal_count,
      count(*) filter (where o.outcome_type in ('order','won','purchase','deal_won'))::int as order_count,
      coalesce(sum(o.revenue_eur),0)::numeric as revenue_eur
    from public.powerhouse_sales_outcomes o
    where o.action_id is not null
    group by o.action_id
  )
  select
    md5(ab.persuasion_strategy||'|'||ab.give_asset||'|'||ab.trigger_type||'|'||ab.get_ask),
    'email',
    ab.persuasion_strategy,
    ab.give_asset,
    ab.trigger_type,
    ab.get_ask,
    count(*)::int,
    coalesce(sum(r.reply_count),0)::int,
    coalesce(sum(r.positive_reply_count),0)::int,
    coalesce(sum(r.question_reply_count),0)::int,
    coalesce(sum(r.objection_reply_count),0)::int,
    coalesce(sum(r.unsubscribe_count),0)::int,
    coalesce(sum(o.meeting_count),0)::int,
    coalesce(sum(o.proposal_count),0)::int,
    coalesce(sum(o.order_count),0)::int,
    coalesce(sum(o.revenue_eur),0)::numeric,
    round(coalesce(sum(r.reply_count),0)::numeric / nullif(count(*),0), 4),
    round(coalesce(sum(r.positive_reply_count),0)::numeric / nullif(count(*),0), 4),
    round(coalesce(sum(o.revenue_eur),0)::numeric / nullif(count(*),0), 2),
    jsonb_build_object(
      'contract','powerhouse-email-reply-learning-v1',
      'priority_metric','revenue_eur',
      'secondary_metrics',jsonb_build_array('orders','proposals','meetings','positive_replies','replies'),
      'window_days',180
    ),
    now()
  from action_base ab
  left join reply_by_action r on r.action_id=ab.action_id
  left join outcome_by_action o on o.action_id=ab.action_id
  group by ab.persuasion_strategy,ab.give_asset,ab.trigger_type,ab.get_ask;
end;
$$;

revoke all on function public.powerhouse_refresh_email_learning_stats() from public, anon, authenticated;
grant execute on function public.powerhouse_refresh_email_learning_stats() to service_role;
