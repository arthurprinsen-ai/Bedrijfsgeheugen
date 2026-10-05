-- 1. Elke wijziging van een cijfer wordt bewaard, nooit overschreven
create table public.blokversies (
  id uuid primary key default gen_random_uuid(),
  blok_id uuid not null references public.portaalblokken(id) on delete cascade,
  cijfer text,
  bronvermelding text,
  publicatie_id uuid references public.bronpublicaties(id) on delete set null,
  publicatie_url text,
  geldig_vanaf timestamptz not null default now(),
  reden text
);

create index blokversies_idx on public.blokversies (blok_id, geldig_vanaf desc);

alter table public.portaalblokken add column if not exists vorig_cijfer text;
alter table public.portaalblokken add column if not exists gewijzigd_op timestamptz;
alter table public.portaalblokken add column if not exists laatste_publicatie_url text;

-- 2. Waar wordt dit cijfer gebruikt? Dit is wat het portaal moet kunnen tonen.
create table public.blokgebruik (
  id uuid primary key default gen_random_uuid(),
  blok_id uuid not null references public.portaalblokken(id) on delete cascade,
  soort text not null check (soort in ('advies','model','scherm','offerte')),
  plek text not null,          -- 'Scan > dimensie tech', 'Benchmark berekening verzuim', 'Offertetekst hoofdstuk 2'
  omschrijving text
);

create index blokgebruik_idx on public.blokgebruik (blok_id);

-- 3. Wijzigt een cijfer, dan wordt dat overal vastgelegd
create or replace function intern.blok_gewijzigd()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.huidig_cijfer is distinct from old.huidig_cijfer
     or new.bronvermelding is distinct from old.bronvermelding then

    new.vorig_cijfer := old.huidig_cijfer;
    new.gewijzigd_op := now();
    new.laatst_bevestigd := current_date;

    insert into public.blokversies (blok_id, cijfer, bronvermelding, publicatie_url, reden)
    values (new.id, new.huidig_cijfer, new.bronvermelding, new.laatste_publicatie_url,
            'gewijzigd van ' || coalesce(old.huidig_cijfer,'(leeg)') || ' naar ' || coalesce(new.huidig_cijfer,'(leeg)'));
  end if;
  return new;
end;
$$;

drop trigger if exists blok_wijziging on public.portaalblokken;
create trigger blok_wijziging before update on public.portaalblokken
  for each row execute function intern.blok_gewijzigd();

alter table public.blokversies enable row level security;
alter table public.blokgebruik enable row level security;
create policy versies_lezen on public.blokversies for select to authenticated using (true);
create policy gebruik_lezen on public.blokgebruik for select to authenticated using (true);
