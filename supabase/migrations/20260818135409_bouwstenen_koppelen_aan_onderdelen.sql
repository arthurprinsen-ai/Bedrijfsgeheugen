alter table public.bouwstenen
  add column if not exists voor_onderdeel text[] default '{}',
  add column if not exists uren_met_bouwsteen numeric;

comment on column public.bouwstenen.voor_onderdeel is
  'Onderdeel-ids uit een offerte waar deze bouwsteen het werk van doet (fase1, fundament, marketing, signalering, ...). Zo weet een nieuwe offerte wat er al ligt.';
comment on column public.bouwstenen.uren_met_bouwsteen is
  'Uren die het onderdeel nog kost als je deze bouwsteen hergebruikt. bouwuren min dit getal is wat je per klant bespaart.';

create or replace view public.marge_per_onderdeel as
select
  o.onderdeel,
  count(*) filter (where b.rijp) as bouwstenen_klaar,
  sum(b.bouwuren) filter (where b.rijp) as uren_die_er_al_liggen,
  sum(coalesce(b.uren_met_bouwsteen,0)) filter (where b.rijp) as uren_die_je_nog_maakt,
  sum(b.bouwuren - coalesce(b.uren_met_bouwsteen,0)) filter (where b.rijp) as uren_bespaard_per_klant
from public.bouwstenen b
cross join lateral unnest(b.voor_onderdeel) as o(onderdeel)
group by o.onderdeel;
