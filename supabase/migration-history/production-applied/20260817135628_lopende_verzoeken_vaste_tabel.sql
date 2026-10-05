create table if not exists intern.lopende_verzoeken (
  verzoek_id bigint primary key,
  bron_id uuid not null references public.bronnen(id) on delete cascade,
  uitgezet_op timestamptz not null default now()
);

create or replace function intern.bronnen_ophalen()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  b record;
  vid bigint;
  aantal integer := 0;
begin
  delete from intern.lopende_verzoeken;

  for b in select * from public.bronnen where actief and soort = 'feed' loop
    select net.http_get(
      b.adres,
      headers := case when b.browserkop
        then jsonb_build_object('User-Agent','Mozilla/5.0 (compatible; Bedrijfsgeheugen/1.0)','Accept','application/rss+xml, application/xml, text/xml, */*')
        else '{}'::jsonb end,
      timeout_milliseconds := 15000
    ) into vid;
    insert into intern.lopende_verzoeken (verzoek_id, bron_id) values (vid, b.id);
    aantal := aantal + 1;
  end loop;

  return aantal;
end;
$$;

create or replace function intern.bronnen_verwerken()
returns table (bron text, nieuw integer, status text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
  item text;
  t text; l text; d text; s text;
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
      update public.bronnen set laatst_gecontroleerd = now(),
             laatste_controle_gelukt = false,
             laatste_fout = coalesce(v.error_msg, 'status ' || coalesce(v.status_code::text,'geen antwoord'))
      where id = v.bron_id;
      bron := v.naam; nieuw := 0;
      status := 'mislukt: ' || coalesce(v.error_msg, 'status ' || coalesce(v.status_code::text,'-'));
      return next;
      continue;
    end if;

    for item in
      select (regexp_matches(v.content, '<item>(.*?)</item>', 'gs'))[1]
      union all
      select (regexp_matches(v.content, '<entry>(.*?)</entry>', 'gs'))[1]
    loop
      t := (regexp_matches(item, '<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>', 's'))[1];
      l := (regexp_matches(item, '<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</link>', 's'))[1];
      if l is null then
        l := (regexp_matches(item, '<link[^>]*href="([^"]+)"'))[1];
      end if;
      d := coalesce(
             (regexp_matches(item, '<pubDate>(.*?)</pubDate>', 's'))[1],
             (regexp_matches(item, '<updated>(.*?)</updated>', 's'))[1],
             (regexp_matches(item, '<published>(.*?)</published>', 's'))[1]
           );
      s := (regexp_matches(item, '<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>', 's'))[1];

      if t is null and l is null then continue; end if;

      begin
        insert into public.bronpublicaties (bron_id, titel, url, samenvatting, publicatiedatum, vingerafdruk)
        values (
          v.bron_id,
          left(trim(t), 500),
          trim(l),
          left(trim(regexp_replace(coalesce(s,''), '<[^>]+>', '', 'g')), 1000),
          case
            when d ~ '\d{1,2} \w{3} \d{4}' then
              to_date(substring(d from '(\d{1,2} \w{3} \d{4})'), 'DD Mon YYYY')
            when d ~ '^\d{4}-\d{2}-\d{2}' then
              substring(d from '^\d{4}-\d{2}-\d{2}')::date
          end,
          md5(coalesce(trim(l), trim(t)))
        );
        teller := teller + 1;
      exception
        when unique_violation then null;
        when others then null;
      end;
    end loop;

    update public.bronnen set laatst_gecontroleerd = now(),
           laatste_controle_gelukt = true, laatste_fout = null
    where id = v.bron_id;

    bron := v.naam; nieuw := teller; status := 'ok';
    return next;
  end loop;
end;
$$;

revoke execute on function intern.bronnen_ophalen() from public, anon, authenticated;
revoke execute on function intern.bronnen_verwerken() from public, anon, authenticated;
