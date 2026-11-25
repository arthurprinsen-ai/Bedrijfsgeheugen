-- One operational truth for unified content operations.
-- Historical social_experiments aliases may remain, but the execution ledger is canonical-only.

-- Backfill any execution row that only exists on the bedrijfsgeheugen alias.
insert into public.content_publication_obligations (
  tenant_id, publication_date, channel, experiment_id, content_kind, status,
  content_id, slug, external_id, canonical_url,
  generated_at, approved_at, dispatched_at, published_at, live_proven_at, measured_at, learned_at,
  last_error, recovery_attempts, evidence, metrics, next_action, created_at, updated_at
)
select
  'canonical', publication_date, channel, experiment_id, content_kind, status,
  content_id, slug, external_id, canonical_url,
  generated_at, approved_at, dispatched_at, published_at, live_proven_at, measured_at, learned_at,
  last_error, recovery_attempts, evidence, metrics, next_action, created_at, now()
from public.content_publication_obligations b
where b.tenant_id = 'bedrijfsgeheugen'
  and not exists (
    select 1
    from public.content_publication_obligations c
    where c.tenant_id = 'canonical'
      and c.publication_date = b.publication_date
      and c.channel = b.channel
  );

-- If the alias contains stronger progress, preserve it on the canonical row.
update public.content_publication_obligations c
set experiment_id = b.experiment_id,
    content_kind = b.content_kind,
    status = b.status,
    content_id = coalesce(b.content_id, c.content_id),
    slug = coalesce(b.slug, c.slug),
    external_id = coalesce(b.external_id, c.external_id),
    canonical_url = coalesce(b.canonical_url, c.canonical_url),
    generated_at = coalesce(c.generated_at, b.generated_at),
    approved_at = coalesce(c.approved_at, b.approved_at),
    dispatched_at = coalesce(c.dispatched_at, b.dispatched_at),
    published_at = coalesce(c.published_at, b.published_at),
    live_proven_at = coalesce(c.live_proven_at, b.live_proven_at),
    measured_at = coalesce(c.measured_at, b.measured_at),
    learned_at = coalesce(c.learned_at, b.learned_at),
    last_error = b.last_error,
    recovery_attempts = greatest(c.recovery_attempts, b.recovery_attempts),
    evidence = c.evidence || b.evidence,
    metrics = c.metrics || b.metrics,
    next_action = coalesce(b.next_action, c.next_action),
    updated_at = now()
from public.content_publication_obligations b
where c.tenant_id = 'canonical'
  and b.tenant_id = 'bedrijfsgeheugen'
  and c.publication_date = b.publication_date
  and c.channel = b.channel
  and public.content_publication_state_rank(b.status) > public.content_publication_state_rank(c.status);

-- Remove the duplicate execution truth after preserving stronger progress.
delete from public.content_publication_obligations where tenant_id = 'bedrijfsgeheugen';

-- Normalize any direct future table write to the canonical tenant.
create or replace function public.normalize_content_operations_tenant()
returns trigger
language plpgsql
as $$
begin
  if new.tenant_id in ('canonical','bedrijfsgeheugen') then
    new.tenant_id := 'canonical';
  end if;
  return new;
end;
$$;

drop trigger if exists content_operations_single_tenant on public.content_publication_obligations;
create trigger content_operations_single_tenant
before insert or update of tenant_id on public.content_publication_obligations
for each row execute function public.normalize_content_operations_tenant();

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
    'canonical',
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
    and e.tenant_id = 'canonical'
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

-- Normalize the public state writer too, so old callers cannot recreate the alias.
create or replace function public.record_content_publication_state(
  p_tenant_id text,
  p_publication_date date,
  p_channel text,
  p_status text,
  p_content_id text default null,
  p_slug text default null,
  p_external_id text default null,
  p_canonical_url text default null,
  p_evidence jsonb default '{}'::jsonb,
  p_metrics jsonb default '{}'::jsonb,
  p_next_action text default null,
  p_error text default null
)
returns public.content_publication_obligations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.content_publication_obligations%rowtype;
  v_old_rank integer;
  v_new_rank integer;
  v_tenant_id text;
