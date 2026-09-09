create table if not exists public.powerhouse_opportunities (
  opportunity_id uuid primary key default gen_random_uuid(),
  opportunity_key text not null unique,
  subject_key text,
  person_key text,
  company_key text,
  content_key text,
  topic_key text,
  campaign_key text,
  stage text not null default 'opportunity' check (stage in ('signal','opportunity','lead','meeting','offer','order','revenue','lost','deferred')),
  expected_value_eur numeric not null default 0 check (expected_value_eur >= 0),
  probability numeric not null default 0.08 check (probability >= 0 and probability <= 1),
  confidence numeric not null default 0.35 check (confidence >= 0 and confidence <= 1),
  expected_revenue_value numeric not null default 0 check (expected_revenue_value >= 0),
  score_components jsonb not null default '{}'::jsonb,
  evidence jsonb not null default '{}'::jsonb,
  last_evidence_at timestamptz,
  last_action_at timestamptz,
  next_action_at timestamptz,
  status text not null default 'open' check (status in ('open','won','lost','deferred')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists powerhouse_opportunities_queue_idx
  on public.powerhouse_opportunities(status, expected_revenue_value desc, updated_at desc);
create index if not exists powerhouse_opportunities_subject_idx
  on public.powerhouse_opportunities(subject_key, updated_at desc);
create index if not exists powerhouse_opportunities_topic_idx
  on public.powerhouse_opportunities(topic_key, updated_at desc);

alter table public.powerhouse_opportunities enable row level security;
revoke all on public.powerhouse_opportunities from anon, authenticated;
grant all on public.powerhouse_opportunities to service_role;

create or replace function public.powerhouse_opportunity_queue(p_limit integer default 15)
returns setof public.powerhouse_opportunities
language sql stable security definer set search_path=public as $$
  select *
  from public.powerhouse_opportunities
  where status='open'
  order by expected_revenue_value desc, probability desc, updated_at desc
  limit greatest(1,least(coalesce(p_limit,15),50));
$$;
revoke all on function public.powerhouse_opportunity_queue(integer) from public, anon, authenticated;
grant execute on function public.powerhouse_opportunity_queue(integer) to service_role;

-- Server adapters may need additional scoped routes without changing the browser token.
update public.powerhouse_device_tokens
set scopes = (
  select array_agg(distinct scope order by scope)
  from unnest(scopes || array['opportunities','recommendations','daily']::text[]) scope
)
where active = true;
