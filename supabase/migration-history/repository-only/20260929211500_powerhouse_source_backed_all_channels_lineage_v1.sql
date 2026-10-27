-- powerhouse-source-backed-all-channels-lineage-v1
-- One auditable lineage across LinkedIn personal/company, blog, Instagram, email and LinkedIn DM.

-- Production reply evidence must exist before the first lineage/assurance consumer.
-- This is schema parity only: no synthetic replies, public access or provider sends.
create table if not exists public.powerhouse_email_reply_events (
  reply_event_id uuid primary key default gen_random_uuid(),
  action_id uuid not null references public.powerhouse_sales_actions(action_id) on delete cascade,
  provider text not null default 'gmail',
  provider_message_id text not null,
  provider_thread_id text,
  sender_email text not null,
  subject text not null default '',
  reply_text text not null default '',
  reply_class text not null,
  objection_code text,
  intent_score numeric not null default 0 check (intent_score >= -1 and intent_score <= 1),
  next_action text not null default 'none',
  occurred_at timestamptz not null,
  classification_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_message_id)
);
alter table public.powerhouse_email_reply_events enable row level security;
revoke all on table public.powerhouse_email_reply_events from public, anon, authenticated;
grant all on table public.powerhouse_email_reply_events to service_role;
create index if not exists powerhouse_email_reply_events_action_idx
  on public.powerhouse_email_reply_events(action_id, occurred_at desc);
create index if not exists powerhouse_email_reply_events_class_idx
  on public.powerhouse_email_reply_events(reply_class, occurred_at desc);

