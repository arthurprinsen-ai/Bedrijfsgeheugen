-- Welke bronnen gebruikt het portaal
create table public.bronnen (
  id uuid primary key default gen_random_uuid(),
  naam text not null,                      -- 'CBS - bedrijfsleven digitalisering'
  uitgever text not null,                  -- 'CBS', 'McKinsey', 'Eurostat'
  soort text not null check (soort in ('cbs_odata','webpagina','feed','handmatig')),
  adres text,                              -- tabelcode of URL
  controle_frequentie interval not null default '1 day',
  laatst_gecontroleerd timestamptz,
  laatste_controle_gelukt boolean,
  laatste_fout text,
  actief boolean not null default true,
  aangemaakt_op timestamptz not null default now()
);

-- Elke vondst is een nieuwe regel, nooit overschrijven
create table public.bronpublicaties (
  id uuid primary key default gen_random_uuid(),
  bron_id uuid not null references public.bronnen(id) on delete cascade,
  titel text,
  waarde numeric,                          -- voor cijferreeksen
  eenheid text,
  peildatum text,                          -- '2026Q1', '2025' - zoals de uitgever het noemt
  publicatiedatum date,
  url text,
  vingerafdruk text,                       -- hash, om dubbel binnenhalen te herkennen
  opgehaald_op timestamptz not null default now(),
  goedgekeurd boolean not null default false,
  unique (bron_id, vingerafdruk)
);

create index bronpublicaties_bron_idx on public.bronpublicaties (bron_id, publicatiedatum desc nulls last, opgehaald_op desc);

-- Wat het portaal leest: per bron de nieuwste
create view public.laatste_bronwaarden
with (security_invoker = true) as
select distinct on (b.id)
  b.id as bron_id, b.naam, b.uitgever, b.adres,
  p.titel, p.waarde, p.eenheid, p.peildatum, p.publicatiedatum, p.url,
  p.opgehaald_op, b.laatst_gecontroleerd
from public.bronnen b
join public.bronpublicaties p on p.bron_id = b.id
where b.actief and p.goedgekeurd
order by b.id, p.publicatiedatum desc nulls last, p.opgehaald_op desc;

alter table public.bronnen enable row level security;
alter table public.bronpublicaties enable row level security;

-- Referentiedata: iedereen die is ingelogd mag lezen, schrijven gaat alleen via de service-rol
create policy bronnen_lezen on public.bronnen for select to authenticated using (actief);
create policy publicaties_lezen on public.bronpublicaties for select to authenticated using (true);
