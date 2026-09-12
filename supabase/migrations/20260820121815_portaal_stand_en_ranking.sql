-- De stand van het portaal per ingelogde gebruiker. Iedereen begint op 0 van 100%
-- en alles wat daarna wordt ingevuld beweegt dat percentage.
create table if not exists public.portaal_stand (
  gebruiker_id uuid primary key references auth.users(id) on delete cascade,
  bedrijf       text,
  volledigheid  smallint not null default 0 check (volledigheid between 0 and 100),
  stand         jsonb    not null default '{}'::jsonb,
  aangemaakt    timestamptz not null default now(),
  bijgewerkt    timestamptz not null default now()
);

alter table public.portaal_stand enable row level security;

-- Iedereen ziet en wijzigt uitsluitend zijn eigen rij.
drop policy if exists eigen_stand_lezen   on public.portaal_stand;
drop policy if exists eigen_stand_maken   on public.portaal_stand;
drop policy if exists eigen_stand_wijzigen on public.portaal_stand;

create policy eigen_stand_lezen on public.portaal_stand
  for select to authenticated using (gebruiker_id = auth.uid());
create policy eigen_stand_maken on public.portaal_stand
  for insert to authenticated with check (gebruiker_id = auth.uid());
create policy eigen_stand_wijzigen on public.portaal_stand
  for update to authenticated using (gebruiker_id = auth.uid())
  with check (gebruiker_id = auth.uid());

create or replace function public.stand_bijgewerkt()
returns trigger language plpgsql as $$
begin new.bijgewerkt = now(); return new; end $$;

drop trigger if exists trg_stand_bijgewerkt on public.portaal_stand;
create trigger trg_stand_bijgewerkt before update on public.portaal_stand
  for each row execute function public.stand_bijgewerkt();

-- De ranking. Geeft alleen geaggregeerde cijfers terug, nooit een andere rij:
-- hoeveel bedrijven meedoen, hoeveel er lager staan, en het gemiddelde.
create or replace function public.mijn_ranking()
returns table (meedoeners int, lager int, gemiddelde numeric, mijn int)
language sql security definer set search_path = public, pg_temp as $$
  with ik as (select volledigheid from public.portaal_stand where gebruiker_id = auth.uid())
  select (select count(*)::int from public.portaal_stand),
         (select count(*)::int from public.portaal_stand p, ik
           where p.volledigheid < ik.volledigheid),
         (select round(avg(volledigheid), 0) from public.portaal_stand),
         coalesce((select volledigheid from ik), 0);
$$;

revoke all on function public.mijn_ranking() from public, anon;
grant execute on function public.mijn_ranking() to authenticated;
