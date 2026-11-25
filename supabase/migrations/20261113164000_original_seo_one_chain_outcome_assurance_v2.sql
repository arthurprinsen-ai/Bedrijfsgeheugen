-- P0 #4198 - same original SEO opportunity resolver assurance owner; no second
-- scheduler, publisher, collector, writer, schema, RLS, grants or background jobs.
-- The old guard was TRUE for a recommendation/forecast even when the actual
-- source-to-Brain-to-CRO-to-outcome transfer remained OPEN. Fail closed.
-- Keep existing function signature, SECURITY DEFINER ACL and current cron path.
CREATE OR REPLACE FUNCTION public.powerhouse_refresh_seo_assurance_v1(
    p_now timestamptz DEFAULT now())
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public','pg_catalog'
AS $function$
DECLARE
  v_date date;
  v_recs bigint := 0;
  v_forecasts bigint := 0;
  v_keyword_count bigint := 0;
  v_keyword_observed_at timestamptz;
  v_source_rows bigint := 0;
  v_missing_sources bigint := 0;
  v_original public.brain_obligations%ROWTYPE;
  v_original_found boolean := false;
  v_source_revision text;
  v_ack_revision text;
  v_source_received boolean := false;
  v_ack_exact boolean := false;
  v_execution_proven boolean := false;
  v_measurement_proven boolean := false;
  v_outcome_proven boolean := false;
  v_learning_proven boolean := false;
  v_guard boolean := false;
  v_proof jsonb;
  v_stage text;
  v_stage_pass boolean;
