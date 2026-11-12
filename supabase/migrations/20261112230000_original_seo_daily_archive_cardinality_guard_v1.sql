-- P0 original Powerhouse #175 daily archive: existing derived SEO source is the ninth
-- archive projection. The old exact-eight guard rejects this valid one-owner extension.
-- Preserve the existing function and its ownership, grants, RLS, schedule and source rows.
-- Future additive sources may increase the count; the derived source must still be present.
DO $original_seo_archive_cardinality_guard$
DECLARE
  v_before text;
  v_after text;
  v_old constant text := 'IF v_manifest IS NULL OR v_saved<>8 THEN';
  v_new constant text := $guard$
IF v_manifest IS NULL OR v_saved<9 OR
   NOT EXISTS (
     SELECT 1 FROM public.powerhouse_growth_source_daily_v1
     WHERE tenant_id='bedrijfsgeheugen'
       AND metric_date=p_day
       AND source_key='seo_opportunity_intelligence'
   ) THEN$guard$;
BEGIN
  SELECT pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure)
    INTO v_before;
  IF v_before IS NULL
    OR position(v_old IN v_before)=0
    OR position(v_old IN substring(v_before FROM position(v_old IN v_before)+length(v_old)))>0
    OR position('seo_opportunity_intelligence' IN v_before)=0
    OR position('DERIVED_SEO_OPPORTUNITY_OBSERVED' IN v_before)=0
  THEN
    RAISE EXCEPTION 'ORIGINAL_SEO_ARCHIVE_CARDINALITY_SOURCE_DRIFT'
      USING errcode='23514';
  END IF;

  v_after:=replace(v_before,v_old,v_new);
  IF v_after=v_before OR position(v_new IN v_after)=0
     OR position(v_old IN v_after)>0 THEN
    RAISE EXCEPTION 'ORIGINAL_SEO_ARCHIVE_CARDINALITY_REWRITE_FAILED'
      USING errcode='23514';
  END IF;
  EXECUTE v_after;
  IF position(v_new IN
      pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure))=0
  THEN
    RAISE EXCEPTION 'ORIGINAL_SEO_ARCHIVE_CARDINALITY_READBACK_FAILED'
      USING errcode='23514';
  END IF;
END
$original_seo_archive_cardinality_guard$;
