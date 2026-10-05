-- De kerncijferblokken uit het portaal
create table public.portaalblokken (
  id uuid primary key default gen_random_uuid(),
  dimensie text,
  titel text not null,
  huidig_cijfer text,
  bronvermelding text,
  uitgevers text[] not null default '{}',
  trefwoorden text[] not null default '{}',
  houdbaar_tot date,
  laatst_bevestigd date default current_date,
  actief boolean not null default true
);

-- Voorstellen: publicatie X raakt blok Y
create table public.cijfervoorstellen (
  id uuid primary key default gen_random_uuid(),
  blok_id uuid not null references public.portaalblokken(id) on delete cascade,
  publicatie_id uuid not null references public.bronpublicaties(id) on delete cascade,
  score integer not null default 0,
  voorgesteld_cijfer text,
  toelichting text,
  status text not null default 'nieuw' check (status in ('nieuw','overgenomen','afgewezen')),
  beoordeeld_op timestamptz,
  aangemaakt_op timestamptz not null default now(),
  unique (blok_id, publicatie_id)
);

create index voorstellen_status_idx on public.cijfervoorstellen (status, score desc);

alter table public.portaalblokken enable row level security;
alter table public.cijfervoorstellen enable row level security;

create policy blokken_lezen on public.portaalblokken for select to authenticated using (actief);
create policy voorstellen_lezen on public.cijfervoorstellen for select to authenticated using (true);
create policy voorstellen_beoordelen on public.cijfervoorstellen for update to authenticated
  using (true) with check (true);
