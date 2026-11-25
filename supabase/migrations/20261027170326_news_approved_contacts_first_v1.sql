-- Registry alignment: production migration history carries version 20261027170326 for this exact definition (created by an earlier apply). Idempotent; same content as 20261027180000.
-- Company-news lookups go first to companies of approved e-mail contacts, so the composer
-- gets a verifiable fact for the people who can actually be mailed. Rest of the order unchanged.
create or replace function public.bg_bedrijven_voor_nieuws(p_limiet integer default 8)
returns table(bedrijf text, linkedin_url text, naam text, rol text, segment text, score numeric)
language sql stable security definer set search_path to ''
as $function$
  with approved as (
    select distinct on (c.bedrijf) c.bedrijf, c.linkedin_url, c.naam, c.rol, c.segment, 1000::numeric score
    from public.bg_connecties c
    left join public.bg_bedrijf_gecheckt g on g.bedrijf = c.bedrijf
    where c.extra->>'human_approved' = 'true' and nullif(trim(coalesce(c.email,'')),'') is not null
      and c.bedrijf is not null and length(c.bedrijf) >= 4
      and c.bedrijf !~* '^(zelfstandig|freelance|eigen bedrijf|self.?employed|zzp|diverse|n\.?v\.?t\.?|geen|stealth|consultant)'
      and (g.laatst_gecheckt is null or g.laatst_gecheckt < now() - interval '30 days')
    order by c.bedrijf
  ), rest as (
    select distinct on (k.bedrijf) k.bedrijf, k.linkedin_url, k.naam, k.rol, k.segment, k.score
    from public.bg_inhaak_kandidaten(array['Directeur / eigenaar','Overdracht & M&A','Accountant & fiscaal','Investeerder'], 1500) k
    left join public.bg_bedrijf_gecheckt g on g.bedrijf = k.bedrijf
    where k.bedrijf is not null and length(k.bedrijf) >= 4
      and k.bedrijf !~* '^(zelfstandig|freelance|eigen bedrijf|self.?employed|zzp|diverse|n\.?v\.?t\.?|geen|stealth|consultant)'
      and (g.laatst_gecheckt is null or g.laatst_gecheckt < now() - interval '30 days')
      and k.bedrijf not in (select a.bedrijf from approved a)
    order by k.bedrijf, k.score desc
  )
  select * from (select * from approved union all select * from rest) x
  order by x.score desc, md5(x.bedrijf)
  limit greatest(1, least(p_limiet, 20));
$function$;

revoke all on function public.bg_bedrijven_voor_nieuws(integer) from public, anon, authenticated;
grant execute on function public.bg_bedrijven_voor_nieuws(integer) to service_role;
