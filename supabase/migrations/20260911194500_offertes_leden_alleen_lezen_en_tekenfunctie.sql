-- Offertes en klanten: leden lezen, alleen de eigenaar schrijft. Tekenen via een functie.
--
-- Aanleiding (11 september 2026): offertes_alles en klanten_alles waren FOR ALL
-- voor ieder lid van de organisatie. Een uitgenodigde klant (rol 'lid') kon
-- daardoor bedrag, geldigheid en status van zijn eigen offerte wijzigen, of de
-- offerte wissen. Dat gat moet dicht vóórdat de eerste klant inlogt.
--
-- Nieuw gedrag:
--   * lid en eigenaar lezen offertes en klanten van hun eigen organisatie;
--   * alleen de eigenaar voegt toe, wijzigt en wist;
--   * een lid tekent uitsluitend via public.offerte_akkoord(): die zet de status
--     van 'verstuurd' naar 'geaccepteerd', binnen de geldigheid, en legt vast wie
--     en wanneer. Nogmaals tekenen geeft hetzelfde resultaat terug.
--
-- Het privilege zit in private.offerte_akkoord (security definer); de publieke
-- functie is een invoker-wrapper, zoals bij mijn_ranking.

alter table public.offertes
  add column if not exists akkoord_op timestamptz,
  add column if not exists akkoord_door uuid references auth.users(id) on delete set null,
  add column if not exists akkoord_naam text,
  add column if not exists akkoord_functie text;

drop policy if exists offertes_alles on public.offertes;
drop policy if exists klanten_alles on public.klanten;

create policy offertes_lezen on public.offertes
  for select to authenticated
  using (organisatie_id in (select intern.mijn_organisaties()));
create policy offertes_eigenaar_toevoegen on public.offertes
  for insert to authenticated
  with check (intern.is_eigenaar(organisatie_id));
create policy offertes_eigenaar_wijzigen on public.offertes
  for update to authenticated
  using (intern.is_eigenaar(organisatie_id))
  with check (intern.is_eigenaar(organisatie_id));
create policy offertes_eigenaar_wissen on public.offertes
  for delete to authenticated
  using (intern.is_eigenaar(organisatie_id));

create policy klanten_lezen on public.klanten
  for select to authenticated
  using (organisatie_id in (select intern.mijn_organisaties()));
create policy klanten_eigenaar_toevoegen on public.klanten
  for insert to authenticated
  with check (intern.is_eigenaar(organisatie_id));
create policy klanten_eigenaar_wijzigen on public.klanten
  for update to authenticated
  using (intern.is_eigenaar(organisatie_id))
  with check (intern.is_eigenaar(organisatie_id));
create policy klanten_eigenaar_wissen on public.klanten
  for delete to authenticated
  using (intern.is_eigenaar(organisatie_id));

create or replace function private.offerte_akkoord(p_offerte uuid, p_naam text, p_functie text default null)
returns table (offerte uuid, stand text, getekend_op timestamptz)
language plpgsql
security definer
set search_path = ''
as $fn$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v public.offertes%rowtype;
  v_naam text := nullif(btrim(coalesce(p_naam, '')), '');
  v_functie text := nullif(btrim(coalesce(p_functie, '')), '');
begin
  if v_uid is null then
    raise exception 'Niet ingelogd.' using errcode = '42501';
  end if;

  select o.* into v from public.offertes o where o.id = p_offerte for update;
  if not found or not exists (
    select 1 from public.leden l
     where l.gebruiker_id = v_uid and l.organisatie_id = v.organisatie_id
  ) then
    raise exception 'Offerte niet gevonden.' using errcode = 'P0002';
  end if;

  if v.status = 'geaccepteerd' then
    return query select v.id, v.status, v.akkoord_op;
    return;
  end if;
  if v.status <> 'verstuurd' then
    raise exception 'Deze offerte kan niet worden getekend (status: %).', v.status using errcode = '22023';
  end if;
  if v.geldig_tot is not null and v.geldig_tot < (now() at time zone 'Europe/Amsterdam')::date then
    raise exception 'Deze offerte is verlopen op %.', v.geldig_tot using errcode = '22023';
  end if;
  if v_naam is null or length(v_naam) < 3 then
    raise exception 'Vul je naam in.' using errcode = '22023';
  end if;

  update public.offertes o
     set status = 'geaccepteerd',
         akkoord_op = now(),
         akkoord_door = v_uid,
         akkoord_naam = v_naam,
         akkoord_functie = v_functie
   where o.id = v.id;

  insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
  values (v.organisatie_id, v.id, v_uid, 'offerte_getekend',
          jsonb_build_object('nummer', v.nummer, 'bedrag', v.bedrag, 'naam', v_naam, 'functie', v_functie));

  return query select v.id, 'geaccepteerd'::text, now();
end;
$fn$;

create or replace function public.offerte_akkoord(p_offerte uuid, p_naam text, p_functie text default null)
returns table (offerte uuid, stand text, getekend_op timestamptz)
language sql
security invoker
set search_path = ''
as $fn$
  select * from private.offerte_akkoord(p_offerte, p_naam, p_functie);
$fn$;

revoke all on function private.offerte_akkoord(uuid, text, text) from public, anon;
grant execute on function private.offerte_akkoord(uuid, text, text) to authenticated, service_role;
revoke all on function public.offerte_akkoord(uuid, text, text) from public, anon;
grant execute on function public.offerte_akkoord(uuid, text, text) to authenticated, service_role;
