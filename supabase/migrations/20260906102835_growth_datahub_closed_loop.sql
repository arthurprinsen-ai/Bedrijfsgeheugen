create table if not exists public.growth_events (
  event_id text primary key,
  event_type text not null,
  canonical text,
  intent text,
  intent_owner text,
  attribution_root_key text,
  source text,
  medium text,
  campaign text,
  occurred_at timestamptz not null,
  page_role text,
  funnel_stage text,
  value numeric not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint growth_events_canonical_internal check (canonical is null or canonical = 'https://www.bedrijfsgeheugen.nl/' or canonical like 'https://www.bedrijfsgeheugen.nl/%')
);

create index if not exists growth_events_attribution_idx on public.growth_events(attribution_root_key, occurred_at desc);
create index if not exists growth_events_canonical_idx on public.growth_events(canonical, occurred_at desc);
create index if not exists growth_events_intent_owner_idx on public.growth_events(intent_owner, occurred_at desc);

create table if not exists public.growth_outcomes (
  outcome_id text primary key,
  stage text not null check (stage in ('lead','qualified_lead','appointment','proposal','won_order','revenue')),
  attribution_root_key text not null,
  canonical text,
  intent_owner text,
  occurred_at timestamptz not null,
  revenue_eur numeric(14,2) not null default 0 check (revenue_eur >= 0),
  source text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint growth_outcomes_canonical_internal check (canonical is null or canonical = 'https://www.bedrijfsgeheugen.nl/' or canonical like 'https://www.bedrijfsgeheugen.nl/%')
);

create index if not exists growth_outcomes_attribution_idx on public.growth_outcomes(attribution_root_key, occurred_at desc);
create index if not exists growth_outcomes_canonical_idx on public.growth_outcomes(canonical, occurred_at desc);

create table if not exists public.growth_page_daily (
  day date not null,
  canonical text not null,
  intent_owner text not null default '',
  page_views bigint not null default 0,
  cta_clicks bigint not null default 0,
  leads bigint not null default 0,
  qualified_leads bigint not null default 0,
  appointments bigint not null default 0,
  proposals bigint not null default 0,
  won_orders bigint not null default 0,
  revenue_eur numeric(14,2) not null default 0,
  updated_at timestamptz not null default now(),
  primary key(day, canonical, intent_owner)
);

create table if not exists public.growth_brain_queue (
  queue_id text primary key,
  kind text not null check (kind in ('event','outcome')),
  source_id text not null,
  fingerprint text not null,
  state text not null default 'QUEUED' check (state in ('QUEUED','DELIVERED','BLOCKED')),
  attempts integer not null default 0,
  last_error text,
  last_attempt_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(kind, source_id)
);

alter table public.growth_events enable row level security;
alter table public.growth_outcomes enable row level security;
alter table public.growth_page_daily enable row level security;
alter table public.growth_brain_queue enable row level security;

revoke all on public.growth_events from anon, authenticated;
revoke all on public.growth_outcomes from anon, authenticated;
revoke all on public.growth_page_daily from anon, authenticated;
revoke all on public.growth_brain_queue from anon, authenticated;

grant all on public.growth_events to service_role;
grant all on public.growth_outcomes to service_role;
grant all on public.growth_page_daily to service_role;
grant all on public.growth_brain_queue to service_role;

