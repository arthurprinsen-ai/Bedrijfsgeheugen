-- Relevantie: publicatie raakt een trefwoord van zijn bron
create or replace view public.relevante_publicaties
with (security_invoker = true) as
select distinct on (md5(lower(p.titel)))
  p.id, b.uitgever, b.naam as bron, p.titel, p.samenvatting, p.url,
  p.publicatiedatum, p.opgehaald_op, p.gezien, p.goedgekeurd,
  (select array_agg(w) from unnest(b.trefwoorden) w
    where lower(p.titel) like '%'||lower(w)||'%'
       or lower(coalesce(p.samenvatting,'')) like '%'||lower(w)||'%') as geraakte_trefwoorden
from public.bronpublicaties p
join public.bronnen b on b.id = p.bron_id
where b.actief
  and exists (
    select 1 from unnest(b.trefwoorden) w
    where lower(p.titel) like '%'||lower(w)||'%'
       or lower(coalesce(p.samenvatting,'')) like '%'||lower(w)||'%'
  )
order by md5(lower(p.titel)), p.publicatiedatum desc nulls last;

-- Alles in één keer: ophalen, even wachten, verwerken
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
  delete from net._http_response where created < now() - interval '2 days';
end;
$$;

revoke execute on function intern.bronnen_controleren() from public, anon, authenticated;

-- Elke nacht om 04:00
select cron.schedule('bronnen-dagelijks', '0 4 * * *', $$select intern.bronnen_controleren();$$);
