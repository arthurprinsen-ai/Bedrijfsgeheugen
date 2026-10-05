-- 'ai' als los woord matchte op 'airline' en 'said'. Woordgrenzen gebruiken.
create or replace view public.relevante_publicaties
with (security_invoker = true) as
select distinct on (md5(lower(p.titel)))
  p.id, b.uitgever, b.naam as bron, p.titel, p.samenvatting, p.url,
  p.publicatiedatum, p.opgehaald_op, p.gezien, p.goedgekeurd,
  (select array_agg(w) from unnest(b.trefwoorden) w
    where (p.titel || ' ' || coalesce(p.samenvatting,'')) ~* ('\m' || w || '\M')) as geraakte_trefwoorden
from public.bronpublicaties p
join public.bronnen b on b.id = p.bron_id
where b.actief
  and exists (
    select 1 from unnest(b.trefwoorden) w
    where (p.titel || ' ' || coalesce(p.samenvatting,'')) ~* ('\m' || w || '\M')
  )
order by md5(lower(p.titel)), p.publicatiedatum desc nulls last;

grant select on public.relevante_publicaties to authenticated;
