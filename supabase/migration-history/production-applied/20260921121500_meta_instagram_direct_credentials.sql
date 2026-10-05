-- instagram-meta-direct-credentials-v1
-- Service-role-only writer for the direct Meta Instagram transport credentials.
create or replace function public.powerhouse_set_meta_instagram_credentials_v1(
  p_access_token text,
  p_user_id text,
  p_graph_version text default 'v24.0'
)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_token text := btrim(coalesce(p_access_token,''));
  v_user_id text := btrim(coalesce(p_user_id,''));
  v_version text := btrim(coalesce(p_graph_version,'v24.0'));
  v_id uuid;
begin
  if length(v_token) < 40 then raise exception 'META_INSTAGRAM_ACCESS_TOKEN_INVALID'; end if;
  if v_user_id !~ '^[0-9]+$' then raise exception 'META_INSTAGRAM_USER_ID_INVALID'; end if;
  if v_version !~ '^v[0-9]+\.[0-9]+$' then raise exception 'META_INSTAGRAM_GRAPH_VERSION_INVALID'; end if;

  select id into v_id from vault.secrets where name='META_INSTAGRAM_ACCESS_TOKEN' order by created_at desc limit 1;
  if v_id is null then
    perform vault.create_secret(v_token,'META_INSTAGRAM_ACCESS_TOKEN','Powerhouse direct Meta Instagram access token');
  else
    perform vault.update_secret(v_id,v_token,'META_INSTAGRAM_ACCESS_TOKEN','Powerhouse direct Meta Instagram access token');
  end if;

  v_id := null;
  select id into v_id from vault.secrets where name='META_INSTAGRAM_USER_ID' order by created_at desc limit 1;
  if v_id is null then
    perform vault.create_secret(v_user_id,'META_INSTAGRAM_USER_ID','Powerhouse direct Meta Instagram user id');
  else
    perform vault.update_secret(v_id,v_user_id,'META_INSTAGRAM_USER_ID','Powerhouse direct Meta Instagram user id');
  end if;

  v_id := null;
  select id into v_id from vault.secrets where name='META_INSTAGRAM_GRAPH_VERSION' order by created_at desc limit 1;
  if v_id is null then
    perform vault.create_secret(v_version,'META_INSTAGRAM_GRAPH_VERSION','Powerhouse direct Meta Instagram Graph version');
  else
    perform vault.update_secret(v_id,v_version,'META_INSTAGRAM_GRAPH_VERSION','Powerhouse direct Meta Instagram Graph version');
  end if;

  return jsonb_build_object('stored',true,'user_id',v_user_id,'graph_version',v_version);
end $$;

revoke execute on function public.powerhouse_set_meta_instagram_credentials_v1(text,text,text) from public, anon, authenticated;
grant execute on function public.powerhouse_set_meta_instagram_credentials_v1(text,text,text) to service_role;
