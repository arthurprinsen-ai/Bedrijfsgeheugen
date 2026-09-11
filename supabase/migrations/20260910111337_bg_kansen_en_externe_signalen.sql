create table if not exists public.bg_zoekwoordkansen (
  zoekwoord text primary key,
  zaadwoord text, zoekvolume integer, concurrentie numeric, cpc numeric, kansscore numeric,
  positie numeric, rankende_url text, bron text not null default 'dataforseo',
  notion_page_id text, afgewezen_reden text,
  opgehaald_op timestamptz not null default now()
);
alter table public.bg_zoekwoordkansen enable row level security;
comment on table public.bg_zoekwoordkansen is 'Zoekwoordkansen uit DataForSEO (keywords_for_keywords, NL). Kansscore = volume / concurrentie. Nieuwe kandidaten gaan als Beoordeling=Nieuw naar Notion Zoekwoordkansen; beoordelen blijft handwerk (besluit 15 aug). Functie bg-zoekwoordkansen, 10 sept 2026.';

create table if not exists public.bg_signaal_onderwerpen (
  onderwerp text primary key, zoekvraag text not null, actief boolean not null default true, toegevoegd_op timestamptz not null default now()
);
alter table public.bg_signaal_onderwerpen enable row level security;
insert into public.bg_signaal_onderwerpen(onderwerp, zoekvraag) values
 ('AI Act en mkb', 'EU AI Act verplichtingen mkb Nederland'),
 ('Kennisverlies en personeel', 'kennisverlies personeelstekort mkb Nederland'),
 ('Bedrijfsoverdracht', 'bedrijfsoverdracht opvolging mkb Nederland'),
 ('AFAS', 'AFAS Software nieuws koppeling'),
 ('Exact en boekhouding', 'Exact Online Twinfield nieuws koppeling mkb'),
 ('Digitalisering mkb', 'digitalisering subsidie mkb Nederland 2026')
on conflict do nothing;

create table if not exists public.bg_externe_signalen (
  url text primary key, onderwerp text references public.bg_signaal_onderwerpen(onderwerp),
  titel text, samenvatting text, domein text, gepubliceerd_op timestamptz,
  brontrouw numeric, bevestiging numeric, versheid numeric, relevantie numeric, vertrouwen numeric,
  toegestaan boolean not null default false, opgehaald_op timestamptz not null default now()
);
alter table public.bg_externe_signalen enable row level security;
comment on table public.bg_externe_signalen is 'Externe bronnen via Tavily. Vertrouwen = brontrouw*0,35 + bevestiging*0,25 + versheid*0,15 + relevantie*0,25 (platform/intelligence/external-signals.mjs); toegestaan bij >= 0,6 en gekoppeld onderwerp. Functie bg-externe-signalen, 10 sept 2026.';