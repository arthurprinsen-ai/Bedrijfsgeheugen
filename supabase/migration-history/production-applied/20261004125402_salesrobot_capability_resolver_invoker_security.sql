create or replace function public.powerhouse_resolve_commercial_channel_v1(
  p_preferred text,p_has_salesrobot_address boolean default false,p_has_email boolean default false,p_has_linkedin_post_context boolean default false
) returns jsonb language plpgsql stable security invoker set search_path to 'pg_catalog','public' as $$
declare v_dm_available boolean:=false; v_selected text; v_reason text;
begin
 select exists(select 1 from public.powerhouse_channel_capabilities_v1 where capability_key='salesrobot.linkedin_dm' and status='AVAILABLE' and (expires_at is null or expires_at>now())) into v_dm_available;
 if lower(coalesce(p_preferred,'')) in ('linkedin_dm','linkedin dm') and v_dm_available and p_has_salesrobot_address then v_selected:='linkedin_dm'; v_reason:='salesrobot_available_and_recipient_addressable';
 elsif p_has_email then v_selected:='email'; v_reason:='preferred_channel_not_executable_email_fallback';
 elsif p_has_linkedin_post_context then v_selected:='linkedin_comment'; v_reason:='preferred_channel_not_executable_contextual_comment_fallback';
 else v_selected:='research_wait'; v_reason:='no_safe_executable_external_channel'; end if;
 return jsonb_build_object('contract','powerhouse-capability-routing-v1','preferred_channel',p_preferred,'selected_channel',v_selected,'reason',v_reason,'salesrobot_dm_available',v_dm_available,'fallback_is_terminal',false,'north_star','realized_revenue');
end $$;
revoke all on function public.powerhouse_resolve_commercial_channel_v1(text,boolean,boolean,boolean) from public,anon,authenticated;
grant execute on function public.powerhouse_resolve_commercial_channel_v1(text,boolean,boolean,boolean) to service_role;
