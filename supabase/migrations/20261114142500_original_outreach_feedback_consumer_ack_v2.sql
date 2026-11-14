-- Original P0 #4198 follow-up; no new scheduler / sender / publication.
-- Restore exact source→original-action ACK for both prepared and waiting,
-- and for real provider NO_SOURCE outcomes; provider source ≠ send authority.
-- Service-role only and same original hourly stage #116 function invocation.
create or replace function public.powerhouse_reconcile_relationship_research_handoff_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql security definer
set search_path to 'pg_catalog','public'
as $handoff$
declare
  v_now timestamptz:=now();
  v_touched int:=0;
  v_tracked int:=0;
  v_overdue int:=0;
  v_provider_attempts int:=0;
  v_consumer_receipts int:=0;
  v_waiting int:=0;
begin
  if p_run_date is distinct from (v_now at time zone 'Europe/Amsterdam')::date then
    return jsonb_build_object('contract','original-research-consumer-handoff-receipts-v1',
      'tracked',0,'overdue',0,'reason','non_current_business_day','external_send_executed',false);
  end if;
  if not pg_try_advisory_xact_lock(hashtextextended('original-research-handoff:'||p_run_date::text,0)) then
    return jsonb_build_object('contract','original-research-consumer-handoff-receipts-v1',
      'tracked',0,'overdue',0,'reason','original_owner_busy','external_send_executed',false);
  end if;

  -- Same original #116 reconciler repairs a *missing receiver ACK* for the
  -- existing outbound-source row. Never create a second email or reset status.
  -- Both the actual provider attempt and exact original action identity are required.
  update public.powerhouse_sales_actions o
  set evidence=jsonb_set(coalesce(o.evidence,'{}'::jsonb),
    '{relationship_research_feedback}',
    jsonb_build_object(
      'contract','ORIGINAL_RELATIONSHIP_RESEARCH_RESULT_ACK_V2',
      'research_action_id',a.action_id::text,
      'original_outreach_action_id',o.action_id::text,
      'source_status','NO_VERIFIED_SOURCE_RETRY',
      'provider','dataforseo-serp',
      'provider_researched_at',a.evidence#>>'{public_research_execution,researched_at}',
      'next_research_at',a.evidence#>>'{public_research_execution,next_research_at}',
      'correlation_id',a.action_id::text,
      'accepted_by_original_action_at',v_now,
      'recipient_send_authority_inferred',false,
      'external_send_executed',false
    ),true),updated_at=v_now
  from public.powerhouse_sales_actions a
  where a.dedupe_key='relationship-research:outreach-source:'||o.action_id::text
    and a.action_type='research_enrichment' and a.channel='internal'
    and a.status='waiting'
    and a.person_key=o.person_key and a.company_key=o.company_key
    and a.evidence->>'original_outreach_action_id'=o.action_id::text
    and a.evidence#>>'{public_research_execution,provider}'='dataforseo-serp'
    and a.evidence#>>'{public_research_execution,reason}'='NO_VERIFIED_SOURCE_IN_BOUNDED_ORIGINAL_SEARCH'
    and nullif(a.evidence#>>'{public_research_execution,researched_at}','') is not null
    and o.action_type='autonomous_email' and o.channel='email'
    and o.status in ('prepared','waiting')
    and o.evidence#>>'{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
    and nullif(o.evidence#>>'{autonomous_outbound,provider_message_id}','') is null
    and nullif(o.evidence#>>'{native_gmail_executor,provider_message_id}','') is null
    and nullif(o.evidence->>'provider_message_id','') is null
    and coalesce(o.evidence#>>'{autonomous_outbound,needs_readback}','false')<>'true'
    and coalesce(o.evidence#>>'{autonomous_outbound,republish_forbidden}','false')<>'true'
    and coalesce(o.evidence#>>'{provider_ambiguity_quarantine,external_resend_forbidden}','false')<>'true'
    and (
      nullif(o.evidence#>>'{relationship_research_feedback,provider_researched_at}','') is null
      or (
        (o.evidence#>>'{relationship_research_feedback,provider_researched_at}')::timestamptz
        < (a.evidence#>>'{public_research_execution,researched_at}')::timestamptz
      )
    );

  -- A SERP result is an unverified SOURCE CANDIDATE only. Restore a lost
  -- original-worker writeback for prepared OR waiting actions, same identity.
  -- Never infer a verified publication, composer quality or Gmail authority.
  update public.powerhouse_sales_actions o
  set evidence=jsonb_set(
    jsonb_set(coalesce(o.evidence,'{}'::jsonb),
      '{relationship_source_candidate}',a.evidence->'relationship_source_candidate',true),
    '{relationship_research_feedback}',
    jsonb_build_object(
      'contract','ORIGINAL_RELATIONSHIP_RESEARCH_RESULT_ACK_V2',
      'research_action_id',a.action_id::text,
      'original_outreach_action_id',o.action_id::text,
      'source_status','UNVERIFIED_SOURCE_CANDIDATE',
      'provider','dataforseo-serp',
      'provider_researched_at',a.evidence#>>'{public_research_execution,observed_at}',
      'correlation_id',a.action_id::text,
      'accepted_by_original_action_at',v_now,
      'recipient_send_authority_inferred',false,
      'external_send_executed',false
    ),true),updated_at=v_now
  from public.powerhouse_sales_actions a
  where a.dedupe_key='relationship-research:outreach-source:'||o.action_id::text
    and a.action_type='research_enrichment' and a.channel='internal' and a.status='done'
    and a.person_key=o.person_key and a.company_key=o.company_key
    and a.evidence->>'original_outreach_action_id'=o.action_id::text
    and a.evidence#>>'{public_research_execution,provider}'='dataforseo-serp'
    and a.evidence#>>'{relationship_source_candidate,research_action_id}'=a.action_id::text
    and a.evidence#>>'{relationship_source_candidate,original_outreach_action_id}'=o.action_id::text
    and a.evidence#>>'{relationship_source_candidate,status}'='UNVERIFIED_SOURCE_CANDIDATE'
    and a.evidence#>>'{relationship_source_candidate,provider_send_authorized}'='false'
    and a.evidence#>>'{relationship_source_candidate,message_quality_approved}'='false'
    and a.evidence#>>'{relationship_source_candidate,source_page_independently_read}'='false'
    and a.evidence#>>'{relationship_source_candidate,freshness_verified}'='false'
    and nullif(a.evidence#>>'{relationship_source_candidate,source_url}','') like 'https://%'
    and o.action_type='autonomous_email' and o.channel='email'
    and o.status in ('prepared','waiting')
    and o.evidence#>>'{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
    and nullif(o.evidence#>>'{autonomous_outbound,provider_message_id}','') is null
    and nullif(o.evidence#>>'{native_gmail_executor,provider_message_id}','') is null
    and nullif(o.evidence->>'provider_message_id','') is null
    and coalesce(o.evidence#>>'{autonomous_outbound,needs_readback}','false')<>'true'
    and coalesce(o.evidence#>>'{autonomous_outbound,republish_forbidden}','false')<>'true'
    and coalesce(o.evidence#>>'{provider_ambiguity_quarantine,external_resend_forbidden}','false')<>'true'
    and (o.evidence#>>'{relationship_source_candidate,research_action_id}' is null
      or o.evidence#>>'{relationship_source_candidate,research_action_id}'=a.action_id::text)
    and (o.evidence#>>'{relationship_research_feedback,provider_researched_at}' is distinct from
      a.evidence#>>'{public_research_execution,observed_at}');

  with tracked as (
    select a.action_id,a.dedupe_key,a.subject_key,a.person_key,a.company_key,
      a.status,a.created_at,a.due_at,a.executed_at,a.evidence,
      nullif(a.evidence#>>'{public_research_execution,source_url}','') as original_source_url,
      (
        a.evidence#>>'{public_research_execution,provider}'='dataforseo-serp'
        and (nullif(a.evidence#>>'{public_research_execution,researched_at}','') is not null
          or nullif(a.evidence#>>'{public_research_execution,observed_at}','') is not null)
      ) as provider_attempt_proven,
      nullif(a.evidence->>'original_outreach_action_id','') as original_outreach_action_id
    from public.powerhouse_sales_actions a
    where a.action_type='research_enrichment'
      and a.channel='internal'
      and (a.dedupe_key like 'relationship-research:approved-source:%'
        or a.dedupe_key like 'relationship-research:outreach-source:%')
      and a.created_at >= v_now-interval '10 days'
    order by a.created_at desc,a.action_id
    limit 250
  ), with_consumer as (
    select t.*,
      o.action_id as consumer_action_id,
      o.status as consumer_status,
      (o.action_id is not null
        and o.evidence#>>'{relationship_source_candidate,research_action_id}'=t.action_id::text
        and o.evidence#>>'{relationship_source_candidate,original_outreach_action_id}'=o.action_id::text
        and o.evidence#>>'{relationship_source_candidate,status}'='UNVERIFIED_SOURCE_CANDIDATE'
      ) as candidate_received,
      (o.action_id is not null and t.provider_attempt_proven
        and o.evidence#>>'{relationship_research_feedback,research_action_id}'=t.action_id::text
        and o.evidence#>>'{relationship_research_feedback,original_outreach_action_id}'=o.action_id::text
        and o.evidence#>>'{relationship_research_feedback,source_status}'='NO_VERIFIED_SOURCE_RETRY'
        and o.evidence#>>'{relationship_research_feedback,provider_researched_at}'=
          t.evidence#>>'{public_research_execution,researched_at}'
        and coalesce(o.evidence#>>'{relationship_research_feedback,recipient_send_authority_inferred}','true')='false'
      ) as no_source_received
    from tracked t
    left join public.powerhouse_sales_actions o
      on o.action_id::text=t.original_outreach_action_id
      and o.action_type='autonomous_email'
      and o.person_key=t.person_key
      and o.company_key=t.company_key
  ), classified as (
    select c.*,
      case
        when c.candidate_received then 'ORIGINAL_COMPOSER_RECEIVED_UNVERIFIED_CANDIDATE'
        when c.no_source_received then 'ORIGINAL_RESEARCH_NO_SOURCE_RECEIVED_RETRY_QUEUED'
        when c.original_outreach_action_id is not null
          and c.consumer_action_id is null then 'ORIGINAL_RECIPIENT_ACTION_NOT_FOUND'
        when c.original_outreach_action_id is not null
          and c.consumer_status in ('done','skipped','expired')
          then 'ORIGINAL_TERMINAL_NO_RESEND'
        when c.original_outreach_action_id is not null
          and c.provider_attempt_proven and c.original_source_url is null
          and c.consumer_action_id is not null then 'ORIGINAL_CONSUMER_NO_SOURCE_ACK_MISSING'
        when c.original_outreach_action_id is not null
          and c.original_source_url is not null and c.consumer_action_id is not null
          then 'ORIGINAL_CONSUMER_CANDIDATE_ACK_MISSING'
        when c.original_source_url is not null then 'SOURCE_CANDIDATE_NOT_MESSAGE_AUTHORITY'
        when c.provider_attempt_proven then 'PROVIDER_ATTEMPT_NO_VERIFIED_SOURCE_RETRY'
        when c.status in ('suggested','prepared','waiting')
          and coalesce(c.due_at,c.created_at)<=v_now-interval '2 hours'
          then 'PROVIDER_RECEIPT_OVERDUE'
        when c.status in ('skipped','expired')
          then 'ORIGINAL_RESEARCH_TERMINAL_WITHOUT_SOURCE'
        else 'RESEARCH_ENQUEUED_AWAITING_PROVIDER'
      end as handoff_status
    from with_consumer c
  )
  insert into public.powerhouse_runtime_events(
    dedupe_key,event_type,source,subject_key,person_key,company_key,channel,
    occurred_at,evidence,context,state,data_quality,confidence,updated_at
  )
  select
    'original-research-owner-handoff:'||c.action_id::text,
    'relationship_research_owner_handoff',
    'powerhouse-commercial-learning-v1',
    -- Administrative ACK is NOT a commercial signal: prevent source scoring feedback loops.
    c.subject_key,null,null,'internal',v_now,
    jsonb_build_object(
      'contract','original-research-consumer-handoff-receipts-v1',
      'correlation_id',c.action_id::text,
      'person_key',c.person_key,
      'company_key',c.company_key,
      'research_action_id',c.action_id::text,
      'original_outreach_action_id',c.original_outreach_action_id,
      'research_dedupe_key',c.dedupe_key,
      'handoff_status',c.handoff_status,
      'producer_receipt',true,
      'provider_attempt_received',c.provider_attempt_proven,
      'provider_source_candidate_present',c.original_source_url is not null,
      'original_consumer_receipt',(c.candidate_received or c.no_source_received),
      'consumer_no_source_disposition_received',c.no_source_received,
      'consumer_candidate_unverified',c.candidate_received,
      'research_due_at',c.due_at,
      'original_email_send_executed',false,
      'gmail_provider_delivery_proven',false,
      'recipient_send_authority_inferred',false,
      'exact_owner_required',true
    ),
    jsonb_build_object(
      'run_date',p_run_date,
      'producer','powerhouse_prime_approved_connection_research_v1',
      'research_owner','powerhouse-relationship-public-research',
      'consumer_owner',case when c.original_outreach_action_id is null
        then 'original-commercial-action-materializer' else 'original-commercial-message-composer' end,
      'canonical_cron_id',116,'single_scheduler',true,
      'no_parallel_sender',true
    ),
    case when c.handoff_status in (
      'PROVIDER_RECEIPT_OVERDUE','ORIGINAL_CONSUMER_CANDIDATE_ACK_MISSING',
      'ORIGINAL_CONSUMER_NO_SOURCE_ACK_MISSING',
      'ORIGINAL_RECIPIENT_ACTION_NOT_FOUND'
    ) then 'error'
    when c.handoff_status in (
      'ORIGINAL_COMPOSER_RECEIVED_UNVERIFIED_CANDIDATE',
      'ORIGINAL_RESEARCH_NO_SOURCE_RECEIVED_RETRY_QUEUED',
      'SOURCE_CANDIDATE_NOT_MESSAGE_AUTHORITY',
      'ORIGINAL_TERMINAL_NO_RESEND'
    ) then 'observed'
    else 'observed' end,
    case when c.candidate_received then 'UNVERIFIED_SOURCE_CANDIDATE_ONLY'
      when c.no_source_received then 'NO_SOURCE_DISPOSITION_ACK_ONLY'
      when c.provider_attempt_proven then 'PROVIDER_ATTEMPT_RECEIPT_ONLY'
      else 'OWNER_HANDOFF_PENDING' end,
    case when c.candidate_received or c.no_source_received then 1 else 0 end,
    v_now
  from classified c
  on conflict(dedupe_key) do update set
    occurred_at=excluded.occurred_at,
    evidence=excluded.evidence,
    context=excluded.context,
    state=excluded.state,
    data_quality=excluded.data_quality,
    confidence=excluded.confidence,
    updated_at=v_now;

  get diagnostics v_touched=row_count;
  select count(*)::int,
    count(*)filter(where e.state='error')::int,
    count(*)filter(where e.evidence->>'provider_attempt_received'='true')::int,
    count(*)filter(where e.evidence->>'original_consumer_receipt'='true')::int,
    count(*)filter(where e.evidence->>'handoff_status' in ('PROVIDER_ATTEMPT_NO_VERIFIED_SOURCE_RETRY','RESEARCH_ENQUEUED_AWAITING_PROVIDER','SOURCE_CANDIDATE_NOT_MESSAGE_AUTHORITY'))::int
  into v_tracked,v_overdue,v_provider_attempts,v_consumer_receipts,v_waiting
  from public.powerhouse_runtime_events e
  where e.event_type='relationship_research_owner_handoff'
    and e.updated_at>=v_now-interval '3 minutes'
    and e.context->>'run_date'=p_run_date::text;
  return jsonb_build_object(
    'contract','original-research-consumer-handoff-receipts-v1',
    'run_date',p_run_date,
    'tracked',v_tracked,'touched',v_touched,
    'overdue',v_overdue,
    'provider_attempts',v_provider_attempts,
    'consumer_receipts',v_consumer_receipts,
    'waiting',v_waiting,
    'external_send_executed',false,
    'gmail_delivery_proven',false,
    'no_false_green',true
  );
end;
$handoff$;
revoke all on function public.powerhouse_reconcile_relationship_research_handoff_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_reconcile_relationship_research_handoff_v1(date) to service_role;