create or replace function public.bg_growth_ingest_event(p_event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id text := nullif(trim(p_event->>'event_id'),'');
  v_event_type text := nullif(trim(p_event->>'event_type'),'');
  v_canonical text := nullif(trim(p_event->>'canonical'),'');
  v_intent_owner text := coalesce(nullif(trim(p_event->>'intent_owner'),''),'');
  v_occurred timestamptz := coalesce(nullif(p_event->>'occurred_at','')::timestamptz, now());
  v_inserted integer := 0;
  v_fingerprint text;
begin
  if v_event_id is null or v_event_type is null then raise exception 'INVALID_GROWTH_EVENT'; end if;
  if v_canonical is not null and not (v_canonical='https://www.bedrijfsgeheugen.nl/' or v_canonical like 'https://www.bedrijfsgeheugen.nl/%') then raise exception 'INVALID_CANONICAL'; end if;
  v_fingerprint := coalesce(nullif(p_event->>'fingerprint',''),'growth-event|'||v_event_id);
  insert into public.growth_events(event_id,event_type,canonical,intent,intent_owner,attribution_root_key,source,medium,campaign,occurred_at,page_role,funnel_stage,value,payload)
  values(v_event_id,v_event_type,v_canonical,nullif(p_event->>'intent',''),nullif(p_event->>'intent_owner',''),nullif(p_event->>'attribution_root_key',''),nullif(p_event->>'source',''),nullif(p_event->>'medium',''),nullif(p_event->>'campaign',''),v_occurred,nullif(p_event->>'page_role',''),nullif(p_event->>'funnel_stage',''),coalesce((p_event->>'value')::numeric,0),coalesce(p_event->'payload','{}'::jsonb))
  on conflict(event_id) do nothing;
  get diagnostics v_inserted = row_count;
  insert into public.growth_brain_queue(queue_id,kind,source_id,fingerprint,state)
  values('event:'||v_event_id,'event',v_event_id,v_fingerprint,'QUEUED') on conflict(kind,source_id) do nothing;
  if v_inserted=1 and v_canonical is not null then
    insert into public.growth_page_daily(day,canonical,intent_owner,page_views,cta_clicks)
    values(v_occurred::date,v_canonical,v_intent_owner,case when v_event_type='page_view' then 1 else 0 end,case when v_event_type in ('cta_click','selfscan_start','frisse_blik_click') then 1 else 0 end)
    on conflict(day,canonical,intent_owner) do update set
      page_views=public.growth_page_daily.page_views+excluded.page_views,
      cta_clicks=public.growth_page_daily.cta_clicks+excluded.cta_clicks,
      updated_at=now();
  end if;
  return jsonb_build_object('stored',v_inserted=1,'deduped',v_inserted=0,'event_id',v_event_id,'queue_id','event:'||v_event_id);
end;
$$;

create or replace function public.bg_growth_ingest_outcome(p_outcome jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id text := nullif(trim(p_outcome->>'outcome_id'),'');
  v_stage text := nullif(trim(p_outcome->>'stage'),'');
  v_root text := nullif(trim(p_outcome->>'attribution_root_key'),'');
  v_canonical text := nullif(trim(p_outcome->>'canonical'),'');
  v_intent_owner text := coalesce(nullif(trim(p_outcome->>'intent_owner'),''),'');
  v_occurred timestamptz := coalesce(nullif(p_outcome->>'occurred_at','')::timestamptz, now());
  v_revenue numeric := coalesce((p_outcome->>'revenue_eur')::numeric,0);
  v_inserted integer := 0;
  v_fingerprint text;
begin
  if v_id is null or v_stage is null or v_root is null then raise exception 'INVALID_GROWTH_OUTCOME'; end if;
  if v_stage not in ('lead','qualified_lead','appointment','proposal','won_order','revenue') then raise exception 'INVALID_OUTCOME_STAGE'; end if;
  if v_revenue < 0 then raise exception 'INVALID_REVENUE'; end if;
  if v_canonical is not null and not (v_canonical='https://www.bedrijfsgeheugen.nl/' or v_canonical like 'https://www.bedrijfsgeheugen.nl/%') then raise exception 'INVALID_CANONICAL'; end if;
  v_fingerprint := coalesce(nullif(p_outcome->>'fingerprint',''),'growth-outcome|'||v_id);
  insert into public.growth_outcomes(outcome_id,stage,attribution_root_key,canonical,intent_owner,occurred_at,revenue_eur,source,payload)
  values(v_id,v_stage,v_root,v_canonical,nullif(p_outcome->>'intent_owner',''),v_occurred,v_revenue,nullif(p_outcome->>'source',''),coalesce(p_outcome->'payload','{}'::jsonb))
  on conflict(outcome_id) do nothing;
  get diagnostics v_inserted = row_count;
  insert into public.growth_brain_queue(queue_id,kind,source_id,fingerprint,state)
  values('outcome:'||v_id,'outcome',v_id,v_fingerprint,'QUEUED') on conflict(kind,source_id) do nothing;
  if v_inserted=1 and v_canonical is not null then
    insert into public.growth_page_daily(day,canonical,intent_owner,leads,qualified_leads,appointments,proposals,won_orders,revenue_eur)
    values(v_occurred::date,v_canonical,v_intent_owner,case when v_stage='lead' then 1 else 0 end,case when v_stage='qualified_lead' then 1 else 0 end,case when v_stage='appointment' then 1 else 0 end,case when v_stage='proposal' then 1 else 0 end,case when v_stage='won_order' then 1 else 0 end,case when v_stage in ('won_order','revenue') then v_revenue else 0 end)
    on conflict(day,canonical,intent_owner) do update set
      leads=public.growth_page_daily.leads+excluded.leads,
      qualified_leads=public.growth_page_daily.qualified_leads+excluded.qualified_leads,
      appointments=public.growth_page_daily.appointments+excluded.appointments,
      proposals=public.growth_page_daily.proposals+excluded.proposals,
      won_orders=public.growth_page_daily.won_orders+excluded.won_orders,
      revenue_eur=public.growth_page_daily.revenue_eur+excluded.revenue_eur,
      updated_at=now();
  end if;
  return jsonb_build_object('stored',v_inserted=1,'deduped',v_inserted=0,'outcome_id',v_id,'queue_id','outcome:'||v_id);
end;
$$;

revoke all on function public.bg_growth_ingest_event(jsonb) from public, anon, authenticated;
revoke all on function public.bg_growth_ingest_outcome(jsonb) from public, anon, authenticated;
grant execute on function public.bg_growth_ingest_event(jsonb) to service_role;
grant execute on function public.bg_growth_ingest_outcome(jsonb) to service_role;