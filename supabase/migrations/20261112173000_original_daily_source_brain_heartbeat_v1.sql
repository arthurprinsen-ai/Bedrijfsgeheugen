-- 2026-11-12 ORIGINAL #175 -> ONE BRAIN original #140 -> Heartbeat
-- All source evidence is stored in existing raw provider tables; indexed daily
-- views are manifest snapshots, never synthetic SEO, CRO, clicks or revenue.
-- No new cron, provider sender, scheduler, external side effect or parallel executor.

-- ONE original #175 source ARCHIVE writer, service-role only; no new cron.
CREATE OR REPLACE FUNCTION public.powerhouse_daily_source_archive_v1(p_day date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog','public'
AS $source$
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
   count(*) filter(where quality like 'MISSING%' OR quality like 'PUBLICATION_UNVERIFIED%'
       OR quality='AWAITING_PROVIDER')::int
 INTO v_manifest,v_source_count,v_gap
 FROM public.powerhouse_growth_source_daily_v1
 WHERE tenant_id='bedrijfsgeheugen' AND metric_date=p_day;

 IF v_manifest IS NULL OR v_saved<>7 THEN
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
$source$;

-- ONE ORIGINAL #140: independently re-read the source table and BRAIN payload.
CREATE OR REPLACE FUNCTION public.powerhouse_daily_source_consume_v1(p_day date)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog','public'
AS $consumer$
DECLARE
 v_day date:=(now() at time zone 'Europe/Amsterdam')::date;
 v_manifest jsonb; v_hash text; v_brain public.brain_obligations%rowtype;
 v_views bigint:=0; v_cta bigint:=0; v_leads bigint:=0; v_gaps int:=0; v_source_count int:=0;
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
   count(*) FILTER(WHERE quality LIKE 'MISSING%' OR quality LIKE 'PUBLICATION_UNVERIFIED%'
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
   'next_safe_cro_action',v_action,'independent_source_rechecked',true,
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
$consumer$;


CREATE OR REPLACE FUNCTION public.powerhouse_capture_growth_source_daily_v1(p_day date DEFAULT (((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date - 1))
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_start timestamptz := p_day::timestamp at time zone 'Europe/Amsterdam';
  v_end timestamptz := (p_day+1)::timestamp at time zone 'Europe/Amsterdam';
  v_now timestamptz := now();
  v_gsc_latest date;
  v_ga4_latest date;
  v_social_latest timestamptz;
  v_site_latest timestamptz;
  v_goal numeric := 1000000;
  v_actual numeric := 0;
  v_status text;
  v_bad text[] := array[]::text[];
  v_result jsonb;
  v_multisource jsonb;
begin
  if p_day < date '2025-01-01' or p_day > ((v_now at time zone 'Europe/Amsterdam')::date) then
    raise exception 'INVALID_MEASUREMENT_DATE';
  end if;
  if not pg_try_advisory_xact_lock(hashtextextended('growth-source-measure:'||p_day::text,0)) then
    return jsonb_build_object('state','SKIPPED_OVERLAP','date',p_day);
  end if;

  select max(datum) into v_gsc_latest from public.bg_zoekprestaties;
  select max(period_end) filter (where status in ('IMPORTED','PARTIAL') and rows_total > 0)
    into v_ga4_latest from public.bg_ga4_csv_batches;
  select max(observed_at) into v_social_latest from public.social_metric_snapshots;
  select max(ontvangen_op) into v_site_latest from public.bg_interacties;

  -- Google Search Console reports search dates with normal provider latency.
  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,'search_console',
    jsonb_build_object('clicks',coalesce(sum(klikken),0),'impressions',coalesce(sum(vertoningen),0),
       'rows',count(*),'page_count',count(distinct pagina),'search_terms',count(distinct zoekterm)),
    jsonb_build_object('authority','bg_zoekprestaties','latest_provider_date',v_gsc_latest,'provider_delay_allowed_days',4),
    max(opgehaald_op),v_now,
    case when count(*)>0 then 'OBSERVED'
         when p_day >= (v_now at time zone 'Europe/Amsterdam')::date-4 then 'AWAITING_PROVIDER'
         else 'MISSING' end
  from public.bg_zoekprestaties where datum=p_day
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  -- GA4 campaign batches preserve their full source CSV. A zero-row batch is
  -- not evidence of a measured zero-conversion customer journey.
  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,'ga4',
    jsonb_build_object('provider_rows',coalesce(sum(rows_total),0),
      'attributed_rows',coalesce(sum(rows_attributed),0),
      'unmatched_rows',coalesce(sum(rows_unmatched),0),
      'batches',count(*)),
    jsonb_build_object('authority','bg_ga4_csv_batches','latest_nonempty_day',v_ga4_latest,
       'scope','campaign-attribution-batches-only','not_full_site_analytics',true),
    max(completed_at),v_now,
    case when count(*) filter(where rows_total>0 and status in ('IMPORTED','PARTIAL'))>0 then 'OBSERVED_PARTIAL_SCOPE'
         when count(*)>0 then 'EMPTY_SOURCE_BATCH'
         else 'MISSING' end
  from public.bg_ga4_csv_batches where period_start<=p_day and period_end>=p_day
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  -- Site events: human and robot traffic are never merged.
  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,'website_interactions',
    jsonb_build_object('human_events',count(*) filter(where is_robot is distinct from true),
       'robot_events',count(*) filter(where is_robot is true),
       'human_sessions',count(distinct sessie) filter(where is_robot is distinct from true),
       'human_clicks',count(*) filter(where is_robot is distinct from true and gebeurtenis ilike '%klik%')),
    jsonb_build_object('authority','bg_interacties','privacy','no identified personal tracking',
       'robot_events_excluded_from_learnings',true),
    max(ontvangen_op),v_now,
    case when v_site_latest>=v_now-interval '48 hours' then 'OBSERVED'
         else 'STALE' end
  from public.bg_interacties where ontvangen_op>=v_start and ontvangen_op<v_end
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  -- Historical social snapshots must retain their actual observation times.
  -- Never translate a missing provider pull into 0 likes or 0 impressions.
  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,channels.platform,
    jsonb_build_object('post_snapshot_count',count(s.snapshot_id),
       'posts_with_snapshot',count(distinct s.post_id)),
    jsonb_build_object('authority','social_metric_snapshots',
       'legacy_buffer_is_not_authorized_new_collector',true),
    max(s.observed_at),v_now,
    case when count(s.snapshot_id)>0 then 'OBSERVED_LEGACY'
         when v_social_latest<v_now-interval '72 hours' or v_social_latest is null then 'STALE_PROVIDER'
         else 'NO_NEW_SNAPSHOT' end
  from (values ('linkedin'),('instagram')) as channels(platform)
  left join (
    select sm.snapshot_id,sm.post_id,sm.observed_at,lower(sp.platform) as platform
    from public.social_metric_snapshots sm
    join public.social_posts sp
      on sp.tenant_id=sm.tenant_id and sp.post_id=sm.post_id
    where sm.observed_at>=v_start and sm.observed_at<v_end
  ) s on s.platform=channels.platform
  group by channels.platform
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  -- Revenue from canonical, observed outcomes only. No modeled € enters this sum.
  select coalesce(sum(revenue_eur),0) into v_actual
  from public.powerhouse_sales_outcomes
  where occurred_at>=(v_end-interval '365 days') and occurred_at<v_end
    and revenue_eur>0;

  insert into public.powerhouse_growth_source_daily_v1
  (metric_date,source_key,metrics,evidence,source_observed_at,checked_at,quality)
  select p_day,'revenue_goal',
    jsonb_build_object('rolling_365d_observed_revenue_eur',v_actual,
        'rolling_365d_goal_eur',v_goal,'unproven_gap_eur',greatest(0,v_goal-v_actual),
        'goal_progress_pct',round(100*v_actual/v_goal,4),
        'observed_positive_outcomes_365d',count(*)),
    jsonb_build_object('authority','powerhouse_sales_outcomes','horizon','rolling_365_days',
      'scope','revenue-recorded-in-system-only','modeled_revenue_excluded',true),
    max(occurred_at),v_now,
    case when v_actual>0 then 'PARTIAL_REVENUE_OBSERVED' else 'NO_REVENUE_VERIFIED' end
  from public.powerhouse_sales_outcomes
  where occurred_at>=(v_end-interval '365 days') and occurred_at<v_end
    and revenue_eur>0
  on conflict (tenant_id,metric_date,source_key) do update set
    metrics=excluded.metrics,evidence=excluded.evidence,source_observed_at=excluded.source_observed_at,
    checked_at=excluded.checked_at,quality=excluded.quality;

  if v_gsc_latest is null or v_gsc_latest < p_day-4 then
    v_bad:=array_append(v_bad,'search_console');
  end if;
  if v_ga4_latest is null or v_ga4_latest < p_day-3 then
    v_bad:=array_append(v_bad,'ga4_nonempty');
  end if;
  if v_social_latest is null or v_social_latest < v_now-interval '72 hours' then
    v_bad:=array_append(v_bad,'social_post_metrics');
  end if;
  if v_site_latest is null or v_site_latest < v_now-interval '48 hours' then
    v_bad:=array_append(v_bad,'website_interactions');
  end if;

  v_status:=case when cardinality(v_bad)=0 then 'MEASUREMENTS_CURRENT'
    else 'MEASUREMENT_GAPS' end;

  v_result:=jsonb_build_object('contract','growth-source-daily-v1',
    'day',p_day,'run_at',v_now,'status',v_status,'missing_or_stale_sources',to_jsonb(v_bad),
    'latest_gsc_date',v_gsc_latest,'latest_ga4_nonempty_day',v_ga4_latest,
    'latest_social_observed_at',v_social_latest,'latest_site_event_at',v_site_latest,
    'observed_revenue_365d_eur',v_actual,'goal_eur',v_goal,
    'safety','never infer revenue, reach or engagement from scheduled-run success');


  -- ONE ORIGINAL #175: add source-backed SEO, website, blog, DataForSEO,
  -- external intelligence, AI and CRO evidence without another scheduler.
  -- A source writer failure is recorded but does not erase prior base metrics.
  begin
    v_multisource:=public.powerhouse_daily_source_archive_v1(p_day);
  exception when others then
    v_multisource:=jsonb_build_object('status','SOURCE_ARCHIVE_RETRY_REQUIRED',
      'sqlstate',sqlstate,'reason',left(sqlerrm,220),'owner','original-growth-source-175');
    insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values (v_now,'powerhouse-daily-source-one-loop-v1','archive','fout',
      'Original multisource archive failed; original #175 stays scheduled; retry under same owner.',v_multisource);
  end;
  v_result:=v_result||jsonb_build_object('seo_website_ai_cro_source_manifest',v_multisource);

  insert into public.powerhouse_runtime_events
  (dedupe_key,event_type,source,subject_key,channel,occurred_at,evidence,context,state,data_quality,confidence,updated_at)
  values ('growth-daily-source-health:'||p_day::text,
     'growth_daily_source_health','powerhouse-growth-source-daily-v1','growth-revenue-os',
     'system',v_now,v_result,jsonb_build_object('existing_state_first',true,'source_facts_only',true),
     case when cardinality(v_bad)=0 then 'observed' else 'error' end,
     case when cardinality(v_bad)=0 then 'OBSERVED' else 'PARTIAL' end,1,v_now)
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,state=excluded.state,
    data_quality=excluded.data_quality,updated_at=v_now;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values (v_now,'powerhouse-growth-source-daily-v1','growth-measurement',
     case when cardinality(v_bad)=0 then 'ok' else 'fout' end,
     case when cardinality(v_bad)=0 then 'Bronsnapshots actueel' else 'Ontbrekende of verouderde providerstatistieken' end,
     v_result);
  return v_result;
end;
$function$
;
CREATE OR REPLACE FUNCTION public.powerhouse_content_closed_loop_tick_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog', 'net', 'vault'
AS $function$
declare
  v_request bigint;
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_token text;
  v_source_offset integer;
begin
  begin
    perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  exception when others then
    raise warning 'CONTENT_OUTCOME_RECONCILE_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'reconciliation', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','reconcile_pre','isolated',true));
    exception when others then
      raise warning 'CONTENT_RECONCILE_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  begin
    perform public.powerhouse_measure_content_outcomes_v1(p_now);
  exception when others then
    raise warning 'CONTENT_OUTCOME_MEASURE_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'measurement', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','measure','isolated',true));
    exception when others then
      raise warning 'CONTENT_MEASURE_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  begin
    perform public.powerhouse_report_missed_publications_v1(p_now);
  exception when others then
    raise warning 'CONTENT_MISSED_PUBLICATION_REPORT_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'missed-publication-report', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','missed_report','isolated',true));
    exception when others then
      raise warning 'CONTENT_MISSED_REPORT_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  begin
    perform public.powerhouse_recover_stuck_publications_v1(p_now);
  exception when others then
    raise warning 'CONTENT_STUCK_RECOVERY_ISOLATED: % %', sqlstate, left(sqlerrm, 240);
    begin
      insert into public.bg_gezondheid(gemeten_op, onderdeel, soort, status, detail, gegevens)
      values (now(), 'powerhouse-content-closed-loop-tick', 'stuck-recovery', 'fout', left(sqlerrm,360),
        jsonb_build_object('run_date',v_date::text,'stage','stuck_recovery','isolated',true));
    exception when others then
      raise warning 'CONTENT_STUCK_RECOVERY_DIAGNOSTIC_WRITE_FAILED: %', sqlstate;
    end;
  end;

  -- Existing hourly scheduler #140 performs end-to-end original receipt audit,
  -- without a new worker, publisher, experiment scheduler or provider write.
  begin
    perform public.powerhouse_original_handoff_receipt_audit_v1(p_now);
  exception when others then
    raise warning 'ORIGINAL_HANDOFF_RECEIPT_AUDIT_FAILED: % %',sqlstate,left(sqlerrm,240);
    insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values (p_now,'powerhouse-original-handoff-ack',
      'receipt-audit','fout','Original handoff audit failed; no terminal success claimed.',
      jsonb_build_object('source','powerhouse-content-closed-loop-tick-v1',
        'sqlstate',sqlstate,'error',left(sqlerrm,240),
        'original_event','P0_END_TO_END_CLOSURE_20261109',
        'repair_owner','original Powerhouse operator','verified',false));
  end;


  -- ONE ORIGINAL #140: read what the original #175 wrote into BRAIN,
  -- verify immutable source revision, and route CRO/Heartbeat without
  -- creating another cron, publisher or unsafe experiment executor.
  for v_source_offset in 0..1 loop
    begin
      perform public.powerhouse_daily_source_consume_v1(v_date-v_source_offset);
    exception when others then
      insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
      values(p_now,'powerhouse-daily-source-one-loop-v1','original-brain-consumer',
        'fout','Original BRAIN input/consumer ACK failed; original #140 stays active.',
        jsonb_build_object('source_day',(v_date-v_source_offset)::text,
          'owner','original-content-orchestrator-140','sqlstate',sqlstate,'error',left(sqlerrm,240)));
    end;
  end loop;
  begin
    perform public.powerhouse_commercial_intelligence_heartbeat_v1(v_date);
  exception when others then
    insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values(p_now,'powerhouse-daily-source-one-loop-v1','original-heartbeat-consumer',
      'fout','Original Heartbeat input readback failed; original #140 stays active.',
      jsonb_build_object('source_day',v_date::text,
        'owner','original-heartbeat','sqlstate',sqlstate,'error',left(sqlerrm,240)));
  end;

  -- Auth/security and provider dispatch errors are deliberately NOT caught.
  v_token := nullif(trim(public.bg_geheim('powerhouse_daily_scheduler_token')), '');
  if v_token is null then
    raise exception 'CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE';
  end if;
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := jsonb_build_object('runDate',v_date::text),
    timeout_milliseconds := 120000
  ) into v_request;
  return v_request;
