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
    -- niet loggen als de hele organisatie wordt verwijderd (cascade): het logboek gaat dan toch mee
    if exists (select 1 from public.organisaties o where o.id = old.organisatie_id) then
      insert into public.logboek (organisatie_id, offerte_id, gebruiker_id, actie, details)
      values (old.organisatie_id, null, auth.uid(), 'offerte_verwijderd',
              jsonb_build_object('titel', old.titel, 'nummer', old.nummer));
    end if;
    return old;
  end if;
end;
$$;
