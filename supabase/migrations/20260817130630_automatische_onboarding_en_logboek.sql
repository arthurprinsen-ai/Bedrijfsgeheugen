-- A. Nieuwe gebruiker krijgt automatisch een plek
create or replace function intern.nieuwe_gebruiker()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  org uuid;
  org_naam text;
  gevraagde_rol text;
begin
  org := nullif(new.raw_user_meta_data ->> 'organisatie_id', '')::uuid;

  if org is not null and exists (select 1 from public.organisaties o where o.id = org) then
    -- uitgenodigd bij een bestaande organisatie
    gevraagde_rol := coalesce(nullif(new.raw_user_meta_data ->> 'rol', ''), 'lid');
    if gevraagde_rol not in ('eigenaar','lid') then
      gevraagde_rol := 'lid';
    end if;
    insert into public.leden (gebruiker_id, organisatie_id, rol)
    values (new.id, org, gevraagde_rol)
    on conflict (gebruiker_id, organisatie_id) do nothing;
  else
    -- geen uitnodiging: eigen organisatie, aanmelder wordt eigenaar
    org_naam := coalesce(
      nullif(new.raw_user_meta_data ->> 'organisatie_naam', ''),
      nullif(split_part(coalesce(new.email,''), '@', 2), ''),
      'Nieuwe organisatie'
    );
    insert into public.organisaties (naam) values (org_naam) returning id into org;
    insert into public.leden (gebruiker_id, organisatie_id, rol) values (new.id, org, 'eigenaar');
  end if;

  return new;
end;
$$;

drop trigger if exists op_nieuwe_gebruiker on auth.users;
create trigger op_nieuwe_gebruiker
  after insert on auth.users
  for each row execute function intern.nieuwe_gebruiker();

-- B. Logboek schrijft zichzelf
create or replace function intern.log_offerte()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
    values (new.organisatie_id, new.id, auth.uid(), 'offerte_aangemaakt',
            jsonb_build_object('titel', new.titel, 'status', new.status, 'bedrag', new.bedrag));
    return new;

  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
      values (new.organisatie_id, new.id, auth.uid(), 'status_gewijzigd',
              jsonb_build_object('van', old.status, 'naar', new.status));
    end if;
    if (to_jsonb(new) - 'status' - 'bijgewerkt_op') is distinct from (to_jsonb(old) - 'status' - 'bijgewerkt_op') then
      insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
      values (new.organisatie_id, new.id, auth.uid(), 'offerte_gewijzigd',
              jsonb_build_object('titel', new.titel, 'bedrag', new.bedrag));
    end if;
    return new;

  else
    insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
    values (old.organisatie_id, null, auth.uid(), 'offerte_verwijderd',
            jsonb_build_object('titel', old.titel, 'nummer', old.nummer));
    return old;
  end if;
end;
$$;

drop trigger if exists offertes_logboek on public.offertes;
create trigger offertes_logboek
  after insert or update or delete on public.offertes
  for each row execute function intern.log_offerte();
