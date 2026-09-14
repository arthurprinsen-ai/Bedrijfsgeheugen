-- Deterministic LinkedIn identity reconciliation for unified content operations.
-- Keep the existing social_posts readback as authority; do not guess unidentified LinkedIn rows.

create or replace function public.reconcile_social_post_publication_obligation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date;
  v_channel text;
  v_status text;
  v_evidence jsonb;
  v_tenant_id text;
begin
  if new.published_at is null then
    return new;
  end if;

  v_date := (new.published_at at time zone 'Europe/Amsterdam')::date;
  v_tenant_id := case
    when new.tenant_id in ('canonical','bedrijfsgeheugen') then 'canonical'
    else new.tenant_id
  end;

  v_channel := case
    when new.channel_kind in ('linkedin_personal','linkedin_company','instagram') then new.channel_kind
    when new.source_campaign_id like 'li-personal-%' then 'linkedin_personal'
    when new.source_campaign_id like 'li-company-%' then 'linkedin_company'
    when lower(coalesce(new.platform,'')) = 'instagram' then 'instagram'
    else null
  end;

  -- A legacy LinkedIn row without deterministic identity is deliberately not guessed.
  if v_channel is null then
    return new;
  end if;

  select o.status into v_status
  from public.content_publication_obligations o
  where o.tenant_id = v_tenant_id
    and o.publication_date = v_date
    and o.channel = v_channel;

  if v_status is null then
    return new;
  end if;

  if public.content_publication_state_rank(v_status) >= public.content_publication_state_rank('LIVE_PROVEN') then
    update public.content_publication_obligations
    set external_id = coalesce(nullif(new.external_post_id,''), external_id),
        published_at = coalesce(published_at, new.published_at),
        evidence = evidence || jsonb_strip_nulls(jsonb_build_object(
          'source','social_posts',
          'post_id',new.post_id,
          'external_post_id',new.external_post_id,
          'source_campaign_id',new.source_campaign_id,
          'channel_id',new.channel_id,
          'channel_name',new.channel_name,
          'channel_kind',v_channel,
          'published_at',new.published_at
        )),
        updated_at = now()
    where tenant_id = v_tenant_id
      and publication_date = v_date
      and channel = v_channel;
    return new;
  end if;

  v_evidence := jsonb_strip_nulls(jsonb_build_object(
    'source','social_posts',
    'post_id',new.post_id,
    'external_post_id',new.external_post_id,
    'source_campaign_id',new.source_campaign_id,
    'channel_id',new.channel_id,
    'channel_name',new.channel_name,
    'channel_kind',v_channel,
    'published_at',new.published_at
  ));

  perform public.record_content_publication_state(
    v_tenant_id,
    v_date,
    v_channel,
    'LIVE_PROVEN',
    new.post_id,
    null,
    coalesce(new.external_post_id,new.post_id),
    null,
    v_evidence,
    '{}'::jsonb,
    'Meet prestaties en schrijf outcome/learning terug.',
    null
  );

  update public.content_publication_obligations
  set published_at = coalesce(published_at, new.published_at),
      updated_at = now()
  where tenant_id = v_tenant_id
    and publication_date = v_date
    and channel = v_channel;

  return new;
end;
$$;

revoke all on function public.reconcile_social_post_publication_obligation() from public;

drop trigger if exists social_posts_publication_obligation on public.social_posts;
create trigger social_posts_publication_obligation
after insert or update
on public.social_posts
for each row
execute function public.reconcile_social_post_publication_obligation();

-- Reconcile already observed posts only when identity is explicit or deterministic.
update public.social_posts
set updated_at = now()
where published_at is not null
  and (published_at at time zone 'Europe/Amsterdam')::date between date '2026-09-14' and date '2026-12-31'
  and (
    channel_kind in ('linkedin_personal','linkedin_company','instagram')
    or source_campaign_id like 'li-personal-%'
    or source_campaign_id like 'li-company-%'
    or lower(coalesce(platform,'')) = 'instagram'
  );
