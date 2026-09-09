alter table public.powerhouse_sales_actions add column if not exists opportunity_key text;
alter table public.powerhouse_sales_actions add column if not exists expected_value_eur numeric not null default 0;
alter table public.powerhouse_sales_actions add column if not exists person_name text;
alter table public.powerhouse_sales_actions add column if not exists company_name text;
alter table public.powerhouse_sales_actions add column if not exists role text;

create table if not exists public.powerhouse_opportunities (
  opportunity_id uuid primary key default gen_random_uuid(),
  opportunity_key text not null unique,
  subject_key text,
  person_key text,
  company_key text,
  person_name text,
  company_name text,
  role text,
  stage text not null default 'signal' check (stage in ('signal','opportunity','lead','meeting','offer','order','revenue','lost')),
  status text not null default 'open' check (status in ('open','waiting','deferred','won','lost')),
  expected_order_value_eur numeric not null default 0 check (expected_order_value_eur >= 0),
  order_probability numeric not null default 0.05 check (order_probability >= 0 and order_probability <= 1),
  probability_confidence numeric not null default 0.2 check (probability_confidence >= 0 and probability_confidence <= 1),
  expected_revenue_eur numeric not null default 0 check (expected_revenue_eur >= 0),
  problem_fit numeric not null default 0.5 check (problem_fit >= 0 and problem_fit <= 1),
  intent_score numeric not null default 0.5 check (intent_score >= 0 and intent_score <= 1),
  relationship_warmth numeric not null default 0.5 check (relationship_warmth >= 0 and relationship_warmth <= 1),
  urgency_score numeric not null default 0.5 check (urgency_score >= 0 and urgency_score <= 1),
  strategic_fit numeric not null default 0.5 check (strategic_fit >= 0 and strategic_fit <= 1),
  evidence_quality numeric not null default 0.5 check (evidence_quality >= 0 and evidence_quality <= 1),
  evidence jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  last_evidence_at timestamptz,
  next_action_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.powerhouse_opportunity_stage_events (
  stage_event_id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.powerhouse_opportunities(opportunity_id) on delete cascade,
  dedupe_key text not null unique,
  from_stage text check (from_stage is null or from_stage in ('signal','opportunity','lead','meeting','offer','order','revenue','lost')),
  to_stage text not null check (to_stage in ('signal','opportunity','lead','meeting','offer','order','revenue','lost')),
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists powerhouse_opportunities_value_idx on public.powerhouse_opportunities(status, expected_revenue_eur desc, next_action_at nulls first);
create index if not exists powerhouse_opportunities_subject_idx on public.powerhouse_opportunities(subject_key, updated_at desc);
create index if not exists powerhouse_opportunity_stage_events_idx on public.powerhouse_opportunity_stage_events(opportunity_id, occurred_at desc);
create index if not exists powerhouse_actions_opportunity_idx on public.powerhouse_sales_actions(opportunity_key, status, priority desc);

alter table public.powerhouse_opportunities enable row level security;
alter table public.powerhouse_opportunity_stage_events enable row level security;
revoke all on public.powerhouse_opportunities from anon, authenticated;
revoke all on public.powerhouse_opportunity_stage_events from anon, authenticated;
grant all on public.powerhouse_opportunities to service_role;
grant all on public.powerhouse_opportunity_stage_events to service_role;

create or replace function public.powerhouse_command_center_snapshot(p_limit integer default 15)
returns table (
  action_id uuid,
  opportunity_id uuid,
  opportunity_key text,
  subject_key text,
  person_key text,
  company_key text,
  person_name text,
  company_name text,
  role text,
  stage text,
  opportunity_status text,
  expected_order_value_eur numeric,
  order_probability numeric,
  probability_confidence numeric,
  expected_revenue_eur numeric,
  action_type text,
  channel text,
  priority numeric,
  reason text,
  evidence jsonb,
  message_draft text,
  source_url text,
  action_status text,
  due_at timestamptz,
  updated_at timestamptz
)
language sql stable security definer set search_path=public as $$
  with ranked as (
    select a.*, coalesce(a.opportunity_key,a.subject_key,a.person_key,a.company_key,a.action_id::text) as resolved_opportunity_key,
           row_number() over (partition by coalesce(a.opportunity_key,a.subject_key,a.person_key,a.company_key,a.action_id::text) order by a.priority desc,a.created_at asc) rn
    from public.powerhouse_sales_actions a
    where a.status in ('suggested','prepared','waiting') and (a.due_at is null or a.due_at <= now())
  )
  select r.action_id,o.opportunity_id,r.resolved_opportunity_key,
         coalesce(o.subject_key,r.subject_key),coalesce(o.person_key,r.person_key),coalesce(o.company_key,r.company_key),
         coalesce(o.person_name,r.person_name),coalesce(o.company_name,r.company_name),coalesce(o.role,r.role),
         coalesce(o.stage,'opportunity'),coalesce(o.status,'open'),
         coalesce(o.expected_order_value_eur,r.expected_value_eur,0),coalesce(o.order_probability,0.05),coalesce(o.probability_confidence,0.2),
         coalesce(o.expected_revenue_eur,coalesce(r.expected_value_eur,0)*0.05),r.action_type,r.channel,r.priority,r.reason,r.evidence,r.message_draft,r.source_url,r.status,r.due_at,
         greatest(r.updated_at,coalesce(o.updated_at,r.updated_at))
  from ranked r left join public.powerhouse_opportunities o on o.opportunity_key=r.resolved_opportunity_key
  where r.rn=1
  order by coalesce(o.expected_revenue_eur,coalesce(r.expected_value_eur,0)*0.05) desc,r.priority desc,r.created_at asc
  limit greatest(1,least(coalesce(p_limit,15),50));
$$;
revoke all on function public.powerhouse_command_center_snapshot(integer) from public,anon,authenticated;
grant execute on function public.powerhouse_command_center_snapshot(integer) to service_role;
