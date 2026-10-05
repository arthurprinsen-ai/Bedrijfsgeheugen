-- 1. Elke connectie krijgt een eigen korte sleutel voor in zijn link
alter table public.bg_connecties add column if not exists sleutel text;
update public.bg_connecties
  set sleutel = substr(encode(digest(linkedin_url || 'bg-2026', 'sha256'), 'hex'), 1, 8)
  where sleutel is null;
alter table public.bg_connecties alter column sleutel set not null;
create unique index if not exists bg_connecties_sleutel_idx on public.bg_connecties (sleutel);

-- 2. Een klik vastleggen: als gebeurtenis in de trechter én op de connectie
create or replace function public.bg_klik_vastleggen(p_sleutel text, p_doel text default null)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_url text;
  v_naam text;
  v_doel text := coalesce(nullif(p_doel,''), 'https://www.bedrijfsgeheugen.nl/frisse-blik');
begin
  if v_doel not like 'https://www.bedrijfsgeheugen.nl/%' then
    v_doel := 'https://www.bedrijfsgeheugen.nl/';
  end if;

  select linkedin_url, naam into v_url, v_naam
  from public.bg_connecties where sleutel = p_sleutel;

  if v_url is not null then
    perform public.bg_growth_ingest_event(jsonb_build_object(
      'event_id', gen_random_uuid()::text,
      'event_type','engaged_view',
      'canonical', v_doel,
      'source','persoonlijke-link',
      'medium','outbound',
      'campaign', p_sleutel,
      'attribution_root_key', v_url,
      'intent_owner', v_naam,
      'funnel_stage','consider',
      'payload', jsonb_build_object('connectie', v_url)));

    update public.bg_connecties
      set extra = coalesce(extra,'{}'::jsonb)
                  || jsonb_build_object('kliks', coalesce((extra->>'kliks')::int,0) + 1,
                                        'laatste_klik', now()),
          prioriteit = least(100, coalesce(prioriteit,50) + 15),
          bijgewerkt_op = now()
    where sleutel = p_sleutel;
  end if;

  return v_doel;
end;
$$;

-- 3. Wie reageert er eigenlijk: kliks en uitkomsten per connectie
create or replace view public.bg_connectie_activiteit as
select c.naam, c.bedrijf, c.rol, c.segment, c.status, c.prioriteit,
       coalesce((c.extra->>'kliks')::int, 0) as kliks,
       (c.extra->>'laatste_klik') as laatste_klik,
       (select count(*) from public.growth_outcomes o where o.attribution_root_key = c.linkedin_url) as uitkomsten,
       c.linkedin_url, c.sleutel
from public.bg_connecties c
where coalesce((c.extra->>'kliks')::int, 0) > 0
   or exists (select 1 from public.growth_outcomes o where o.attribution_root_key = c.linkedin_url)
order by kliks desc, prioriteit desc;

grant select on public.bg_connectie_activiteit to service_role;
grant execute on function public.bg_klik_vastleggen(text, text) to service_role;
