-- social-delivery-identity-readback-guard-v1
-- Transport evidence is not identity/artifact proof for linkedin_personal or instagram.

create or replace function public.reconcile_social_post_publication_obligation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_date date;
  v_channel text;
  v_status text;
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
  if v_channel is null then
    return new;
  end if;

  select o.status into v_status
  from public.content_publication_obligations o
  where o.tenant_id = new.tenant_id
    and o.publication_date = v_date
    and o.channel = v_channel;

  if v_status is null then
    return new;
  end if;

  if v_channel in ('linkedin_personal','instagram') then
    update public.content_publication_obligations
       set external_id = coalesce(nullif(new.external_post_id,''), external_id),
           published_at = coalesce(published_at, new.published_at),
           evidence = coalesce(evidence, '{}'::jsonb) || jsonb_build_object(
             'transport_only', true,
             'identity_guard_required', true,
             'transport_source', 'social_posts',
             'transport_post_id', new.post_id,
             'transport_external_post_id', new.external_post_id,
             'transport_observed_at', now()
           ),
           updated_at = now()
     where tenant_id = new.tenant_id
       and publication_date = v_date
       and channel = v_channel;
    return new;
  end if;

  if public.content_publication_state_rank(v_status) >= public.content_publication_state_rank('LIVE_PROVEN') then
    update public.content_publication_obligations
       set external_id = coalesce(nullif(new.external_post_id,''), external_id),
           published_at = coalesce(published_at, new.published_at),
           updated_at = now()
     where tenant_id = new.tenant_id
       and publication_date = v_date
       and channel = v_channel;
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

  update public.content_publication_obligations
     set published_at = coalesce(published_at, new.published_at),
         updated_at = now()
   where tenant_id = new.tenant_id
     and publication_date = v_date
     and channel = v_channel;

  return new;
end;
$$;

revoke execute on function public.reconcile_social_post_publication_obligation() from public, anon, authenticated;
grant execute on function public.reconcile_social_post_publication_obligation() to service_role;
