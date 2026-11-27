-- P0 #4198 #5232: one ORIGINAL #140 Heartbeat reads original #171 content
-- and #116 commercial outcomes. No second executor/provider/cron/queue.
-- This is OBSERVER state only: sent means independent exact Gmail readback,
-- Instagram live only with original provider ID and truth.
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
  v_ig_status text; v_ig_provider_id text; v_ig_public_url text;
  v_ig_live_at timestamptz; v_ig_source_revision text; v_ig_ack_revision text;
  v_ig_brain_stage text; v_ig_brain_owner text;
  v_ig_media_jobs integer:=0; v_ig_lineage integer:=0;
  v_ig_proven boolean:=false; v_ig_original_ack boolean:=false;
  v_gmail_sends integer:=0; v_gmail_waiting integer:=0;
  v_gmail_no_source_acks integer:=0; v_gmail_next_source_due timestamptz;
  v_daily_delivery_receipt jsonb:='{}'::jsonb;
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


  -- Original Instagram/Gmail delivery assurance is a READ-ONLY observer
  -- inside the SAME original Heartbeat cron #140; original senders #171/#116
  -- retain all authority. No action/asset/research task is created here.
  select o.status,o.external_id,o.canonical_url,o.live_proven_at,
         to_char(o.updated_at at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
    into v_ig_status,v_ig_provider_id,v_ig_public_url,v_ig_live_at,v_ig_source_revision
  from public.content_publication_obligations o
  where o.tenant_id='canonical' and o.channel='instagram'
    and o.publication_date=p_run_date
  limit 1;

  select b.evidence#>>'{consumer_ack,source_revision}',
         b.evidence->>'stage', b.evidence#>>'{consumer_ack,owner}'
    into v_ig_ack_revision,v_ig_brain_stage,v_ig_brain_owner
  from public.brain_obligations b
  where b.obligation_type='CONTENT_HANDOFF'
    and b.capability_id='content:instagram'
    and b.business_entity='original-provider-to-learning-chain'
    and b.business_period=p_run_date::text
    and b.business_timezone='Europe/Amsterdam'
    and b.state='OPEN'
  limit 1;

  v_ig_original_ack := v_ig_source_revision is not null
     and v_ig_ack_revision=v_ig_source_revision;
  select count(*)::int into v_ig_media_jobs
  from public.powerhouse_instagram_media_jobs_v1
  where tenant_id='canonical' and channel='instagram'
    and publication_date=p_run_date;
  select count(*)::int into v_ig_lineage
  from public.powerhouse_mira_problem_lineage_v1
  where run_date=p_run_date;
  v_ig_proven := coalesce(v_ig_status in ('LIVE_PROVEN','MEASURED','LEARNED')
    and nullif(v_ig_provider_id,'') is not null
    and nullif(v_ig_public_url,'') like 'https://%'
    and v_ig_live_at is not null
    and exists (
      select 1 from public.content_publication_obligations original_ig
      where original_ig.tenant_id='canonical' and original_ig.channel='instagram'
        and original_ig.publication_date=p_run_date
        and original_ig.evidence->>'provider_truth_verified'='true'
    ),false);

  select count(*)::int into v_gmail_sends
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email' and a.channel='email'
    and a.status='done'
    and (a.executed_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and nullif(a.evidence#>>'{autonomous_outbound,provider_message_id}','') is not null
    and a.evidence#>>'{autonomous_outbound,provider_ack_verified}'='true'
    and a.evidence#>>'{autonomous_outbound,provider_readback_verified}'='true'
    and a.evidence#>>'{autonomous_outbound,user_authorized}'='true'
    and a.evidence#>>'{autonomous_outbound,needs_readback}'<>'true';

  select count(*)::int into v_gmail_waiting
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email' and a.channel='email'
    and a.status in ('prepared','waiting')
    and (a.created_at at time zone 'Europe/Amsterdam')::date=p_run_date;

  -- Exact DataForSEO → original awaiting Gmail action → original #116 ACK.
  -- A NO_SOURCE receiver receipt is not a Gmail send and must not reset due_at.
  select count(*)::int,min(r.due_at)
    into v_gmail_no_source_acks,v_gmail_next_source_due
  from public.powerhouse_sales_actions a
  join public.powerhouse_sales_actions r
    on r.dedupe_key='relationship-research:outreach-source:'||a.action_id::text
   and r.action_type='research_enrichment' and r.channel='internal'
   and r.person_key=a.person_key and r.company_key=a.company_key
   and r.evidence->>'original_outreach_action_id'=a.action_id::text
  join public.powerhouse_runtime_events owner_ack
    on owner_ack.dedupe_key='original-research-owner-handoff:'||r.action_id::text
   and owner_ack.event_type='relationship_research_owner_handoff'
   and owner_ack.evidence->>'consumer_no_source_disposition_received'='true'
   and owner_ack.evidence->>'original_outreach_action_id'=a.action_id::text
  where a.action_type='autonomous_email' and a.channel='email'
    and a.status in ('prepared','waiting')
    and (a.created_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and a.evidence#>>'{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
    and a.evidence#>>'{relationship_research_feedback,source_status}'='NO_VERIFIED_SOURCE_RETRY'
    and a.evidence#>>'{relationship_research_feedback,research_action_id}'=r.action_id::text
    and a.evidence#>>'{relationship_research_feedback,original_outreach_action_id}'=a.action_id::text
    and r.evidence#>>'{public_research_execution,provider}'='dataforseo-serp'
    and r.evidence#>>'{public_research_execution,reason}'='NO_VERIFIED_SOURCE_IN_BOUNDED_ORIGINAL_SEARCH';

  v_daily_delivery_receipt:=jsonb_build_object(
    'contract','ORIGINAL_DAILY_MIRA_EMAIL_TO_HEARTBEAT_ACK_V1',
    'date',p_run_date::text,
    'owner','original-commercial-intelligence-heartbeat-140',
    'original_instagram_owner','original Mira radar / media router / social publisher',
    'original_email_owner','original commercial cron 116 / Gmail composer',
    'original_brain_owner','original content handoff cron 171',
    'instagram',jsonb_build_object(
      'source_state',coalesce(v_ig_status,'SOURCE_ROW_MISSING'),
      'source_revision',v_ig_source_revision,
      'original_brain_exact_ack',v_ig_original_ack,
      'original_brain_stage',coalesce(v_ig_brain_stage,'SOURCE_ACK_MISSING'),
      'original_brain_next_owner',v_ig_brain_owner,
      'source_lineage_rows',v_ig_lineage,
      'media_jobs',v_ig_media_jobs,
      'provider_proven',v_ig_proven,
      'provider_id',case when v_ig_proven then v_ig_provider_id else null end,
      'next_stage',case
        when v_ig_proven then 'PROVIDER_TO_METRICS_AND_LEARNING'
        when not v_ig_original_ack then 'ORIGINAL_BRAIN_SOURCE_ACK_REQUIRED'
        when v_ig_lineage=0 then 'MIRA_SOURCE_SELECTION_TO_LINEAGE_MISSING'
        when v_ig_media_jobs=0 then 'MIRA_ORIGINAL_MEDIA_JOB_MISSING'
        else 'MEDIA_ASSET_AND_PROVIDER_READBACK_REQUIRED' end,
      'no_duplicate_instagram_post',true,
      'provider_media_credit_scope_not_inferred',true),
    'gmail',jsonb_build_object(
      'provider_verified_sends_today',v_gmail_sends,
      'original_prepared_or_waiting',v_gmail_waiting,
      'exact_no_source_consumer_acks',v_gmail_no_source_acks,
      'next_original_source_due',v_gmail_next_source_due,
      'provider_send_proven',v_gmail_sends>0,
      'next_stage',case
        when v_gmail_sends>0 then 'PROVIDER_VERIFIED_SENT_NEXT_OUTCOME_MEASUREMENT'
        when v_gmail_no_source_acks>0 then 'WAIT_VERIFIED_COMPANY_SOURCE_AND_ORIGINAL_COMPOSER'
        when v_gmail_waiting>0 then 'ORIGINAL_COMPOSER_AND_SOURCE_ACK_REQUIRED'
        else 'NO_ORIGINAL_ELIGIBLE_APPROVED_OUTBOUND_PROVEN' end,
      'no_duplicate_gmail_send',true,
      'recipient_authority_not_inferred',true),
    'handoff_state',case
      when v_ig_proven and v_gmail_sends>0 then 'BOTH_PROVIDER_DELIVERIES_PROVEN'
      when v_now>((p_run_date+time '20:30') at time zone 'Europe/Amsterdam')
        then 'OPEN_ORIGINAL_OWNERS_OVERDUE'
      else 'OPEN_ORIGINAL_OWNERS_WAITING' end,
    'no_second_scheduler',true,'no_false_green',true,
    'learning_or_revenue_proven',false,
    'captured_at',v_now);

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
      'original_daily_mira_email_handoff',v_daily_delivery_receipt,
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
    'original_daily_mira_email_handoff',v_daily_delivery_receipt,
      'snapshot_age_seconds',case when v_age is null then null else extract(epoch from v_age)::bigint end,
    'critical_path','read-only',
    'heavy_refresh_inline',false,
    'executed_at',v_now
  );
end $function$
;

REVOKE ALL ON FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_commercial_intelligence_heartbeat_v1(date) TO service_role;
