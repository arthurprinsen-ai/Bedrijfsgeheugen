-- trigger-functie vastzetten
create or replace function public.zet_bijgewerkt_op()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.bijgewerkt_op = now();
  return new;
end;
$$;

-- hulpfuncties naar een schema dat niet via de REST-API bereikbaar is
create schema if not exists intern;
grant usage on schema intern to authenticated;

create or replace function intern.mijn_organisaties()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select organisatie_id from public.leden where gebruiker_id = auth.uid();
$$;

create or replace function intern.is_eigenaar(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.leden
    where gebruiker_id = auth.uid() and organisatie_id = org and rol = 'eigenaar'
  );
$$;

revoke execute on function intern.mijn_organisaties() from public, anon;
revoke execute on function intern.is_eigenaar(uuid) from public, anon;
grant execute on function intern.mijn_organisaties() to authenticated;
grant execute on function intern.is_eigenaar(uuid) to authenticated;

-- policies opnieuw, nu tegen intern.*
drop policy organisaties_lezen on public.organisaties;
drop policy organisaties_wijzigen on public.organisaties;
drop policy leden_lezen on public.leden;
drop policy leden_beheren on public.leden;
drop policy klanten_alles on public.klanten;
drop policy offertes_alles on public.offertes;
drop policy logboek_lezen on public.logboek;
drop policy logboek_toevoegen on public.logboek;

create policy organisaties_lezen on public.organisaties for select to authenticated
  using (id in (select intern.mijn_organisaties()));
create policy organisaties_wijzigen on public.organisaties for update to authenticated
  using (intern.is_eigenaar(id)) with check (intern.is_eigenaar(id));

create policy leden_lezen on public.leden for select to authenticated
  using (organisatie_id in (select intern.mijn_organisaties()));
create policy leden_beheren on public.leden for all to authenticated
  using (intern.is_eigenaar(organisatie_id)) with check (intern.is_eigenaar(organisatie_id));

create policy klanten_alles on public.klanten for all to authenticated
  using (organisatie_id in (select intern.mijn_organisaties()))
  with check (organisatie_id in (select intern.mijn_organisaties()));

create policy offertes_alles on public.offertes for all to authenticated
  using (organisatie_id in (select intern.mijn_organisaties()))
  with check (organisatie_id in (select intern.mijn_organisaties()));

create policy logboek_lezen on public.logboek for select to authenticated
  using (organisatie_id in (select intern.mijn_organisaties()));
create policy logboek_toevoegen on public.logboek for insert to authenticated
  with check (organisatie_id in (select intern.mijn_organisaties()));

drop function if exists public.mijn_organisaties();
drop function if exists public.is_eigenaar(uuid);
