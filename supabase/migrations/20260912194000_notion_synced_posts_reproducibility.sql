-- Canonical reproducibility repair for a table that originally existed outside versioned migrations.
create table if not exists public.notion_synced_posts (
  post_id text primary key,
  page_path text,
  notion_url text,
  hook_type text,
  format text,
  narrative_type text,
  emotion text,
  cta_type text,
  topic text,
  synced_at timestamptz not null default now(),
  synced_from text default 'notion'::text,
  platform text,
  external_post_id text,
  campaign_key text,
  notion_page_id text
);

alter table public.notion_synced_posts
  add column if not exists page_path text,
  add column if not exists notion_url text,
  add column if not exists hook_type text,
  add column if not exists format text,
  add column if not exists narrative_type text,
  add column if not exists emotion text,
  add column if not exists cta_type text,
  add column if not exists topic text,
  add column if not exists synced_at timestamptz not null default now(),
  add column if not exists synced_from text default 'notion'::text,
  add column if not exists platform text,
  add column if not exists external_post_id text,
  add column if not exists campaign_key text,
  add column if not exists notion_page_id text;

alter table public.notion_synced_posts enable row level security;

create index if not exists notion_synced_posts_campaign_key_idx
  on public.notion_synced_posts(campaign_key)
  where campaign_key is not null;

create index if not exists notion_synced_posts_external_post_idx
  on public.notion_synced_posts(platform, external_post_id)
  where external_post_id is not null;
