-- Canonical Powerhouse Data Intake & Learning Spine v1.
-- Production migration applied 2026-09-15. Reuses bg_gezondheid and powerhouse_runtime_events.

select cron.alter_job(
  (select jobid from cron.job where jobname='bg-analytics-sync-daily' limit 1),
  active := true
);

create or replace function public.bg_gezondheid_meten()
returns table(onderdeel text, soort text, status text, detail text)
language plpgsql
security definer
set search_path to 'public','cron','net'
as $function$
declare v_tijd timestamptz := now(); r record;
begin
  for r in
    select j.jobname,j.schedule,
      (select d.status from cron.job_run_details d where d.jobid=j.jobid order by d.start_time desc limit 1) as laatste_status,
      (select left(coalesce(d.return_message,''),200) from cron.job_run_details d where d.jobid=j.jobid order by d.start_time desc limit 1) as melding,
      (select max(d.start_time) from cron.job_run_details d where d.jobid=j.jobid) as laatste_run
    from cron.job j where j.active and j.jobname<>'bg-gezondheid-dagelijks'
  loop
    insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values(v_tijd,r.jobname,'cron',
      case when r.laatste_run is null then 'fout'
           when r.laatste_status<>'succeeded' then 'fout'
           when r.schedule~'^\d+ \d+ \* \* \*$' and r.laatste_run<now()-interval '26 hours' then 'fout'
           when r.laatste_run<now()-interval '74 hours' then 'waarschuwing' else 'ok' end,
      case when r.laatste_run is null then 'nog nooit gedraaid'
           when r.laatste_status<>'succeeded' then 'laatste run faalde: '||r.melding
           else 'laatste run '||to_char(r.laatste_run at time zone 'Europe/Amsterdam','DD-MM HH24:MI') end,
      jsonb_build_object('schedule',r.schedule,'laatste_run',r.laatste_run));
  end loop;

  for r in
    select distinct on(a.functie) a.functie,a.aangeroepen_op,h.status_code,left(coalesce(h.content,''),200) as inhoud,h.timed_out
    from bg_functie_aanroep a left join net._http_response h on h.id=a.request_id
    where a.aangeroepen_op>now()-interval '26 hours'
    order by a.functie,a.aangeroepen_op desc
  loop
    insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values(v_tijd,r.functie,'edge-function',
      case when r.status_code between 200 and 299 and r.inhoud not like '%"ok":false%' and r.inhoud not like '%"error"%' then 'ok'
           when r.status_code is null then 'waarschuwing' else 'fout' end,
      coalesce('HTTP '||r.status_code||': '||r.inhoud,case when r.timed_out then 'time-out' else 'nog geen antwoord' end),
      jsonb_build_object('aangeroepen_op',r.aangeroepen_op));
  end loop;

  insert into bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  select v_tijd,t.naam,'versheid',
    case when t.required_activity and t.laatst is null then 'fout'
         when t.laatst is null then 'ok'
         when t.laatst<now()-t.max_leeftijd then 'fout'
         when t.laatst<now()-t.max_leeftijd/2 then 'waarschuwing' else 'ok' end,
    case when t.laatst is null and not t.required_activity then 'geen recente activiteit; toegestaan voor event-driven bron'
         else coalesce('laatst bijgewerkt '||to_char(t.laatst at time zone 'Europe/Amsterdam','DD-MM HH24:MI'),'leeg') end,
    jsonb_build_object('max_leeftijd',t.max_leeftijd::text,'required_activity',t.required_activity,'contract','powerhouse-data-intake-learning-spine-v1')
  from (values
    ('website-events',(select max(ge.created_at) from growth_events ge),interval '24 hours',false),
    ('social-posts (Buffer)',(select max(sp.updated_at) from social_posts sp),interval '48 hours',false),
    ('buffer-sync',(select max(bs.uitgevoerd_op) from bg_buffer_sync bs where bs.status='ok'),interval '6 hours',true),
    ('ga4-analytics',(select max(gs.uitgevoerd_op) from bg_ga4_sync gs where gs.status in('ok','partial')),interval '48 hours',true),
    ('zoekprestaties (Search Console)',(select max(zp.opgehaald_op) from bg_zoekprestaties zp),interval '72 hours',true),
    ('externe-signalen',(select max(es.opgehaald_op) from bg_externe_signalen es),interval '36 hours',true),
    ('post-kenmerken (Notion)',(select max(sp2.updated_at) from social_posts sp2 where sp2.hook_type is not null),interval '72 hours',false),
    ('schrijfregels',(select max(sr.bijgewerkt_op) from bg_schrijfregels sr),interval '96 hours',true),
    ('connecties',(select max(c.bijgewerkt_op) from bg_connecties c),interval '96 hours',false),
    ('runtime-events',(select max(pre.created_at) from powerhouse_runtime_events pre),interval '6 hours',true),
    ('social-learning',(select max(sl.updated_at) from social_learnings sl),interval '96 hours',false),
    ('revenue-learning',(select max(rl.updated_at) from revenue_learnings rl),interval '96 hours',false),
    ('forecast-calibration',(select max(fc.measured_at) from powerhouse_forecast_calibration fc),interval '48 hours',false),
    ('growth-outcomes',(select max(go2.created_at) from growth_outcomes go2),interval '720 hours',false),
    ('sales-outcomes',(select max(so2.created_at) from powerhouse_sales_outcomes so2),interval '720 hours',false),
    ('waardehorizons',(select max(d.end_time) from cron.job_run_details d join cron.job j using(jobid) where j.jobname='brain-outcome-horizon-hourly-v1' and d.status='succeeded'),interval '3 hours',true)
  ) as t(naam,laatst,max_leeftijd,required_activity);

  insert into powerhouse_runtime_events(dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence)
  select 'source-health:'||replace(lower(g.onderdeel),' ','-')||':'||to_char(v_tijd at time zone 'Europe/Amsterdam','YYYY-MM-DD-HH24'),
    'source_health_evaluated','bg_gezondheid_meten',g.onderdeel,'system',v_tijd,
    jsonb_build_object('status',g.status,'detail',g.detail,'soort',g.soort),
    jsonb_build_object('contract','powerhouse-data-intake-learning-spine-v1'),
    case when g.status='ok' then 'observed' else 'error' end,
    case when g.status='ok' then 'OBSERVED' else 'DEGRADED' end,
    case when g.status='ok' then 1.0 else 0.5 end
  from bg_gezondheid g where g.gemeten_op=v_tijd and g.soort='versheid'
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,state=excluded.state,
    data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  return query
  select g.onderdeel,g.soort,g.status,g.detail
  from bg_gezondheid g where g.gemeten_op=v_tijd
  order by(g.status='ok'),g.soort,g.onderdeel;
end
$function$;
