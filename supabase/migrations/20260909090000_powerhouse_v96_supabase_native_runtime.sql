create table public.powerhouse_device_tokens (
  token_hash text primary key,
  label text not null,
  scopes text[] not null default array['ingest','actions','outcomes','learning','health']::text[],
  active boolean not null default true,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.powerhouse_runtime_events (
  event_id uuid primary key default gen_random_uuid(),
  dedupe_key text not null unique,
  event_type text not null,
  source text not null,
  subject_key text,
  person_key text,
  company_key text,
  channel text,
  occurred_at timestamptz not null default now(),
  evidence jsonb not null default '{}'::jsonb,
  context jsonb not null default '{}'::jsonb,
  state text not null default 'observed' check (state in ('observed','decided','actioned','closed','ignored','error')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.powerhouse_sales_actions (
  action_id uuid primary key default gen_random_uuid(),
  event_id uuid references public.powerhouse_runtime_events(event_id) on delete set null,
  dedupe_key text not null unique,
  subject_key text,
  person_key text,
  company_key text,
  action_type text not null,
  channel text not null,
  priority numeric not null default 0,
  reason text not null default '',
  evidence jsonb not null default '{}'::jsonb,
  message_draft text not null default '',
  source_url text not null default '',
  status text not null default 'suggested' check (status in ('suggested','prepared','waiting','done','skipped','expired','error')),
  due_at timestamptz,
  executed_at timestamptz,
  outcome_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.powerhouse_sales_outcomes (
  outcome_id uuid primary key default gen_random_uuid(),
  action_id uuid references public.powerhouse_sales_actions(action_id) on delete set null,
  dedupe_key text not null unique,
  outcome_type text not null,
  subject_key text,
  person_key text,
  company_key text,
  revenue_eur numeric not null default 0,
  evidence jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.powerhouse_sales_actions add constraint powerhouse_sales_actions_outcome_fk foreign key (outcome_id) references public.powerhouse_sales_outcomes(outcome_id) on delete set null;

create table public.powerhouse_sales_learnings (
  learning_id uuid primary key default gen_random_uuid(),
  fingerprint text not null unique,
  subject_key text,
  scope text not null,
  hypothesis text not null default '',
  evidence jsonb not null default '{}'::jsonb,
  effect jsonb not null default '{}'::jsonb,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  status text not null default 'active' check (status in ('hypothesis','active','proven','rejected','superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index powerhouse_events_subject_idx on public.powerhouse_runtime_events(subject_key, occurred_at desc);
create index powerhouse_actions_queue_idx on public.powerhouse_sales_actions(status, priority desc, due_at nulls first);
create index powerhouse_actions_person_idx on public.powerhouse_sales_actions(person_key, created_at desc);
create index powerhouse_outcomes_subject_idx on public.powerhouse_sales_outcomes(subject_key, occurred_at desc);

alter table public.powerhouse_device_tokens enable row level security;
alter table public.powerhouse_runtime_events enable row level security;
alter table public.powerhouse_sales_actions enable row level security;
alter table public.powerhouse_sales_outcomes enable row level security;
alter table public.powerhouse_sales_learnings enable row level security;

revoke all on public.powerhouse_device_tokens from anon, authenticated;
revoke all on public.powerhouse_runtime_events from anon, authenticated;
revoke all on public.powerhouse_sales_actions from anon, authenticated;
revoke all on public.powerhouse_sales_outcomes from anon, authenticated;
revoke all on public.powerhouse_sales_learnings from anon, authenticated;
grant all on public.powerhouse_device_tokens to service_role;
grant all on public.powerhouse_runtime_events to service_role;
grant all on public.powerhouse_sales_actions to service_role;
grant all on public.powerhouse_sales_outcomes to service_role;
grant all on public.powerhouse_sales_learnings to service_role;

create or replace function public.powerhouse_action_queue(p_limit integer default 15)
returns setof public.powerhouse_sales_actions language sql stable security definer set search_path=public as $$
  select * from public.powerhouse_sales_actions
  where status in ('suggested','prepared','waiting') and (due_at is null or due_at <= now())
  order by priority desc, created_at asc limit greatest(1,least(coalesce(p_limit,15),50));
$$;
revoke all on function public.powerhouse_action_queue(integer) from public,anon,authenticated;
grant execute on function public.powerhouse_action_queue(integer) to service_role;

create or replace function public.powerhouse_record_outcome(p_action_id uuid,p_dedupe_key text,p_outcome_type text,p_evidence jsonb default '{}'::jsonb,p_revenue_eur numeric default 0)
returns public.powerhouse_sales_outcomes language plpgsql security definer set search_path=public as $$
declare v_action public.powerhouse_sales_actions; v_outcome public.powerhouse_sales_outcomes;
begin
  select * into v_action from public.powerhouse_sales_actions where action_id=p_action_id for update;
  if not found then raise exception 'ACTION_NOT_FOUND'; end if;
  insert into public.powerhouse_sales_outcomes(action_id,dedupe_key,outcome_type,subject_key,person_key,company_key,revenue_eur,evidence)
  values(v_action.action_id,p_dedupe_key,p_outcome_type,v_action.subject_key,v_action.person_key,v_action.company_key,coalesce(p_revenue_eur,0),coalesce(p_evidence,'{}'::jsonb))
  on conflict(dedupe_key) do update set evidence=excluded.evidence returning * into v_outcome;
  update public.powerhouse_sales_actions set outcome_id=v_outcome.outcome_id,status=case when p_outcome_type in ('waiting','no_response') then 'waiting' else 'done' end,executed_at=coalesce(executed_at,now()),updated_at=now() where action_id=v_action.action_id;
  if v_action.event_id is not null then update public.powerhouse_runtime_events set state='closed',updated_at=now() where event_id=v_action.event_id; end if;
  return v_outcome;
end; $$;
revoke all on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) from public,anon,authenticated;
grant execute on function public.powerhouse_record_outcome(uuid,text,text,jsonb,numeric) to service_role;
