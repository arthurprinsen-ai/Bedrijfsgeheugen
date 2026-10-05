create table if not exists public.powerhouse_channel_decisions (
  run_date date not null,
  channel text not null,
  decision text not null,
  state text not null default 'decided',
  priority numeric,
  confidence numeric,
  topic_key text,
  content_key text,
  rationale text not null,
  scheduled_for timestamptz,
  delivery_ref text,
  delivery_evidence jsonb not null default '{}'::jsonb,
  learning_evidence jsonb not null default '{}'::jsonb,
  source_recommendation_ids uuid[] not null default '{}'::uuid[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (run_date, channel),
  constraint powerhouse_channel_decisions_channel_chk check (channel in ('email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog')),
  constraint powerhouse_channel_decisions_decision_chk check (decision in ('publish','skip','hold')),
  constraint powerhouse_channel_decisions_state_chk check (state in ('decided','content_ready','scheduled','published','measured','learned','blocked','failed','skipped')),
  constraint powerhouse_channel_decisions_confidence_chk check (confidence is null or (confidence >= 0 and confidence <= 1))
);
create index if not exists powerhouse_channel_decisions_state_idx on public.powerhouse_channel_decisions(run_date,state,decision);
