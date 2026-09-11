-- Scan- en offertegegevens voor de benchmark.
-- Opzet: het portaal mag alleen toevoegen, niet lezen. Zo kan niemand via de
-- publieke sleutel de gegevens van andere bedrijven ophalen, terwijl de
-- benchmark wel op alles kan rekenen.

create table if not exists public.scan_inzendingen (
  id             uuid primary key default gen_random_uuid(),
  aangemaakt     timestamptz not null default now(),
  klant_slug     text,                    -- welk portaal, niet wie
  soort          text not null,           -- frisse_blik | ai_scan | zelfscan | afmaakindex
  scan_datum     date,
  score          numeric,                 -- 0-100 waar van toepassing
  branche        text,
  omvang         text,                    -- grootteklasse, geen exact aantal
  niveaus        jsonb,                   -- gemiddelde per dimensie
  taken          jsonb,                   -- AI-scan: uren en herhaling per taak
  doel           text,
  bron           text default 'klantportaal'
);

create table if not exists public.offerte_inzendingen (
  id             uuid primary key default gen_random_uuid(),
  aangemaakt     timestamptz not null default now(),
  klant_slug     text,
  titel          text,
  totaal         numeric,                 -- excl. btw
  weken          int,
  onderdelen     jsonb,                   -- naam, prijs, aantal sprints per onderdeel
  getekend       boolean default false,
  getekend_op    date,
  bron           text default 'klantportaal'
);

create index if not exists scan_soort_datum on public.scan_inzendingen (soort, scan_datum);
create index if not exists scan_branche on public.scan_inzendingen (branche);
create index if not exists offerte_datum on public.offerte_inzendingen (aangemaakt);

alter table public.scan_inzendingen enable row level security;
alter table public.offerte_inzendingen enable row level security;

-- Alleen toevoegen vanaf de site. Lezen kan uitsluitend met de servicesleutel.
drop policy if exists scan_toevoegen on public.scan_inzendingen;
create policy scan_toevoegen on public.scan_inzendingen
  for insert to anon, authenticated with check (true);

drop policy if exists offerte_toevoegen on public.offerte_inzendingen;
create policy offerte_toevoegen on public.offerte_inzendingen
  for insert to anon, authenticated with check (true);
