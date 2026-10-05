-- Het portaal is (nog) niet ingelogd. Eén view die alleen de kerncijfers toont,
-- leesbaar zonder account. Klantgegevens blijven volledig afgeschermd.
create or replace view public.kerncijfers_publiek
with (security_invoker = false) as
select
  pb.id,
  pb.dimensie,
  pb.titel,
  pb.huidig_cijfer,
  pb.vorig_cijfer,
  pb.bronvermelding,
  pb.laatste_publicatie_url,
  pb.gewijzigd_op,
  (pb.gewijzigd_op is not null and pb.gewijzigd_op > now() - interval '30 days') as recent_gewijzigd,
  (select array_agg(g.plek order by g.soort) from public.blokgebruik g where g.blok_id = pb.id) as werkt_door_in,
  (select jsonb_agg(jsonb_build_object('cijfer', v.cijfer, 'bron', v.bronvermelding, 'vanaf', v.geldig_vanaf) order by v.geldig_vanaf)
     from public.blokversies v where v.blok_id = pb.id) as versies
from public.portaalblokken pb
where pb.actief;

grant select on public.kerncijfers_publiek to anon, authenticated;

-- Ook de wijzigingslijst mag publiek: het is jouw transparantie naar de klant
create or replace view public.wijzigingen_publiek
with (security_invoker = false) as
select pb.dimensie, pb.titel as blok, pb.vorig_cijfer as origineel, pb.huidig_cijfer as nu,
       pb.bronvermelding, pb.laatste_publicatie_url as bron_url, pb.gewijzigd_op,
       (select array_agg(g.plek order by g.soort) from public.blokgebruik g where g.blok_id = pb.id) as werkt_door_in
from public.portaalblokken pb
where pb.gewijzigd_op is not null and pb.actief
order by pb.gewijzigd_op desc;

grant select on public.wijzigingen_publiek to anon, authenticated;
