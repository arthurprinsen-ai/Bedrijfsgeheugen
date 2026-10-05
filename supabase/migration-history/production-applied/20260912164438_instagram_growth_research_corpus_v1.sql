create table if not exists public.instagram_growth_research_sources (
  source_url text primary key,
  domain text not null,
  source_title text,
  source_type text not null default 'web',
  publisher text,
  topic text not null,
  method_tags text[] not null default '{}',
  evidence_summary text,
  authority_tier text not null default 'secondary',
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  relevance numeric not null default 0.5,
  confidence numeric not null default 0.5,
  status text not null default 'candidate',
  used_in_rule_ids text[] not null default '{}',
  content_hash text,
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists idx_instagram_growth_research_topic on public.instagram_growth_research_sources(topic);
create index if not exists idx_instagram_growth_research_domain on public.instagram_growth_research_sources(domain);
create index if not exists idx_instagram_growth_research_status on public.instagram_growth_research_sources(status);
comment on table public.instagram_growth_research_sources is 'Canonical deduplicated evidence corpus for Instagram growth research; one row per unique public source URL.';
