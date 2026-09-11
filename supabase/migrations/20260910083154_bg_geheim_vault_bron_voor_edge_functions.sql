create or replace function public.bg_geheim(p_naam text)
returns text
language sql
security definer
set search_path = ''
as $$
  select decrypted_secret from vault.decrypted_secrets where name = p_naam order by created_at desc limit 1
$$;
revoke all on function public.bg_geheim(text) from public, anon, authenticated;
grant execute on function public.bg_geheim(text) to service_role;
comment on function public.bg_geheim(text) is 'Enige bron voor sleutels van Edge Functions: leest uit Vault. Alleen service_role. Vastgelegd 10 sept 2026 bij het uitfaseren van Make.';