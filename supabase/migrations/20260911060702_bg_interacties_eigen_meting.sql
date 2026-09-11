create table if not exists public.bg_interacties (
  id bigint generated always as identity primary key,
  ontvangen_op timestamptz not null default now(),
  gebeurd_op timestamptz,
  gebeurtenis text not null check (gebeurtenis in ('pagina','klik','scroll','formulier_start','formulier_verzonden','tijd_op_pagina','zichtbaar')),
  pad text not null check (pad ~ '^/[^?#]*$' and length(pad) <= 300),
  gebied text check (gebied in ('site','portaal')),
  element_tekst text check (length(element_tekst) <= 120),
  element_soort text check (length(element_soort) <= 30),
  element_doel text check (length(element_doel) <= 300),
  onderdeel text check (length(onderdeel) <= 80),
  diepte_pct smallint check (diepte_pct between 0 and 100),
  seconden integer check (seconden between 0 and 86400),
  sessie text check (length(sessie) <= 64),
  apparaat text check (apparaat in ('mobiel','tablet','desktop')),
  bron_domein text check (length(bron_domein) <= 120),
  toestemming boolean,
  is_robot boolean not null default false
);
alter table public.bg_interacties enable row level security;
create index if not exists bg_interacties_pad_tijd on public.bg_interacties (pad, ontvangen_op desc);
create index if not exists bg_interacties_gebeurtenis_tijd on public.bg_interacties (gebeurtenis, ontvangen_op desc);
comment on table public.bg_interacties is 'Eigen, privacyarme meting van alle interacties op site en portaal (11 sept 2026, besluit Arthur: alles meten om te optimaliseren). Geen cookies, geen IP, geen user-agent, geen ingevulde waarden: alleen pad, zichtbare elementtekst, gebeurtenis, diepte, tijd, sessie-ID per tabblad en apparaatklasse. Gevuld door Edge Function bg-interactie.';