begin
  v_tenant_id := case when p_tenant_id in ('canonical','bedrijfsgeheugen') then 'canonical' else p_tenant_id end;

  select * into v_row
  from public.content_publication_obligations
  where tenant_id = v_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  for update;

  if not found then
    raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND';
  end if;

  v_old_rank := public.content_publication_state_rank(v_row.status);
  v_new_rank := public.content_publication_state_rank(p_status);
  if v_new_rank < 0 then
    raise exception 'INVALID_PUBLICATION_STATE';
  end if;

  if v_row.status not in ('BLOCKED','FAILED')
     and p_status not in ('BLOCKED','FAILED')
     and v_new_rank < v_old_rank then
    raise exception 'STATE_REGRESSION_NOT_ALLOWED';
  end if;

  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and coalesce(nullif(p_canonical_url,''), nullif(p_external_id,''), nullif(v_row.canonical_url,''), nullif(v_row.external_id,'')) is null then
    raise exception 'LIVE_PROOF_REQUIRED';
  end if;

  if p_status in ('LIVE_PROVEN','MEASURED','LEARNED')
     and coalesce(p_evidence, '{}'::jsonb) = '{}'::jsonb
     and coalesce(v_row.evidence, '{}'::jsonb) = '{}'::jsonb then
    raise exception 'LIVE_PROOF_REQUIRED';
  end if;

  update public.content_publication_obligations
  set status = p_status,
      content_id = coalesce(nullif(p_content_id,''), content_id),
      slug = coalesce(nullif(p_slug,''), slug),
      external_id = coalesce(nullif(p_external_id,''), external_id),
      canonical_url = coalesce(nullif(p_canonical_url,''), canonical_url),
      evidence = case when coalesce(p_evidence,'{}'::jsonb) = '{}'::jsonb then evidence else evidence || p_evidence end,
      metrics = case when coalesce(p_metrics,'{}'::jsonb) = '{}'::jsonb then metrics else metrics || p_metrics end,
      next_action = coalesce(p_next_action, next_action),
      last_error = case when p_status in ('BLOCKED','FAILED') then coalesce(p_error, last_error) else null end,
      recovery_attempts = recovery_attempts + case when p_status in ('BLOCKED','FAILED') then 1 else 0 end,
      generated_at = case when p_status in ('GENERATED','APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(generated_at,now()) else generated_at end,
      approved_at = case when p_status in ('APPROVED','DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(approved_at,now()) else approved_at end,
      dispatched_at = case when p_status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(dispatched_at,now()) else dispatched_at end,
      published_at = case when p_status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then coalesce(published_at,now()) else published_at end,
      live_proven_at = case when p_status in ('LIVE_PROVEN','MEASURED','LEARNED') then coalesce(live_proven_at,now()) else live_proven_at end,
      measured_at = case when p_status in ('MEASURED','LEARNED') then coalesce(measured_at,now()) else measured_at end,
      learned_at = case when p_status = 'LEARNED' then coalesce(learned_at,now()) else learned_at end,
      updated_at = now()
  where tenant_id = v_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.record_content_publication_state(text,date,text,text,text,text,text,text,jsonb,jsonb,text,text) from public;

select public.sync_content_publication_obligations(date '2026-09-14', date '2026-12-31');

do $$
declare
  v_blog_count integer;
  v_alias_count integer;
begin
  select count(*) into v_blog_count
  from public.content_publication_obligations
  where tenant_id = 'canonical'
    and channel = 'blog'
    and publication_date between date '2026-09-14' and date '2026-12-31';

  select count(*) into v_alias_count
  from public.content_publication_obligations
  where tenant_id = 'bedrijfsgeheugen';

  if v_blog_count <> 109 then
    raise exception 'BLOG_CALENDAR_INCOMPLETE expected=109 actual=%', v_blog_count;
  end if;
  if v_alias_count <> 0 then
    raise exception 'CONTENT_OPERATIONS_ALIAS_DUPLICATION actual=%', v_alias_count;
  end if;
end;
$$;
