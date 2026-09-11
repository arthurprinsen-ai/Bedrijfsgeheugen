create table if not exists public.bg_zoekprestaties (
  datum date not null,
  pagina text not null,
  zoekterm text not null,
  klikken integer not null default 0,
  vertoningen integer not null default 0,
  ctr numeric,
  positie numeric,
  opgehaald_op timestamptz not null default now(),
  primary key (datum, pagina, zoekterm)
);
alter table public.bg_zoekprestaties enable row level security;
comment on table public.bg_zoekprestaties is 'Search Console per dag, pagina en zoekterm. Gevuld door Edge Function bg-gsc-sync (cron 05:15 UTC). Aangelegd 10 sept 2026.';