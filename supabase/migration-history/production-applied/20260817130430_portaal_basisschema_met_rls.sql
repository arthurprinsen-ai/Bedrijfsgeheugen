-- 1. Tabellen

create table public.organisaties (
  id uuid primary key default gen_random_uuid(),
  naam text not null,
  aangemaakt_op timestamptz not null default now()
);

create table public.leden (
  id uuid primary key default gen_random_uuid(),
  gebruiker_id uuid not null references auth.users(id) on delete cascade,
  organisatie_id uuid not null references public.organisaties(id) on delete cascade,
  rol text not null default 'lid' check (rol in ('eigenaar','lid')),
  aangemaakt_op timestamptz not null default now(),
  unique (gebruiker_id, organisatie_id)
);

create table public.klanten (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null references public.organisaties(id) on delete cascade,
  naam text not null,
  contactpersoon text,
  email text,
  telefoon text,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now()
);

create table public.offertes (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null references public.organisaties(id) on delete cascade,
  klant_id uuid references public.klanten(id) on delete set null,
  nummer text,
  titel text not null,
  status text not null default 'concept' check (status in ('concept','verstuurd','geaccepteerd','afgewezen','vervallen')),
  bedrag numeric(12,2),
  geldig_tot date,
  inhoud jsonb not null default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now(),
  bijgewerkt_op timestamptz not null default now(),
  unique (organisatie_id, nummer)
);

create table public.logboek (
  id uuid primary key default gen_random_uuid(),
  organisatie_id uuid not null references public.organisaties(id) on delete cascade,
  offerte_id uuid references public.offertes(id) on delete set null,
  gebruiker_id uuid references auth.users(id) on delete set null,
  actie text not null,
  details jsonb not null default '{}'::jsonb,
  aangemaakt_op timestamptz not null default now()
);

create index leden_gebruiker_idx on public.leden (gebruiker_id);
create index klanten_org_idx on public.klanten (organisatie_id);
create index offertes_org_idx on public.offertes (organisatie_id);
create index offertes_klant_idx on public.offertes (klant_id);
create index logboek_org_idx on public.logboek (organisatie_id, aangemaakt_op desc);

-- 2. bijgewerkt_op automatisch

create or replace function public.zet_bijgewerkt_op()
returns trigger
language plpgsql
as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

create trigger klanten_bijgewerkt before update on public.klanten
  for each row execute function public.zet_bijgewerkt_op();
create trigger offertes_bijgewerkt before update on public.offertes
  for each row execute function public.zet_bijgewerkt_op();

-- 3. Hulpfuncties (security definer -> geen recursie in policies)

create or replace function public.mijn_organisaties()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select organisatie_id from public.leden where gebruiker_id = auth.uid();
$$;

create or replace function public.is_eigenaar(org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.leden
    where gebruiker_id = auth.uid() and organisatie_id = org and rol = 'eigenaar'
  );
$$;

revoke execute on function public.mijn_organisaties() from public, anon;
revoke execute on function public.is_eigenaar(uuid) from public, anon;
grant execute on function public.mijn_organisaties() to authenticated;
grant execute on function public.is_eigenaar(uuid) to authenticated;

-- 4. RLS

alter table public.organisaties enable row level security;
alter table public.leden       enable row level security;
alter table public.klanten     enable row level security;
alter table public.offertes    enable row level security;
alter table public.logboek     enable row level security;

create policy organisaties_lezen on public.organisaties for select to authenticated
  using (id in (select public.mijn_organisaties()));
create policy organisaties_wijzigen on public.organisaties for update to authenticated
  using (public.is_eigenaar(id)) with check (public.is_eigenaar(id));

create policy leden_lezen on public.leden for select to authenticated
  using (organisatie_id in (select public.mijn_organisaties()));
create policy leden_beheren on public.leden for all to authenticated
  using (public.is_eigenaar(organisatie_id)) with check (public.is_eigenaar(organisatie_id));

create policy klanten_alles on public.klanten for all to authenticated
  using (organisatie_id in (select public.mijn_organisaties()))
  with check (organisatie_id in (select public.mijn_organisaties()));

create policy offertes_alles on public.offertes for all to authenticated
  using (organisatie_id in (select public.mijn_organisaties()))
  with check (organisatie_id in (select public.mijn_organisaties()));

-- logboek: alleen lezen en toevoegen, bewust geen update/delete
create policy logboek_lezen on public.logboek for select to authenticated
  using (organisatie_id in (select public.mijn_organisaties()));
create policy logboek_toevoegen on public.logboek for insert to authenticated
  with check (organisatie_id in (select public.mijn_organisaties()));
