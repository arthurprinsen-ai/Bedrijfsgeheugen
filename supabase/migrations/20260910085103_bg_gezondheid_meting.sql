create table if not exists public.bg_gezondheid (
  id bigint generated always as identity primary key,
  gemeten_op timestamptz not null default now(),
  onderdeel text not null,
  soort text not null,
  status text not null check (status in ('ok','waarschuwing','fout')),
  detail text,
  gegevens jsonb not null default '{}'::jsonb
);
create index if not exists bg_gezondheid_tijd on public.bg_gezondheid (gemeten_op desc);
alter table public.bg_gezondheid enable row level security;
comment on table public.bg_gezondheid is 'Dagelijkse gezondheidsmeting van het brein: cron-jobs, Edge Functions en versheid van data. Vervangt de Make-bewaking (BG 82/150/159). Aangelegd 10 sept 2026.';

create or replace function public.bg_gezondheid_meten()
returns table(onderdeel text, soort text, status text, detail text)
language plpgsql
security definer
set search_path = public, cron
as $$
declare
  v_tijd timestamptz := now();
  r record;
begin
  for r in
    select j.jobname, j.schedule,
      (select d.status from cron.job_run_details d where d.jobid=j.jobid order by d.start_time desc limit 1) as laatste_status,
      (select left(coalesce(d.return_message,''),200) from cron.job_run_details d where d.jobid=j.jobid order by d.start_time desc limit 1) as melding,
      (select max(d.start_time) from cron.job_run_details d where d.jobid=j.jobid) as laatste_run
    from cron.job j where j.active
  loop
    insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values (v_tijd, r.jobname, 'cron',
      case when r.laatste_run is null then 'fout'
           when r.laatste_status <> 'succeeded' then 'fout'
           when r.schedule like '% * * *' and r.schedule not like '%* * * * *' and r.laatste_run < now() - interval '26 hours' and r.schedule not like '%1-5' then 'fout'
           when r.laatste_run < now() - interval '74 hours' then 'waarschuwing'
           else 'ok' end,
      case when r.laatste_run is null then 'nog nooit gedraaid'
           when r.laatste_status <> 'succeeded' then 'laatste run faalde: '||r.melding
           else 'laatste run '||to_char(r.laatste_run at time zone 'Europe/Amsterdam','DD-MM HH24:MI') end,
      jsonb_build_object('schedule',r.schedule,'laatste_run',r.laatste_run));
  end loop;

  for r in
    select substring(c.command from 'functions/v1/([a-z0-9-]+)') as functie
    from cron.job c where c.active and c.command like '%net.http_post%functions/v1/%'
  loop
    insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    select v_tijd, r.functie, 'edge-function',
      case when x.status_code between 200 and 299 and coalesce(x.content,'') not like '%"ok":false%' then 'ok'
           when x.status_code is null then 'waarschuwing' else 'fout' end,
      coalesce('HTTP '||x.status_code||': '||left(x.content,180),'geen antwoord gevonden in de laatste 26 uur'),
      '{}'::jsonb
    from (select 1) one
    left join lateral (
      select h.status_code, h.content from net._http_response h
      where h.created > now() - interval '26 hours' and h.content like '%' and h.id in (
        select h2.id from net._http_response h2 order by h2.id desc limit 500)
      and exists (select 1)
      order by h.id desc limit 1
    ) x on false;
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
    ('waardehorizons', (select max(end_time) from cron.job_run_details d join cron.job j using (jobid) where j.jobname='brain-outcome-horizon-hourly-v1' and d.status='succeeded'), interval '3 hours')
  ) as t(naam, laatst, max_leeftijd);

  return query select g.onderdeel, g.soort, g.status, g.detail from bg_gezondheid g where g.gemeten_op = v_tijd order by (g.status='ok'), g.soort, g.onderdeel;
end;
$$;
revoke all on function public.bg_gezondheid_meten() from public, anon, authenticated;
grant execute on function public.bg_gezondheid_meten() to service_role;

create or replace view public.bg_gezondheid_nu with (security_invoker = true) as
select distinct on (onderdeel, soort) onderdeel, soort, status, detail, gemeten_op
from public.bg_gezondheid order by onderdeel, soort, gemeten_op desc;