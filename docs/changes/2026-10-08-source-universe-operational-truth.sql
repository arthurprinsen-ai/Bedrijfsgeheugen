-- Read-only operational truth for Source Universe. Never equate catalog presence with live ingestion.
-- Run with service-side SQL access; no tenant data is selected.
with catalog as (
 select
   count(*)::integer as registered,
   count(*) filter (where active)::integer as active,
   count(*) filter (where activation_mode='PUBLIC_ALWAYS')::integer as public_sources,
   count(*) filter (where activation_mode='CONNECTOR_REQUIRED')::integer as connector_required,
   count(*) filter (where activation_mode='PROVIDER_REQUIRED')::integer as provider_required,
   count(*) filter (where availability_state='LIVE')::integer as marked_live,
   count(*) filter (where availability_state='STALE')::integer as marked_stale,
   count(*) filter (where last_observed_at is not null)::integer as observed_ever,
   count(*) filter (where last_observed_at >= now()-interval '24 hours')::integer as observed_24h,
   count(*) filter (where availability_state='LIVE' and last_observed_at is null)::integer as live_without_observation
 from public.powerhouse_intelligence_source_catalog_v1
), impacts as (
 select
   count(*)::integer as company_impacts,
   count(*) filter (where status='READY' and impact_score is not null)::integer as ready_scored,
   count(*) filter (where estimated_value_eur is not null or estimated_loss_eur is not null)::integer as monetary_estimates,
   count(*) filter (where (estimated_value_eur is not null or estimated_loss_eur is not null)
     and (evidence is null or evidence='{}'::jsonb))::integer as monetary_without_evidence
 from public.powerhouse_intelligence_company_impact_v1
)
select now() as checked_at,catalog.*,impacts.*,
 case
  when catalog.live_without_observation>0 or impacts.monetary_without_evidence>0 then 'GUARD_FAILURE'
  when catalog.observed_24h=0 then 'NO_RECENT_SOURCE_EVIDENCE'
  when impacts.ready_scored=0 then 'INGESTION_PRESENT_IMPACT_NOT_PROVEN'
  else 'IMPACT_PRESENT_VERIFY_ACTION_AND_OUTCOME'
 end as evidence_state
from catalog cross join impacts;
