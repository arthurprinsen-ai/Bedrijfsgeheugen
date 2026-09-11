-- Weergaven voor de benchmark. Bewust met een ondergrens van vijf inzendingen
-- per groep: onder dat aantal is een gemiddelde herleidbaar tot een bedrijf.

create or replace view public.benchmark_branche as
select
  branche,
  count(*)                                   as aantal,
  round(avg(score)::numeric, 1)              as score_gemiddeld,
  round((percentile_cont(0.5) within group (order by score))::numeric, 1) as score_midden,
  round((percentile_cont(0.75) within group (order by score))::numeric, 1) as score_bovenste_kwart
from public.scan_inzendingen
where soort = 'frisse_blik' and score is not null and branche is not null
group by branche
having count(*) >= 5;

create or replace view public.benchmark_niveaus as
select
  branche,
  sleutel                                    as onderdeel,
  count(*)                                   as aantal,
  round(avg(waarde)::numeric, 2)             as niveau_gemiddeld
from public.scan_inzendingen,
     lateral jsonb_each_text(coalesce(niveaus, '{}'::jsonb)) as n(sleutel, ruw),
     lateral (select (n.ruw)::numeric as waarde) w
where soort = 'frisse_blik' and branche is not null
group by branche, sleutel
having count(*) >= 5;

create or replace view public.benchmark_offertes as
select
  date_trunc('month', aangemaakt)::date      as maand,
  count(*)                                   as aantal,
  round(avg(totaal)::numeric, 0)             as gemiddeld_bedrag,
  round(avg(weken)::numeric, 1)              as gemiddelde_doorlooptijd,
  round(100.0 * avg(case when getekend then 1 else 0 end), 1) as getekend_percentage
from public.offerte_inzendingen
group by 1
having count(*) >= 5;
