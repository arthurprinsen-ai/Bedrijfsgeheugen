-- Exact original provider function readback: 2026-11-13. Existing #140 runtime receipt only.
-- No second scheduler, new queue, DDL table, publication or fabricated outcome.
-- Keep existing SECURITY DEFINER service-only ACL intact.
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_now timestamptz:=now(); v_snapshot_at timestamptz; v_rows int:=0; v_age interval;
  v_source_ack_at timestamptz; v_source_stage text;
  v_current_table_revision text; v_current_source_count int:=0;
  v_site_receipts jsonb:='[]'::jsonb;
  v_site_receipt_count int:=0;
begin
  select max(refreshed_at),count(*)::int into v_snapshot_at,v_rows
  from public.powerhouse_revenue_command_center_snapshot_v1;
  v_age := case when v_snapshot_at is null then null else v_now-v_snapshot_at end;
  -- Heartbeat MUST validate the current persisted source table, the
  -- original BRAIN current revision AND latest original consumer receipt.
  -- Never accept yesterday's/superseded source ACK after #175 writes
  -- a new revision but before original #140 has consumed it.
  select encode(sha256(convert_to(jsonb_agg(
    jsonb_build_object('source_key',source_key,'quality',quality,
      'observed_at',source_observed_at,'metrics',metrics,
      'raw_source_revision',evidence->>'source_revision',
      'authority',evidence->>'authority') ORDER BY source_key)::text,'UTF8')),'hex'),
    count(*)::int
  into v_current_table_revision,v_current_source_count
  from public.powerhouse_growth_source_daily_v1
  where tenant_id='bedrijfsgeheugen' and metric_date=p_run_date;
  select max(e.occurred_at) into v_source_ack_at
  from public.powerhouse_runtime_events e
  JOIN public.brain_obligations b ON
    b.obligation_type='GROWTH_SOURCE_DAILY_HANDOFF'
    and b.capability_id='website-seo-dataforseo-ai-cro'
    and b.business_entity='bedrijfsgeheugen.nl:bedrijfsgeheugen'
    and b.business_period=p_run_date::text
    and b.business_timezone='Europe/Amsterdam'
  WHERE e.event_type='original_daily_growth_source_consumer'
    and e.evidence->>'consumer_accepted'='true'
    and e.evidence->>'source_day'=p_run_date::text
    and e.evidence->>'consumer_source_revision'=v_current_table_revision
    and b.evidence->>'source_revision'=v_current_table_revision
    and b.evidence#>>'{consumer_ack,accepted}'='true'
    and b.evidence#>>'{consumer_ack,consumed_revision}'=v_current_table_revision
    and b.state='OPEN' and v_current_source_count>=8
    and (e.occurred_at at time zone 'Europe/Amsterdam')::date=p_run_date;
  select evidence->>'stage' into v_source_stage
  from public.brain_obligations
  where obligation_type='GROWTH_SOURCE_DAILY_HANDOFF'
    and capability_id='website-seo-dataforseo-ai-cro'
    and business_entity='bedrijfsgeheugen.nl:bedrijfsgeheugen'
    and business_period=p_run_date::text
    and business_timezone='Europe/Amsterdam'
  limit 1;



  -- The actual existing #140 Heartbeat is the CRO next-owner consumer.
  -- Read the ORIGINAL recommendation, original #175 source obligation and
  -- original #140 exact ACK; do not accept the producer's own claim alone.
  -- This is a receipt of delivered website work, NOT CRO treatment or outcome.
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'recommendation_key',r.dedupe_key,
      'original_obligation_id',b.id::text,
      'source_revision',v_current_table_revision,
      'consumer_ack_revision',b.evidence#>>'{consumer_ack,consumed_revision}',
      'canonical_owner',r.evidence#>>'{original_delivery_crosslink,canonical_owner}',
      'site_release_sha',r.evidence#>>'{original_delivery_crosslink,owner_change_merge_sha}',
      'independent_provider_request_id',r.evidence#>>'{original_delivery_crosslink,independent_page_provider_request_id}',
      'next_stage','CRO_PROSPECTIVE_EXPERIMENT_REQUIRED'
    ) ORDER BY r.dedupe_key),'[]'::jsonb),
    count(*)::integer
  INTO v_site_receipts,v_site_receipt_count
  FROM public.powerhouse_content_recommendations r
  JOIN public.brain_obligations b
    ON b.obligation_type='GROWTH_SOURCE_DAILY_HANDOFF'
   AND b.capability_id='website-seo-dataforseo-ai-cro'
   AND b.business_entity='bedrijfsgeheugen.nl:bedrijfsgeheugen'
   AND b.business_timezone='Europe/Amsterdam'
   AND b.business_period=r.run_date::text
   AND b.state='OPEN'
  WHERE r.run_date=p_run_date
    AND r.target_channel='website'
    AND r.recommendation_type='seo_money_page_update'
    AND r.status='done'
    AND v_source_ack_at IS NOT NULL
    AND v_current_source_count>=8
    AND b.evidence->>'tenant_id'='bedrijfsgeheugen'
    AND b.evidence->>'source_revision'=v_current_table_revision
    AND b.evidence#>>'{analysis,source_revision}'=v_current_table_revision
    AND b.evidence#>>'{consumer_ack,accepted}'='true'
    AND b.evidence#>>'{consumer_ack,consumed_revision}'=v_current_table_revision
    AND b.evidence#>>'{consumer_ack,consumer}'='original powerhouse-content-orchestrator-140'
    AND r.evidence->>'contract'='SEO_ORIGINAL_MONEY_OWNER_HANDOFF_V1'
    AND r.evidence#>>'{original_delivery_crosslink,stage}'='SITE_ACTION_PROVEN_CRO_EXPERIMENT_AND_OUTCOME_DUE'
    AND r.evidence#>>'{original_delivery_crosslink,site_action_proven}'='true'
    AND r.evidence#>>'{original_delivery_crosslink,original_obligation_id}'=b.id::text
    AND r.evidence#>>'{original_delivery_crosslink,source_revision}'=v_current_table_revision
    AND r.evidence#>>'{original_delivery_crosslink,original_ack_revision}'=v_current_table_revision
    AND r.evidence#>>'{original_delivery_crosslink,canonical_owner}'=r.evidence->>'canonical_owner'
    AND r.evidence#>>'{original_delivery_crosslink,owner_change_merge_sha}'=r.evidence->>'owner_change_merge_sha'
    AND r.evidence#>>'{original_delivery_crosslink,independent_page_provider_request_id}'=r.evidence->>'public_provider_request_id'
    AND NULLIF(r.evidence->>'public_provider_request_id','') IS NOT NULL
    AND r.evidence->>'public_canonical_readback'=r.evidence->>'canonical_owner'
    AND r.evidence->>'netlify_deploy_state'='READY'
    AND r.evidence->>'public_frisse_blik_cta_readback'='true'
    AND EXISTS (
      SELECT 1 FROM jsonb_array_elements(COALESCE(b.evidence->'source_manifest','[]'::jsonb)) manifest(source_row)
      WHERE manifest.source_row->>'source_key'='website_release_readback'
        AND manifest.source_row->>'quality'='VERIFIED_PRODUCTION_RELEASE'
        AND manifest.source_row#>>'{metrics,source_release_proven}'='true'
        AND manifest.source_row#>>'{metrics,http_status}'='200'
        AND manifest.source_row#>>'{metrics,published_commit_ref}'=r.evidence->>'owner_change_merge_sha'
        AND manifest.source_row#>'{metrics,routes}' ? (r.evidence->>'canonical_owner')
    );

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
      'daily_source_current_raw_manifest_sha256',v_current_table_revision,
      'daily_source_current_source_count',v_current_source_count,

      'original_site_to_cro_handoff',jsonb_build_object(
        'contract','ORIGINAL_SEO_TO_HEARTBEAT_CRO_RECEIPT_V1',
        'original_owner','original-commercial-intelligence-heartbeat-140',
        'source_owner','original-growth-source-175',
        'accepted',v_site_receipt_count>0 AND v_source_ack_at IS NOT NULL,
        'source_revision',v_current_table_revision,
        'source_day',p_run_date::text,
        'site_receipt_count',v_site_receipt_count,
        'verified_site_receipts',v_site_receipts,
        'next_owner','original Powerhouse CRO/Experiment + ONE BRAIN',
        'next_stage',CASE WHEN v_site_receipt_count>0
          THEN 'CRO_PROSPECTIVE_EXPERIMENT_REQUIRED'
          ELSE 'WAIT_ORIGINAL_VERIFIED_SITE_DELIVERY' END,
        'cro_treatment_executed',false,
        'controlled_outcome_proven',false,
        'paid_order_proven',false,
        'next_run_learning_proven',false,
        'no_new_scheduler_or_queue',true
      ),
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
      'daily_source_current_raw_manifest_sha256',v_current_table_revision,
      'daily_source_current_source_count',v_current_source_count,

      'original_site_to_cro_handoff',jsonb_build_object(
        'contract','ORIGINAL_SEO_TO_HEARTBEAT_CRO_RECEIPT_V1',
        'original_owner','original-commercial-intelligence-heartbeat-140',
        'source_owner','original-growth-source-175',
        'accepted',v_site_receipt_count>0 AND v_source_ack_at IS NOT NULL,
        'source_revision',v_current_table_revision,
        'source_day',p_run_date::text,
        'site_receipt_count',v_site_receipt_count,
        'verified_site_receipts',v_site_receipts,
        'next_owner','original Powerhouse CRO/Experiment + ONE BRAIN',
        'next_stage',CASE WHEN v_site_receipt_count>0
          THEN 'CRO_PROSPECTIVE_EXPERIMENT_REQUIRED'
          ELSE 'WAIT_ORIGINAL_VERIFIED_SITE_DELIVERY' END,
        'cro_treatment_executed',false,
        'controlled_outcome_proven',false,
        'paid_order_proven',false,
        'next_run_learning_proven',false,
        'no_new_scheduler_or_queue',true
      ),
    'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end,
    'critical_path','read-only',
    'heavy_refresh_inline',false,
    'executed_at',v_now
  );
end $function$
;

REVOKE ALL ON FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(date) TO service_role;
