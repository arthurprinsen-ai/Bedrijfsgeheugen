-- De kern van het verdienmodel: werk dat we één keer maken en daarna hergebruiken.
-- De prijs blijft staan, de tijd daalt. Daarvoor moeten we weten wát we hebben
-- en hoeveel tijd het de vorige keer kostte.

create table if not exists public.bouwstenen (
  id            uuid primary key default gen_random_uuid(),
  aangemaakt    timestamptz not null default now(),
  bijgewerkt    timestamptz not null default now(),
  naam          text not null,
  soort         text not null,            -- powerbi_rapport | semantisch_model | koppeling |
                                          -- make_scenario | sql | dax | document | prompt | anders
  bron_systeem  text,                     -- AFAS, Exact, Twinfield, GA4, BigQuery, ...
  omschrijving  text,                     -- wat het doet, in gewone taal
  waarom        text,                     -- waarom het zo is gebouwd
  bestandspad   text,                     -- waar het echte bestand staat (GitHub, Drive)
  eerste_klant  text,                     -- waar het voor is gemaakt
  bouwuren      numeric,                  -- wat het de eerste keer kostte
  hergebruik    int not null default 0,   -- hoe vaak sindsdien ingezet
  uren_bespaard numeric default 0,        -- opgetelde besparing
  rijp          boolean default false,    -- klaar voor hergebruik zonder aanpassing
  labels        text[]
);

create table if not exists public.offerte_sjablonen (
  id            uuid primary key default gen_random_uuid(),
  aangemaakt    timestamptz not null default now(),
  naam          text not null,            -- 'Analytics en Power BI-dashboard'
  vraagsoort    text,                     -- waar de klantvraag op leek
  onderdelen    jsonb not null,           -- epics met prijs, sprints, stories, koppelingen, documenten
  totaal        numeric,
  weken         int,
  bouwstenen    uuid[],                   -- welke bestaande bouwstenen hierin passen
  keer_gebruikt int not null default 0,
  keer_getekend int not null default 0,
  laatste_prijs numeric,
  notities      text
);

create index if not exists bouwsteen_soort on public.bouwstenen (soort, bron_systeem);
create index if not exists sjabloon_vraag on public.offerte_sjablonen (vraagsoort);

alter table public.bouwstenen enable row level security;
alter table public.offerte_sjablonen enable row level security;
-- Geen policies: alleen bereikbaar met de servicesleutel, dus vanuit jouw kant.
-- Dit is intern gereedschap en hoort niet in een klantbrowser.;
