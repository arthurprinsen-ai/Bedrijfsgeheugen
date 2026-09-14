-- Canonical content operations registry: one operational truth for plan -> publish -> proof -> learning.

create table if not exists public.content_operations_registry (
  content_key text primary key,
  tenant_id text,
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
create index if not exists content_operations_registry_campaign_channel_idx
  on public.content_operations_registry(tenant_id, campaign_key, channel);
create index if not exists content_operations_registry_attention_idx
  on public.content_operations_registry(status, updated_at desc);

alter table public.content_operations_registry enable row level security;

-- Calendar/experiment slots become the canonical forward-looking plan.
create or replace function public.sync_social_experiment_to_content_operations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_channel text;
  v_key text;
  v_planned timestamptz;
begin
  if new.calendar_date is null then
    return new;
  end if;

  v_planned := (new.calendar_date::timestamp at time zone 'Europe/Amsterdam');

  for v_channel in
    select lower(value)
    from jsonb_array_elements_text(coalesce(new.target_channels, '[]'::jsonb))
  loop
    v_key := 'plan:' || new.tenant_id || ':' || new.experiment_id || ':' || v_channel;

    insert into public.content_operations_registry (
      content_key, tenant_id, content_type, channel, title, campaign_key,
      planned_for, status, source_system, source_ref, updated_at
    ) values (
      v_key,
      new.tenant_id,
      case when v_channel = 'blog' then 'blog' else 'social_post' end,
      v_channel,
      nullif(new.comparison_scope->>'family',''),
      new.experiment_id,
      v_planned,
      case
        when new.status = 'ROLLED_BACK' then 'blocked'
        when new.status = 'COMPLETE' then 'measured'
        else 'planned'
      end,
      'social_experiments',
      jsonb_build_object(
        'experiment_id', new.experiment_id,
        'calendar_date', new.calendar_date,
        'experiment_status', new.status,
        'recipe', coalesce(new.recipe, '{}'::jsonb),
        'source_signals', coalesce(new.source_signals, '[]'::jsonb)
      ),
      now()
    )
    on conflict (content_key) do update set
      content_type = excluded.content_type,
      channel = excluded.channel,
      title = excluded.title,
      campaign_key = excluded.campaign_key,
      planned_for = excluded.planned_for,
      status = case
        when content_operations_registry.live_verified_at is not null then 'verified'
        when content_operations_registry.published_at is not null then 'published'
        else excluded.status
      end,
      source_ref = content_operations_registry.source_ref || excluded.source_ref,
      updated_at = now();
  end loop;

  return new;
end;
$$;

revoke all on function public.sync_social_experiment_to_content_operations() from public;

drop trigger if exists social_experiments_content_operations on public.social_experiments;
create trigger social_experiments_content_operations
after insert or update of status, recipe, source_signals, target_channels, calendar_date
on public.social_experiments
for each row
execute function public.sync_social_experiment_to_content_operations();

-- Provider-observed social publications become actual delivery evidence. channel_kind keeps personal/company identities separate.
create or replace function public.sync_social_post_to_content_operations()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_status text;
  v_channel text;
  v_verified timestamptz;
begin
  v_key := 'social:' || new.tenant_id || ':' || new.post_id;
  v_channel := lower(coalesce(nullif(new.channel_kind,''), nullif(new.platform,''), 'unknown'));
  v_verified := case
    when new.published_at is not null and nullif(new.external_post_id,'') is not null then new.published_at
    else null
  end;
  v_status := case
    when v_verified is not null then 'verified'
    when new.published_at is not null then 'published'
    else 'generated'
  end;

  insert into public.content_operations_registry (
    content_key, tenant_id, content_type, channel, campaign_key, generated_at,
    published_at, live_verified_at, status, source_system, source_ref, updated_at
  ) values (
    v_key,
    new.tenant_id,
    'social_post',
    v_channel,
    new.source_campaign_id,
    coalesce(new.created_at, now()),
    new.published_at,
    v_verified,
    v_status,
    'social_posts',
    jsonb_build_object(
      'post_id', new.post_id,
      'external_post_id', new.external_post_id,
      'channel_id', new.channel_id,
      'channel_name', new.channel_name,
      'channel_kind', new.channel_kind,
      'proof_type', case when v_verified is not null then 'provider_observed_publication' else null end
    ),
    now()
  )
  on conflict (content_key) do update set
    tenant_id = excluded.tenant_id,
    channel = excluded.channel,
    campaign_key = coalesce(excluded.campaign_key, content_operations_registry.campaign_key),
    generated_at = coalesce(content_operations_registry.generated_at, excluded.generated_at),
    published_at = coalesce(excluded.published_at, content_operations_registry.published_at),
    live_verified_at = coalesce(excluded.live_verified_at, content_operations_registry.live_verified_at),
    status = case
      when content_operations_registry.learning_written_at is not null then 'learned'
      when excluded.live_verified_at is not null then 'verified'
      when excluded.published_at is not null then 'published'
      else coalesce(content_operations_registry.status, excluded.status)
    end,
    source_ref = content_operations_registry.source_ref || excluded.source_ref,
    updated_at = now();

  -- Close the matching calendar slot without guessing across identities.
  if new.source_campaign_id is not null and nullif(new.channel_kind,'') is not null then
    update public.content_operations_registry
    set
      generated_at = coalesce(generated_at, new.created_at),
      published_at = coalesce(new.published_at, published_at),
      live_verified_at = coalesce(v_verified, live_verified_at),
      status = case
        when v_verified is not null then 'verified'
        when new.published_at is not null then 'published'
        else status
      end,
      source_ref = source_ref || jsonb_build_object(
        'matched_post_id', new.post_id,
        'matched_external_post_id', new.external_post_id,
        'matched_channel_id', new.channel_id
      ),
      updated_at = now()
    where content_key = 'plan:' || new.tenant_id || ':' || new.source_campaign_id || ':' || lower(new.channel_kind);
  end if;

  return new;
end;
$$;

revoke all on function public.sync_social_post_to_content_operations() from public;

drop trigger if exists social_posts_content_operations on public.social_posts;
create trigger social_posts_content_operations
after insert or update of platform, channel_id, channel_name, channel_kind, source_campaign_id, published_at, external_post_id
on public.social_posts
for each row
execute function public.sync_social_post_to_content_operations();

-- Idempotent backfill for existing plans and observed posts.
update public.social_experiments
set target_channels = target_channels
where calendar_date is not null;

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
    or (
      r.planned_for is not null
      and (r.planned_for at time zone 'Europe/Amsterdam')::date < (now() at time zone 'Europe/Amsterdam')::date
      and r.published_at is null
    )
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
