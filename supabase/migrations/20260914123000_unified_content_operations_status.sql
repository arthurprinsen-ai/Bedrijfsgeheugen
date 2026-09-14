-- Canonical content operations registry: one operational truth for plan -> publish -> proof -> learning.

create table if not exists public.content_operations_registry (
  content_key text primary key,
  tenant_id uuid,
  content_type text not null,
  channel text not null,
  title text,
  slug text,
  campaign_key text,
  planned_for timestamptz,
  generated_at timestamptz,
  scheduled_for timestamptz,
  published_at timestamptz,
  live_verified_at timestamptz,
  publication_url text,
  proof_url text,
  status text not null default 'planned',
  source_system text,
  source_ref jsonb not null default '{}'::jsonb,
  metrics jsonb not null default '{}'::jsonb,
  learning_written_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint content_operations_status_check check (
    status in ('planned','generated','scheduled','publishing','published','verified','measured','learned','blocked','failed')
  )
);

create index if not exists content_operations_registry_planned_idx
  on public.content_operations_registry(planned_for, channel);
create index if not exists content_operations_registry_published_idx
  on public.content_operations_registry(published_at desc)
  where published_at is not null;
create index if not exists content_operations_registry_attention_idx
  on public.content_operations_registry(status, updated_at desc);

alter table public.content_operations_registry enable row level security;

create or replace function public.sync_social_post_to_content_operations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_status text;
begin
  v_key := 'social:' || new.post_id;
  v_status := case
    when new.published_at is not null then 'published'
    else 'generated'
  end;

  insert into public.content_operations_registry (
    content_key,
    tenant_id,
    content_type,
    channel,
    campaign_key,
    generated_at,
    published_at,
    status,
    source_system,
    source_ref,
    updated_at
  ) values (
    v_key,
    new.tenant_id,
    'social_post',
    lower(coalesce(new.platform, 'unknown')),
    new.source_campaign_id,
    coalesce(new.created_at, now()),
    new.published_at,
    v_status,
    'social_posts',
    jsonb_build_object('post_id', new.post_id),
    now()
  )
  on conflict (content_key) do update set
    tenant_id = excluded.tenant_id,
    channel = excluded.channel,
    campaign_key = coalesce(excluded.campaign_key, content_operations_registry.campaign_key),
    generated_at = coalesce(content_operations_registry.generated_at, excluded.generated_at),
    published_at = coalesce(excluded.published_at, content_operations_registry.published_at),
    status = case
      when content_operations_registry.live_verified_at is not null then 'verified'
      when excluded.published_at is not null then 'published'
      else greatest(content_operations_registry.status, excluded.status)
    end,
    source_ref = content_operations_registry.source_ref || excluded.source_ref,
    updated_at = now();

  return new;
end;
$$;

revoke all on function public.sync_social_post_to_content_operations() from public;

drop trigger if exists social_posts_content_operations on public.social_posts;
create trigger social_posts_content_operations
after insert or update of platform, source_campaign_id, published_at
on public.social_posts
for each row
execute function public.sync_social_post_to_content_operations();

-- Backfill already observed social content into the canonical registry through the same trigger.
update public.social_posts
set platform = platform
where post_id is not null;

create or replace view public.content_operations_dashboard
with (security_invoker = true)
as
select
  r.content_key,
  r.content_type,
  r.channel,
  r.title,
  r.slug,
  r.campaign_key,
  r.planned_for,
  r.generated_at,
  r.scheduled_for,
  r.published_at,
  r.live_verified_at,
  r.publication_url,
  r.proof_url,
  case
    when r.last_error is not null then 'failed'
    when r.live_verified_at is not null and r.learning_written_at is not null then 'learned'
    when r.live_verified_at is not null then 'verified'
    when r.published_at is not null then 'published'
    when r.scheduled_for is not null then 'scheduled'
    when r.generated_at is not null then 'generated'
    else 'planned'
  end as lifecycle_status,
  (
    (r.published_at is not null and r.live_verified_at is null)
    or (r.status in ('blocked','failed'))
    or (r.planned_for is not null and r.planned_for < now() and r.published_at is null)
  ) as needs_attention,
  r.metrics,
  r.learning_written_at,
  r.last_error,
  r.source_system,
  r.source_ref,
  r.updated_at
from public.content_operations_registry r;

comment on view public.content_operations_dashboard is
  'Canonical operational truth for planned, generated, scheduled, published, live-proven, measured and learned content across channels.';
