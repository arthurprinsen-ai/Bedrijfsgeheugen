-- Source: 2026-10-25 production function definitions, changed only two numeric candidate-pool caps.
-- Root cause: the top 200 persons were mostly checked in prior 30 days BEFORE the 20-company
-- selection filter. Actual 2026-10-25 run evaluated 5 companies instead of 15 and yielded 0 news.
-- Retain existing no-contact-repeat eligibility, sales-action suppression, NL scope, 30-day
-- company cooldown, max-20 result size and existing Tavily request budget.
-- CREATE OR REPLACE preserves existing function EXECUTE grants (anon=false, authenticated=false).
-- Replay check: existing callers requesting <=200 candidates remain unchanged.
CREATE OR REPLACE FUNCTION public.bg_inhaak_kandidaten(p_segmenten text[], p_limiet integer DEFAULT 60)
 RETURNS TABLE(linkedin_url text, naam text, bedrijf text, rol text, segment text, score numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select c.linkedin_url, c.naam, c.bedrijf, c.rol, c.segment, coalesce(s.score, c.prioriteit)::numeric
  from public.bg_connecties c
  left join public.bg_connectiescore s on s.linkedin_url = c.linkedin_url
  where c.segment = any(p_segmenten)
    and c.status in ('nieuw','rust')
    and c.sleutel is not null
    and (c.laatst_aangeboden_op is null or c.laatst_aangeboden_op < now() - interval '21 days')
    and not exists (select 1 from public.powerhouse_sales_actions a where a.subject_key = c.linkedin_url and a.status in ('suggested','prepared','waiting') )
    -- buitenland uitsluiten
    and coalesce(c.rol,'')||' '||coalesce(c.bedrijf,'') !~* '\m(UK|U\.K\.|United Kingdom|England|London|USA|U\.S\.|United States|India|Dubai|UAE|Singapore|Australia|Canada|Germany|Deutschland|France|Spain|España|Italy|Bangladesh|Pakistan|Nigeria|Philippines|Brazil|Poland|Romania|Turkey|South Africa|EMEA|APAC|Global|Worldwide)\M'
    -- minstens één Nederlands kenmerk
    and ( coalesce(c.rol,'') ~* '\m(eigenaar|directeur|oprichter|mede-oprichter|bedrijfsleider|algemeen directeur|adviseur|accountant|zelfstandig|ondernemer|partner|vennoot|manager bedrijfsvoering|hoofd|teamleider|werkvoorbereider|financieel|belastingadviseur|notaris|bemiddelaar)\M'
       or coalesce(c.bedrijf,'') ~* '(\mB\.?V\.?\M|\mv\.o\.f\.?|\mVOF\M|\mholding\M|\mNederland\M|\mgroep\M|\madvies\M|\mbureau\M|\mdiensten\M)'
       or coalesce(c.naam,'') ~* '\m(van|de|der|den|ter|ten|het|van der|van den|van de)\M' )
  order by coalesce(s.score, c.prioriteit) desc nulls last, md5(c.linkedin_url)
  limit greatest(1, least(p_limiet, 1500));
$function$
;

CREATE OR REPLACE FUNCTION public.bg_bedrijven_voor_nieuws(p_limiet integer DEFAULT 8)
 RETURNS TABLE(bedrijf text, linkedin_url text, naam text, rol text, segment text, score numeric)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  select * from (
    select distinct on (k.bedrijf) k.bedrijf, k.linkedin_url, k.naam, k.rol, k.segment, k.score
    from public.bg_inhaak_kandidaten(array['Directeur / eigenaar','Overdracht & M&A','Accountant & fiscaal','Investeerder'], 1500) k
    left join public.bg_bedrijf_gecheckt g on g.bedrijf = k.bedrijf
    where k.bedrijf is not null and length(k.bedrijf) >= 4
      and k.bedrijf !~* '^(zelfstandig|freelance|eigen bedrijf|self.?employed|zzp|diverse|n\.?v\.?t\.?|geen|stealth|consultant)'
      and (g.laatst_gecheckt is null or g.laatst_gecheckt < now() - interval '30 days')
    order by k.bedrijf, k.score desc
  ) x order by x.score desc, md5(x.bedrijf)
  limit greatest(1, least(p_limiet, 20));
$function$
;
