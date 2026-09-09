alter table public.powerhouse_runtime_events add column if not exists content_key text;
alter table public.powerhouse_runtime_events add column if not exists topic_key text;
alter table public.powerhouse_runtime_events add column if not exists campaign_key text;
alter table public.powerhouse_runtime_events add column if not exists opportunity_key text;
alter table public.powerhouse_runtime_events add column if not exists data_quality text not null default 'OBSERVED';
alter table public.powerhouse_runtime_events add column if not exists confidence numeric not null default 0.5 check (confidence >= 0 and confidence <= 1);

alter table public.powerhouse_sales_actions add column if not exists content_key text;
alter table public.powerhouse_sales_actions add column if not exists topic_key text;
alter table public.powerhouse_sales_actions add column if not exists campaign_key text;
alter table public.powerhouse_sales_actions add column if not exists opportunity_key text;
alter table public.powerhouse_sales_actions add column if not exists expected_value_eur numeric not null default 0;

alter table public.powerhouse_sales_outcomes add column if not exists content_key text;
alter table public.powerhouse_sales_outcomes add column if not exists topic_key text;
alter table public.powerhouse_sales_outcomes add column if not exists campaign_key text;
alter table public.powerhouse_sales_outcomes add column if not exists opportunity_key text;
alter table public.powerhouse_sales_outcomes add column if not exists channel text;

alter table public.powerhouse_sales_learnings add column if not exists content_key text;
alter table public.powerhouse_sales_learnings add column if not exists topic_key text;
alter table public.powerhouse_sales_learnings add column if not exists channel text;
alter table public.powerhouse_sales_learnings add column if not exists sample_size integer not null default 1 check (sample_size >= 1);
alter table public.powerhouse_sales_learnings add column if not exists expires_at timestamptz;

create table if not exists public.powerhouse_content_recommendations (
  recommendation_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  run_date date not null,
  topic_key text not null,
  content_key text,
  target_channel text,
  recommendation_type text not null,
  priority numeric not null default 0,
  reason text not null default '',
  evidence jsonb not null default '{}'::jsonb,
  status text not null default 'suggested' check (status in ('suggested','accepted','done','skipped','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.powerhouse_daily_runs (
  run_date date primary key,
  dedupe_key text not null unique,
  state text not null default 'started' check (state in ('started','completed','degraded','failed')),
  action_count integer not null default 0,
  recommendation_count integer not null default 0,
  evidence jsonb not null default '{}'::jsonb,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists powerhouse_events_topic_idx on public.powerhouse_runtime_events(topic_key, occurred_at desc);
create index if not exists powerhouse_events_content_idx on public.powerhouse_runtime_events(content_key, occurred_at desc);
create index if not exists powerhouse_actions_topic_idx on public.powerhouse_sales_actions(topic_key, priority desc);
create index if not exists powerhouse_learnings_topic_idx on public.powerhouse_sales_learnings(topic_key, channel, updated_at desc);
create index if not exists powerhouse_content_recommendations_queue_idx on public.powerhouse_content_recommendations(run_date, status, priority desc);

alter table public.powerhouse_content_recommendations enable row level security;
alter table public.powerhouse_daily_runs enable row level security;
revoke all on public.powerhouse_content_recommendations from anon, authenticated;
revoke all on public.powerhouse_daily_runs from anon, authenticated;
grant all on public.powerhouse_content_recommendations to service_role;
grant all on public.powerhouse_daily_runs to service_role;

update public.powerhouse_device_tokens
set scopes=(select array_agg(distinct s) from unnest(scopes || array['daily']::text[]) s)
where not ('daily'=any(scopes));

create or replace function public.powerhouse_record_outcome(p_action_id uuid,p_dedupe_key text,p_outcome_type text,p_evidence jsonb default '{}'::jsonb,p_revenue_eur numeric default 0)
returns public.powerhouse_sales_outcomes language plpgsql security definer set search_path=public as $$
declare v_action public.powerhouse_sales_actions; v_outcome public.powerhouse_sales_outcomes;
begin
  select * into v_action from public.powerhouse_sales_actions where action_id=p_action_id for update;
  if not found then raise exception 'ACTION_NOT_FOUND'; end if;
  insert into public.powerhouse_sales_outcomes(action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,content_key,topic_key,campaign_key,opportunity_key,channel,revenue_eur,evidence)
  values(v_action.action_id,p_dedupe_key,p_outcome_type,v_action.subject_key,v_action.person_key,v_action.company_key,v_action.content_key,v_action.topic_key,v_action.campaign_key,v_action.opportunity_key,v_action.channel,coalesce(p_revenue_eur,0),coalesce(p_evidence,'{}'::jsonb))
  on conflict(dedupe_key) do update set evidence=excluded.evidence,revenue_eur=excluded.revenue_eur returning * into v_outcome;
  update public.powerhouse_sales_actions set outcome_id=v_outcome.outcome_id,status=case when p_outcome_type in ('waiting','no_response') then 'waiting' else 'done' end,executed_at=coalesce(executed_at,now()),updated_at=now() where action_id=v_action.action_id;
  if v_action.event_id is not null then update public.powerhouse_runtime_events set state='closed',updated_at=now() where event_id=v_action.event_id; end if;
  return v_outcome;
end; $$;
revoke all on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) from public,anon,authenticated;
grant execute on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) to service_role;
