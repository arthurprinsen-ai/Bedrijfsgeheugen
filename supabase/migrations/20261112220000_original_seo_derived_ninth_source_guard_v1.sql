-- Repair original #175 nine-row source archive after protected derived SEO #837.
-- No new scheduler, table, provider, grant or historical migration replay.
-- This patch is only admitted when the native existing archived procedure has
-- exactly one old eight-row guard and its verified derived source already exists.
DO $original_seo_nine_source_guard$
DECLARE
  v_before text;
  v_after text;
  v_old constant text := 'v_saved<>8';
  v_new constant text := 'v_saved<>9';
BEGIN
  SELECT pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure)
    INTO v_before;
  IF v_before IS NULL
    OR position('seo_opportunity_intelligence' IN v_before)=0
    OR position('DERIVED_SEO_OPPORTUNITY_OBSERVED' IN v_before)=0
    OR position('MISSING_DERIVED_SEO_OPPORTUNITY' IN v_before)=0
    OR (length(v_before)-length(replace(v_before,v_old,'')))<>length(v_old)
    OR position(v_new IN v_before)>0 THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_NINE_SOURCE_GUARD_PRECONDITION_FAILED'
      USING errcode='23514';
  END IF;
  v_after:=replace(v_before,v_old,v_new);
  IF v_after=v_before OR position(v_old IN v_after)>0
    OR position(v_new IN v_after)=0 THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_NINE_SOURCE_GUARD_PATCH_FAILED'
      USING errcode='23514';
  END IF;
  EXECUTE v_after;
  IF position(v_new IN pg_get_functiondef(
    'public.powerhouse_daily_source_archive_v1(date)'::regprocedure))=0
    OR position('seo_opportunity_intelligence' IN pg_get_functiondef(
    'public.powerhouse_daily_source_archive_v1(date)'::regprocedure))=0 THEN
    RAISE EXCEPTION 'SEO_ORIGINAL_NINE_SOURCE_GUARD_READBACK_FAILED'
      USING errcode='23514';
  END IF;
END
$original_seo_nine_source_guard$;
