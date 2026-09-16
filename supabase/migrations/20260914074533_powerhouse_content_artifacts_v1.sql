create table if not exists public.powerhouse_content_artifacts (
  run_date date not null,
  channel text not null,
  artifact_type text not null,
  title text,
  body text not null,
  cta text,
  content_brief text,
  generation_evidence jsonb not null default '{}'::jsonb,
  status text not null default 'content_ready',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (run_date,channel),
  constraint powerhouse_content_artifacts_channel_chk check (channel in ('email_newsletter','linkedin_personal','linkedin_company','linkedin_article_personal','linkedin_article_company','instagram_company','blog')),
  constraint powerhouse_content_artifacts_status_chk check (status in ('content_ready','scheduled','published','measured','learned','blocked','failed'))
);
create index if not exists powerhouse_content_artifacts_status_idx on public.powerhouse_content_artifacts(run_date,status,channel);
