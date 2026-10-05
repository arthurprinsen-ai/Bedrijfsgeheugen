-- Wat een nieuwe offerte zou moeten kosten, afgeleid uit wat eerder is getekend.
-- Bewust op getekende offertes: wat niet is getekend zegt niets over de prijs
-- die de markt accepteert.

create or replace view public.prijsadvies as
select
  s.naam                                        as sjabloon,
  s.vraagsoort,
  s.keer_gebruikt,
  s.keer_getekend,
  case when s.keer_gebruikt > 0
       then round(100.0 * s.keer_getekend / s.keer_gebruikt, 0) end as slagingskans,
  s.laatste_prijs,
  round(avg(o.totaal)::numeric, 0)              as gemiddeld_getekend,
  round(max(o.totaal)::numeric, 0)              as hoogst_getekend,
  round(avg(o.weken)::numeric, 1)               as gemiddelde_doorlooptijd
from public.offerte_sjablonen s
left join public.offerte_inzendingen o
  on o.getekend = true and o.titel ilike '%' || split_part(s.naam, ' ', 1) || '%'
group by s.id, s.naam, s.vraagsoort, s.keer_gebruikt, s.keer_getekend, s.laatste_prijs;

-- Wat hergebruik oplevert: de marge tussen wat we vragen en wat het nog kost.
create or replace view public.hergebruik_rendement as
select
  soort,
  bron_systeem,
  count(*)                                      as aantal_bouwstenen,
  sum(hergebruik)                               as keer_hergebruikt,
  round(sum(bouwuren)::numeric, 1)              as uren_geinvesteerd,
  round(sum(uren_bespaard)::numeric, 1)         as uren_bespaard,
  case when sum(bouwuren) > 0
       then round((sum(uren_bespaard) / sum(bouwuren))::numeric, 2) end as rendement
from public.bouwstenen
group by soort, bron_systeem
order by uren_bespaard desc nulls last;
