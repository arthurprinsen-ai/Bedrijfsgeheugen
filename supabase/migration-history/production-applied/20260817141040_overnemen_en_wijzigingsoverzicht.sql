-- De knop: voorstel overnemen werkt het blok bij en laat overal een spoor achter
create or replace function public.voorstel_overnemen(voorstel_id uuid, nieuw_cijfer text default null)
returns table (blok text, van text, naar text, plekken_geraakt integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
  oud text;
  gebruikt integer;
begin
  select cv.*, p.url as pub_url, p.titel as pub_titel, b.uitgever
    into v
  from public.cijfervoorstellen cv
  join public.bronpublicaties p on p.id = cv.publicatie_id
  join public.bronnen b on b.id = p.bron_id
  where cv.id = voorstel_id and cv.status = 'nieuw';

  if not found then
    raise exception 'Voorstel niet gevonden of al beoordeeld';
  end if;

  select huidig_cijfer into oud from public.portaalblokken where id = v.blok_id;

  update public.portaalblokken
     set huidig_cijfer = coalesce(nieuw_cijfer, v.voorgesteld_cijfer, huidig_cijfer),
         bronvermelding = v.uitgever || ' — ' || left(v.pub_titel, 120),
         laatste_publicatie_url = v.pub_url
   where id = v.blok_id;

  update public.cijfervoorstellen
     set status = 'overgenomen', beoordeeld_op = now()
   where id = voorstel_id;

  select count(*) into gebruikt from public.blokgebruik where blok_id = v.blok_id;

  return query
  select pb.titel, oud, pb.huidig_cijfer, gebruikt
  from public.portaalblokken pb where pb.id = v.blok_id;
end;
$$;

create or replace function public.voorstel_afwijzen(voorstel_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.cijfervoorstellen
     set status = 'afgewezen', beoordeeld_op = now()
   where id = voorstel_id and status = 'nieuw';
$$;

grant execute on function public.voorstel_overnemen(uuid, text) to authenticated;
grant execute on function public.voorstel_afwijzen(uuid) to authenticated;

-- Wat is er gewijzigd, en waar werkt dat door? Dit toont het portaal.
create or replace view public.wijzigingen
with (security_invoker = true) as
select
  pb.id as blok_id,
  pb.dimensie,
  pb.titel as blok,
  pb.vorig_cijfer as was,
  pb.huidig_cijfer as is_nu,
  pb.bronvermelding,
  pb.laatste_publicatie_url as bron_url,
  pb.gewijzigd_op,
  (now() - pb.gewijzigd_op) < interval '30 days' as recent,
  (select array_agg(g.plek order by g.soort) from public.blokgebruik g where g.blok_id = pb.id) as werkt_door_in,
  (select count(*) from public.blokgebruik g where g.blok_id = pb.id and g.soort = 'advies') > 0 as advies_gewijzigd,
  (select count(*) from public.blokgebruik g where g.blok_id = pb.id and g.soort = 'model') > 0 as model_gewijzigd
from public.portaalblokken pb
where pb.gewijzigd_op is not null
order by pb.gewijzigd_op desc;

-- Per plek in het portaal: staat hier iets wat recent is bijgewerkt?
create or replace view public.gewijzigd_per_plek
with (security_invoker = true) as
select g.plek, g.soort, count(*) as aantal_blokken,
       max(pb.gewijzigd_op) as laatste_wijziging,
       array_agg(pb.titel) as blokken
from public.blokgebruik g
join public.portaalblokken pb on pb.id = g.blok_id
where pb.gewijzigd_op > now() - interval '30 days'
group by g.plek, g.soort
order by max(pb.gewijzigd_op) desc;

grant select on public.wijzigingen, public.gewijzigd_per_plek to authenticated;
