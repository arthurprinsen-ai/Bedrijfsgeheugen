create table if not exists public.bg_functie_aanroep (
  request_id bigint primary key,
  functie text not null,
  aangeroepen_op timestamptz not null default now()
);
alter table public.bg_functie_aanroep enable row level security;
comment on table public.bg_functie_aanroep is 'Elke geplande aanroep van een Edge Function met zijn pg_net-verzoeknummer, zodat de gezondheidsmeting het echte antwoord kan beoordelen.';

create or replace function public.bg_roep_functie(p_functie text, p_body jsonb default '{}'::jsonb)
returns bigint language plpgsql security definer set search_path = public, net as $$
declare v_id bigint;
begin
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/'||p_functie,
    body := p_body, headers := '{"content-type":"application/json"}'::jsonb, timeout_milliseconds := 120000) into v_id;
  insert into public.bg_functie_aanroep(request_id, functie) values (v_id, p_functie);
  return v_id;
end $$;
revoke all on function public.bg_roep_functie(text, jsonb) from public, anon, authenticated;

create or replace function public.bg_gezondheid_meten()
returns table(onderdeel text, soort text, status text, detail text)
language plpgsql security definer set search_path = public, cron, net as $$
declare v_tijd timestamptz := now(); r record;
begin
  for r in
    select j.jobname, j.schedule,
      (select d.status from cron.job_run_details d where d.jobid=j.jobid order by d.start_time desc limit 1) as laatste_status,
      (select left(coalesce(d.return_message,''),200) from cron.job_run_details d where d.jobid=j.jobid order by d.start_time desc limit 1) as melding,
      (select max(d.start_time) from cron.job_run_details d where d.jobid=j.jobid) as laatste_run
    from cron.job j where j.active and j.jobname <> 'bg-gezondheid-dagelijks'
  loop
    insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values (v_tijd, r.jobname, 'cron',
      case when r.laatste_run is null then 'fout'
           when r.laatste_status <> 'succeeded' then 'fout'
           when r.schedule ~ '^\d+ \d+ \* \* \*$' and r.laatste_run < now() - interval '26 hours' then 'fout'
           when r.laatste_run < now() - interval '74 hours' then 'waarschuwing'
           else 'ok' end,
      case when r.laatste_run is null then 'nog nooit gedraaid'
           when r.laatste_status <> 'succeeded' then 'laatste run faalde: '||r.melding
           else 'laatste run '||to_char(r.laatste_run at time zone 'Europe/Amsterdam','DD-MM HH24:MI') end,
      jsonb_build_object('schedule',r.schedule,'laatste_run',r.laatste_run));
  end loop;

  for r in
    select distinct on (a.functie) a.functie, a.aangeroepen_op, h.status_code, left(coalesce(h.content,''),200) as inhoud, h.timed_out
    from bg_functie_aanroep a left join net._http_response h on h.id = a.request_id
    where a.aangeroepen_op > now() - interval '26 hours'
    order by a.functie, a.aangeroepen_op desc
  loop
    insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values (v_tijd, r.functie, 'edge-function',
      case when r.status_code between 200 and 299 and r.inhoud not like '%"ok":false%' and r.inhoud not like '%"error"%' then 'ok'
           when r.status_code is null then 'waarschuwing' else 'fout' end,
      coalesce('HTTP '||r.status_code||': '||r.inhoud, case when r.timed_out then 'time-out' else 'nog geen antwoord' end),
      jsonb_build_object('aangeroepen_op', r.aangeroepen_op));
  end loop;

  for r in
    select source, count(*) filter (where status='PASS') as pass, count(*) filter (where status<>'PASS') as fail, max(created_at) as laatst
    from brain_delivery_evidence where created_at > now() - interval '26 hours' group by source
  loop
    insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values (v_tijd, r.source, 'bewijs', case when r.fail>0 and r.pass=0 then 'fout' when r.fail>0 then 'waarschuwing' else 'ok' end,
      r.pass||' geslaagd, '||r.fail||' mislukt', jsonb_build_object('laatst',r.laatst));
  end loop;

  insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  select v_tijd, t.naam, 'versheid',
    case when t.laatst is null then 'fout' when t.laatst < now() - t.max_leeftijd then 'fout' when t.laatst < now() - t.max_leeftijd/2 then 'waarschuwing' else 'ok' end,
    coalesce('laatst bijgewerkt '||to_char(t.laatst at time zone 'Europe/Amsterdam','DD-MM HH24:MI'),'leeg'),
    jsonb_build_object('max_leeftijd',t.max_leeftijd::text)
  from (values
    ('website-events', (select max(created_at) from growth_events), interval '12 hours'),
    ('social-posts (Buffer)', (select max(updated_at) from social_posts), interval '48 hours'),
    ('post-kenmerken (Notion)', (select max(updated_at) from social_posts where hook_type is not null), interval '72 hours'),
    ('schrijfregels', (select max(bijgewerkt_op) from bg_schrijfregels), interval '96 hours'),
    ('zoekprestaties (Search Console)', (select max(opgehaald_op) from bg_zoekprestaties), interval '72 hours'),
    ('connecties', (select max(bijgewerkt_op) from bg_connecties), interval '96 hours'),
    ('waardehorizons', (select max(d.end_time) from cron.job_run_details d join cron.job j using (jobid) where j.jobname='brain-outcome-horizon-hourly-v1' and d.status='succeeded'), interval '3 hours')
  ) as t(naam, laatst, max_leeftijd);

  return query select g.onderdeel, g.soort, g.status, g.detail from bg_gezondheid g where g.gemeten_op = v_tijd order by (g.status='ok'), g.soort, g.onderdeel;
end $$;
revoke all on function public.bg_gezondheid_meten() from public, anon, authenticated;

select cron.alter_job(j.jobid, command := format('select public.bg_roep_functie(%L);', v.f))
from (values ('bg-buffer-sync-daily','bg-buffer-sync'),('bg-analytics-sync-daily','bg-analytics-sync-composio'),('bg-native-content-generate-daily','bg-native-content-generate'),('bg-notion-sync-daily','bg-notion-sync'),('bg-gsc-sync-daily','bg-gsc-sync')) v(n,f)
join cron.job j on j.jobname = v.n;

select cron.schedule('bg-gezondheid-dagelijks', '45 5 * * *', 'select count(*) from public.bg_gezondheid_meten();');