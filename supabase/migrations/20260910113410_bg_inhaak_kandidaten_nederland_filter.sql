create or replace function public.bg_inhaak_kandidaten(p_segmenten text[], p_limiet integer default 60)
returns table(linkedin_url text, naam text, bedrijf text, rol text, segment text, score numeric)
language sql stable security definer set search_path='' as $$
  select c.linkedin_url, c.naam, c.bedrijf, c.rol, c.segment, coalesce(s.score, c.prioriteit)::numeric
  from public.bg_connecties c
  left join public.bg_connectiescore s on s.linkedin_url = c.linkedin_url
  where c.segment = any(p_segmenten)
    and c.status in ('nieuw','rust')
    and c.sleutel is not null
    and (c.laatst_aangeboden_op is null or c.laatst_aangeboden_op < now() - interval '21 days')
    and not exists (select 1 from public.powerhouse_sales_actions a where a.subject_key = c.linkedin_url and a.status in ('suggested','prepared','waiting') )
    and coalesce(c.rol,'')||' '||coalesce(c.bedrijf,'') !~* '\m(UK|U\.K\.|United Kingdom|England|London|USA|U\.S\.|United States|India|Dubai|UAE|Singapore|Australia|Canada|Germany|Deutschland|France|Spain|España|Italy|Bangladesh|Pakistan|Nigeria|Philippines|Brazil|Poland|Romania|Turkey|South Africa|EMEA|APAC|Global|Worldwide)\M'
    and ( coalesce(c.rol,'') ~* '\m(eigenaar|directeur|oprichter|mede-oprichter|bedrijfsleider|algemeen directeur|adviseur|accountant|zelfstandig|ondernemer|partner|vennoot|manager bedrijfsvoering|hoofd|teamleider|werkvoorbereider|financieel|belastingadviseur|notaris|bemiddelaar)\M'
       or coalesce(c.bedrijf,'') ~* '(\mB\.?V\.?\M|\mv\.o\.f\.?|\mVOF\M|\mholding\M|\mNederland\M|\mgroep\M|\madvies\M|\mbureau\M|\mdiensten\M)'
       or coalesce(c.naam,'') ~* '\m(van|de|der|den|ter|ten|het|van der|van den|van de)\M' )
  order by coalesce(s.score, c.prioriteit) desc nulls last, md5(c.linkedin_url)
  limit greatest(1, least(p_limiet, 200));
$$;
revoke all on function public.bg_inhaak_kandidaten(text[], integer) from public, anon, authenticated;
grant execute on function public.bg_inhaak_kandidaten(text[], integer) to service_role;
comment on function public.bg_inhaak_kandidaten(text[], integer) is 'Connecties voor een inhaak-DM op Nederlands nieuws. Heuristisch: sluit buitenlandse kenmerken uit en vraagt minstens één Nederlands kenmerk (rol, rechtsvorm of tussenvoegsel). Geen landveld beschikbaar; benadering, geen zekerheid. 10 sept 2026.';
select naam, left(rol,50) rol, left(bedrijf,30) bedrijf, segment, round(score) score from public.bg_inhaak_kandidaten(array['Directeur / eigenaar','IT & data'], 8);