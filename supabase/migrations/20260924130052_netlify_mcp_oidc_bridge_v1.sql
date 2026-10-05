create or replace function public.get_netlify_mcp_proxy_bridge()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'netlify_mcp_proxy_20260924'
  order by created_at desc
  limit 1
$$;

revoke all on function public.get_netlify_mcp_proxy_bridge() from public;
revoke all on function public.get_netlify_mcp_proxy_bridge() from anon;
revoke all on function public.get_netlify_mcp_proxy_bridge() from authenticated;
grant execute on function public.get_netlify_mcp_proxy_bridge() to service_role;
