-- ORIGINAL P0 #4198. Persistent provider and next-owner receipts in the existing
-- #116 commercial stage; no second scheduler, no new action producer or sender.
-- A DataForSEO snippet is an UNVERIFIED source candidate, never Gmail authority.
-- Persist action-level original producer -> research provider -> consumer receipts
-- in the EXISTING ONE BRAIN runtime event ledger, no new tables or schedulers.
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
      ) as candidate_received
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
        when c.original_outreach_action_id is not null
          and c.consumer_action_id is null then 'ORIGINAL_RECIPIENT_ACTION_NOT_FOUND'
        when c.original_outreach_action_id is not null
          and c.consumer_status in ('done','skipped','expired')
          then 'ORIGINAL_TERMINAL_NO_RESEND'
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
      'original_consumer_receipt',c.candidate_received,
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
      'ORIGINAL_RECIPIENT_ACTION_NOT_FOUND'
    ) then 'error'
    when c.handoff_status in (
      'ORIGINAL_COMPOSER_RECEIVED_UNVERIFIED_CANDIDATE',
      'SOURCE_CANDIDATE_NOT_MESSAGE_AUTHORITY',
      'ORIGINAL_TERMINAL_NO_RESEND'
    ) then 'observed'
    else 'waiting' end,
    case when c.candidate_received then 'UNVERIFIED_SOURCE_CANDIDATE_ONLY'
      when c.provider_attempt_proven then 'PROVIDER_ATTEMPT_RECEIPT_ONLY'
      else 'OWNER_HANDOFF_PENDING' end,
    case when c.candidate_received then 1 else 0 end,
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
    count(*)filter(where e.state='waiting')::int
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

revoke all on function public.powerhouse_reconcile_relationship_research_handoff_v1(date)
 from public,anon,authenticated;
grant execute on function public.powerhouse_reconcile_relationship_research_handoff_v1(date)
 to service_role;

