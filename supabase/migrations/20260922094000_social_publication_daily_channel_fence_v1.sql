-- social-publication-daily-channel-fence-v1
-- One external publication side-effect maximum per canonical channel/day.
-- Safe recovery is allowed only when the previous capability expired unconsumed.

with ranked as (
  select capability_id,
         row_number() over (
           partition by run_date, channel
           order by issued_at asc, capability_id asc
         ) as rn
  from public.powerhouse_social_publish_capabilities_v1
  where revoked_at is null
)
update public.powerhouse_social_publish_capabilities_v1 c
set revoked_at = now(),
    evidence = coalesce(c.evidence,'{}'::jsonb) || jsonb_build_object(
      'revocation_reason','DUPLICATE_ACTIVE_CAPABILITY_CLEANUP_DAILY_CHANNEL_FENCE_V1',
      'revoked_by','social-publication-daily-channel-fence-v1',
      'revoked_at',now()
    )
from ranked r
where c.capability_id = r.capability_id
  and r.rn > 1;

create or replace function public.powerhouse_social_publish_daily_channel_fence_v1()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_existing public.powerhouse_social_publish_capabilities_v1%rowtype;
  v_lock_key bigint;
begin
  v_lock_key := pg_catalog.hashtextextended(
    'powerhouse-social-publish|' || new.run_date::text || '|' || new.channel,
    0
  );
  perform pg_catalog.pg_advisory_xact_lock(v_lock_key);

  select *
    into v_existing
  from public.powerhouse_social_publish_capabilities_v1
  where run_date = new.run_date
    and channel = new.channel
    and revoked_at is null
  order by issued_at asc, capability_id asc
  limit 1
  for update;

  if found then
    if v_existing.consumed_at is null and v_existing.expires_at <= now() then
      update public.powerhouse_social_publish_capabilities_v1
      set revoked_at = now(),
          evidence = coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
            'revocation_reason','EXPIRED_UNCONSUMED_RECLAIM_DAILY_CHANNEL_FENCE_V1',
            'revoked_by','social-publication-daily-channel-fence-v1',
            'revoked_at',now()
          )
      where capability_id = v_existing.capability_id;
    else
      raise exception using
        errcode = 'P0001',
        message = 'DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED',
        detail = new.run_date::text || '|' || new.channel;
    end if;
  end if;

  return new;
end
$$;

drop trigger if exists powerhouse_social_publish_daily_channel_fence_v1
on public.powerhouse_social_publish_capabilities_v1;

create trigger powerhouse_social_publish_daily_channel_fence_v1
before insert on public.powerhouse_social_publish_capabilities_v1
for each row
execute function public.powerhouse_social_publish_daily_channel_fence_v1();

create unique index if not exists powerhouse_social_publish_capabilities_v1_one_active_day_channel_uidx
on public.powerhouse_social_publish_capabilities_v1(run_date, channel)
where revoked_at is null;

comment on index public.powerhouse_social_publish_capabilities_v1_one_active_day_channel_uidx
is 'Hard fail-closed fence: at most one non-revoked social publication capability per canonical channel/day.';

revoke execute on function public.powerhouse_social_publish_daily_channel_fence_v1() from public, anon, authenticated;
grant execute on function public.powerhouse_social_publish_daily_channel_fence_v1() to service_role;
