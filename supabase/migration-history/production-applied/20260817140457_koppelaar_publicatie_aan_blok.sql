-- trefwoorden per blok, afgeleid van de titel (stopwoorden eruit)
update public.portaalblokken set trefwoorden = (
  select array_agg(w) from (
    select distinct lower(w) as w
    from unnest(regexp_split_to_array(titel, '\s+')) w
    where length(w) > 4
      and lower(w) not in ('bijna','iedereen','niemand','zonder','wordt','worden','pfffff',
                           'staat','staan','moeten','zeggen','zegt','tegen','eigen','situatie',
                           'ranglijst','landelijk','vraagstuk','geen','niet','maar','over','naar',
                           'wat','die','dat','een','het','van','met','voor','door','zijn','doen')
  ) x
)
where trefwoorden = '{}';

-- Voorstellen maken: match op uitgever + minstens één trefwoord
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
      -- getal uit de titel of samenvatting halen als voorstel
      substring(p.titel || ' ' || coalesce(p.samenvatting,'') from '(\d{1,3}(?:[.,]\d+)?\s?%|\$\s?\d[\d.,]*\s?(?:trillion|billion|miljard|biljoen))') as gevonden_cijfer,
      p.publicatiedatum
    from public.portaalblokken bl
    join public.bronnen b on b.uitgever = any (bl.uitgevers)
    join public.bronpublicaties p on p.bron_id = b.id
    where bl.actief and b.actief
      and p.publicatiedatum > current_date - interval '18 months'
  )
  insert into public.cijfervoorstellen (blok_id, publicatie_id, score, voorgesteld_cijfer, toelichting)
  select blok_id, publicatie_id,
         raken * 10 + case when gevonden_cijfer is not null then 15 else 0 end,
         gevonden_cijfer,
         case when gevonden_cijfer is not null
              then 'Zelfde uitgever, ' || raken || ' trefwoord(en) raak, cijfer gevonden in de tekst'
              else 'Zelfde uitgever, ' || raken || ' trefwoord(en) raak' end
  from kandidaten
  where raken > 0
  on conflict (blok_id, publicatie_id) do nothing;

  get diagnostics aantal = row_count;
  return aantal;
end;
$$;

revoke execute on function intern.voorstellen_bijwerken() from public, anon, authenticated;

-- Overzicht voor het portaal
create or replace view public.te_beoordelen
with (security_invoker = true) as
select v.id, bl.dimensie, bl.titel as blok, bl.huidig_cijfer, bl.bronvermelding,
       v.voorgesteld_cijfer, v.score, v.toelichting,
       p.titel as publicatie, p.url, p.publicatiedatum, b.uitgever
from public.cijfervoorstellen v
join public.portaalblokken bl on bl.id = v.blok_id
join public.bronpublicaties p on p.id = v.publicatie_id
join public.bronnen b on b.id = p.bron_id
where v.status = 'nieuw'
order by v.score desc, p.publicatiedatum desc nulls last;

grant select on public.te_beoordelen to authenticated;
