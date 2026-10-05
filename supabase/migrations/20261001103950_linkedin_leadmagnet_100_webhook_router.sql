create or replace function public.powerhouse_route_linkedin_leadmagnet_comment_v1()
returns trigger
language plpgsql
security definer
set search_path='public','pg_catalog'
as $$
declare
  v_text text := lower(trim(coalesce(
    new.payload->>'comment_text',
    new.payload->>'commentary',
    new.payload->>'text',
    new.payload->>'message',
    ''
  )));
  v_post_ref text := coalesce(
    nullif(new.content_key,''),
    nullif(new.payload->>'post_id',''),
    nullif(new.payload->>'post_urn',''),
    nullif(new.post_url,''),
    ''
  );
  v_is_target boolean := false;
  v_is_connection boolean := false;
  v_action_type text;
  v_status text;
  v_dedupe text;
  v_message text;
begin
  if new.is_test or lower(coalesce(new.engagement_type,'')) <> 'comment' then
    return new;
  end if;

  v_is_target :=
    v_post_ref = 'urn:li:share:7511373650017591297'
    or v_post_ref like '%7511373650017591297%'
    or coalesce(new.post_url,'') like '%7511373650017591297%';

  if not v_is_target then
    return new;
  end if;

  if v_text !~ '(^|[^0-9])100([^0-9]|$)' then
    return new;
  end if;

  select exists(
    select 1
    from public.bg_connecties c
    where c.linkedin_url = new.actor_linkedin_url
  ) into v_is_connection;

  v_action_type := case when v_is_connection then 'reply_dm' else 'review_profile' end;
  v_status := case when v_is_connection then 'prepared' else 'suggested' end;
  v_dedupe := 'leadmagnet:2026-10-01:100:' || new.event_key;

  v_message := 'Dank voor je reactie met 100. Hier is de Nederlandse versie van "100 dingen die je bedrijf in 2026 niet meer handmatig zou moeten doen". Als je liever de Engelse versie wilt, stuur ik die ook.';

  insert into public.powerhouse_sales_actions(
    dedupe_key,
    subject_key,
    person_key,
    company_key,
    action_type,
    channel,
    priority,
    reason,
    evidence,
    message_draft,
    source_url,
    status,
    due_at,
    content_key,
    topic_key,
    campaign_key,
    person_name,
    company_name,
    role,
    created_at,
    updated_at
  )
  values (
    v_dedupe,
    new.actor_linkedin_url,
    case when new.actor_type='person' then new.actor_linkedin_url end,
    case when new.actor_type='company' then new.actor_linkedin_url else new.company_name end,
    v_action_type,
    'linkedin',
    case when v_is_connection then 95 else 75 end,
    'Leadmagnet-intent: comment 100 op LinkedIn company post 2026-10-01.',
    new.payload || jsonb_build_object(
      'source_event_id',new.event_id,
      'source_event_key',new.event_key,
      'provider_post_id','urn:li:share:7511373650017591297',
      'campaign_key','linkedin-leadmagnet-2026-10-01-100',
      'keyword','100',
      'asset_language_default','nl',
      'asset_nl_file','bedrijfsgeheugen_100_dingen_2026_NL.pdf',
      'asset_en_file','bedrijfsgeheugen_100_things_2026_EN.pdf',
      'attachment_url_required',true,
      'asset_local_verified',true,
      'relationship_verified',v_is_connection,
      'webhook_routed',true,
      'dedupe_contract','person+provider_post_id+keyword+event_key'
    ),
    v_message,
    coalesce(new.post_url,'https://www.linkedin.com/feed/update/urn:li:share:7511373650017591297'),
    v_status,
    now(),
    'urn:li:share:7511373650017591297',
    'leadmagnet-100-manual-work-2026',
    'linkedin-leadmagnet-2026-10-01-100',
    new.actor_name,
    new.company_name,
    new.role,
    now(),
    now()
  )
  on conflict (dedupe_key) do nothing;

  return new;
end
$$;

drop trigger if exists trg_powerhouse_route_linkedin_leadmagnet_comment_v1
on public.linkedin_engagement_events;

create trigger trg_powerhouse_route_linkedin_leadmagnet_comment_v1
after insert on public.linkedin_engagement_events
for each row
execute function public.powerhouse_route_linkedin_leadmagnet_comment_v1();
