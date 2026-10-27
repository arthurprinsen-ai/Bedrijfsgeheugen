create table if not exists public.powerhouse_channel_capabilities_v1 (
  capability_key text primary key,
  provider text not null,
  channel text not null,
  status text not null check (status in ('AVAILABLE','DEGRADED','UNAVAILABLE','CONFIG_REQUIRED')),
  checked_at timestamptz not null default now(),
  expires_at timestamptz,
  evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

comment on table public.powerhouse_channel_capabilities_v1 is
'Runtime capability truth used by Powerhouse next-best-action routing. Provider availability never overrides identity, source, dedupe, consent, suppression, cooldown or revenue-truth gates.';

insert into public.powerhouse_channel_capabilities_v1(capability_key,provider,channel,status,checked_at,expires_at,evidence)
values
('salesrobot.linkedin_dm','salesrobot','linkedin_dm','AVAILABLE',now(),now()+interval '6 hours',
 jsonb_build_object('contract','powerhouse-capability-routing-v1','verified_via','Composio SalesRobot connection + healthy LinkedIn account','tool','SALESROBOT_SEND_MESSAGE','recipient_address_required',true)),
('salesrobot.campaign_outreach','salesrobot','linkedin_dm','CONFIG_REQUIRED',now(),now()+interval '6 hours',
 jsonb_build_object('contract','powerhouse-capability-routing-v1','verified_via','SALESROBOT_LIST_CAMPAIGNS','campaign_count',0,'reason','No SalesRobot campaign exists; campaign outreach must not be fabricated.'))
on conflict(capability_key) do update set provider=excluded.provider,channel=excluded.channel,status=excluded.status,checked_at=excluded.checked_at,expires_at=excluded.expires_at,evidence=excluded.evidence,updated_at=now();

create or replace function public.powerhouse_resolve_commercial_channel_v1(
  p_preferred text,
  p_has_salesrobot_address boolean default false,
  p_has_email boolean default false,
  p_has_linkedin_post_context boolean default false
) returns jsonb
language plpgsql stable security definer
set search_path to 'pg_catalog','public'
as $$
declare
  v_dm_available boolean:=false;
  v_selected text;
  v_reason text;
begin
  select exists(
    select 1 from public.powerhouse_channel_capabilities_v1
    where capability_key='salesrobot.linkedin_dm'
      and status='AVAILABLE'
      and (expires_at is null or expires_at>now())
  ) into v_dm_available;

  if lower(coalesce(p_preferred,'')) in ('linkedin_dm','linkedin dm') and v_dm_available and p_has_salesrobot_address then
    v_selected:='linkedin_dm'; v_reason:='salesrobot_available_and_recipient_addressable';
  elsif p_has_email then
    v_selected:='email'; v_reason:='preferred_channel_not_executable_email_fallback';
  elsif p_has_linkedin_post_context then
    v_selected:='linkedin_comment'; v_reason:='preferred_channel_not_executable_contextual_comment_fallback';
  else
    v_selected:='research_wait'; v_reason:='no_safe_executable_external_channel';
  end if;

  return jsonb_build_object(
    'contract','powerhouse-capability-routing-v1',
    'preferred_channel',p_preferred,
    'selected_channel',v_selected,
    'reason',v_reason,
    'salesrobot_dm_available',v_dm_available,
    'fallback_is_terminal',false,
    'north_star','realized_revenue'
  );
end $$;
