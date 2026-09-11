-- Een getekende offerte verschijnt meteen in Vandaag.
--
-- Besluit 10 september 2026: meldingen lopen via het brein en Vandaag, niet via
-- Make. Vandaag (public.bg_vandaag) toont de acties uit powerhouse_sales_actions
-- met status 'suggested'. Daarom zet offerte_akkoord bij het tekenen een actie
-- klaar: bel de klant om de start in te plannen, met een conceptbericht.
--
-- Mislukt het klaarzetten, dan blijft de handtekening staan en komt er een regel
-- 'melding_mislukt' in het logboek. Tekenen mag nooit afhangen van de melding.
-- Nogmaals tekenen maakt geen tweede actie (dedupe_key per offerte).

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
  v_org public.organisaties%rowtype;
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

  -- Melding in Vandaag. Eigen blok: een fout hier draait de handtekening niet terug.
  begin
    select g.* into v_org from public.organisaties g where g.id = v.organisatie_id;
    insert into public.powerhouse_sales_actions
      (dedupe_key, subject_key, company_key, action_type, channel, priority, reason, evidence,
       message_draft, source_url, status, due_at, person_name, company_name, role, expected_value_eur)
    values
      ('offerte_getekend:' || v.id::text,
       'offerte:' || v.id::text,
       v_org.slug,
       'offerte_getekend',
       'Telefoon',
       1000,
       format('Offerte %s is getekend door %s op %s. Bel om de start in te plannen.',
              coalesce(v.nummer, ''), v_naam,
              to_char(now() at time zone 'Europe/Amsterdam', 'DD-MM-YYYY HH24:MI')),
       jsonb_build_object('offerte_id', v.id, 'nummer', v.nummer, 'bedrag', v.bedrag,
                          'naam', v_naam, 'functie', v_functie, 'organisatie', v_org.naam),
       format(E'Hoi %s,\n\nDank je voor je akkoord op %s. Ik bel je deze week om de start in te plannen. Welk moment komt je het best uit?',
              split_part(v_naam, ' ', 1), coalesce(v.nummer, 'de offerte')),
       'https://www.bedrijfsgeheugen.nl/klantportaal?klant=' || coalesce(v_org.slug, ''),
       'suggested',
       now(),
       v_naam,
       v_org.naam,
       v_functie,
       coalesce(v.bedrag, 0))
    on conflict (dedupe_key) do nothing;
  exception when others then
    insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
    values (v.organisatie_id, v.id, v_uid, 'melding_mislukt',
            jsonb_build_object('waar', 'powerhouse_sales_actions', 'fout', sqlerrm));
  end;

  return query select v.id, 'geaccepteerd'::text, now();
end;
$fn$;

revoke all on function private.offerte_akkoord(uuid, text, text) from public, anon;
grant execute on function private.offerte_akkoord(uuid, text, text) to authenticated, service_role;
