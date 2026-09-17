-- Replay compatibility baseline: this table existed in production before it was ever captured in migrations.
-- Keep only the proven pre-existing columns; the canonical ALTER below adds the later fields.
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
  synced_from text default 'notion'::text
);
alter table public.notion_synced_posts enable row level security;
revoke all on table public.notion_synced_posts from public, anon, authenticated;
grant all on table public.notion_synced_posts to service_role;

alter table public.notion_synced_posts
  add column if not exists platform text,
  add column if not exists external_post_id text,
  add column if not exists campaign_key text,
  add column if not exists notion_page_id text;
create index if not exists notion_synced_posts_campaign_key_idx on public.notion_synced_posts(campaign_key) where campaign_key is not null;
create index if not exists notion_synced_posts_external_post_idx on public.notion_synced_posts(platform, external_post_id) where external_post_id is not null;
