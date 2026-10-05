-- instagram-meta-oauth-onboarding-v1
create or replace function public.powerhouse_set_meta_instagram_app_credentials_v1(
  p_app_id text,
  p_app_secret text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_app_id text := btrim(coalesce(p_app_id,''));
  v_app_secret text := btrim(coalesce(p_app_secret,''));
  v_id uuid;
begin
  if v_app_id !~ '^[0-9]+$' then raise exception 'META_INSTAGRAM_APP_ID_INVALID'; end if;
  if length(v_app_secret) < 20 then raise exception 'META_INSTAGRAM_APP_SECRET_INVALID'; end if;

  select id into v_id from vault.secrets where name='META_INSTAGRAM_APP_ID' order by created_at desc limit 1;
  if v_id is null then
    perform vault.create_secret(v_app_id,'META_INSTAGRAM_APP_ID','Meta Instagram Login app id');
  else
    perform vault.update_secret(v_id,v_app_id,'META_INSTAGRAM_APP_ID','Meta Instagram Login app id');
  end if;

  v_id := null;
  select id into v_id from vault.secrets where name='META_INSTAGRAM_APP_SECRET' order by created_at desc limit 1;
  if v_id is null then
    perform vault.create_secret(v_app_secret,'META_INSTAGRAM_APP_SECRET','Meta Instagram Login app secret');
  else
    perform vault.update_secret(v_id,v_app_secret,'META_INSTAGRAM_APP_SECRET','Meta Instagram Login app secret');
  end if;

  return jsonb_build_object('stored',true,'app_id',v_app_id);
end $$;

revoke execute on function public.powerhouse_set_meta_instagram_app_credentials_v1(text,text) from public, anon, authenticated;
grant execute on function public.powerhouse_set_meta_instagram_app_credentials_v1(text,text) to service_role;
