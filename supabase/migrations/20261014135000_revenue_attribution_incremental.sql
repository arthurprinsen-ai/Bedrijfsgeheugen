-- Transactional rolling reconciliation: no global truncate or full-table delete.
-- This is a rolling window, not CDC; older corrected outcomes require backfill.
BEGIN;
CREATE OR REPLACE FUNCTION public.powerhouse_refresh_revenue_attribution_incremental_v1(
  p_since timestamptz DEFAULT now() - interval '14 days'
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO pg_catalog, public
AS $fn$
DECLARE
  v_upserted integer := 0;
  v_removed integer := 0;
  v_now timestamptz := clock_timestamp();
BEGIN
  IF p_since IS NULL OR p_since > v_now THEN
    RAISE EXCEPTION 'INVALID_INCREMENTAL_WINDOW';
  END IF;
  IF NOT pg_try_advisory_xact_lock(hashtextextended('powerhouse-revenue-attribution-snapshot-v1',0)) THEN
    RETURN jsonb_build_object('state','SKIPPED_OVERLAP','window_start',p_since);
  END IF;
  CREATE TEMP TABLE revenue_delta_stage ON COMMIT DROP AS
    SELECT outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,opportunity_key,person_key,company_key,revenue_eur,attribution_weight,attributed_revenue_eur,is_first_touch,is_conversion_touch,attribution_model,attribution_confidence,evidence FROM public.powerhouse_revenue_attribution_v2
    WHERE conversion_at >= p_since;
  INSERT INTO public.powerhouse_revenue_attribution_snapshot_v1 (outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,opportunity_key,person_key,company_key,revenue_eur,attribution_weight,attributed_revenue_eur,is_first_touch,is_conversion_touch,attribution_model,attribution_confidence,evidence,refreshed_at)
  SELECT outcome_id,touch_type,touch_id,touch_at,conversion_at,channel,campaign_key,content_key,opportunity_key,person_key,company_key,revenue_eur,attribution_weight,attributed_revenue_eur,is_first_touch,is_conversion_touch,attribution_model,attribution_confidence,evidence,v_now FROM pg_temp.revenue_delta_stage
  WHERE true -- disambiguate INSERT SELECT from the following ON CONFLICT clause
  ON CONFLICT(outcome_id,touch_type,touch_id) DO UPDATE SET
    touch_at=excluded.touch_at,
    conversion_at=excluded.conversion_at,
    channel=excluded.channel,
    campaign_key=excluded.campaign_key,
    content_key=excluded.content_key,
    opportunity_key=excluded.opportunity_key,
    person_key=excluded.person_key,
    company_key=excluded.company_key,
    revenue_eur=excluded.revenue_eur,
    attribution_weight=excluded.attribution_weight,
    attributed_revenue_eur=excluded.attributed_revenue_eur,
    is_first_touch=excluded.is_first_touch,
    is_conversion_touch=excluded.is_conversion_touch,
    attribution_model=excluded.attribution_model,
    attribution_confidence=excluded.attribution_confidence,
    evidence=excluded.evidence,
    refreshed_at=excluded.refreshed_at
  WHERE (public.powerhouse_revenue_attribution_snapshot_v1.touch_at,public.powerhouse_revenue_attribution_snapshot_v1.conversion_at,public.powerhouse_revenue_attribution_snapshot_v1.channel,public.powerhouse_revenue_attribution_snapshot_v1.campaign_key,public.powerhouse_revenue_attribution_snapshot_v1.content_key,public.powerhouse_revenue_attribution_snapshot_v1.opportunity_key,public.powerhouse_revenue_attribution_snapshot_v1.person_key,public.powerhouse_revenue_attribution_snapshot_v1.company_key,public.powerhouse_revenue_attribution_snapshot_v1.revenue_eur,public.powerhouse_revenue_attribution_snapshot_v1.attribution_weight,public.powerhouse_revenue_attribution_snapshot_v1.attributed_revenue_eur,public.powerhouse_revenue_attribution_snapshot_v1.is_first_touch,public.powerhouse_revenue_attribution_snapshot_v1.is_conversion_touch,public.powerhouse_revenue_attribution_snapshot_v1.attribution_model,public.powerhouse_revenue_attribution_snapshot_v1.attribution_confidence,public.powerhouse_revenue_attribution_snapshot_v1.evidence)
        IS DISTINCT FROM (excluded.touch_at,excluded.conversion_at,excluded.channel,excluded.campaign_key,excluded.content_key,excluded.opportunity_key,excluded.person_key,excluded.company_key,excluded.revenue_eur,excluded.attribution_weight,excluded.attributed_revenue_eur,excluded.is_first_touch,excluded.is_conversion_touch,excluded.attribution_model,excluded.attribution_confidence,excluded.evidence);
  GET DIAGNOSTICS v_upserted=ROW_COUNT;
  DELETE FROM public.powerhouse_revenue_attribution_snapshot_v1 s
  WHERE s.conversion_at >= p_since AND NOT EXISTS (
    SELECT 1 FROM pg_temp.revenue_delta_stage d
    WHERE d.outcome_id=s.outcome_id
      AND d.touch_type=s.touch_type AND d.touch_id=s.touch_id
  );
  GET DIAGNOSTICS v_removed=ROW_COUNT;
  RETURN jsonb_build_object('contract','powerhouse-revenue-attribution-rolling-v1',
    'state','WINDOW_PUBLISHED_ATOMICALLY','window_start',p_since,
    'upserted_rows',v_upserted,'removed_rows',v_removed,'refreshed_at',v_now);
END;
$fn$;
REVOKE ALL ON FUNCTION public.powerhouse_refresh_revenue_attribution_incremental_v1(timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_refresh_revenue_attribution_incremental_v1(timestamptz) TO postgres;
-- Replace only the attribution lane, not the independent commercial schedules.
SELECT cron.schedule('powerhouse-runtime-isolated-revenue-attribution-snapshot',
  '4,19,34,49 * * * *',
  'select public.powerhouse_refresh_revenue_attribution_incremental_v1()');
COMMIT;
