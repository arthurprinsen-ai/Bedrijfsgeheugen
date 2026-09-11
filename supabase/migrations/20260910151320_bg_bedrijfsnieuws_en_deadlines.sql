create table if not exists public.bg_bedrijfsnieuws (
  url text primary key, bedrijf text not null, titel text, domein text, gepubliceerd_op timestamptz,
  over_dit_bedrijf boolean, soort text, haak text, zekerheid numeric, gebruikt_voor text,
  opgehaald_op timestamptz not null default now()
);
alter table public.bg_bedrijfsnieuws enable row level security;
comment on table public.bg_bedrijfsnieuws is 'Zakelijk nieuws over bedrijven van connecties (Tavily), getoetst door Claude. Alleen bedrijfsnieuws, nooit persoonsinformatie. Functie bg-bedrijfsnieuws, 10 sept 2026.';

create table if not exists public.bg_bedrijf_gecheckt (
  bedrijf text primary key, laatst_gecheckt timestamptz not null default now(), resultaten integer not null default 0
);
alter table public.bg_bedrijf_gecheckt enable row level security;

alter table public.bg_externe_signalen add column if not exists deadline date, add column if not exists deadline_post_notion_id text;

create or replace function public.bg_bedrijven_voor_nieuws(p_limiet integer default 8)
returns table(bedrijf text, linkedin_url text, naam text, rol text, segment text, score numeric)
language sql stable security definer set search_path='' as $$
  select distinct on (k.bedrijf) k.bedrijf, k.linkedin_url, k.naam, k.rol, k.segment, k.score
  from public.bg_inhaak_kandidaten(array['Directeur / eigenaar','Overdracht & M&A','Accountant & fiscaal','Investeerder'], 200) k
  left join public.bg_bedrijf_gecheckt g on g.bedrijf = k.bedrijf
  where k.bedrijf is not null and length(k.bedrijf) >= 4
    and k.bedrijf !~* '^(zelfstandig|freelance|eigen bedrijf|self.?employed|zzp|diverse|n\.?v\.?t\.?|geen|stealth|consultant)'
    and (g.laatst_gecheckt is null or g.laatst_gecheckt < now() - interval '30 days')
  order by k.bedrijf, k.score desc
  limit greatest(1, least(p_limiet, 20));
$$;
revoke all on function public.bg_bedrijven_voor_nieuws(integer) from public, anon, authenticated;
grant execute on function public.bg_bedrijven_voor_nieuws(integer) to service_role;