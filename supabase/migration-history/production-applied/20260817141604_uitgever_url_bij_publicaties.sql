alter table public.bronpublicaties add column if not exists uitgever_url text;
alter table public.bronpublicaties add column if not exists via_google boolean not null default false;

create or replace function intern.bronnen_verwerken()
returns table (bron text, nieuw integer, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
  item text;
  t text; l text; d text; s text; su text;
  teller integer;
begin
  for v in
    select lv.bron_id, r.status_code, r.content, r.error_msg, b.naam
    from intern.lopende_verzoeken lv
    join public.bronnen b on b.id = lv.bron_id
    left join net._http_response r on r.id = lv.verzoek_id
  loop
    teller := 0;

    if v.status_code is distinct from 200 or v.content is null then
      update public.bronnen set laatst_gecontroleerd = now(), laatste_controle_gelukt = false,
             laatste_fout = coalesce(v.error_msg, 'status ' || coalesce(v.status_code::text,'geen antwoord'))
      where id = v.bron_id;
      bron := v.naam; nieuw := 0;
      status := 'mislukt'; return next; continue;
    end if;

    for item in
      select (regexp_matches(v.content, '<item>(.*?)</item>', 'gs'))[1]
      union all
      select (regexp_matches(v.content, '<entry>(.*?)</entry>', 'gs'))[1]
    loop
      t := substring(item from '<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>');
      l := substring(item from '<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</link>');
      if l is null or trim(l) = '' then l := substring(item from '<link[^>]*href="([^"]+)"'); end if;
      d := substring(item from '<pubDate>(.*?)</pubDate>');
      if d is null then d := substring(item from '<updated>(.*?)</updated>'); end if;
      if d is null then d := substring(item from '<published>(.*?)</published>'); end if;
      s := substring(item from '<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>');
      su := substring(item from '<source[^>]*url="([^"]+)"');

      if (t is null or trim(t) = '') and (l is null or trim(l) = '') then continue; end if;

      insert into public.bronpublicaties (bron_id, titel, url, samenvatting, publicatiedatum, vingerafdruk, uitgever_url, via_google)
      values (
        v.bron_id,
        left(trim(coalesce(t,'')), 500),
        trim(coalesce(l,'')),
        left(trim(regexp_replace(coalesce(s,''), '<[^>]+>', '', 'g')), 1000),
        case
          when d ~ '\d{1,2} \w{3} \d{4}' then to_date(substring(d from '\d{1,2} \w{3} \d{4}'), 'DD Mon YYYY')
          when d ~ '\d{4}-\d{2}-\d{2}'   then (substring(d from '\d{4}-\d{2}-\d{2}'))::date
        end,
        md5(coalesce(nullif(trim(coalesce(l,'')),''), trim(coalesce(t,'')))),
        su,
        coalesce(l,'') like '%news.google.com%'
      )
      on conflict (bron_id, vingerafdruk) do update
        set uitgever_url = coalesce(excluded.uitgever_url, public.bronpublicaties.uitgever_url),
            via_google   = excluded.via_google;

      teller := teller + 1;
    end loop;

    update public.bronnen set laatst_gecontroleerd = now(), laatste_controle_gelukt = true, laatste_fout = null
    where id = v.bron_id;

    bron := v.naam; nieuw := teller; status := 'ok'; return next;
  end loop;
end;
$$;

revoke execute on function intern.bronnen_verwerken() from public, anon, authenticated;
