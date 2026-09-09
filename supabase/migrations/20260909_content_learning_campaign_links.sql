create table if not exists public.bg_campaign_links (
  key text primary key,
  destination text not null,
  campaign_key text not null,
  status text not null default 'active' check (status in ('active','disabled')),
  expires_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bg_campaign_links_key_format check (key ~ '^[A-Za-z0-9_-]{6,80}$'),
  constraint bg_campaign_links_destination_https check (destination ~ '^https://(www\.)?bedrijfsgeheugen\.nl(/|$)')
);

alter table public.bg_campaign_links enable row level security;
revoke all on table public.bg_campaign_links from public, anon, authenticated;
grant select, insert, update, delete on table public.bg_campaign_links to service_role;

create index if not exists bg_campaign_links_campaign_key_idx
  on public.bg_campaign_links(campaign_key);
create index if not exists bg_campaign_links_active_idx
  on public.bg_campaign_links(status, expires_at);
