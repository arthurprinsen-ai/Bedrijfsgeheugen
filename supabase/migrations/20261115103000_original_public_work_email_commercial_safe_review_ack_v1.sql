-- Original #116 → #138 → ONE BRAIN → original commercial Heartbeat → 
-- SAME original-agent:commercial BRAIN obligation, safe hold only.
-- No second scheduler/worker/provider, no email promotion or send.
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_heartbeat_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_run_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_full_needed boolean := false;
  v_full jsonb := '{}'::jsonb;
  v_composer jsonb := '{}'::jsonb;
  v_promote jsonb := '{}'::jsonb;
  v_current_set jsonb := '{}'::jsonb;
  v_social_release jsonb := '{}'::jsonb;
  v_social_dispatch jsonb := '{}'::jsonb;
  v_provider_error_closure jsonb := '{}'::jsonb;
  v_closure jsonb := '{}'::jsonb;
  v_terminal jsonb := '{}'::jsonb;
  v_output jsonb := '{}'::jsonb;
  v_gate jsonb := '{}'::jsonb;
  v_proven boolean := false;
  v_control_healthy boolean := false;
  v_output_valid boolean := false;
  v_email_receipts_written int := 0;
  v_email_receipts_total int := 0;
  v_email_source_retry_backlog int := 0;
  v_work_email_review_row record;
  v_work_email_owner_ack public.brain_obligations;
  v_work_email_review_acks_created int := 0;
  v_work_email_review_acks_blocked_total int := 0;
