-- Existing Powerhouse source registry owner drift: canonical GA4 collector only.
-- No new scheduler, source, event, permission or freshness-state write.
-- The original AFTER INSERT/UPDATE trigger on bg_ga4_csv_batches remains
-- solely responsible for independently observed, nonempty GA4 evidence.
do $ga4_owner$
declare
  prior_owner text;
begin
  select owner_component into prior_owner
    from public.powerhouse_evidence_sources
   where source_key='ga4-analytics'
   for update;
  if not found then
    raise exception 'GA4_SOURCE_REGISTRY_ENTRY_MISSING';
  end if;
  if prior_owner not in ('bg-ga4-sync','bg-analytics-sync-composio') then
    raise exception 'GA4_UNEXPECTED_SOURCE_OWNER: %', prior_owner;
  end if;
  update public.powerhouse_evidence_sources
     set owner_component='bg-analytics-sync-composio',
         updated_at=now()
   where source_key='ga4-analytics'
     and owner_component='bg-ga4-sync';
end
$ga4_owner$;