BEGIN
  IF p_now IS NULL THEN
    RAISE EXCEPTION 'SEO_ONE_CHAIN_OBSERVATION_TIME_REQUIRED'
      USING ERRCODE='22023';
  END IF;
  v_date := (p_now AT TIME ZONE 'Europe/Amsterdam')::date;

  SELECT count(*) INTO v_recs
  FROM public.powerhouse_content_recommendations
  WHERE run_date=v_date
    AND lower(coalesce(evidence->>'contract','')) LIKE '%seo%';

  SELECT count(*) INTO v_forecasts
  FROM public.powerhouse_forecasts
  WHERE created_at >= (date_trunc('day',p_now AT TIME ZONE 'Europe/Amsterdam')
    AT TIME ZONE 'Europe/Amsterdam')
    AND lower(coalesce(evidence->>'contract','')) LIKE '%seo%';

  -- Provider-intelligence tenant is 'canonical'; daily business archive tenant
  -- is 'bedrijfsgeheugen'. These namespaces must not be confused.
  SELECT count(*),max(observed_at)
    INTO v_keyword_count,v_keyword_observed_at
  FROM public.powerhouse_seo_keyword_intelligence_v1
  WHERE tenant_id='canonical'
    AND observed_at <= p_now
    AND observed_at >= p_now-interval '7 days';

  SELECT count(*),
    count(*) FILTER(WHERE
      quality LIKE 'MISSING%'
      OR quality LIKE 'STALE%'
      OR quality LIKE 'AWAITING%'
      OR quality='EMPTY_SOURCE_BATCH')
    INTO v_source_rows,v_missing_sources
  FROM public.powerhouse_growth_source_daily_v1
  WHERE tenant_id='bedrijfsgeheugen' AND metric_date=v_date
    AND source_key IN ('search_console','ga4','technical_seo_audit',
      'seo_keyword_provider','website_page_cro','website_release_readback');

  SELECT * INTO v_original
  FROM public.brain_obligations
  WHERE obligation_type='GROWTH_SOURCE_DAILY_HANDOFF'
    AND capability_id='website-seo-dataforseo-ai-cro'
    AND business_entity='bedrijfsgeheugen.nl:bedrijfsgeheugen'
    AND business_period=v_date::text
    AND business_timezone='Europe/Amsterdam'
  ORDER BY version DESC,updated_at DESC
  LIMIT 1;
  v_original_found := FOUND;

  IF v_original_found THEN
    v_source_revision := nullif(v_original.evidence->>'source_revision','');
    v_ack_revision := nullif(v_original.evidence#>>'{consumer_ack,consumed_revision}','');
    v_source_received := v_source_revision ~ '^[0-9a-f]{64}$'
      AND nullif(v_original.evidence->>'producer_observed_at','') IS NOT NULL
      AND coalesce(v_original.evidence->>'tenant_id','')='bedrijfsgeheugen';
    v_ack_exact := v_source_received
      AND v_ack_revision=v_source_revision
      AND v_original.evidence#>>'{analysis,source_revision}'=v_source_revision
      AND v_original.evidence#>>'{consumer_ack,accepted}'='true'
      AND v_original.evidence#>>'{consumer_ack,consumer}'
         ='original powerhouse-content-orchestrator-140';

    -- Neither suggested content nor a finished cron is a site deployment.
    -- Require independent exact deployment evidence and the original
    -- corresponding production action, not a self-reported 'done' label.
    v_execution_proven := v_ack_exact
      AND v_original.evidence->>'optimization_status'='LIVE_PROVEN'
      AND v_original.evidence#>>'{execution,production_readback,verified}'='true'
      AND nullif(v_original.evidence#>>'{execution,production_readback,deploy_sha}','') IS NOT NULL
      AND nullif(v_original.evidence#>>'{execution,production_readback,canonical_url}','') IS NOT NULL;

    -- Measured results must refer to the same original change lineage.
    v_measurement_proven := v_execution_proven
      AND v_original.evidence#>>'{measurement,independent_source_verified}'='true'
      AND nullif(v_original.evidence#>>'{measurement,source_event_id}','') IS NOT NULL
      AND v_original.evidence#>>'{measurement,source_revision}'=v_source_revision;

    v_outcome_proven := v_measurement_proven
      AND v_original.evidence#>>'{analysis,causal_lift_or_revenue_proven}'='true'
      AND v_original.evidence->>'causal_lift_proven'='true'
      AND nullif(v_original.evidence#>>'{measurement,experiment_or_paid_receipt_id}','') IS NOT NULL;

    v_learning_proven := v_outcome_proven
      AND v_original.evidence#>>'{learning,next_original_run_readback_verified}'='true'
      AND nullif(v_original.evidence#>>'{learning,learning_id}','') IS NOT NULL
      AND nullif(v_original.evidence#>>'{learning,next_original_run_id}','') IS NOT NULL;
  END IF;

  -- NULL from missing optional JSON evidence must fail CLOSED, not leak into
  -- a nullable guard/pass or an ambiguous UI status.
  v_source_received := coalesce(v_source_received,false);
  v_ack_exact := coalesce(v_ack_exact,false);
  v_execution_proven := coalesce(v_execution_proven,false);
  v_measurement_proven := coalesce(v_measurement_proven,false);
  v_outcome_proven := coalesce(v_outcome_proven,false);
  v_learning_proven := coalesce(v_learning_proven,false);

  v_guard := (v_recs>0 OR v_forecasts>0)
    AND v_keyword_count>0
    AND v_source_rows>=6
    AND v_missing_sources=0
    AND v_ack_exact AND v_execution_proven
    AND v_measurement_proven AND v_outcome_proven AND v_learning_proven
    AND v_original_found AND v_original.state='FULFILLED';

  v_guard := coalesce(v_guard,false);

  v_proof := jsonb_build_object(
    'contract','powerhouse-seo-opportunity-resolver-v2-exact-original-handoff',
    'date',v_date,
    'tenant_id','bedrijfsgeheugen',
    'original_owner','Powerhouse #175 -> ONE BRAIN/Heartbeat #140',
    'original_obligation_id',CASE WHEN v_original_found THEN v_original.id ELSE NULL END,
    'original_state',CASE WHEN v_original_found THEN v_original.state ELSE 'MISSING' END,
    'source_revision',v_source_revision,
    'consumer_ack_revision',v_ack_revision,
    'source_received',v_source_received,
    'consumer_ack_exact',v_ack_exact,
    'execution_proven',v_execution_proven,
    'measurement_proven',v_measurement_proven,
    'outcome_proven',v_outcome_proven,
    'learning_next_run_proven',v_learning_proven,
    'recommendations_today',v_recs,
    'forecasts_today',v_forecasts,
    'keyword_rows_7d',v_keyword_count,
    'keyword_last_observed_at',v_keyword_observed_at,
    'daily_source_rows',v_source_rows,
    'incomplete_critical_sources',v_missing_sources,
    'ack_is_not_processed',true,
    'no_duplicate_publisher_or_scheduler',true,
    'evidence_basis','original obligation + exact consumer revision + production readback + independent measurement + applied learning'
  );

  -- Same existing receipt registry and same original scheduler. A fresh
  -- guard receipt cannot be GREEN merely from planned recommendations.
  FOREACH v_stage IN ARRAY ARRAY['action','readback','outcome',
                                 'measurement','learning','guard'] LOOP
    v_stage_pass := CASE v_stage
      WHEN 'action' THEN v_execution_proven
      WHEN 'readback' THEN v_execution_proven
      WHEN 'measurement' THEN v_measurement_proven
      WHEN 'outcome' THEN v_outcome_proven
      WHEN 'learning' THEN v_learning_proven
      ELSE v_guard END;
    PERFORM public.powerhouse_record_loop_stage_v1(
      'seo-opportunity-resolver',v_stage,
      v_proof || jsonb_build_object('pass',v_stage_pass,'stage',v_stage),
      p_now);
  END LOOP;

  RETURN v_proof || jsonb_build_object(
    'ok',true,'pass',v_guard,
    'state',CASE WHEN v_guard THEN 'PROVEN_ONE_CHAIN'
                 WHEN NOT v_source_received THEN 'WAIT_ORIGINAL_SOURCE'
                 WHEN NOT v_ack_exact THEN 'WAIT_EXACT_CONSUMER_ACK'
                 WHEN NOT v_execution_proven THEN 'WAIT_PRODUCTION_ACTION'
                 WHEN NOT v_measurement_proven THEN 'WAIT_INDEPENDENT_MEASUREMENT'
                 WHEN NOT v_outcome_proven THEN 'WAIT_CAUSAL_OR_PAID_OUTCOME'
                 WHEN NOT v_learning_proven THEN 'WAIT_LEARNING_NEXT_RUN'
                 ELSE 'WAIT_SOURCE_COMPLETENESS_OR_TERMINAL_PROOF' END);
END;
$function$;

-- Production currently grants only postgres and service_role. Reassert the
-- same non-browser boundary on this SECURITY DEFINER replacement; never expose
-- the assurance function to PUBLIC, anon or authenticated.
REVOKE ALL ON FUNCTION public.powerhouse_refresh_seo_assurance_v1(timestamptz)
  FROM PUBLIC, anon, authenticated;

-- Preserve production's existing restricted service role execution. Production
-- ACL readback: postgres=X, service_role=X, anon=false, authenticated=false.
-- Revoke any inherited/default PUBLIC and browser rights on replacement.
REVOKE ALL ON FUNCTION public.powerhouse_refresh_seo_assurance_v1(timestamptz)
  FROM PUBLIC, anon, authenticated;

-- Migration-time contract check. This only inspects the function definition,
-- never manufactures a production receipt or closes an original obligation.
DO $assert$
DECLARE
  v_def text;
BEGIN
  SELECT pg_get_functiondef('public.powerhouse_refresh_seo_assurance_v1(timestamptz)'::regprocedure)
    INTO v_def;
  IF v_def IS NULL
    OR position('consumer_ack_exact' IN v_def)=0
    OR position('WAIT_PRODUCTION_ACTION' IN v_def)=0
    OR position('learning_next_run_proven' IN v_def)=0
    OR position('original_obligation_id' IN v_def)=0
    OR position('v_original.state=''FULFILLED''' IN v_def)=0
  THEN
    RAISE EXCEPTION 'SEO_ONE_CHAIN_GUARD_MIGRATION_READBACK_FAILED'
      USING ERRCODE='23514';
  END IF;
END;
$assert$;