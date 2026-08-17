-- Bedrijfsgeheugen — tabellen voor het klantportaal
-- Plakken in Supabase: SQL Editor → New query → Run.
--
-- Fase 1: de gedeelde waarheid. Alles wat nu in de browser staat, komt hier te
-- staan, zodat twee mensen bij dezelfde klant hetzelfde zien en goedkeuring door
-- een ander mogelijk wordt.
--
-- LET OP: met alleen de publishable key kan iedereen die de paginabron leest bij
-- deze tabellen. Dat is aanvaardbaar voor projectgegevens, niet voor cijfers en
-- facturen. Zet daar niets in tot fase 2 (inloggen via Supabase Auth) klaar is.

-- ── het logboek: alles wat er gebeurt ────────────────────────────────────
create table if not exists portaal_log (
  id         uuid primary key default gen_random_uuid(),
  klant      text not null,
  soort      text not null,            -- Handtekening, Meerwerk, Wijziging, Opmerking, Vraag, Afspraak
  wat        text not null,
  detail     text,
  wie        text,
  akkoord    boolean,                  -- null = wacht op akkoord
  door       text,                     -- wie akkoord gaf
  wanneer    timestamptz not null default now()
);
create index if not exists portaal_log_klant on portaal_log (klant, wanneer desc);

-- ── wie welke rol vervult ────────────────────────────────────────────────
create table if not exists portaal_team (
  klant      text not null,
  rol        text not null,
  naam       text,
  bijgewerkt timestamptz not null default now(),
  primary key (klant, rol)
);

-- ── het akkoord op de offerte ────────────────────────────────────────────
create table if not exists portaal_akkoord (
  klant      text primary key,
  naam       text not null,
  functie    text,
  datum      date not null,
  onderdelen text,
  gemaakt    timestamptz not null default now()
);

-- ── getekend meerwerk ────────────────────────────────────────────────────
create table if not exists portaal_meerwerk (
  id          uuid primary key default gen_random_uuid(),
  klant       text not null,
  onderdeel   text not null,           -- de id uit de offerte
  titel       text,
  prijs       integer,
  weken       integer,
  naam        text,
  datum       date,
  gemaakt     timestamptz not null default now()
);
create index if not exists portaal_meerwerk_klant on portaal_meerwerk (klant);

-- ── voortgang per klant ──────────────────────────────────────────────────
create table if not exists portaal_voortgang (
  klant      text primary key,
  weken      integer not null default 0,
  gestart    date,
  bijgewerkt timestamptz not null default now()
);

-- ── toegang ──────────────────────────────────────────────────────────────
-- Row level security staat aan, met beleid dat lezen en schrijven toestaat.
-- Dat is bewust: zonder Supabase Auth kunnen we niet per gebruiker afschermen.
-- In fase 2 vervangen we deze regels door beleid op auth.jwt().
alter table portaal_log        enable row level security;
alter table portaal_team       enable row level security;
alter table portaal_akkoord    enable row level security;
alter table portaal_meerwerk   enable row level security;
alter table portaal_voortgang  enable row level security;

do $$
declare t text;
begin
  foreach t in array array['portaal_log','portaal_team','portaal_akkoord',
                           'portaal_meerwerk','portaal_voortgang']
  loop
    execute format('drop policy if exists lezen on %I', t);
    execute format('drop policy if exists schrijven on %I', t);
    execute format('drop policy if exists bijwerken on %I', t);
    execute format('create policy lezen on %I for select using (true)', t);
    execute format('create policy schrijven on %I for insert with check (true)', t);
    execute format('create policy bijwerken on %I for update using (true)', t);
  end loop;
end $$;
