-- ORIGINAL #175 -> ONE BRAIN #140: align ONE global owned SEO source tenant.
-- The authoritative public.powerhouse_seo_keyword_intelligence_v1 was established
-- with tenant_id='canonical' on 2026-09-30. Daily archive incorrectly reads only
-- tenant_id='bedrijfsgeheugen', which has zero rows. This migration does not
-- relabel existing rows, create tables or add a scheduler. Keep all other real
-- original source consumers and security grants unchanged.
--
-- Immutable history remains untouched. Existing source_revision and mutable
-- consumer ACK reconciliation remain owned by the 20261112194500 contract.

DO $tenant_canonical_only_keyword_projection$
DECLARE
  v_before text;
  v_after text;
  v_old constant text := 'WHERE k.tenant_id=''bedrijfsgeheugen'' AND k.observed_at>=v_start AND k.observed_at<v_end';
  v_new constant text := 'WHERE k.tenant_id=''canonical'' AND k.observed_at>=v_start AND k.observed_at<v_end';
BEGIN
  SELECT pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure)
    INTO v_before;
  IF v_before IS NULL OR position(v_old IN v_before)=0 OR
     position(v_old IN substring(v_before FROM position(v_old IN v_before)+length(v_old)))>0 THEN
    RAISE EXCEPTION 'KEYWORD_TENANT_SOURCE_DEFINITION_DRIFT: original #175 expected exactly one keyword tenant predicate'
      USING errcode='23514';
  END IF;
  v_after:=replace(v_before,v_old,v_new);
  IF v_after=v_before OR position(v_old IN v_after)>0 OR position(v_new IN v_after)=0 THEN
    RAISE EXCEPTION 'KEYWORD_TENANT_SOURCE_DEFINITION_DRIFT: replacement unsafe'
      USING errcode='23514';
  END IF;
  EXECUTE v_after;
  IF position(v_new IN pg_get_functiondef('public.powerhouse_daily_source_archive_v1(date)'::regprocedure))=0 THEN
    RAISE EXCEPTION 'KEYWORD_TENANT_SOURCE_READBACK_FAILED'
      USING errcode='23514';
  END IF;
END
$tenant_canonical_only_keyword_projection$;