create table if not exists public.powerhouse_outbound_source_lineage_v1 (
  lineage_key text primary key,
  run_date date not null,
  channel text not null,
  source_kind text not null,
  source_ref text not null,
  topic_key text,
  recommendation_id uuid,
  action_id uuid,
  decision_state text,
  external_ref text,
  source_evidence jsonb not null default '{}'::jsonb,
  outcome_evidence jsonb not null default '{}'::jsonb,
  learning_evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_outbound_source_lineage_v1 enable row level security;
revoke all on public.powerhouse_outbound_source_lineage_v1 from public,anon,authenticated;
grant select,insert,update on public.powerhouse_outbound_source_lineage_v1 to service_role;
create index if not exists powerhouse_outbound_source_lineage_date_channel_idx
  on public.powerhouse_outbound_source_lineage_v1(run_date,channel,updated_at desc);
create index if not exists powerhouse_outbound_source_lineage_rec_idx
  on public.powerhouse_outbound_source_lineage_v1(recommendation_id) where recommendation_id is not null;
create index if not exists powerhouse_outbound_source_lineage_action_idx
  on public.powerhouse_outbound_source_lineage_v1(action_id) where action_id is not null;

create or replace function public.powerhouse_refresh_outbound_source_lineage_v1(p_date date default timezone('Europe/Amsterdam',now())::date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  r record;
  rec public.powerhouse_content_recommendations%rowtype;
  rid uuid;
  sk text;
  sr text;
  social jsonb;
  replies jsonb;
  outcomes jsonb;
  upserts integer := 0;
begin
  -- Content/publication channels.
  for r in
    select * from public.powerhouse_channel_decisions
    where run_date=p_date
      and channel in ('linkedin_personal','linkedin_company','blog','instagram_company')
  loop
    rid := null;
    if r.channel='instagram_company' then
      begin rid := nullif(r.delivery_evidence->>'daily_winner_recommendation_id','')::uuid; exception when others then rid:=null; end;
    elsif r.channel='linkedin_personal' then
      begin rid := nullif(r.delivery_evidence->>'personal_source_recommendation_id','')::uuid; exception when others then rid:=null; end;
    else
      begin rid := nullif(r.delivery_evidence->>'fallback_recommendation_id','')::uuid; exception when others then rid:=null; end;
    end if;

    rec := null;
    if rid is not null then select * into rec from public.powerhouse_content_recommendations where recommendation_id=rid; end if;

    sk := coalesce(nullif(rec.evidence->>'source_loop',''),nullif(rec.evidence->>'source_type',''),
      case when r.channel='linkedin_personal' then 'verified_personal_source'
           when r.channel='blog' then 'problem_search_evidence'
           when r.channel='linkedin_company' then 'mkb_problem_evidence'
           when r.channel='instagram_company' then 'public_daily_life_friction'
           else 'evidence_bound_recommendation' end);
    sr := coalesce(nullif(rec.evidence->>'source_url',''),nullif(rec.evidence->>'content_id',''),
      nullif(rec.content_key,''),rid::text,'decision:'||p_date::text||':'||r.channel);

    select coalesce(jsonb_agg(jsonb_build_object(
      'post_id',sp.post_id,'external_post_id',sp.external_post_id,'published_at',sp.published_at,
      'metrics',(select coalesce(jsonb_agg(jsonb_build_object('observed_at',sms.observed_at,'age_hours',sms.age_hours,'metrics',sms.metrics) order by sms.observed_at),'[]'::jsonb)
                 from public.social_metric_snapshots sms where sms.post_id=sp.post_id)
    ) order by sp.published_at),'[]'::jsonb) into social
    from public.social_posts sp
    where (rid is not null and sp.winner_recommendation_id=rid)
       or (r.delivery_ref is not null and sp.external_post_id=r.delivery_ref);

    insert into public.powerhouse_outbound_source_lineage_v1(
      lineage_key,run_date,channel,source_kind,source_ref,topic_key,recommendation_id,decision_state,external_ref,
      source_evidence,outcome_evidence,learning_evidence,updated_at
    ) values (
      'content:'||p_date::text||':'||r.channel,p_date,r.channel,sk,sr,coalesce(rec.topic_key,r.topic_key),rid,r.state,r.delivery_ref,
      jsonb_build_object(
        'contract','powerhouse-source-backed-all-channels-v1',
        'recommendation_evidence',coalesce(rec.evidence,'{}'::jsonb),
        'decision_evidence',coalesce(r.delivery_evidence,'{}'::jsonb),
        'source_recommendation_ids',coalesce(to_jsonb(r.source_recommendation_ids),'[]'::jsonb)
      ),
      jsonb_build_object('social',coalesce(social,'[]'::jsonb)),
      jsonb_build_object('feedback_targets',jsonb_build_array('source_quality','topic_priority','angle','cta','channel_fit')),
      now()
    )
    on conflict(lineage_key) do update set
      source_kind=excluded.source_kind,source_ref=excluded.source_ref,topic_key=excluded.topic_key,
      recommendation_id=excluded.recommendation_id,decision_state=excluded.decision_state,external_ref=excluded.external_ref,
      source_evidence=excluded.source_evidence,outcome_evidence=excluded.outcome_evidence,
      learning_evidence=excluded.learning_evidence,updated_at=now();
    upserts := upserts + 1;
  end loop;

  -- Direct commercial channels. These must stay account/person specific.
  for r in
    select * from public.powerhouse_sales_actions
    where lower(channel) in ('email','e-mail','linkedin dm','linkedin_dm')
      and (coalesce(due_at,executed_at,created_at) at time zone 'Europe/Amsterdam')::date between p_date-1 and p_date+1
  loop
    select coalesce(jsonb_agg(jsonb_build_object(
      'reply_event_id',e.reply_event_id,'reply_class',e.reply_class,'intent_score',e.intent_score,
      'objection_code',e.objection_code,'next_action',e.next_action,'occurred_at',e.occurred_at
    ) order by e.occurred_at),'[]'::jsonb) into replies
    from public.powerhouse_email_reply_events e where e.action_id=r.action_id;

    select coalesce(jsonb_agg(jsonb_build_object(
      'outcome_id',o.outcome_id,'outcome_type',o.outcome_type,'revenue_eur',o.revenue_eur,
      'occurred_at',o.occurred_at,'evidence',o.evidence
    ) order by o.occurred_at),'[]'::jsonb) into outcomes
    from public.powerhouse_sales_outcomes o where o.action_id=r.action_id;

    insert into public.powerhouse_outbound_source_lineage_v1(
      lineage_key,run_date,channel,source_kind,source_ref,topic_key,action_id,decision_state,external_ref,
      source_evidence,outcome_evidence,learning_evidence,updated_at
    ) values (
      'sales:'||r.action_id::text,
      (coalesce(r.due_at,r.executed_at,r.created_at) at time zone 'Europe/Amsterdam')::date,
      case when lower(r.channel) in ('email','e-mail') then 'email' else 'linkedin_dm' end,
      case when coalesce(r.source_url,'')<>'' then 'account_specific_public_trigger' else 'relationship_or_account_evidence' end,
      coalesce(nullif(r.source_url,''),nullif(r.opportunity_key,''),nullif(r.subject_key,''),r.action_id::text),
      r.topic_key,r.action_id,r.status,null,
      jsonb_build_object(
        'contract','powerhouse-source-backed-all-channels-v1',
        'person_key',r.person_key,'company_key',r.company_key,'opportunity_key',r.opportunity_key,
        'campaign_key',r.campaign_key,'reason',r.reason,'evidence',coalesce(r.evidence,'{}'::jsonb),
        'source_url',r.source_url
      ),
      jsonb_build_object('replies',coalesce(replies,'[]'::jsonb),'sales_outcomes',coalesce(outcomes,'[]'::jsonb)),
      jsonb_build_object('feedback_targets',jsonb_build_array('trigger_quality','message_angle','micro_cta','objection_handling','channel_fit','revenue_per_send')),
      now()
    )
    on conflict(lineage_key) do update set
      decision_state=excluded.decision_state,source_evidence=excluded.source_evidence,
      outcome_evidence=excluded.outcome_evidence,learning_evidence=excluded.learning_evidence,updated_at=now();
    upserts := upserts + 1;
  end loop;

  return jsonb_build_object('ok',true,'contract','powerhouse-source-backed-all-channels-v1','run_date',p_date,'lineages_refreshed',upserts);
end $$;
revoke execute on function public.powerhouse_refresh_outbound_source_lineage_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_refresh_outbound_source_lineage_v1(date) to service_role;

do $$
declare jid bigint;
begin
  select jobid into jid from cron.job where jobname='powerhouse-outbound-source-lineage-hourly-v1';
  if jid is not null then perform cron.unschedule(jid); end if;
  perform cron.schedule(
    'powerhouse-outbound-source-lineage-hourly-v1',
    '47 * * * *',
    $c$select public.powerhouse_refresh_outbound_source_lineage_v1(timezone('Europe/Amsterdam',now())::date);$c$
  );
end $$;
