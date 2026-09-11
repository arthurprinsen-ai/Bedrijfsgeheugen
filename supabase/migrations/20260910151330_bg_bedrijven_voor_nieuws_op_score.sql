create or replace function public.bg_bedrijven_voor_nieuws(p_limiet integer default 8)
returns table(bedrijf text, linkedin_url text, naam text, rol text, segment text, score numeric)
language sql stable security definer set search_path='' as $$
  select * from (
    select distinct on (k.bedrijf) k.bedrijf, k.linkedin_url, k.naam, k.rol, k.segment, k.score
    from public.bg_inhaak_kandidaten(array['Directeur / eigenaar','Overdracht & M&A','Accountant & fiscaal','Investeerder'], 200) k
    left join public.bg_bedrijf_gecheckt g on g.bedrijf = k.bedrijf
    where k.bedrijf is not null and length(k.bedrijf) >= 4
      and k.bedrijf !~* '^(zelfstandig|freelance|eigen bedrijf|self.?employed|zzp|diverse|n\.?v\.?t\.?|geen|stealth|consultant)'
      and (g.laatst_gecheckt is null or g.laatst_gecheckt < now() - interval '30 days')
    order by k.bedrijf, k.score desc
  ) x order by x.score desc, md5(x.bedrijf)
  limit greatest(1, least(p_limiet, 20));
$$;
revoke all on function public.bg_bedrijven_voor_nieuws(integer) from public, anon, authenticated;
grant execute on function public.bg_bedrijven_voor_nieuws(integer) to service_role;