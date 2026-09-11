update public.bg_externe_signalen set deadline_post_notion_id='dubbel:https://www.bouwendnederland.nl/nieuws/algemeen/tot-1250-subsidie-voor-je-cyberweerbaarheidsmaatregel' where domein='dagelijksestandaard.nl' and deadline='2026-11-30';
select cron.schedule('bg-bedrijfsnieuws-werkdagen', '20 6 * * 1-5', $c$select net.http_post(url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-bedrijfsnieuws', body := '{}'::jsonb, headers := '{"content-type":"application/json"}'::jsonb, timeout_milliseconds := 150000);$c$);

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
  ('Zoekwoordkansen (DataForSEO)', 'bg-zoekwoordkansen', (select laatst_groen from ev where component_id='bg-zoekwoordkansen'), 192, null, null),
  ('Externe signalen (Tavily)', 'bg-externe-signalen', (select laatst_groen from ev where component_id='bg-externe-signalen'), 36, null, null),
  ('Kansenradar', 'bg-kansenradar', (select laatst_groen from ev where component_id='bg-kansenradar'), 36, null, null),
  ('Bedrijfsnieuws connecties', 'bg-bedrijfsnieuws', (select laatst_groen from ev where component_id='bg-bedrijfsnieuws'), 96, null, null),
  ('Schrijfregels', 'bg_content_lessen', (select max(bijgewerkt_op) from public.bg_schrijfregels), 96, null, null),
  ('Kanaalteksten genereren', 'bg-native-content-generate', (select laatst_groen from ev where component_id='bg-native-content-generate'), 72, null, null),
  ('Website-events (mensen)', 'growth-datahub-ingest', (select max(created_at) from public.growth_events where not coalesce(is_robot,false)), 12, null, null),
  ('Connectie-dagselectie', 'bg_connecties_dagselectie', (select max(bijgewerkt_op) from public.bg_connecties), 96, null, null),
  ('Waardehorizons', 'brain_run_due_value_evaluations', (select laatst_gelukt from cron_last where jobname='brain-outcome-horizon-hourly-v1'), 3, null, null),
  ('Omzet-leerlaag', 'powerhouse-runtime', (select laatst_gelukt from cron_last where jobname='powerhouse-daily-revenue-growth'), 26, null, null)
) as t(onderdeel, bron, laatst_bewezen, max_uren, extra_ok, toelichting);
revoke all on intern.bg_brein_status from public, anon, authenticated;