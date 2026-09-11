create or replace view intern.bg_brein_status as
with cron_last as (
  select j.jobname,
         max(d.start_time) filter (where d.status='succeeded') as laatst_gelukt,
         max(d.start_time) as laatste_run,
         (array_agg(d.status order by d.start_time desc))[1] as laatste_status,
         (array_agg(left(d.return_message,160) order by d.start_time desc))[1] as laatste_melding
  from cron.job j left join cron.job_run_details d on d.jobid=j.jobid and d.start_time>now()-interval '7 days'
  where j.active group by j.jobname
),
ev as (
  select component_id, max(created_at) filter (where status='GREEN') as laatst_groen, max(created_at) filter (where status='RED') as laatst_rood
  from public.brain_delivery_evidence where created_at>now()-interval '14 days' group by component_id
)
select * from (values
  ('Nachtelijke jobs (alle)', 'pg_cron', (select min(laatst_gelukt) from cron_last where laatste_run is not null), 26,
     (select count(*) from cron_last where laatste_status is distinct from 'succeeded' and laatste_run is not null) = 0,
     (select string_agg(jobname||': '||coalesce(laatste_melding,laatste_status),' | ') from cron_last where laatste_status is distinct from 'succeeded' and laatste_run is not null)),
  ('Posts en metrics (Buffer)', 'bg-buffer-sync', (select max(updated_at) from public.social_posts), 36, null::boolean, null::text),
  ('Postkenmerken uit Notion', 'bg-notion-sync', (select laatst_groen from ev where component_id='bg-notion-sync'), 36, null, null),
  ('Search Console', 'bg-gsc-sync', (select max(opgehaald_op) from public.bg_zoekprestaties), 36, null, null),
  ('Schrijfregels', 'bg_content_lessen', (select max(bijgewerkt_op) from public.bg_schrijfregels), 96, null, null),
  ('Kanaalteksten genereren', 'bg-native-content-generate', (select laatst_groen from ev where component_id='bg-native-content-generate'), 72, null, null),
  ('Website-events (mensen)', 'growth-datahub-ingest', (select max(created_at) from public.growth_events where not coalesce(is_robot,false)), 12, null, null),
  ('Connectie-dagselectie', 'bg_connecties_dagselectie', (select max(bijgewerkt_op) from public.bg_connecties), 96, null, null),
  ('Waardehorizons', 'brain_run_due_value_evaluations', (select laatst_gelukt from cron_last where jobname='brain-outcome-horizon-hourly-v1'), 3, null, null),
  ('Omzet-leerlaag', 'powerhouse-runtime', (select laatst_gelukt from cron_last where jobname='powerhouse-daily-revenue-growth'), 26, null, null)
) as t(onderdeel, bron, laatst_bewezen, max_uren, extra_ok, toelichting);

create or replace view intern.bg_brein_status_oordeel as
select onderdeel, bron, laatst_bewezen,
  round((extract(epoch from now()-laatst_bewezen)/3600.0)::numeric,1) as uren_geleden, max_uren,
  case when laatst_bewezen is null then 'NOOIT_BEWEZEN'
       when coalesce(extra_ok,true)=false then 'FOUT'
       when now()-laatst_bewezen > make_interval(hours=>max_uren) then 'VEROUDERD'
       else 'WERKT' end as oordeel,
  toelichting
from intern.bg_brein_status;
revoke all on intern.bg_brein_status, intern.bg_brein_status_oordeel from public, anon, authenticated;

create or replace function intern.bg_brein_zelfbewaking()
returns jsonb language plpgsql security definer set search_path='' as $$
declare r record; n int := 0; uur text := to_char(date_trunc('hour', now()),'YYYY-MM-DD"T"HH24');
begin
  for r in select * from intern.bg_brein_status_oordeel where oordeel <> 'WERKT' loop
    perform public.brain_observe_failure(
      'zelfbewaking:'||r.bron||':'||uur,
      'brein-status|'||r.bron||'|'||r.oordeel,
      md5(coalesce(r.toelichting,'')||r.oordeel),
      jsonb_build_object('onderdeel',r.onderdeel,'oordeel',r.oordeel,'laatst_bewezen',r.laatst_bewezen,'uren_geleden',r.uren_geleden,'max_uren',r.max_uren,'toelichting',r.toelichting,'bron','intern.bg_brein_zelfbewaking'));
    n := n+1;
  end loop;
  return jsonb_build_object('gecontroleerd',(select count(*) from intern.bg_brein_status_oordeel),'niet_werkend',n,'tijd',now());
end $$;
revoke all on function intern.bg_brein_zelfbewaking() from public, anon, authenticated;
comment on function intern.bg_brein_zelfbewaking() is 'Elk uur: elk onderdeel dat niet aantoonbaar werkt komt als failure in brain_failure_registry (vervangt Make BG166/BG82). Aangelegd 10 sept 2026.';
select cron.schedule('brein-zelfbewaking-uurlijks', '37 * * * *', 'select intern.bg_brein_zelfbewaking();');