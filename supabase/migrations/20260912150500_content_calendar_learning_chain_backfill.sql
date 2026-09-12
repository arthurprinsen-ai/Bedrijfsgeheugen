-- The canonical trigger is column-scoped. Touch a watched column so existing
-- observed posts flow through exactly the same enrichment path as future posts.
update public.social_posts
set platform = platform,
    updated_at = now()
where published_at is not null
  and exists (
    select 1
    from public.social_experiments e
    where e.tenant_id = social_posts.tenant_id
      and e.calendar_date = (social_posts.published_at at time zone 'Europe/Amsterdam')::date
  );
