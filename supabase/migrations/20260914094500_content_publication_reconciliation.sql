-- Reconcile observed social publication proof into the unified operations ledger.
-- This consumes the existing Buffer-first social_posts table; it does not create a parallel metrics store.

create or replace function public.reconcile_social_post_publication_obligation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date;
  v_channel text;
  v_exists boolean;
  v_evidence jsonb;
begin
  if new.published_at is null then
    return new;
  end if;

  v_date := (new.published_at at time zone 'Europe/Amsterdam')::date;
  v_channel := case
    when new.channel_kind in ('linkedin_personal','linkedin_company','instagram') then new.channel_kind
    when lower(coalesce(new.platform,'')) = 'instagram' then 'instagram'
    else null
  end;

  -- A legacy LinkedIn row without channel identity is deliberately not guessed.
  if v_channel is null then
    return new;
  end if;

  select exists(
    select 1
    from public.content_publication_obligations o
    where o.tenant_id = new.tenant_id
      and o.publication_date = v_date
      and o.channel = v_channel
  ) into v_exists;

  if not v_exists then
    return new;
  end if;

  v_evidence := jsonb_build_object(
    'source','social_posts',
    'post_id',new.post_id,
    'external_post_id',new.external_post_id,
    'channel_id',new.channel_id,
    'channel_name',new.channel_name,
    'channel_kind',v_channel,
    'published_at',new.published_at
  );

  perform public.record_content_publication_state(
    new.tenant_id,
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

  return new;
end;
$$;

revoke all on function public.reconcile_social_post_publication_obligation() from public;

drop trigger if exists social_posts_publication_obligation on public.social_posts;
create trigger social_posts_publication_obligation
after insert or update of published_at, external_post_id, channel_id, channel_name, channel_kind
on public.social_posts
for each row
execute function public.reconcile_social_post_publication_obligation();

-- Reconcile existing observed posts for the operating horizon without inventing identity.
do $$
declare
  r public.social_posts%rowtype;
begin
  for r in
    select *
    from public.social_posts
    where published_at is not null
      and (published_at at time zone 'Europe/Amsterdam')::date between date '2026-09-14' and date '2026-12-31'
      and (
        channel_kind in ('linkedin_personal','linkedin_company','instagram')
        or lower(coalesce(platform,'')) = 'instagram'
      )
  loop
    perform public.reconcile_social_post_publication_obligation_row(r);
  end loop;
end;
$$;