-- Retain the original closed stage catalogue and original cron; add only
-- after-the-stage recipient/provider readback and honest waiting/error semantics.
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_hourly_stage_v1(p_stage integer, p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
 v_names constant text[] := array[
  'powerhouse_refresh_relationship_revenue_v1',
  'powerhouse_execute_relationship_research_v1',
  'powerhouse_dispatch_relationship_public_research_v1',
  'powerhouse_refresh_trigger_based_mkb_acquisition_v1',
  'powerhouse_refresh_linkedin_company_growth_v1',
  'powerhouse_refresh_growth_swarm_v1',
  'powerhouse_materialize_growth_swarm_v1',
  'powerhouse_activate_all_growth_plays_v2',
  'powerhouse_execute_growth_play_actions_v1',
  'powerhouse_dispatch_linkedin_sales_machine_v1',
  'powerhouse_prepare_autonomous_outreach_v1',
  'powerhouse_optimize_prepared_outreach_v1',
  'powerhouse_dispatch_autonomous_outreach_v1',
  'powerhouse_commercial_learning_cycle_v1'
 ];
 v_fn text;
 v_result jsonb;
 v_handoff jsonb;
 v_bad boolean;
 v_state text;
 v_hour text := to_char(now() at time zone 'UTC','YYYYMMDDHH24');
begin
 if p_stage is null or p_stage<1 or p_stage>array_length(v_names,1) then
   raise exception 'INVALID_CANONICAL_COMMERCIAL_STAGE: %',p_stage;
 end if;
 v_fn := v_names[p_stage];
 if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-commercial-stage:'||v_fn,0)) then
   return jsonb_build_object('stage',v_fn,'state','BUSY','retriable',true);
 end if;
 -- Names are taken only from the closed, constant catalogue above.
 execute format('select public.%I($1)',v_fn) into v_result using p_run_date;
 -- Existing stage #116 gets the action-level consumer/provider acknowledgement.
 if p_stage in (2,3) then
   v_handoff := public.powerhouse_reconcile_relationship_research_handoff_v1(p_run_date);
 end if;
 v_bad := (v_result is null or jsonb_typeof(v_result)<>'object' or
           coalesce(v_result->>'degraded','false')='true' or
           coalesce(v_result->>'healthy','true')='false' or
           coalesce((v_result->>'failure_count')::int,0)>0);
 if p_stage in (2,3) then
   v_bad := v_bad
     or coalesce((v_handoff->>'overdue')::int,0)>0
     or (p_stage=3 and coalesce((v_result->>'pending')::int,0)>0
        and (coalesce((v_result->>'dispatched')::boolean,false)=false
             or nullif(v_result->>'request_id','') is null));
 end if;
 v_state := case when v_bad then 'error'
   when p_stage in (2,3) and coalesce((v_handoff->>'tracked')::int,0)>
        coalesce((v_handoff->>'consumer_receipts')::int,0) then 'waiting'
   else 'actioned' end;
 -- INTERNAL stage receipt, never external provider delivery or realized revenue.
 insert into public.powerhouse_runtime_events(
  dedupe_key,event_type,source,subject_key,occurred_at,
  evidence,context,state,data_quality,confidence,updated_at
 ) values (
  'commercial-stage:'||v_hour||':'||v_fn,
  'commercial_stage_execution',
  'powerhouse-commercial-learning-v1',
  v_fn,now(),
  jsonb_build_object(
    'run_date',p_run_date,'stage',v_fn,'stage_number',p_stage,
    'result_contract',v_result->>'contract',
    'reported_degraded',v_bad,
    'failure_count',v_result->>'failure_count',
    'research_handoff_receipt',v_handoff,
    'original_provider_request_id',case when p_stage=3 then v_result->>'request_id' else null end,
    'provider_dispatched',case when p_stage=3 then v_result->>'dispatched' else null end,
    'truth_boundary','Internal stage completion does not prove any provider send, reply, conversion or sale'
  ),
  jsonb_build_object(
    'canonical_job_id',116,
    'single_existing_scheduler',true,
    'contact_source_refresh_owner','powerhouse-identity-graph-v1',
    'independent_transaction_per_stage',true
  ),v_state,'INTERNAL_STAGE_RECEIPT',1,now()
 )
 on conflict(dedupe_key) do update set
  occurred_at=excluded.occurred_at,
  evidence=excluded.evidence,context=excluded.context,
  state=excluded.state,updated_at=now();
 return jsonb_build_object('contract','powerhouse-commercial-stage-isolation-v1',
   'run_date',p_run_date,'stage',v_fn,'stage_number',p_stage,
   'degraded',v_bad,'state',v_state,
   'provider_delivery_proven',false,
   'research_handoff_receipt',v_handoff,
   'result_contract',v_result->>'contract');
end;
$function$

-- Do not dispatch a new DataForSEO call for a 24h source retry whose due_at
-- is still in the future. The existing Edge worker already uses this due gate.
CREATE OR REPLACE FUNCTION public.powerhouse_dispatch_relationship_public_research_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare v_token text; v_request_id bigint; v_pending int;
begin
  select count(*)::int into v_pending
  from public.powerhouse_sales_actions
  where action_type='research_enrichment' and channel='internal'
    and status in ('suggested','prepared','waiting')
    and dedupe_key like 'relationship-research:%'
    and (due_at is null or due_at<=now());

  if v_pending=0 then
    return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','NO_DUE_RESEARCH','pending',0);
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;

  if nullif(v_token,'') is null then
    return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING','pending',v_pending);
  end if;

  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-relationship-public-research',
    headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body:=jsonb_build_object('run_date',p_run_date),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object('contract','powerhouse-relationship-public-research-dispatch-v1',
    'dispatched',true,'pending',v_pending,'request_id',v_request_id,'run_date',p_run_date);
end $function$
