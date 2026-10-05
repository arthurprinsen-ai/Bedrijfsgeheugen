
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
  unique(provider, provider_message_id)
);

comment on table public.powerhouse_email_reply_events is
'Private canonical inbound reply evidence for commercial outreach. One provider message may count once only and always links back to the originating sales action.';

create index if not exists powerhouse_email_reply_events_action_idx
  on public.powerhouse_email_reply_events(action_id, occurred_at desc);
create index if not exists powerhouse_email_reply_events_class_idx
  on public.powerhouse_email_reply_events(reply_class, occurred_at desc);

alter table public.powerhouse_email_reply_events enable row level security;
revoke all on table public.powerhouse_email_reply_events from anon, authenticated;
grant select, insert, update on table public.powerhouse_email_reply_events to service_role;

create table if not exists public.powerhouse_email_contact_suppressions (
  suppression_id uuid primary key default gen_random_uuid(),
  email text not null,
  reason text not null,
  source_reply_event_id uuid references public.powerhouse_email_reply_events(reply_event_id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  lifted_at timestamptz,
  unique(email)
);

comment on table public.powerhouse_email_contact_suppressions is
'Server-only commercial contact suppression registry. Explicit unsubscribe/do-not-contact replies must block future autonomous email outreach.';

create index if not exists powerhouse_email_contact_suppressions_active_idx
  on public.powerhouse_email_contact_suppressions(active, email);

alter table public.powerhouse_email_contact_suppressions enable row level security;
revoke all on table public.powerhouse_email_contact_suppressions from anon, authenticated;
grant select, insert, update on table public.powerhouse_email_contact_suppressions to service_role;

create table if not exists public.powerhouse_email_learning_stats (
  learning_key text primary key,
  channel text not null default 'email',
  persuasion_strategy text,
  give_asset text,
  trigger_type text,
  get_ask text,
  sent_count integer not null default 0 check (sent_count >= 0),
  reply_count integer not null default 0 check (reply_count >= 0),
  positive_reply_count integer not null default 0 check (positive_reply_count >= 0),
  question_reply_count integer not null default 0 check (question_reply_count >= 0),
  objection_reply_count integer not null default 0 check (objection_reply_count >= 0),
  unsubscribe_count integer not null default 0 check (unsubscribe_count >= 0),
  meeting_count integer not null default 0 check (meeting_count >= 0),
  proposal_count integer not null default 0 check (proposal_count >= 0),
  order_count integer not null default 0 check (order_count >= 0),
  revenue_eur numeric not null default 0,
  reply_rate numeric,
  positive_reply_rate numeric,
  revenue_per_send_eur numeric,
  evidence jsonb not null default '{}'::jsonb,
  last_recomputed_at timestamptz not null default now()
);

comment on table public.powerhouse_email_learning_stats is
'Derived commercial email optimization projection. Revenue/order outcomes outrank vanity metrics; rebuilt from canonical sales actions, reply evidence and outcomes.';

alter table public.powerhouse_email_learning_stats enable row level security;
revoke all on table public.powerhouse_email_learning_stats from anon, authenticated;
grant select, insert, update on table public.powerhouse_email_learning_stats to service_role;