begin
  select not exists (
    select 1 from public.powerhouse_runtime_events e
    where e.dedupe_key='one-commercial-decision-loop:'||v_run_date::text
      and e.occurred_at >= v_run_date::timestamp at time zone 'Europe/Amsterdam'
  ) into v_full_needed;

  if v_full_needed then
    v_full := public.powerhouse_one_commercial_decision_loop_v1(v_run_date);
  else
    v_composer := public.powerhouse_dispatch_human_sales_composer_v2(5);
  end if;

  v_promote := public.powerhouse_promote_research_to_social_v1();
  v_current_set := public.powerhouse_reconcile_current_commercial_action_set_v2(v_run_date);
  v_social_release := public.powerhouse_prepare_quality_social_comments_v1(v_run_date);
  v_social_dispatch := public.powerhouse_dispatch_linkedin_comment_autopilot_v1(v_run_date);
  v_provider_error_closure := public.powerhouse_close_current_set_provider_errors_v1(v_run_date,p_now);
  v_closure := public.powerhouse_commercial_action_closure_watchdog_v1(p_now);
  v_terminal := public.powerhouse_terminalize_action_outcome_lineage_v1(v_run_date);
  v_output := public.powerhouse_commercial_output_assurance_v1(v_run_date);
  v_gate := public.powerhouse_commercial_regression_gate_v1(v_run_date);
  v_proven := coalesce((v_output->>'commercial_day_proven')::boolean,false);
  -- Transport/durable observation health is NOT the daily sales SLA.
  -- Fail closed if the output-assurance contract itself is absent or malformed.
  v_output_valid := coalesce(v_output->>'contract','')='powerhouse-commercial-output-assurance-v3'
    and coalesce(v_output->>'run_date','')=v_run_date::text
    and jsonb_typeof(v_output->'commercial_day_proven')='boolean'
    and nullif(v_output->>'commercial_day_state','') is not null;
  v_control_healthy := coalesce((v_gate->>'healthy')::boolean,false)
    and v_output_valid;


  -- Independent ORIGINAL commercial Heartbeat consumes the exact #138 ONE BRAIN
  -- PROCESSED receipt. This is a SOURCE/OWNERSHIP receipt only, never verified
  -- deliverability, marketing consent, provider send, or promotion to contact.email.
  -- No fresh schedule, worker, queue, sender or parallel source of truth.
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,channel,
    occurred_at,evidence,context,state,data_quality,confidence,updated_at
  )
  select
    'contact-public-work-email-heartbeat:'||src.event_id::text,
    'contact_public_work_email_heartbeat_receipt',
    'powerhouse-commercial-heartbeat-v1',
    'contact:'||src.person_key,
    src.person_key,src.company_key,'internal',
    p_now,
    jsonb_build_object(
      'contract','ORIGINAL_PUBLIC_WORK_EMAIL_HEARTBEAT_SOURCE_RECEIPT_V1',
      'original_source_event_id',src.event_id::text,
      'original_research_action_id',src.context->>'correlation_id',
      'identity_graph_brain_obligation_id',b.id::text,
      'identity_graph_consumer_result','PROCESSED',
      'source_revision',src.evidence->>'observed_at',
      'original_source_url',src.evidence->>'source_url',
      'source_receipt_verified',true,
      'heartbeat_receipt_observed_at',p_now,
      'candidate_email_verified',false,
      'candidate_only',true,
      'canonical_email_written',false,
      'provider_send_authorized',false,
      'recipient_consent_inferred',false,
      'external_messages_sent',0,
      'next_action_state','VERIFICATION_REQUIRED_NOT_SENDABLE'
    ),
    jsonb_build_object(
      'single_canonical_chain',true,
      'original_heartbeat_owner','powerhouse-commercial-heartbeat-v1',
      'source_consumer_owner','powerhouse-identity-graph-v1',
      'next_owner','original-agent:commercial',
      'next_action','EVIDENCE_AND_DELIVERABILITY_REVIEW_BEFORE_ANY_OUTREACH',
      'original_cron_116_owned',true,
      'no_new_scheduler',true,
      'no_parallel_mailer',true
    ),
    'observed','UNVERIFIED_CONTACT_CANDIDATE_SOURCE_RECEIPT',1,p_now
  from public.powerhouse_runtime_events src
  join public.brain_obligations b
    on b.id::text=src.evidence->>'consumer_brain_obligation_id'
  join public.bg_connecties c on c.sleutel=src.person_key
  where src.event_type='contact_public_work_email_candidate'
    and src.state='decided'
    and src.evidence->>'handoff_state'='IDENTITY_GRAPH_PROCESSED'
    and src.evidence->>'identity_graph_readback_verified'='true'
    and src.evidence->>'canonical_email_written'='false'
    and src.evidence->>'provider_send_authorized'='false'
    and src.context->>'consumer_result'='PROCESSED'
    and b.state='FULFILLED'
    and b.evidence->>'contract'='ORIGINAL_PUBLIC_WORK_EMAIL_SOURCE_CONSUMER_V1'
    and b.evidence->>'state'='PROCESSED'
    and b.evidence->>'source_event_id'=src.event_id::text
    and b.evidence->>'source_revision'=src.evidence->>'observed_at'
    and b.evidence->>'candidate_only'='true'
    and b.evidence->>'external_messages_sent'='0'
    and c.extra#>>'{public_work_email_candidate,observed_at}'=src.evidence->>'observed_at'
    and c.extra#>>'{public_work_email_candidate,source_url}'=src.evidence->>'source_url'
    and c.extra#>>'{public_work_email_candidate,research_action_id}'=src.context->>'correlation_id'
    and c.extra#>>'{public_work_email_candidate,email_verification}'='UNVERIFIED'
    and c.extra#>>'{public_work_email_candidate,send_authorized}'='false'
    and c.extra#>>'{public_work_email_candidate,data_processing_state}'='CANDIDATE_NOT_PROMOTED'
    and not exists(
      select 1 from public.powerhouse_runtime_events receipt
      where receipt.dedupe_key='contact-public-work-email-heartbeat:'||src.event_id::text
    )
  order by src.occurred_at,src.event_id
  limit 25
  on conflict(dedupe_key) do nothing;
  get diagnostics v_email_receipts_written=row_count;


  -- Original single commercial Heartbeat: explicitly ACCEPT a processed
  -- identity source at the *commercial* owner, not merely in a source log.
  -- A source-observed email stays quarantine-only and is NEVER sendable here.
  -- The existing ONE BRAIN is the durable idempotent handoff ledger; there
  -- is no parallel queue, scheduler, sender, agent or provider lookup.
  if pg_try_advisory_xact_lock(
    hashtextextended('original-public-work-email-commercial-review-v1',0)
  ) then
    for v_work_email_review_row in
      select hb.event_id as receipt_id,hb.person_key,hb.company_key,
        hb.evidence->>'original_source_event_id' as source_event_id,
        hb.evidence->>'source_revision' as source_revision,
        hb.evidence->>'original_research_action_id' as research_action_id,
        identity.id as identity_brain_id,
        c.extra#>'{public_work_email_candidate}' as candidate
      from public.powerhouse_runtime_events hb
      join public.brain_obligations identity
        on identity.id::text=hb.evidence->>'identity_graph_brain_obligation_id'
      join public.bg_connecties c on c.sleutel=hb.person_key
      where hb.event_type='contact_public_work_email_heartbeat_receipt'
        and hb.state='observed'
        and hb.evidence->>'contract'='ORIGINAL_PUBLIC_WORK_EMAIL_HEARTBEAT_SOURCE_RECEIPT_V1'
        and hb.evidence->>'next_action_state'='VERIFICATION_REQUIRED_NOT_SENDABLE'
        and hb.evidence->>'candidate_email_verified'='false'
        and hb.evidence->>'canonical_email_written'='false'
        and hb.evidence->>'provider_send_authorized'='false'
        and hb.evidence->>'recipient_consent_inferred'='false'
        and hb.context->>'next_owner'='original-agent:commercial'
        and identity.state='FULFILLED'
        and identity.evidence->>'contract'='ORIGINAL_PUBLIC_WORK_EMAIL_SOURCE_CONSUMER_V1'
        and identity.evidence->>'state'='PROCESSED'
        and identity.evidence->>'source_event_id'=hb.evidence->>'original_source_event_id'
        and identity.evidence->>'source_revision'=hb.evidence->>'source_revision'
        and identity.evidence->>'original_action_id'=hb.evidence->>'original_research_action_id'
        and identity.evidence->>'external_messages_sent'='0'
        and c.extra#>>'{public_work_email_candidate,observed_at}'=hb.evidence->>'source_revision'
        and c.extra#>>'{public_work_email_candidate,research_action_id}'=hb.evidence->>'original_research_action_id'
        and c.extra#>>'{public_work_email_candidate,email_verification}'='UNVERIFIED'
        and c.extra#>>'{public_work_email_candidate,send_authorized}'='false'
        and c.extra#>>'{public_work_email_candidate,data_processing_state}'='CANDIDATE_NOT_PROMOTED'
      order by hb.occurred_at,hb.event_id
      limit 25
    loop
      v_work_email_owner_ack:=public.brain_create_obligation(
        'COMMERCIAL_EXECUTION',
        'powerhouse-original-public-work-email-commercial-safe-review-v1',
        'contact:'||v_work_email_review_row.person_key||
          ':source:'||v_work_email_review_row.source_event_id,
        substring(v_work_email_review_row.source_revision from 1 for 10),
        'Europe/Amsterdam',
        encode(sha256(convert_to(
          v_work_email_review_row.person_key||':'||
          v_work_email_review_row.source_event_id||':'||
          v_work_email_review_row.source_revision||':'||
          v_work_email_review_row.identity_brain_id::text,
          'UTF8')),'hex'),
        'heartbeat-source-review:'||v_work_email_review_row.source_event_id,
        'original-agent:commercial'
      );
      if v_work_email_owner_ack.state='OPEN' then
        v_work_email_owner_ack:=public.brain_transition_obligation(
          v_work_email_owner_ack.id,v_work_email_owner_ack.version,
          'BLOCKED','original-agent:commercial',
          jsonb_build_object(
            'contract','ORIGINAL_PUBLIC_WORK_EMAIL_COMMERCIAL_SAFE_REVIEW_V1',
            'state','OWNER_ACCEPTED_SAFE_HOLD',
            'reason',case
              when v_work_email_review_row.candidate->>'contact_approval_evidenced'='true'
                then 'WORK_EMAIL_UNVERIFIED_DELIVERABILITY'
              else 'NO_APPROVED_CONTACT_BASIS_AND_UNVERIFIED_DELIVERABILITY'
            end,
            'source_event_id',v_work_email_review_row.source_event_id,
            'source_revision',v_work_email_review_row.source_revision,
            'original_research_action_id',v_work_email_review_row.research_action_id,
            'identity_brain_obligation_id',v_work_email_review_row.identity_brain_id,
            'heartbeat_receipt_event_id',v_work_email_review_row.receipt_id,
            'processed_at',p_now,
            'next_owner','original-agent:commercial',
            'next_action','VERIFY_SOURCE_DELIVERABILITY_LAWFUL_BASIS_AND_SUPPRESSIONS',
            'candidate_only',true,
            'verification_state','UNVERIFIED',
            'canonical_email_written',false,
            'provider_send_authorized',false,
            'recipient_consent_inferred',false,
            'external_messages_sent',0,
            'realized_revenue_claimed',false,
            'one_original_chain',true
          )
        );
        v_work_email_review_acks_created:=v_work_email_review_acks_created+1;
      end if;
    end loop;
  end if;

  select count(*)::int into v_work_email_review_acks_blocked_total
  from public.brain_obligations b
  where b.obligation_type='COMMERCIAL_EXECUTION'
    and b.capability_id='powerhouse-original-public-work-email-commercial-safe-review-v1'
    and b.owner='original-agent:commercial'
    and b.state='BLOCKED';

  select count(*)::int into v_email_receipts_total
  from public.powerhouse_runtime_events e
  where e.event_type='contact_public_work_email_heartbeat_receipt'
    and e.evidence->>'contract'='ORIGINAL_PUBLIC_WORK_EMAIL_HEARTBEAT_SOURCE_RECEIPT_V1';
  select count(*)::int into v_email_source_retry_backlog
  from public.powerhouse_sales_actions a
  where a.action_type='research_enrichment'
    and a.channel='internal'
    and a.status='done'
    and a.dedupe_key like 'relationship-research:public-domain:%'
    and a.evidence->>'public_email_source_checked'='false'
    and nullif(a.evidence->>'public_email_next_attempt_at','') is not null;

  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,occurred_at,evidence,context,state,data_quality,confidence
  ) values (
    'commercial-heartbeat:'||to_char(p_now at time zone 'UTC','YYYYMMDDHH24MI'),
    'commercial_heartbeat','powerhouse-commercial-heartbeat-v1','growth-revenue-os',p_now,
    jsonb_build_object(
      'full_cycle_executed',v_full_needed,'full_cycle',v_full,'composer',v_composer,
      'research_promotion',v_promote,'current_action_set',v_current_set,
      'social_release',v_social_release,'social_dispatch',v_social_dispatch,
      'provider_error_closure',v_provider_error_closure,'closure',v_closure,
      'terminal_lineage',v_terminal,'output_assurance',v_output,'regression_gate',v_gate,
      'commercial_day_proven',v_proven,
      'control_plane_healthy',v_control_healthy,
      'commercial_delivery_healthy',coalesce((v_output->>'healthy')::boolean,false),
      'commercial_day_state',v_output->>'commercial_day_state',
      'public_work_email_source_heartbeat_receipts_created',v_email_receipts_written,
      'public_work_email_source_heartbeat_receipts_total',v_email_receipts_total,
      'public_work_email_commercial_owner_acks_created',v_work_email_review_acks_created,
      'public_work_email_commercial_review_blocked_total',v_work_email_review_acks_blocked_total,
      'public_work_email_unreadable_source_retry_backlog',v_email_source_retry_backlog,
      'public_work_email_handoff_state',case
        when v_email_source_retry_backlog>0 then 'DEGRADED_SOURCE_RETRY_OPEN'
        when v_email_receipts_total>0 then 'CANDIDATE_VERIFICATION_REQUIRED'
        else 'NO_VERIFIED_CANDIDATE' end
    ),
    jsonb_build_object(
      'single_scheduler_owner',true,'scheduler_authority','NETLIFY_SUPABASE_EDGE',
      'existing_state_first',true,'terminal_lineage_required',true,
      'provider_execution_owned_by_canonical_channel_executors',true
    ),
    case when not v_control_healthy then 'error'
      when v_proven then 'actioned'
      else 'observed' end,
    case when v_control_healthy then 'VERIFIED' else 'PARTIAL' end,
    case when v_control_healthy then 1 else 0.5 end
  )
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,evidence=excluded.evidence,context=excluded.context,
    state=excluded.state,data_quality=excluded.data_quality,confidence=excluded.confidence,
    updated_at=now();

  return jsonb_build_object(
    'contract','powerhouse-commercial-heartbeat-v1','run_date',v_run_date,
    'full_cycle_executed',v_full_needed,'current_action_set',v_current_set,
    'social_release',v_social_release,'social_dispatch',v_social_dispatch,
    'provider_error_closure',v_provider_error_closure,'output_assurance',v_output,
    'terminal_lineage',v_terminal,'regression_gate',v_gate,
    'healthy',v_control_healthy,
    'commercial_delivery_healthy',coalesce((v_output->>'healthy')::boolean,false),
    'commercial_day_proven',v_proven,
    'commercial_day_state',v_output->>'commercial_day_state',
    'public_work_email_source_heartbeat_receipts_created',v_email_receipts_written,
    'public_work_email_source_heartbeat_receipts_total',v_email_receipts_total,
      'public_work_email_commercial_owner_acks_created',v_work_email_review_acks_created,
      'public_work_email_commercial_review_blocked_total',v_work_email_review_acks_blocked_total,
    'public_work_email_unreadable_source_retry_backlog',v_email_source_retry_backlog,
    'public_work_email_handoff_state',case
      when v_email_source_retry_backlog>0 then 'DEGRADED_SOURCE_RETRY_OPEN'
      when v_email_receipts_total>0 then 'CANDIDATE_VERIFICATION_REQUIRED'
      else 'NO_VERIFIED_CANDIDATE' end,
    'executed_at',p_now
  );
end;
$function$
;
-- Explicitly preserve original provider-verified SECURITY DEFINER ACL.
revoke execute on function public.powerhouse_commercial_heartbeat_v1(timestamptz)
  from public, anon, authenticated;
grant execute on function public.powerhouse_commercial_heartbeat_v1(timestamptz)
  to service_role;
comment on function public.powerhouse_commercial_heartbeat_v1(timestamptz) is
'Original commercial Heartbeat: idempotent source-bound #138 receipt and original-agent:commercial ONE BRAIN safe-review owner acceptance. Unverified business-email candidate is not sendable.';
