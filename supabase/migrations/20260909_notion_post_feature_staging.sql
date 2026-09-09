alter table public.notion_synced_posts
  add column if not exists platform text,
  add column if not exists external_post_id text,
  add column if not exists campaign_key text,
  add column if not exists notion_page_id text;

create index if not exists notion_synced_posts_campaign_key_idx
  on public.notion_synced_posts(campaign_key)
  where campaign_key is not null;

create index if not exists notion_synced_posts_external_post_idx
  on public.notion_synced_posts(platform, external_post_id)
  where external_post_id is not null;
