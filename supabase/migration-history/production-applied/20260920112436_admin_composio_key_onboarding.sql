-- admin-composio-key-onboarding-v1
-- Narrow service-role-only writer for exactly one external provider secret.
create or replace function public.powerhouse_set_composio_api_key_v1(p_secret text)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_secret text := btrim(coalesce(p_secret,''));
  v_id uuid;
begin
  if length(v_secret) < 20 then
    raise exception 'COMPOSIO_API_KEY_INVALID';
  end if;

  select id into v_id
  from vault.secrets
  where name='COMPOSIO_API_KEY'
  order by created_at desc
  limit 1;

  if v_id is null then
    perform vault.create_secret(v_secret,'COMPOSIO_API_KEY','Powerhouse canonical Composio project API key');
  else
    perform vault.update_secret(v_id,v_secret,'COMPOSIO_API_KEY','Powerhouse canonical Composio project API key');
  end if;

  return jsonb_build_object('stored',true,'name','COMPOSIO_API_KEY');
end $$;

revoke execute on function public.powerhouse_set_composio_api_key_v1(text) from public, anon, authenticated;
grant execute on function public.powerhouse_set_composio_api_key_v1(text) to service_role;
