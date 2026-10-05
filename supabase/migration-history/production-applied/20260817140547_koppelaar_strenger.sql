create or replace function intern.voorstellen_bijwerken()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  aantal integer;
begin
  with kandidaten as (
    select
      bl.id as blok_id,
      p.id  as publicatie_id,
      (select count(*) from unnest(bl.trefwoorden) w
        where (p.titel || ' ' || coalesce(p.samenvatting,'')) ~* ('\m' || w))::int as raken,
      substring(p.titel || ' ' || coalesce(p.samenvatting,'')
        from '(\d{1,3}(?:[.,]\d+)?\s?%|\$\s?\d[\d.,]*\s?(?:trillion|billion)|\d[\d.,]*\s?(?:miljard|biljoen))') as gevonden_cijfer
    from public.portaalblokken bl
    join public.bronnen b on b.uitgever = any (bl.uitgevers)
    join public.bronpublicaties p on p.bron_id = b.id
    where bl.actief and b.actief
      and p.publicatiedatum > current_date - interval '18 months'
  )
  insert into public.cijfervoorstellen (blok_id, publicatie_id, score, voorgesteld_cijfer, toelichting)
  select blok_id, publicatie_id,
         raken * 20 + case when gevonden_cijfer is not null then 25 else 0 end,
         gevonden_cijfer,
         raken || ' inhoudelijk trefwoord(en) raak'
           || case when gevonden_cijfer is not null then ', cijfer gevonden: ' || gevonden_cijfer else ', geen cijfer in de tekst' end
  from kandidaten
  where raken >= 1 and gevonden_cijfer is not null
     or raken >= 2
  on conflict (blok_id, publicatie_id) do nothing;

  get diagnostics aantal = row_count;
  return aantal;
end;
$$;

revoke execute on function intern.voorstellen_bijwerken() from public, anon, authenticated;

-- ook de voorstellen elke nacht bijwerken
create or replace function intern.bronnen_controleren()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform intern.bronnen_ophalen();
  perform pg_sleep(20);
  perform intern.bronnen_verwerken();
  perform intern.voorstellen_bijwerken();
  delete from net._http_response where created < now() - interval '2 days';
end;
$$;

revoke execute on function intern.bronnen_controleren() from public, anon, authenticated;
