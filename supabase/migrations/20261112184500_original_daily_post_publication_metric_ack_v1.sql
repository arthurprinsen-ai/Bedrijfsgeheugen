-- Original daily post source: existing #175 -> ONE BRAIN #140 -> Heartbeat.
-- Two original source tenants only, no extra publisher/cron, no synthetic engagements.
CREATE OR REPLACE FUNCTION public.powerhouse_daily_source_archive_v1(p_day date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
DECLARE
 v_start timestamptz:=p_day::timestamp at time zone 'Europe/Amsterdam';
 v_end timestamptz:=(p_day+1)::timestamp at time zone 'Europe/Amsterdam';
 v_now timestamptz:=now();
 v_saved int:=0; v_source_count int:=0; v_gap int:=0;
 v_manifest jsonb; v_revision text; v_result jsonb;
BEGIN
 IF p_day<date '2025-01-01' OR p_day>(v_now at time zone 'Europe/Amsterdam')::date THEN
   RAISE EXCEPTION 'INVALID_DAILY_SOURCE_DATE' USING errcode='22023';
 END IF;

 -- Original provider facts are immutable in their authoritative source
 -- tables. The daily rows are reproducible aggregates, never substitutions.
 WITH s AS (
 SELECT 'dataforseo_provider_activity'::text source_key,
   jsonb_build_object('provider_runs',count(o.observation_id),
     'reported_found',coalesce(sum(case when jsonb_typeof(o.evidence->'found')='number' then (o.evidence->>'found')::int else 0 end),0),
     'reported_allowed',coalesce(sum(case when jsonb_typeof(o.evidence->'allowed')='number' then (o.evidence->>'allowed')::int else 0 end),0),
     'plan_limited_runs',count(*) filter(where o.evidence::text like '%UPSTREAM_PLAN_LIMIT%')) metrics,
   jsonb_build_object('authority','powerhouse_evidence_source_observations',
      'original_source_key','dataforseo-intelligence',
      'source_revision',md5(coalesce(string_agg(o.observation_id::text,',' order by o.observation_id::text),'')),
      'provider_diagnostic_is_not_keyword_volume',true) evidence,
   max(o.observed_at) observed_at,
   case when count(o.observation_id)>0 then 'PROVIDER_DIAGNOSTIC_ONLY' else 'MISSING_PROVIDER_ACTIVITY' end quality
 FROM public.powerhouse_evidence_source_observations o
 WHERE o.source_key='dataforseo-intelligence' AND o.observed_at>=v_start AND o.observed_at<v_end
 UNION ALL
 SELECT 'seo_keyword_provider',
   jsonb_build_object('keyword_rows',count(k.keyword),'keywords_with_volume',count(k.keyword) filter(where k.search_volume is not null),
     'nl_keywords',count(k.keyword) filter(where k.locale='nl'),'en_keywords',count(k.keyword) filter(where k.locale='en')),
   jsonb_build_object('authority','powerhouse_seo_keyword_intelligence_v1',
      'source_revision',md5(coalesce(string_agg(k.keyword,',' order by k.keyword),'')),
      'missing_is_not_zero_search_demand',true),
   max(k.observed_at),
   case when count(k.keyword)>0 then 'PROVIDER_KEYWORDS_OBSERVED' else 'MISSING_PROVIDER_KEYWORDS' end
 FROM public.powerhouse_seo_keyword_intelligence_v1 k
 WHERE k.tenant_id='bedrijfsgeheugen' AND k.observed_at>=v_start AND k.observed_at<v_end
 UNION ALL
 SELECT 'external_intelligence',
   jsonb_build_object('stored_observations',count(o.observation_id),
     'allowed_signals',count(o.observation_id) filter(where o.evidence->>'allowed'='true'),
     'rejected_signals',count(o.observation_id) filter(where o.evidence->>'allowed'='false')),
   jsonb_build_object('authority','powerhouse_evidence_source_observations',
      'original_source_key','external-intelligence',
      'source_revision',md5(coalesce(string_agg(o.observation_id::text,',' order by o.observation_id::text),'')),
      'rejected_signals_not_actionable',true),
   max(o.observed_at),
   case when count(o.observation_id)>0 then 'OBSERVED_WITH_FILTERING' else 'MISSING_EXTERNAL_SIGNALS' end
 FROM public.powerhouse_evidence_source_observations o
 WHERE o.source_key='external-intelligence' AND o.observed_at>=v_start AND o.observed_at<v_end
 UNION ALL
 SELECT 'website_page_cro',
   jsonb_build_object('pages',count(p.canonical),'page_views',coalesce(sum(p.page_views),0),
     'cta_clicks',coalesce(sum(p.cta_clicks),0),'leads',coalesce(sum(p.leads),0),
     'qualified_leads',coalesce(sum(p.qualified_leads),0),'won_orders',coalesce(sum(p.won_orders),0)),
   jsonb_build_object('authority','growth_page_daily',
      'source_revision',md5(coalesce(string_agg(p.canonical||':'||p.updated_at::text,',' order by p.canonical),'')),
      'low_sample_does_not_prove_causal_failure',true),
   max(p.updated_at),
   case when count(p.canonical)>0 then 'OBSERVED' else 'MISSING_PAGE_ANALYTICS' end
 FROM public.growth_page_daily p WHERE p.day=p_day
 UNION ALL
 SELECT 'blog_publication',
   jsonb_build_object('source_publication_rows',count(c.content_id),
     'live_proven',count(c.content_id) filter(where
       c.status in('LIVE_PROVEN','MEASURED','LEARNED') AND c.live_proven_at is not null
       AND c.canonical_url like 'https://www.bedrijfsgeheugen.nl/blog/%'),
     'unverified',count(c.content_id) filter(where c.live_proven_at is null)),
   jsonb_build_object('authority','content_publication_obligations','channel','blog',
      'source_revision',md5(coalesce(string_agg(coalesce(c.content_id,'')||':'||
         coalesce(c.status,'')||':'||coalesce(c.live_proven_at::text,''),',' order by c.content_id),'')),
      'publication_not_traffic_or_revenue_proof',true),
   max(c.live_proven_at),
   case when count(c.content_id) filter(where c.status in('LIVE_PROVEN','MEASURED','LEARNED')
     AND c.live_proven_at is not null
     AND c.canonical_url like 'https://www.bedrijfsgeheugen.nl/blog/%')>0 then 'LIVE_PROVEN'
        when count(c.content_id)>0 then 'PUBLICATION_UNVERIFIED' else 'MISSING_PUBLICATION' end
 FROM public.content_publication_obligations c
 WHERE c.tenant_id='canonical' AND c.channel='blog' AND c.publication_date=p_day
 UNION ALL
 SELECT 'ai_content_recommendations',
   jsonb_build_object('source_recommendations',count(r.recommendation_id),
     'suggested',count(r.recommendation_id) filter(where r.status='suggested'),
     'accepted',count(r.recommendation_id) filter(where r.status='accepted'),
     'done',count(r.recommendation_id) filter(where r.status='done')),
   jsonb_build_object('authority','powerhouse_content_recommendations',
      'source_revision',md5(coalesce(string_agg(r.recommendation_id::text,',' order by r.recommendation_id::text),'')),
      'recommendation_not_execution_or_ai_model_validation',true),
   max(r.updated_at),
   case when count(r.recommendation_id)>0 then 'RECOMMENDATIONS_STORED' else 'MISSING_AI_RECOMMENDATIONS' end
 FROM public.powerhouse_content_recommendations r WHERE r.run_date=p_day

 UNION ALL
 -- Original post sources span canonical personal and bedrijfsgeheugen company.
 -- Original published receipts are separate from independently observed metrics.
 SELECT 'posts_publication_and_metrics',
   jsonb_build_object('original_post_obligations',c.total,
     'provider_live_proven',c.live,
     'unverified_or_pending_posts',c.total-c.live,
     'linkedin_company_live',c.company,
     'linkedin_personal_live',c.personal,
     'instagram_live',c.ig,
     'registered_first_party_posts',p.registered,
     'registered_posts_with_provider_ids',p.linked,
     'provider_post_metric_snapshots',m.snapshots,
     'posts_with_numeric_linked_provider_metrics',m.verified,
     'post_metric_coverage_missing',greatest(c.live-m.verified,0)),
   jsonb_build_object('authority',jsonb_build_array('content_publication_obligations','social_posts','social_metric_snapshots'),
     'original_source_tenants',jsonb_build_array('canonical','bedrijfsgeheugen'),
     'source_revision',md5(coalesce(c.rev,'')||':'||coalesce(p.rev,'')||':'||coalesce(m.rev,'')),
     'provider_id_plus_original_live_readback_required',true,
     'observed_at_not_historical_window',true,
     'unobserved_metrics_not_zero',true,
     'original_single_publisher_only',true),
   greatest(c.last_live,p.last_post,m.last_metric),
   case when c.live=0 and (c.total>0 or p.registered>0) then 'PUBLICATION_UNVERIFIED'
        when c.total=0 and p.registered=0 then 'MISSING_POST_PUBLICATION'
        when c.live>0 and m.verified=0 then 'MISSING_POST_METRICS'
        when c.live>m.verified then 'PARTIAL_POST_METRICS'
        else 'LIVE_AND_PROVIDER_METRICS_OBSERVED' end
 FROM (
    select count(*)::int total,
      count(*) filter(where status in('LIVE_PROVEN','MEASURED','LEARNED') and live_proven_at is not null and external_id is not null and canonical_url is not null)::int live,
      count(*) filter(where channel='linkedin_company' and status in('LIVE_PROVEN','MEASURED','LEARNED') and live_proven_at is not null and external_id is not null and canonical_url is not null)::int company,
      count(*) filter(where channel='linkedin_personal' and status in('LIVE_PROVEN','MEASURED','LEARNED') and live_proven_at is not null and external_id is not null and canonical_url is not null)::int personal,
      count(*) filter(where channel='instagram' and status in('LIVE_PROVEN','MEASURED','LEARNED') and live_proven_at is not null and external_id is not null and canonical_url is not null)::int ig,
      max(live_proven_at) last_live,
      md5(coalesce(string_agg(channel||':'||coalesce(content_id,'')||':'||coalesce(external_id,'')||':'||status||':'||coalesce(live_proven_at::text,'')||':'||coalesce(updated_at::text,''),',' order by channel),'')) rev
    from public.content_publication_obligations where tenant_id='canonical'
      and channel in('linkedin_company','linkedin_personal','instagram') and publication_date=p_day
 ) c
 CROSS JOIN (
    select count(*)::int registered,
      count(*) filter(where external_post_id is not null)::int linked,
      max(published_at) last_post,
      md5(coalesce(string_agg(tenant_id||':'||post_id||':'||coalesce(external_post_id,'')||':'||published_at::text,',' order by tenant_id,post_id),'')) rev
    from public.social_posts where tenant_id in('canonical','bedrijfsgeheugen')
      and (published_at at time zone 'Europe/Amsterdam')::date=p_day
      and channel_kind in('linkedin_company','linkedin_personal','instagram')
 ) p
 CROSS JOIN (
    select count(*)::int snapshots,
      count(distinct (s.tenant_id||':'||s.post_id)) filter(where s.data_quality='PROVIDER_OBSERVED_LINKED' and jsonb_typeof(s.metrics->'impressions')='number' and s.observed_at>=p.published_at)::int verified,
      max(s.observed_at) last_metric,
      md5(coalesce(string_agg(s.tenant_id||':'||s.post_id||':'||coalesce(s.source_event_id,'')||':'||s.observed_at::text||':'||md5(s.metrics::text),',' order by s.tenant_id,s.post_id,s.observed_at),'')) rev
    from public.social_metric_snapshots s join public.social_posts p
      on p.tenant_id=s.tenant_id and p.post_id=s.post_id
    where p.tenant_id in('canonical','bedrijfsgeheugen')
      and (p.published_at at time zone 'Europe/Amsterdam')::date=p_day
      and p.channel_kind in('linkedin_company','linkedin_personal','instagram')
 ) m
 UNION ALL
 SELECT 'technical_seo_audit',
   jsonb_build_object('seo_resolver_health_records',count(h.gemeten_op),
     'reported_healthy_resolver',count(h.gemeten_op) filter(where h.status='ok'),
     'technical_audit_with_independent_evidence',0),
   jsonb_build_object('authority','bg_gezondheid','original_component','seo-opportunity-resolver',
      'source_revision',md5(coalesce(string_agg(h.gemeten_op::text,',' order by h.gemeten_op),'')),
      'seo_resolver_health_not_a_full_technical_audit',true,
      'independent_audit_evidence_still_required',true),
   max(h.gemeten_op),'MISSING_INDEPENDENT_TECHNICAL_AUDIT_PROOF'
 FROM public.bg_gezondheid h
 WHERE h.onderdeel='seo-opportunity-resolver' AND h.gemeten_op>=v_start AND h.gemeten_op<v_end
 ), inserted AS (
 INSERT INTO public.powerhouse_growth_source_daily_v1
 (tenant_id,metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
 SELECT 'bedrijfsgeheugen',p_day,source_key,metrics,evidence,observed_at,v_now,quality FROM s
 ON CONFLICT(tenant_id,metric_date,source_key) DO UPDATE SET
   metrics=excluded.metrics,evidence=excluded.evidence,
   source_observed_at=excluded.source_observed_at,checked_at=excluded.checked_at,quality=excluded.quality
 RETURNING source_key
 ) SELECT count(*)::int INTO v_saved FROM inserted;

 SELECT jsonb_agg(jsonb_build_object(
   'source_key',source_key,'quality',quality,'observed_at',source_observed_at,
   'metrics',metrics,'raw_source_revision',evidence->>'source_revision',
   'authority',evidence->>'authority') ORDER BY source_key),
   count(*)::int,
   count(*) filter(where quality like 'MISSING%' OR quality like 'PUBLICATION_UNVERIFIED%' OR quality='PARTIAL_POST_METRICS'
       OR quality='AWAITING_PROVIDER')::int
 INTO v_manifest,v_source_count,v_gap
 FROM public.powerhouse_growth_source_daily_v1
 WHERE tenant_id='bedrijfsgeheugen' AND metric_date=p_day;

 IF v_manifest IS NULL OR v_saved<>8 THEN
   RAISE EXCEPTION 'GROWTH_SOURCE_MANIFEST_INCOMPLETE:%',v_saved USING errcode='23514';
 END IF;
 v_revision:=encode(sha256(convert_to(v_manifest::text,'UTF8')),'hex');

 -- Existing ONE BRAIN obligation is the ORIGINAL input consumer destination.
 -- Source and consumer ACKs are separate: source write never closes learning.
 INSERT INTO public.brain_obligations(
 obligation_type,capability_id,business_entity,business_period,business_timezone,
 payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version)
 VALUES(
 'GROWTH_SOURCE_DAILY_HANDOFF','website-seo-dataforseo-ai-cro',
 'bedrijfsgeheugen.nl:bedrijfsgeheugen',p_day::text,'Europe/Amsterdam',
 v_revision,'original-daily-growth-source-one-loop-v1',
 'original Powerhouse #175 → ONE BRAIN + Heartbeat #140','OPEN',
 jsonb_build_object('contract','original-daily-growth-source-one-loop-v1',
  'stage','SOURCE_PERSISTED_AWAIT_ORIGINAL_BRAIN_READBACK',
  'tenant_id','bedrijfsgeheugen','source_revision',v_revision,
  'source_count',v_source_count,'missing_or_unverified_sources',v_gap,
  'source_manifest',v_manifest,'producer_observed_at',v_now,
  'consumer_ack',jsonb_build_object('accepted',false,'consumed_revision',null,'consumed_at',null),
  'optimization_status','NOT_EXECUTED','causal_lift_proven',false,
  'next_action','ORIGINAL_BRAIN_140_VERIFY_SOURCE_REVISION_AND_COMPUTE_CRO_RECOMMENDATION',
  'original_executor_only',true,'no_duplicate_scheduler_or_publication',true),
 v_now,v_now,1)
 ON CONFLICT(obligation_type,capability_id,business_entity,business_period,business_timezone)
 DO UPDATE SET
 payload_sha256=excluded.payload_sha256,
 evidence=CASE WHEN public.brain_obligations.payload_sha256=excluded.payload_sha256
    THEN public.brain_obligations.evidence ELSE excluded.evidence END,
 updated_at=CASE WHEN public.brain_obligations.payload_sha256=excluded.payload_sha256
    THEN public.brain_obligations.updated_at ELSE v_now END,
 version=CASE WHEN public.brain_obligations.payload_sha256=excluded.payload_sha256
    THEN public.brain_obligations.version ELSE public.brain_obligations.version+1 END
 WHERE public.brain_obligations.state<>'FULFILLED';

 v_result:=jsonb_build_object('contract','original-daily-growth-source-one-loop-v1',
    'source_day',p_day,'tenant_id','bedrijfsgeheugen','source_count',v_source_count,
    'additional_source_types_archived',v_saved,'missing_or_unverified_sources',v_gap,
    'source_revision',v_revision,'producer_state','SOURCE_PERSISTED_WAIT_CONSUMER',
    'consumer_ack_not_inferred',true,'experiment_not_yet_proven',true);
 INSERT INTO public.powerhouse_runtime_events(
 dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at)
 VALUES('original-growth-source-producer:'||p_day,
   'original_daily_growth_source_producer','powerhouse-growth-source-175',
   'bedrijfsgeheugen.nl','website',v_now,v_result,
   jsonb_build_object('owner','original Powerhouse #175','consumer','original ONE BRAIN #140',
      'heartbeat','original commercial-intelligence-heartbeat','idempotency','source-day+SHA256'),
   CASE WHEN v_gap=0 THEN 'observed' ELSE 'error' END,
   CASE WHEN v_gap=0 THEN 'OBSERVED' ELSE 'PARTIAL' END,1,v_now)
 ON CONFLICT(dedupe_key) DO UPDATE SET
   occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
   state=excluded.state,data_quality=excluded.data_quality,updated_at=v_now;

 RETURN v_result;
END;
$function$
;
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
             AND v_source_count>=7 AND v_hash=v_brain.payload_sha256
             AND v_brain.evidence->>'source_revision'=v_hash
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
          'recommended_safe_action',v_action,'actual_cro_experiment_executed',false,
          'causal_lift_or_revenue_proven',false),
       'next_action',v_action,
       'experiment_state','PROPOSED_OR_WAITING_NOT_EXECUTED',
       'heartbeat_consumer_expected',true),
      updated_at=v_now,version=version+1
   WHERE id=v_brain.id AND state='OPEN'
   AND (evidence#>>'{consumer_ack,consumed_revision}' IS DISTINCT FROM v_hash
       OR evidence#>>'{analysis,recommended_safe_action}' IS DISTINCT FROM v_action
       OR (evidence#>>'{consumer_ack,accepted}')::boolean IS DISTINCT FROM v_accepted);
 END IF;

 v_report:=jsonb_build_object('contract','original-daily-growth-source-one-loop-v1',
   'source_day',p_day,'tenant_id','bedrijfsgeheugen','consumer_accepted',v_accepted,
   'consumer_source_revision',CASE WHEN v_accepted THEN v_hash ELSE null END,
   'source_rows',v_source_count,'missing_or_unverified_sources',v_gaps,
   'next_safe_cro_action',v_action,'provider_live_posts',v_posts_live,
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
 CASE WHEN v_accepted AND v_gaps=0 THEN 'VERIFIED' ELSE 'PARTIAL' END,
 CASE WHEN v_accepted THEN 1 ELSE 0.4 END,v_now)
 ON CONFLICT(dedupe_key) DO UPDATE SET occurred_at=excluded.occurred_at,
 evidence=excluded.evidence,context=excluded.context,state=excluded.state,
 data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=v_now;
 RETURN v_report;
END;
$function$
;
REVOKE ALL ON FUNCTION public.powerhouse_daily_source_archive_v1(date) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.powerhouse_daily_source_consume_v1(date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_daily_source_archive_v1(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerhouse_daily_source_consume_v1(date) TO service_role;
