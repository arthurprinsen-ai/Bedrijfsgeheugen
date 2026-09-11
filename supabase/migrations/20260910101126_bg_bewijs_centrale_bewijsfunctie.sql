create or replace function public.bg_bewijs(p_bron text, p_groen boolean, p_detail jsonb default '{}'::jsonb, p_foutklasse text default null)
returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid;
begin
  insert into public.brain_delivery_evidence(idempotency_key, change_id, component_id, target, status, error_class, payload_sha256, evidence)
  values (p_bron||':'||gen_random_uuid(), 'runtime-'||to_char(now() at time zone 'Europe/Amsterdam','YYYYMMDD'), p_bron, 'supabase',
          case when p_groen then 'GREEN' else 'RED' end,
          case when p_foutklasse in ('AUTH','TRANSIENT','VALIDATION','POLICY','REMOTE') then p_foutklasse end,
          md5(coalesce(p_detail::text,'')), coalesce(p_detail,'{}'::jsonb))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.bg_bewijs(text, boolean, jsonb, text) from public, anon, authenticated;
grant execute on function public.bg_bewijs(text, boolean, jsonb, text) to service_role;
comment on function public.bg_bewijs(text, boolean, jsonb, text) is 'Enige schrijfroute voor runtimebewijs van Edge Functions naar brain_delivery_evidence. Aangelegd 10 sept 2026.';