end
$function$
;
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_now timestamptz:=now(); v_snapshot_at timestamptz; v_rows int:=0; v_age interval;
  v_source_ack_at timestamptz; v_source_stage text;
begin
  select max(refreshed_at),count(*)::int into v_snapshot_at,v_rows
  from public.powerhouse_revenue_command_center_snapshot_v1;
  v_age := case when v_snapshot_at is null then null else v_now-v_snapshot_at end;
  select max(occurred_at) into v_source_ack_at
  from public.powerhouse_runtime_events
  where event_type='original_daily_growth_source_consumer'
    and evidence->>'consumer_accepted'='true'
    and (occurred_at at time zone 'Europe/Amsterdam')::date=p_run_date;
  select evidence->>'stage' into v_source_stage
  from public.brain_obligations
  where obligation_type='GROWTH_SOURCE_DAILY_HANDOFF'
    and capability_id='website-seo-dataforseo-ai-cro'
    and business_entity='bedrijfsgeheugen.nl:bedrijfsgeheugen'
    and business_period=p_run_date::text
    and business_timezone='Europe/Amsterdam'
  limit 1;


  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values(
    'commercial-intelligence-heartbeat:'||p_run_date,
    'commercial_intelligence_heartbeat',
    'powerhouse-commercial-intelligence-heartbeat-v5',
    'company-person-commercial',
    v_now,
    jsonb_build_object(
      'source_nba','powerhouse_commercial_next_best_action_v5',
      'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
      'snapshot_refreshed_at',v_snapshot_at,
      'snapshot_rows',v_rows,
      'daily_source_brain_ack_at',v_source_ack_at,
      'daily_source_brain_stage',coalesce(v_source_stage,'NO_SOURCE_BRAIN_ACK'),
      'daily_source_brain_ack_verified',v_source_ack_at is not null,
      'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end
    ),
    jsonb_build_object(
      'critical_path_mode','read_only_snapshot',
      'heavy_intelligence_refresh_inline',false,
      'reason','prevent lock contention/deadlocks with asynchronous research/composer/provider writebacks',
      'existing_refresh_owners_preserved',true,
      'single_action_materializer',true
    ),
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 'actioned' else 'error' end,
    case when v_snapshot_at is not null and v_rows>0 then 'VERIFIED' else 'INCOMPLETE' end,
    case when v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0 then 1 else .4 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-intelligence-heartbeat-v5',
    'healthy',v_snapshot_at is not null and v_snapshot_at>=v_now-interval '6 hours' and v_rows>0,
    'source_nba','v5',
    'runtime_read_model','powerhouse_revenue_command_center_snapshot_v1',
    'snapshot_refreshed_at',v_snapshot_at,
    'snapshot_rows',v_rows,
      'daily_source_brain_ack_at',v_source_ack_at,
      'daily_source_brain_stage',coalesce(v_source_stage,'NO_SOURCE_BRAIN_ACK'),
      'daily_source_brain_ack_verified',v_source_ack_at is not null,
    'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end,
    'critical_path','read-only',
    'heavy_refresh_inline',false,
    'executed_at',v_now
  );
end $function$
;

REVOKE ALL ON FUNCTION public.powerhouse_daily_source_archive_v1(date) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.powerhouse_daily_source_consume_v1(date) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.powerhouse_capture_growth_source_daily_v1(date) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.powerhouse_content_closed_loop_tick_v1(timestamptz) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(date) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_daily_source_archive_v1(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerhouse_daily_source_consume_v1(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerhouse_capture_growth_source_daily_v1(date) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerhouse_content_closed_loop_tick_v1(timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(date) TO service_role;
