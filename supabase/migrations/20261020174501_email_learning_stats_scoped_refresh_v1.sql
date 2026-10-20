-- Obligation: powerhouse|email-learning-scoped-refresh|20261020. Parent #4478.
-- Reproduced: EMAIL_REPLY_LOOP_FAILED LEARNING_REFRESH:DELETE requires a WHERE clause.
-- Do not disable safe-update controls, change grants, or clear source evidence.
DO $preflight$
DECLARE v_definition text;
BEGIN
 SELECT pg_get_functiondef('public.powerhouse_refresh_email_learning_stats()'::regprocedure) INTO v_definition;
 IF md5(v_definition)<>'f9ff58f839c1233ffd1b85fa4e86ec73'
    AND position('email-learning-stats-scoped-refresh-v1' in v_definition)=0 THEN
  RAISE EXCEPTION 'EMAIL_LEARNING_REFRESH_BASELINE_DRIFT';
 END IF;
END $preflight$;

CREATE OR REPLACE FUNCTION public.powerhouse_refresh_email_learning_stats()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
declare
  v_active_keys text[];
begin
  -- email-learning-stats-scoped-refresh-v1: one owner, no unqualified DELETE.
  perform pg_advisory_xact_lock(hashtextextended('powerhouse-email-learning-stats-refresh',0));

  if exists (
    select 1 from public.powerhouse_email_learning_stats s
    join (
      select distinct md5(coalesce(nullif(a.evidence->>'persuasion_strategy',''),'unknown')||'|'||
        coalesce(nullif(a.evidence->>'give_asset',''),'none')||'|'||
        coalesce(nullif(a.evidence->>'trigger_type',''),'unknown')||'|'||
        coalesce(nullif(a.evidence->>'get_ask',''),'unknown')) as learning_key
      from public.powerhouse_sales_actions a
      where a.channel='email' and a.action_type='autonomous_email' and a.status='done'
        and a.executed_at>=now()-interval '180 days'
    ) active using (learning_key)
    where (s.channel='email' and s.evidence->>'contract'='powerhouse-email-reply-learning-v1') is distinct from true
  ) then
    raise exception 'EMAIL_LEARNING_FOREIGN_KEY_COLLISION';
  end if;

  with refreshed as (
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
  group by ab.persuasion_strategy,ab.give_asset,ab.trigger_type,ab.get_ask
  on conflict (learning_key) do update set
    channel=excluded.channel,
    persuasion_strategy=excluded.persuasion_strategy,
    give_asset=excluded.give_asset,
    trigger_type=excluded.trigger_type,
    get_ask=excluded.get_ask,
    sent_count=excluded.sent_count,
    reply_count=excluded.reply_count,
    positive_reply_count=excluded.positive_reply_count,
    question_reply_count=excluded.question_reply_count,
    objection_reply_count=excluded.objection_reply_count,
    unsubscribe_count=excluded.unsubscribe_count,
    meeting_count=excluded.meeting_count,
    proposal_count=excluded.proposal_count,
    order_count=excluded.order_count,
    revenue_eur=excluded.revenue_eur,
    reply_rate=excluded.reply_rate,
    positive_reply_rate=excluded.positive_reply_rate,
    revenue_per_send_eur=excluded.revenue_per_send_eur,
    evidence=excluded.evidence,
    last_recomputed_at=excluded.last_recomputed_at
  returning learning_key
  )
  select coalesce(array_agg(learning_key),array[]::text[]) into v_active_keys from refreshed;

  -- Retire only expired rows owned by this exact derived-email contract.
  -- Unrelated channels, contracts and all source actions/replies/outcomes survive.
  delete from public.powerhouse_email_learning_stats s
  where s.channel='email'
    and s.evidence->>'contract'='powerhouse-email-reply-learning-v1'
    and not (s.learning_key=any(v_active_keys));
end;
$function$

DO $readback$
BEGIN
 IF (SELECT prosecdef FROM pg_proc WHERE oid='public.powerhouse_refresh_email_learning_stats()'::regprocedure)
    OR has_function_privilege('anon','public.powerhouse_refresh_email_learning_stats()','EXECUTE')
    OR has_function_privilege('authenticated','public.powerhouse_refresh_email_learning_stats()','EXECUTE')
    OR NOT has_function_privilege('service_role','public.powerhouse_refresh_email_learning_stats()','EXECUTE') THEN
  RAISE EXCEPTION 'EMAIL_LEARNING_REFRESH_PRIVILEGE_DRIFT';
 END IF;
END $readback$;
