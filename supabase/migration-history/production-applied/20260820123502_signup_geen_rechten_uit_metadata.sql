-- LEK: /auth/v1/signup laat de aanmelder zelf "data" meesturen, en dat landt in
-- raw_user_meta_data. De trigger las daar organisatie_id en rol uit, dus kon
-- iedereen zich aanmelden als eigenaar van een bestaande organisatie. De id's
-- daarvan waren bovendien zonder inloggen op te vragen.
-- Vanaf nu bepaalt uitsluitend een uitnodiging in de database bij welke
-- organisatie iemand hoort. Wat de aanmelder zelf meestuurt telt niet mee.
create or replace function intern.nieuwe_gebruiker()
returns trigger
language plpgsql
security definer
set search_path to ''
as $function$
declare
  org uuid;
  org_naam text;
  gevraagde_rol text := 'lid';
begin
  -- Alleen een uitnodiging geeft toegang tot een bestaande organisatie.
  select u.organisatie_id, u.rol into org, gevraagde_rol
  from public.uitnodigingen u
  where lower(u.email) = lower(coalesce(new.email,''))
    and u.gebruikt_op is null
  order by u.aangemaakt_op limit 1;

  if gevraagde_rol is null or gevraagde_rol not in ('eigenaar','lid') then
    gevraagde_rol := 'lid';
  end if;

  if org is not null then
    insert into public.leden (gebruiker_id, organisatie_id, rol)
    values (new.id, org, gevraagde_rol)
    on conflict (gebruiker_id, organisatie_id) do nothing;
    update public.uitnodigingen set gebruikt_op = now()
     where organisatie_id = org
       and lower(email) = lower(coalesce(new.email,''))
       and gebruikt_op is null;
  else
    -- Geen uitnodiging: een eigen, nieuwe organisatie. De naam mag de gebruiker
    -- wel zelf aanleveren -- dat geeft geen rechten op iets van iemand anders.
    org_naam := coalesce(
      nullif(new.raw_user_meta_data ->> 'organisatie_naam', ''),
      nullif(split_part(coalesce(new.email,''), '@', 2), ''),
      'Nieuwe organisatie'
    );
    insert into public.organisaties (naam) values (org_naam) returning id into org;
    insert into public.leden (gebruiker_id, organisatie_id, rol)
    values (new.id, org, 'eigenaar');
  end if;

  return new;
end;
$function$;

-- Tweede afscherming: de id van een organisatie hoeft niemand zonder login te
-- kennen. Naam en slug blijven leesbaar voor de publieke portaalpagina.
revoke select (id) on public.organisaties from anon;
