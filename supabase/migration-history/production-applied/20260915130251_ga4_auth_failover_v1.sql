-- GA4 auth failover v1
-- Keep the existing canonical collector; increase repair cadence so an auth failure can
-- recover through the evidence-bound fallback lane without creating a parallel store.

do $$
begin
  if exists(select 1 from pg_extension where extname='pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname='bg-analytics-sync-daily';
    perform cron.unschedule(jobid) from cron.job where jobname='bg-analytics-sync-6h-v1';
    perform cron.schedule(
      'bg-analytics-sync-6h-v1',
      '5 */6 * * *',
      'select public.bg_roep_functie(''bg-analytics-sync-composio'');'
    );
  end if;
end $$;

insert into public.powerhouse_runtime_events(
  dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at
)
values(
  'ga4-auth-failover-v1:activation',
  'ga4_failover_contract_activated',
  'bg-analytics-sync-composio',
  'ga4-analytics',
  'website',
  now(),
  jsonb_build_object(
    'contract','ga4-auth-failover-v1',
    'primary_route','google-analytics-data-api',
    'fallback_route','windsor-googleanalytics4',
    'fallback_trigger','AUTH only',
    'schedule','5 */6 * * *',
    'truth_boundary','only observed GA4 rows or a freshness-bounded verified Windsor readback can keep the source green'
  ),
  jsonb_build_object(
    'canonical_collector','bg-analytics-sync-composio',
    'canonical_tables',jsonb_build_array('bg_ga4_csv_batches','bg_ga4_sync'),
    'no_parallel_store',true
  ),
  'decided','verified',1,now()
)
on conflict (dedupe_key) do update
set evidence=excluded.evidence,context=excluded.context,state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();
