-- One operational truth for unified content operations.
-- social_experiments may keep historical aliases, but the execution ledger is bedrijfsgeheugen-only.

-- Backfill any row that only exists on the old alias.
insert into public.content_publication_obligations (
  tenant_id, publication_date, channel, experiment_id, content_kind, status,
  content_id, slug, external_id, canonical_url,
  generated_at, approved_at, dispatched_at, published_at, live_proven_at, measured_at, learned_at,
  last_error, recovery_attempts, evidence, metrics, next_action, created_at, updated_at
)
select
  'bedrijfsgeheugen', publication_date, channel, experiment_id, content_kind, status,
  content_id, slug, external_id, canonical_url,
  generated_at, approved_at, dispatched_at, published_at, live_proven_at, measured_at, learned_at,
  last_error, recovery_attempts, evidence, metrics, next_action, created_at, now()
from public.content_publication_obligations c
where c.tenant_id = 'canonical'
  and not exists (
    select 1
    from public.content_publication_obligations b
    where b.tenant_id = 'bedrijfsgeheugen'
      and b.publication_date = c.publication_date
      and b.channel = c.channel
  );

-- If the alias contains stronger progress, preserve it on the operational row.
update public.content_publication_obligations b
set experiment_id = c.experiment_id,
    content_kind = c.content_kind,
    status = c.status,
    content_id = coalesce(c.content_id, b.content_id),
    slug = coalesce(c.slug, b.slug),
    external_id = coalesce(c.external_id, b.external_id),
    canonical_url = coalesce(c.canonical_url, b.canonical_url),
    generated_at = coalesce(b.generated_at, c.generated_at),
    approved_at = coalesce(b.approved_at, c.approved_at),
    dispatched_at = coalesce(b.dispatched_at, c.dispatched_at),
    published_at = coalesce(b.published_at, c.published_at),
    live_proven_at = coalesce(b.live_proven_at, c.live_proven_at),
    measured_at = coalesce(b.measured_at, c.measured_at),
    learned_at = coalesce(b.learned_at, c.learned_at),
    last_error = c.last_error,
    recovery_attempts = greatest(b.recovery_attempts, c.recovery_attempts),
    evidence = b.evidence || c.evidence,
    metrics = b.metrics || c.metrics,
    next_action = coalesce(c.next_action, b.next_action),
    updated_at = now()
from public.content_publication_obligations c
where b.tenant_id = 'bedrijfsgeheugen'
  and c.tenant_id = 'canonical'
  and b.publication_date = c.publication_date
  and b.channel = c.channel
  and public.content_publication_state_rank(c.status) > public.content_publication_state_rank(b.status);

-- Remove the duplicate execution truth after preservation.
delete from public.content_publication_obligations where tenant_id = 'canonical';

create or replace function public.sync_content_publication_obligations(
  p_from date default (timezone('Europe/Amsterdam', now()))::date,
  p_to date default (timezone('Europe/Amsterdam', now()))::date
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
begin
  if p_from is null or p_to is null or p_to < p_from then
    raise exception 'INVALID_PUBLICATION_RANGE';
  end if;

  insert into public.content_publication_obligations(
    tenant_id, publication_date, channel, experiment_id, content_kind, status, next_action, updated_at
  )
  select
    'bedrijfsgeheugen',
    e.calendar_date,
    ch.channel,
    e.experiment_id,
    case when ch.channel = 'blog' then 'blog' else 'social' end,
    'PLANNED',
    case
      when ch.channel = 'blog' then 'Selecteer exact één goedgekeurde due slug en lever via candidate PR → BG169 → live proof.'
      else 'Genereer/publiceer via de bestaande kanaallane en koppel live bewijs plus metrics terug.'
    end,
    now()
  from public.social_experiments e
  cross join lateral (
    select distinct value as channel
    from jsonb_array_elements_text(coalesce(e.target_channels,'[]'::jsonb)) as c(value)
  ) ch
  where e.calendar_date between p_from and p_to
    and e.tenant_id = 'bedrijfsgeheugen'
    and ch.channel in ('linkedin_personal','linkedin_company','instagram','blog')
  on conflict (tenant_id, publication_date, channel) do update
    set experiment_id = excluded.experiment_id,
        content_kind = excluded.content_kind,
        next_action = case
          when public.content_publication_state_rank(content_publication_obligations.status) <= 10
            then excluded.next_action
          else content_publication_obligations.next_action
        end,
        updated_at = now();

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.sync_content_publication_obligations(date,date) from public;

select public.sync_content_publication_obligations(date '2026-09-14', date '2026-12-31');

do $$
declare
  v_blog_count integer;
  v_alias_count integer;
begin
  select count(*) into v_blog_count
  from public.content_publication_obligations
  where tenant_id = 'bedrijfsgeheugen'
    and channel = 'blog'
    and publication_date between date '2026-09-14' and date '2026-12-31';

  select count(*) into v_alias_count
  from public.content_publication_obligations
  where tenant_id = 'canonical';

  if v_blog_count <> 109 then
    raise exception 'BLOG_CALENDAR_INCOMPLETE expected=109 actual=%', v_blog_count;
  end if;
  if v_alias_count <> 0 then
    raise exception 'CONTENT_OPERATIONS_ALIAS_DUPLICATION actual=%', v_alias_count;
  end if;
end;
$$;
