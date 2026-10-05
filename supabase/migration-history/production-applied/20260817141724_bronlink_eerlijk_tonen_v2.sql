alter table public.portaalblokken add column if not exists bron_via_google boolean not null default false;
alter table public.portaalblokken add column if not exists uitgever_url text;

create or replace function public.voorstel_overnemen(voorstel_id uuid, nieuw_cijfer text default null)
returns table (blok text, van text, naar text, plekken_geraakt integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record; oud text; gebruikt integer;
begin
  select cv.*, p.url as pub_url, p.titel as pub_titel, p.via_google, p.uitgever_url, b.uitgever
    into v
  from public.cijfervoorstellen cv
  join public.bronpublicaties p on p.id = cv.publicatie_id
  join public.bronnen b on b.id = p.bron_id
  where cv.id = voorstel_id and cv.status = 'nieuw';

  if not found then raise exception 'Voorstel niet gevonden of al beoordeeld'; end if;

  select huidig_cijfer into oud from public.portaalblokken where id = v.blok_id;

  update public.portaalblokken
     set huidig_cijfer = coalesce(nieuw_cijfer, v.voorgesteld_cijfer, huidig_cijfer),
         bronvermelding = v.uitgever || ' — ' || left(v.pub_titel, 120),
         laatste_publicatie_url = v.pub_url,
         bron_via_google = coalesce(v.via_google, false),
         uitgever_url = v.uitgever_url
   where id = v.blok_id;

  update public.cijfervoorstellen set status = 'overgenomen', beoordeeld_op = now() where id = voorstel_id;
  select count(*) into gebruikt from public.blokgebruik where blok_id = v.blok_id;

  return query select pb.titel, oud, pb.huidig_cijfer, gebruikt
               from public.portaalblokken pb where pb.id = v.blok_id;
end;
$$;

revoke execute on function public.voorstel_overnemen(uuid, text) from anon, public;
grant execute on function public.voorstel_overnemen(uuid, text) to authenticated;

drop view if exists public.kerncijfers_publiek;
create view public.kerncijfers_publiek
with (security_invoker = true) as
select pb.id, pb.dimensie, pb.titel, pb.huidig_cijfer, pb.vorig_cijfer, pb.bronvermelding,
       pb.laatste_publicatie_url, pb.bron_via_google, pb.uitgever_url, pb.gewijzigd_op,
       (pb.gewijzigd_op is not null and pb.gewijzigd_op > now() - interval '30 days') as recent_gewijzigd,
       (select array_agg(g.plek order by g.soort) from public.blokgebruik g where g.blok_id = pb.id) as werkt_door_in,
       (select jsonb_agg(jsonb_build_object('cijfer', v.cijfer, 'bron', v.bronvermelding, 'vanaf', v.geldig_vanaf) order by v.geldig_vanaf)
          from public.blokversies v where v.blok_id = pb.id) as versies
from public.portaalblokken pb
where pb.actief;

grant select on public.kerncijfers_publiek to anon, authenticated;

-- het bestaande Eurostat-blok bijwerken met de herkomst
update public.portaalblokken pb
   set bron_via_google = p.via_google, uitgever_url = p.uitgever_url
  from public.bronpublicaties p
 where p.url = pb.laatste_publicatie_url;
