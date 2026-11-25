create table if not exists public.bg_bedrijfsprofiel (
  bedrijf text primary key,
  website_url text,
  domein text,
  samenvatting text,
  sector text,
  diensten jsonb not null default '[]'::jsonb,
  systemen jsonb not null default '[]'::jsonb,
  vacatures_genoemd boolean,
  zakelijk_contact jsonb not null default '{}'::jsonb,
  bron_urls jsonb not null default '[]'::jsonb,
  zekerheid numeric,
  afgewezen_reden text,
  opgehaald_op timestamptz not null default now(),
  volgende_controle timestamptz not null default now() + interval '90 days'
);

alter table public.bg_bedrijfsprofiel enable row level security;
revoke all on public.bg_bedrijfsprofiel from public, anon, authenticated;
grant select, insert, update on public.bg_bedrijfsprofiel to service_role;

create or replace function public.bg_bedrijven_voor_profiel(p_limiet integer default 12)
returns table(bedrijf text, warm boolean, score numeric)
language sql
stable
security definer
set search_path = ''
as $$
  select c.bedrijf,
    bool_or(c.status in ('in_gesprek', 'aangeboden')) as warm,
    coalesce(max(c.prioriteit), 0) as score
  from public.bg_connecties c
  left join public.bg_bedrijfsprofiel p on p.bedrijf = c.bedrijf
  where c.bedrijf is not null and length(c.bedrijf) >= 4
    and c.bedrijf !~* '^(zelfstandig|freelance|eigen bedrijf|self.?employed|zzp|diverse|n[.]?v[.]?t[.]?|geen|stealth|consultant)'
    and (p.bedrijf is null or p.volgende_controle < now())
  group by c.bedrijf
  order by warm desc, score desc, md5(c.bedrijf)
  limit greatest(1, least(coalesce(p_limiet, 12), 40));
$$;

revoke all on function public.bg_bedrijven_voor_profiel(integer) from public, anon, authenticated;
grant execute on function public.bg_bedrijven_voor_profiel(integer) to service_role;