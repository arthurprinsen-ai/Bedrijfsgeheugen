-- Original SEO evidence -> original #175 daily source -> original ONE BRAIN #140
-- -> existing commercial Heartbeat. A derived observation is not provider traffic.
-- Protected source admission only; no additional scheduler, direct production SQL,
-- historical replay, duplicate collector or new grant/RLS.
DO $seo_derived_original_handoff$
DECLARE
  v_before text;
  v_after text;
  v_marker constant text := E' UNION ALL\n SELECT ''technical_seo_audit'',';
  v_addition constant text := $derived_union$
 UNION ALL
 -- DERIVED SEO decisions have their own provider-neutral observation lineage.
 SELECT 'seo_opportunity_intelligence',
   jsonb_build_object(
     'source_observation_rows',count(o.observation_id),
     'forecast_receipts',coalesce(sum(
       CASE WHEN jsonb_typeof(o.evidence->'forecasts_written')='number'
            THEN (o.evidence->>'forecasts_written')::int ELSE 0 END),0),
     'owner_handoff_receipts',coalesce(sum(
       CASE WHEN jsonb_typeof(o.evidence->'owner_handoffs_written')='number'
            THEN (o.evidence->>'owner_handoffs_written')::int ELSE 0 END),0),
     'not_provider_search_or_traffic',true),
   jsonb_build_object(
     'authority','powerhouse_evidence_source_observations',
     'original_source_key','seo-opportunity-intelligence',
     'derived_intelligence_not_provider_evidence',true,
     'source_revision',md5(coalesce(string_agg(
        o.observation_id::text||':'||o.observed_at::text||':'||md5(o.evidence::text),
        ',' ORDER BY o.observation_id::text),'')),
     'producer_receipt_required',true,
     'independent_cro_execution_and_effect_still_required',true),
   max(o.observed_at),
   CASE WHEN count(o.observation_id)>0
     THEN 'DERIVED_SEO_OPPORTUNITY_OBSERVED'
     ELSE 'MISSING_DERIVED_SEO_OPPORTUNITY' END
 FROM public.powerhouse_evidence_source_observations o
 WHERE o.source_key='seo-opportunity-intelligence'
   AND o.observed_at>=v_start AND o.observed_at<v_end
 UNION ALL
 SELECT 'technical_seo_audit',$derived_union$;
BEGIN
  -- Fail closed on drift or misregistered source; this is the ORIGINAL writer.
  IF NOT EXISTS (
    SELECT 1 FROM public.powerhouse_evidence_sources
    WHERE source_key='seo-opportunity-intelligence'
      AND source_class='projection' AND required=false
      AND writer_contract='powerhouse-seo-opportunity-resolver-v1'
      AND owner_component='powerhouse-seo-opportunity-resolver'
  ) THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_DERIVED_SOURCE_OWNER_DRIFT'
      USING errcode='23514';
  END IF;
  SELECT pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure)
    INTO v_before;
  IF v_before IS NULL
    OR position(v_marker IN v_before)=0
    OR position(v_marker IN substring(v_before FROM position(v_marker IN v_before)+length(v_marker)))>0
    OR position('seo_opportunity_intelligence' IN v_before)>0
  THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_ARCHIVE_DEFINITION_DRIFT'
      USING errcode='23514';
  END IF;
  v_after:=replace(v_before,v_marker,v_addition);
  IF v_after=v_before OR
     position('seo_opportunity_intelligence' IN v_after)=0 OR
     position('MISSING_DERIVED_SEO_OPPORTUNITY' IN v_after)=0 OR
     position('DERIVED_SEO_OPPORTUNITY_OBSERVED' IN v_after)=0 THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_ARCHIVE_PATCH_INCOMPLETE'
      USING errcode='23514';
  END IF;
  EXECUTE v_after;
  IF position('seo_opportunity_intelligence'
       IN pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure))=0
  THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_ARCHIVE_READBACK_FAILED'
      USING errcode='23514';
  END IF;
END
$seo_derived_original_handoff$;
