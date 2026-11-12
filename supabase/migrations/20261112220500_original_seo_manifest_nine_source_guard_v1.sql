-- Exact original #175 archive contract reconciliation following protected SEO
-- derived-source addition (version 20261112214500). Production readback proved
-- nine original source rows but original hard-coded v_saved<>8 fail-closed.
-- Change ONLY the count gate; never bypass it, backfill false evidence, or
-- introduce another scheduler/consumer/writer/grant/RLS/SQL table.
DO $original_seo_nine_source_count$
DECLARE
  v_before text;
  v_after text;
  v_old constant text := 'IF v_manifest IS NULL OR v_saved<>8 THEN';
  v_new constant text := 'IF v_manifest IS NULL OR v_saved<>9 THEN';
BEGIN
  IF NOT EXISTS(
    SELECT 1 FROM public.powerhouse_evidence_sources
    WHERE source_key='seo-opportunity-intelligence'
      AND source_class='projection'
      AND owner_component='powerhouse-seo-opportunity-resolver'
      AND writer_contract='powerhouse-seo-opportunity-resolver-v1'
  ) THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_NINE_SOURCE_OWNER_DRIFT' USING errcode='23514';
  END IF;
  SELECT pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure)
    INTO v_before;
  IF v_before IS NULL
    OR position('seo_opportunity_intelligence' IN v_before)=0
    OR position('DERIVED_SEO_OPPORTUNITY_OBSERVED' IN v_before)=0
    OR position('MISSING_DERIVED_SEO_OPPORTUNITY' IN v_before)=0
    OR position(v_old IN v_before)=0
    OR position(v_old IN substring(v_before FROM position(v_old IN v_before)+length(v_old)))>0
    OR position(v_new IN v_before)>0 THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_NINE_SOURCE_COUNT_DEFINITION_DRIFT'
      USING errcode='23514';
  END IF;
  v_after:=replace(v_before,v_old,v_new);
  IF v_after=v_before OR position(v_old IN v_after)>0 OR position(v_new IN v_after)=0 THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_NINE_SOURCE_COUNT_PATCH_INCOMPLETE'
      USING errcode='23514';
  END IF;
  EXECUTE v_after;
  IF position(v_new IN pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure))=0 THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_NINE_SOURCE_COUNT_READBACK_FAILED'
      USING errcode='23514';
  END IF;
END
$original_seo_nine_source_count$;
