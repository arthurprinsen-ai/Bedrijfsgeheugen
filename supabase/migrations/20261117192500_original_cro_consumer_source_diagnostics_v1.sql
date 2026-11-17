-- Original source revision and scheduled #140 consumer are preserved.
-- Exact-source guard prevents clobbering a concurrently updated canonical function.
DO $guard$ BEGIN
 IF md5(pg_get_functiondef('public.powerhouse_daily_source_consume_v1(date)'::regprocedure)) <> '0f08b2e3dc972498a5298e10e3e7e71c'
 THEN RAISE EXCEPTION 'CRO_CONSUMER_ORIGINAL_SOURCE_CHANGED_REVIEW_REQUIRED'; END IF;
END $guard$;
CREATE OR REPLACE FUNCTION public.powerhouse_daily_source_consume_v1(p_day date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
 v_day date:=(now() at time zone 'Europe/Amsterdam')::date;
 v_manifest jsonb; v_hash text; v_brain public.brain_obligations%rowtype;
 v_views bigint:=0; v_cta bigint:=0; v_leads bigint:=0; v_gaps int:=0; v_source_count int:=0;
 v_posts_live bigint:=0; v_posts_numeric bigint:=0; v_posts_total bigint:=0;
 v_accepted boolean:=false; v_action text; v_report jsonb; v_now timestamptz:=now();
 v_cro jsonb:='{}'::jsonb; v_cro_state text:='UNVERIFIED';
 v_cro_error text:=null;
 v_cro_hour text:=to_char(now() at time zone 'UTC','YYYY-MM-DD"T"HH24');
BEGIN
 IF p_day<v_day-2 OR p_day>v_day THEN
   RAISE EXCEPTION 'SOURCE_CONSUMER_DAY_OUT_OF_BOUNDS' USING errcode='22023';
 END IF;
 SELECT * INTO v_brain FROM public.brain_obligations
 WHERE obligation_type='GROWTH_SOURCE_DAILY_HANDOFF'
 AND capability_id='website-seo-dataforseo-ai-cro'
 AND business_entity='bedrijfsgeheugen.nl:bedrijfsgeheugen'
 AND business_period=p_day::text AND business_timezone='Europe/Amsterdam'
 FOR UPDATE;

 SELECT jsonb_agg(jsonb_build_object(
   'source_key',source_key,'quality',quality,'observed_at',source_observed_at,
   'metrics',metrics,'raw_source_revision',evidence->>'source_revision',
   'authority',evidence->>'authority') ORDER BY source_key),
   count(*)::int,
   count(*) FILTER(WHERE quality LIKE 'MISSING%' OR quality LIKE 'PUBLICATION_UNVERIFIED%' OR quality='PARTIAL_POST_METRICS'
       OR quality='AWAITING_PROVIDER')::int
 INTO v_manifest,v_source_count,v_gaps
 FROM public.powerhouse_growth_source_daily_v1
 WHERE tenant_id='bedrijfsgeheugen' AND metric_date=p_day;

 IF v_manifest IS NOT NULL THEN
   v_hash:=encode(sha256(convert_to(v_manifest::text,'UTF8')),'hex');
 END IF;
 v_accepted:=v_brain.id IS NOT NULL AND v_manifest IS NOT NULL
             AND v_source_count>=8
             AND v_brain.evidence->>'source_revision'=v_hash
             AND v_brain.payload_sha256=coalesce(
               v_brain.evidence->>'original_identity_sha256',v_brain.payload_sha256)
             AND v_brain.state='OPEN';

 SELECT coalesce((metrics->>'page_views')::bigint,0),
        coalesce((metrics->>'cta_clicks')::bigint,0),
        coalesce((metrics->>'leads')::bigint,0)
 INTO v_views,v_cta,v_leads
 FROM public.powerhouse_growth_source_daily_v1
 WHERE tenant_id='bedrijfsgeheugen' AND metric_date=p_day
   AND source_key='website_page_cro' AND quality='OBSERVED';
 IF NOT FOUND THEN v_views:=0;v_cta:=0;v_leads:=0;END IF;

 -- Original post rows join the same immutable BRAIN source revision.
 SELECT coalesce((metrics->>'provider_live_proven')::bigint,0),
        coalesce((metrics->>'posts_with_numeric_linked_provider_metrics')::bigint,0),
        coalesce((metrics->>'original_post_obligations')::bigint,0)
 INTO v_posts_live,v_posts_numeric,v_posts_total
 FROM public.powerhouse_growth_source_daily_v1
 WHERE tenant_id='bedrijfsgeheugen' and metric_date=p_day
   and source_key='posts_publication_and_metrics';
 IF NOT FOUND THEN v_posts_live:=0;v_posts_numeric:=0;v_posts_total:=0;END IF;
 -- Existing original ONE BRAIN / CRO consumer observes all three live source
 -- diagnostics; no second scheduler, collector, sender or data store.
 BEGIN
   SELECT jsonb_build_object(
     'site',(SELECT jsonb_build_object(
       'pages_7d',count(*),
       'low_consented_sample_pages',count(*) FILTER (WHERE evidence_status='LOW_CONSENTED_SAMPLE'),
       'cta_mapping_gap_pages',count(*) FILTER (WHERE cta_mapping_gap_signal),
       'last_event_at',max(last_event_at),
       'next_safe_action',CASE WHEN count(*) FILTER(WHERE cta_mapping_gap_signal)>0
         THEN 'AUDIT_ORIGINAL_CTA_MAPPING_AND_CONSENT'
         ELSE 'CHECK_CONSENTED_SAMPLE_BEFORE_CONTROLLED_TEST' END)
       FROM public.powerhouse_cro_site_signal_v1),
     'social',(SELECT jsonb_build_object(
       'post_metrics_7d',count(*),
       'partial_metric_scope_posts',count(*) FILTER(WHERE evidence_status IN
         ('PARTIAL_SCOPE_NO_COMPARABLE_IMPRESSIONS','DISTRIBUTION_METRIC_UNAVAILABLE')),
       'last_provider_observed_at',max(provider_observed_at),
       'next_safe_action','RECHECK_ORIGINAL_PROVIDER_METRIC_SCOPE_AND_CONTROL')
       FROM public.powerhouse_cro_post_signal_v1),
     'email',(SELECT jsonb_build_object(
       'strategies',count(*),
       'historical_reported_sends',sum(reported_sends),
       'verified_send_readbacks_7d',max(verified_send_readbacks_7d),
       'last_learning_recomputed_at',max(stats_updated_at),
       'active_suppressions',max(active_suppressions),
       'next_safe_action',CASE WHEN coalesce(max(verified_send_readbacks_7d),0)=0
         THEN 'RESTORE_ORIGINAL_AUTHORIZED_EMAIL_PROVIDER_READBACK'
         ELSE 'RECONCILE_ORIGINAL_EMAIL_LEARNING_AND_TEST_WITH_CONTROL' END)
       FROM public.powerhouse_cro_email_signal_v1),
     'truth','SOURCE_ONLY_NO_EXECUTED_EXPERIMENT_OR_REVENUE')
   INTO v_cro;
   v_cro_state:='SOURCE_DIAGNOSTICS_READBACK';
 EXCEPTION WHEN OTHERS THEN
   v_cro_state:='SOURCE_READBACK_UNVERIFIED';
   v_cro_error:=sqlstate;
   v_cro:='{}'::jsonb;
 END;
 v_action:=CASE
   WHEN NOT v_accepted THEN 'SOURCE_REVISION_MISMATCH_OR_PRODUCER_MISSING_RETRY_ORIGINAL_175'
   WHEN v_views>=10 AND v_cta=0 THEN 'PROPOSE_REVERSIBLE_CTA_VISIBILITY_VALUE_PROP_AB_TEST'
   WHEN v_views>=10 AND v_cta>0 AND v_leads=0 THEN 'PROPOSE_REVERSIBLE_CONTACT_FORM_FRICTION_AB_TEST'
   ELSE 'CONTINUE_SOURCE_BACKED_CRO_MEASUREMENT' END;
 IF v_brain.id IS NOT NULL AND v_brain.state='OPEN' THEN
   UPDATE public.brain_obligations SET
      evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
       'stage',CASE WHEN v_accepted THEN 'ORIGINAL_BRAIN_INPUT_ACCEPTED_WAIT_CRO_OUTCOME'
                    ELSE 'SOURCE_REVISION_MISMATCH_RETRY' END,
       'consumer_ack',jsonb_build_object('accepted',v_accepted,
           'consumed_revision',CASE WHEN v_accepted THEN v_hash ELSE null END,
           'consumed_at',CASE WHEN v_accepted THEN v_now ELSE null END,
           'consumer','original powerhouse-content-orchestrator-140'),
       'analysis',jsonb_build_object(
          'source_revision',v_hash,'source_count',v_source_count,
          'incomplete_sources',v_gaps,'observed_page_views',v_views,
          'observed_cta_clicks',v_cta,'observed_leads',v_leads,
          'original_post_obligations',v_posts_total,'provider_live_posts',v_posts_live,
          'posts_with_verified_numeric_metrics',v_posts_numeric,
          'post_optimization_recommendation',case
            when not v_accepted then 'WAIT_CORRECT_BRAIN_SOURCE_REVISION'
            when v_posts_live=0 then 'WAIT_PROVEN_ORIGINAL_PROVIDER_POST'
            when v_posts_numeric<v_posts_live then 'COLLECT_SOURCE_LINKED_PROVIDER_POST_METRICS'
            else 'PROPOSE_REVERSIBLE_POST_HOOK_CTA_HOLDOUT_TEST' end,
          'recommended_safe_action',v_action,
          'cro_diagnostic_readback',jsonb_build_object(
             'status',v_cro_state,'checked_hour_utc',v_cro_hour,
             'observations',v_cro,'failure_sqlstate',v_cro_error,
             'effect_verified',false),
          'actual_cro_experiment_executed',false,
          'causal_lift_or_revenue_proven',false),
       'next_action',v_action,
       'experiment_state','PROPOSED_OR_WAITING_NOT_EXECUTED',
       'heartbeat_consumer_expected',true),
      updated_at=v_now,version=version+1
   WHERE id=v_brain.id AND state='OPEN'
   AND (evidence#>>'{consumer_ack,consumed_revision}' IS DISTINCT FROM v_hash
       OR evidence#>>'{analysis,recommended_safe_action}' IS DISTINCT FROM v_action
       OR evidence#>>'{analysis,cro_diagnostic_readback,checked_hour_utc}' IS DISTINCT FROM v_cro_hour
       OR evidence#>>'{analysis,cro_diagnostic_readback,status}' IS DISTINCT FROM v_cro_state
       OR (evidence#>>'{consumer_ack,accepted}')::boolean IS DISTINCT FROM v_accepted);
 END IF;

 v_report:=jsonb_build_object('contract','original-daily-growth-source-one-loop-v1',
   'source_day',p_day,'tenant_id','bedrijfsgeheugen','consumer_accepted',v_accepted,
   'consumer_source_revision',CASE WHEN v_accepted THEN v_hash ELSE null END,
   'source_rows',v_source_count,'missing_or_unverified_sources',v_gaps,
   'next_safe_cro_action',v_action,
   'cro_diagnostic_readback',jsonb_build_object(
      'status',v_cro_state,'checked_hour_utc',v_cro_hour,
      'observations',v_cro,'failure_sqlstate',v_cro_error,
      'effect_verified',false),
   'provider_live_posts',v_posts_live,
   'posts_with_verified_numeric_metrics',v_posts_numeric,'independent_source_rechecked',true,
   'actual_experiment_not_claimed',true,'outcome_and_learning_still_pending',true);
 INSERT INTO public.powerhouse_runtime_events(
 dedupe_key,event_type,source,subject_key,channel,occurred_at,
 evidence,context,state,data_quality,confidence,updated_at)
 VALUES('original-growth-source-consumer:'||p_day,
 'original_daily_growth_source_consumer','powerhouse-content-orchestrator-140',
 'bedrijfsgeheugen.nl','website',v_now,v_report,
 jsonb_build_object('original_producer','powerhouse-growth-source-175',
  'original_consumer','ONE BRAIN + Heartbeat #140','source_day',p_day,'no_new_schedule',true),
 CASE WHEN v_accepted THEN 'observed' ELSE 'error' END,
 CASE WHEN v_accepted AND v_gaps=0 AND v_cro_state='SOURCE_DIAGNOSTICS_READBACK' THEN 'VERIFIED' ELSE 'PARTIAL' END,
 CASE WHEN v_accepted THEN 1 ELSE 0.4 END,v_now)
 ON CONFLICT(dedupe_key) DO UPDATE SET occurred_at=excluded.occurred_at,
 evidence=excluded.evidence,context=excluded.context,state=excluded.state,
 data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=v_now;
 RETURN v_report;
END;
$function$
;

-- Preserve production's service-role-only contract for this SECURITY DEFINER.
REVOKE EXECUTE ON FUNCTION public.powerhouse_daily_source_consume_v1(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_daily_source_consume_v1(date) TO service_role;
