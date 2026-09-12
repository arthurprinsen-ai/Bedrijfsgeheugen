-- Geen definer-views. In plaats daarvan: leesrecht voor anon via RLS-policies,
-- zodat de views op de rechten van de bezoeker draaien.
create or replace view public.kerncijfers_publiek
with (security_invoker = true) as
select pb.id, pb.dimensie, pb.titel, pb.huidig_cijfer, pb.vorig_cijfer, pb.bronvermelding,
       pb.laatste_publicatie_url, pb.gewijzigd_op,
       (pb.gewijzigd_op is not null and pb.gewijzigd_op > now() - interval '30 days') as recent_gewijzigd,
       (select array_agg(g.plek order by g.soort) from public.blokgebruik g where g.blok_id = pb.id) as werkt_door_in,
       (select jsonb_agg(jsonb_build_object('cijfer', v.cijfer, 'bron', v.bronvermelding, 'vanaf', v.geldig_vanaf) order by v.geldig_vanaf)
          from public.blokversies v where v.blok_id = pb.id) as versies
from public.portaalblokken pb
where pb.actief;

create or replace view public.wijzigingen_publiek
with (security_invoker = true) as
select pb.dimensie, pb.titel as blok, pb.vorig_cijfer as origineel, pb.huidig_cijfer as nu,
       pb.bronvermelding, pb.laatste_publicatie_url as bron_url, pb.gewijzigd_op,
       (select array_agg(g.plek order by g.soort) from public.blokgebruik g where g.blok_id = pb.id) as werkt_door_in
from public.portaalblokken pb
where pb.gewijzigd_op is not null and pb.actief;

-- kerncijfers, hun versies en hun gebruik zijn openbaar leesbaar; klantdata niet
create policy blokken_publiek     on public.portaalblokken for select to anon using (actief);
create policy versies_publiek     on public.blokversies    for select to anon using (true);
create policy gebruik_publiek     on public.blokgebruik    for select to anon using (true);

grant select on public.portaalblokken, public.blokversies, public.blokgebruik to anon;
grant select on public.kerncijfers_publiek, public.wijzigingen_publiek to anon, authenticated;

-- de knoppen horen niet bij bezoekers
revoke execute on function public.voorstel_overnemen(uuid, text) from anon, public;
revoke execute on function public.voorstel_afwijzen(uuid) from anon, public;
grant execute on function public.voorstel_overnemen(uuid, text) to authenticated;
grant execute on function public.voorstel_afwijzen(uuid) to authenticated;
