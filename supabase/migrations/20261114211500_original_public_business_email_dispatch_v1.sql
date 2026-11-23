-- P0 public business work-email candidate, SAME ORIGINAL commercial #116 dispatcher.
-- Existing site research is free first-party domain verification; no new SERP,
-- purchased email provider, CRM, sender, cron, queue or user consent inference.
-- Original provider-applied migration baseline is not altered or forged; new version follows original source #5792 at 21:00.
create or replace function public.powerhouse_dispatch_relationship_public_research_v1(
  p_run_date date default (now() at time zone 'Europe/Amsterdam')::date
) returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $function$
declare
  v_token text;
  v_request_id bigint;
  v_pending integer := 0;
  v_first_party_researched integer := 0;
  v_first_party_due boolean := false;
begin
  if p_run_date is distinct from (now() at time zone 'Europe/Amsterdam')::date then
    return jsonb_build_object(
      'contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','NON_CURRENT_BUSINESS_DAY',
      'run_date',p_run_date,'new_scheduler',false);
  end if;

  select count(*)::int into v_pending
  from public.powerhouse_sales_actions
  where action_type='research_enrichment' and channel='internal'
    and status in ('suggested','prepared','waiting')
    and dedupe_key like 'relationship-research:%'
    and (due_at is null or due_at<=now());

  -- This tally represents the SAME original internal action queue; never
  -- allocate an unbounded or parallel job when no research is due.
  select count(*)::int into v_first_party_researched
  from public.powerhouse_sales_actions
  where dedupe_key like 'relationship-research:public-domain:'||p_run_date::text||':%';

  if v_first_party_researched < 8 then
    select exists(
      select 1
      from (
        select distinct lower(btrim(known.bedrijf)) company
        from public.bg_connecties known
        where known.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
          and nullif(btrim(known.bedrijf),'') is not null
          and lower(split_part(known.email,'@',2)) not in
            ('gmail.com','outlook.com','hotmail.com','icloud.com',
             'live.nl','yahoo.com','proton.me','protonmail.com')
      ) known
      join public.bg_connecties missing
        on lower(btrim(missing.bedrijf))=known.company
      where missing.email is null
        and nullif(btrim(missing.naam),'') is not null
        and nullif(btrim(missing.sleutel),'') is not null
        and coalesce(missing.extra->>'approval_revoked','false')<>'true'
        and coalesce(missing.extra->>'do_not_contact','false')<>'true'
        and coalesce(missing.extra->>'opt_out','false')<>'true'
    ) into v_first_party_due;
  end if;

  if v_pending=0 and not v_first_party_due then
    return jsonb_build_object(
      'contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','NO_DUE_ORIGINAL_SOURCE_RESEARCH',
      'pending',0,'first_party_researched',v_first_party_researched,
      'new_scheduler',false,'external_send_executed',false);
  end if;

  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc limit 1;
  if nullif(v_token,'') is null then
    return jsonb_build_object(
      'contract','powerhouse-relationship-public-research-dispatch-v1',
      'dispatched',false,'reason','SCHEDULER_TOKEN_MISSING',
      'pending',v_pending,'first_party_due',v_first_party_due);
  end if;

  -- SAME Edge and private x-powerhouse-token; never a new endpoint.
  select net.http_post(
    url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-relationship-public-research',
    headers:=jsonb_build_object('content-type','application/json',
      'x-powerhouse-token',v_token),
    body:=jsonb_build_object('run_date',p_run_date),
    timeout_milliseconds:=120000
  ) into v_request_id;

  return jsonb_build_object(
    'contract','powerhouse-relationship-public-research-dispatch-v1',
    'dispatched',true,'pending',v_pending,
    'first_party_due',v_first_party_due,
    'first_party_researched_today',v_first_party_researched,
    'request_id',v_request_id,'run_date',p_run_date,
    'new_scheduler',false,'external_send_executed',false);
end
$function$;

revoke execute on function public.powerhouse_dispatch_relationship_public_research_v1(date)
  from public,anon,authenticated;
grant execute on function public.powerhouse_dispatch_relationship_public_research_v1(date)
  to service_role;
comment on function public.powerhouse_dispatch_relationship_public_research_v1(date) is
'Same original #116: dispatches already-due source research OR bounded first-party domain evidence-only candidates; no new cron, provider search, sender or recipient authority.';


-- Same original #138 independent identity-graph consumer. Exact source & contact
-- readback is required before ONE BRAIN PROCESSED (candidate only, no send).
create or replace function public.powerhouse_ack_public_business_email_candidates_v1(
 p_limit integer default 25
) returns jsonb language plpgsql security definer
set search_path=pg_catalog,public as $consumer$
declare
 r record;
 v_ack public.brain_obligations;
 v_valid boolean;
 v_processed integer:=0;
 v_held integer:=0;
 v_digest text;
begin
 if not pg_try_advisory_xact_lock(hashtextextended('original-public-work-email-consumer-v1',0)) then
   return jsonb_build_object('state','BUSY_RETRY','processed',0);
 end if;
 for r in
   select e.event_id,e.dedupe_key,e.person_key,e.company_key,e.evidence,e.context,
     lower(btrim(c.bedrijf)) as contact_company_key,
     c.extra#>'{public_work_email_candidate}' as candidate
   from public.powerhouse_runtime_events e
   join public.bg_connecties c on c.sleutel=e.person_key
   where e.event_type='contact_public_work_email_candidate'
     and e.state='observed'
     and e.evidence->>'handoff_state'='CANDIDATE_INGEST_ACK_CONSUMER_PROCESSED_PENDING'
   order by e.occurred_at,e.event_id
   limit greatest(1,least(coalesce(p_limit,25),50))
   for update of e skip locked
 loop
   if r.candidate is null or nullif(r.candidate->>'email','') is null
     or r.candidate->>'email_verification' is distinct from 'UNVERIFIED'
     or r.candidate->>'data_processing_state' is distinct from 'CANDIDATE_NOT_PROMOTED'
     or r.candidate->>'send_authorized' is distinct from 'false'
     or r.candidate->>'person_key' is distinct from r.person_key
     or r.contact_company_key is distinct from r.company_key
     or r.candidate->>'observed_at' is distinct from r.evidence->>'observed_at'
     or r.candidate->>'source_url' is distinct from r.evidence->>'source_url'
     or r.candidate->>'research_action_id' is distinct from r.context->>'correlation_id'
     or r.evidence->>'canonical_email_written' is distinct from 'false'
     or r.evidence->>'provider_send_authorized' is distinct from 'false'
   then
     v_held:=v_held+1; continue;
   end if;
   select exists(
     select 1 from public.powerhouse_sales_actions a
     where a.action_id::text=r.context->>'correlation_id'
       and a.person_key=r.person_key and a.company_key=r.company_key
       and a.channel='internal' and a.action_type='research_enrichment'
       and a.status='done'
   ) into v_valid;
   if not coalesce(v_valid,false) then
     v_held:=v_held+1; continue;
   end if;
   v_digest:=encode(sha256(convert_to(r.person_key||':'||
      (r.context->>'correlation_id')||':'||(r.evidence->>'source_url')||':'||
      (r.evidence->>'observed_at'),'UTF8')),'hex');
   v_ack:=public.brain_create_obligation(
     'COMMERCIAL_EXECUTION',
     'powerhouse-original-public-work-email-candidate-consumption-v1',
     'contact:'||r.person_key,
     substring(r.evidence->>'observed_at' from 1 for 10),
     'Europe/Amsterdam',v_digest,
     'source:'||r.event_id::text,'original-agent:identity-graph');
   if v_ack.state<>'FULFILLED' then
     v_ack:=public.brain_transition_obligation(v_ack.id,v_ack.version,
       'FULFILLED','original-agent:identity-graph',
       jsonb_build_object(
         'contract','ORIGINAL_PUBLIC_WORK_EMAIL_SOURCE_CONSUMER_V1',
         'state','PROCESSED','source_event_id',r.event_id,
         'source_revision',r.evidence->>'observed_at',
         'source_url',r.evidence->>'source_url',
         'original_action_id',r.context->>'correlation_id',
         'person_key',r.person_key,'company_key',r.company_key,
         'identity_source_readback_verified',true,
         'original_action_readback_verified',true,
         'consumer_owner','powerhouse-identity-graph-v1',
         'heartbeat_event_readback',false,
         'heartbeat_processed','NOT_PROVEN','processed_at',now(),
         'candidate_only',true,'verified_deliverability',false,
         'send_authority_inferred',false,
         'external_messages_sent',0,'realized_revenue_claimed',false)
     );
   end if;
   update public.powerhouse_runtime_events e
      set evidence=e.evidence||jsonb_build_object(
         'handoff_state','IDENTITY_GRAPH_PROCESSED',
         'consumer_processed_at',now(),
         'consumer_brain_obligation_id',v_ack.id,
         'identity_graph_readback_verified',true,
         'canonical_email_written',false),
         context=e.context||jsonb_build_object(
           'consumer_owner','powerhouse-identity-graph-v1',
           'consumer_result','PROCESSED',
           'original_brain_obligation_id',v_ack.id),
         state='decided',updated_at=now()
      where e.event_id=r.event_id and e.state='observed';
   if not found then raise exception 'ORIGINAL_CONTACT_CONSUMER_CAS_CONFLICT'; end if;
   v_processed:=v_processed+1;
 end loop;
 return jsonb_build_object(
   'contract','ORIGINAL_PUBLIC_WORK_EMAIL_SOURCE_CONSUMER_V1',
   'processed',v_processed,'held',v_held,
   'sender_email_promotions',0,'external_messages_sent',0);
end;
$consumer$;
revoke all on function public.powerhouse_ack_public_business_email_candidates_v1(integer)
 from public,anon,authenticated;
grant execute on function public.powerhouse_ack_public_business_email_candidates_v1(integer)
 to service_role;

-- Original #138 pulse code: one safe new consumer call, no cron change.
CREATE OR REPLACE FUNCTION public.powerhouse_connection_daily_pulse_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date, p_batch_size integer DEFAULT 500)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare
  v_total integer;
  v_done integer;
  v_reviewed_batch integer := 0;
  v_reviewed_today integer := 0;
  v_refresh jsonb := '{}'::jsonb;
  v_size integer := greatest(1, least(coalesce(p_batch_size,500),500));
  v_candidate_receipt jsonb := '{}'::jsonb;
begin
  if not pg_try_advisory_xact_lock(hashtextextended('powerhouse_connection_daily_pulse_v1',0)) then
    return jsonb_build_object('state','BUSY','run_date',p_run_date,'retriable',true);
  end if;

  select count(*) into v_total
  from public.bg_connecties c
  where coalesce(nullif(btrim(c.sleutel),''),nullif(btrim(c.linkedin_url),'')) is not null;

  select count(*) into v_done
  from public.powerhouse_connection_enrichment_state_v1
  where enrichment_date=p_run_date;

  if v_done < v_total then
    v_refresh := public.powerhouse_refresh_connection_enrichment_batch_v1(p_run_date,v_size);
  end if;

  -- Only facts already ingested from authorized/public sources are used here.
  -- The Brain's canonical NBA and provider gates decide whether any external action can execute.
  with todo as (
    select s.person_key,s.enrichment_date,
      case
        when lower(coalesce(s.source_snapshot #>> '{core,status}',''))='rust'
          then 'NO_ACTION_HOLD'
        when s.company_news_120d>0 and s.latest_external_at >= now()-interval '30 days'
          then 'COMPANY_SIGNAL_REVIEW'
        when s.external_signals_90d>0 and s.latest_external_at >= now()-interval '30 days'
          then 'EXTERNAL_SIGNAL_REVIEW'
        when s.linkedin_events_30d>0
          then 'LINKEDIN_ENGAGEMENT_REVIEW'
        when lower(coalesce(s.source_snapshot #>> '{core,status}',''))='in_gesprek'
          then 'FOLLOWUP_REVIEW'
        when s.data_completeness<0.60
          then 'CONTEXT_RESEARCH_REVIEW'
        else 'NO_ACTION'
      end as review_result,
      s.linkedin_events_30d,
      s.external_signals_90d,
      s.company_news_120d,
      s.latest_external_at
    from public.powerhouse_connection_enrichment_state_v1 s
    where s.source_snapshot #>> '{daily_decision,run_date}' is distinct from p_run_date::text
    order by s.enriched_at asc, s.person_key
    limit v_size
  ), updated as (
    update public.powerhouse_connection_enrichment_state_v1 s
    set source_snapshot=jsonb_set(
      coalesce(s.source_snapshot,'{}'::jsonb),
      '{daily_decision}',
      jsonb_build_object(
        'run_date',p_run_date::text,
        'source_enrichment_date',t.enrichment_date,
        'review_based_on_historical_snapshot',t.enrichment_date is distinct from p_run_date,
        'reviewed_at',now(),
        'result',t.review_result,
        'evidence',jsonb_build_object(
          'linkedin_events_30d',t.linkedin_events_30d,
          'external_signals_90d',t.external_signals_90d,
          'company_news_120d',t.company_news_120d,
          'latest_external_at',t.latest_external_at),
        'decision_authority','canonical_powerhouse_commercial_next_best_action',
        'execution_authority','existing_canonical_channel_and_consent_gates',
        'direct_provider_action_executed',false,
        'fresh_external_lookup_performed',false,
        'sensitive_inference_allowed',false
      ),true),
      updated_at=now()
    from todo t where s.person_key=t.person_key
    returning s.person_key
  )
  select count(*) into v_reviewed_batch from updated;

  select count(*) into v_done
  from public.powerhouse_connection_enrichment_state_v1 where enrichment_date=p_run_date;
  select count(*) into v_reviewed_today
  from public.powerhouse_connection_enrichment_state_v1
  where source_snapshot #>> '{daily_decision,run_date}'=p_run_date::text;

  v_candidate_receipt:=public.powerhouse_ack_public_business_email_candidates_v1(25);
  return jsonb_build_object(
    'contract','powerhouse-connection-daily-pulse-v1',
    'run_date',p_run_date,
    'total_connections',v_total,
    'enriched_today',v_done,
    'reviewed_today',v_reviewed_today,
    'reviewed_this_batch',v_reviewed_batch,
    'remaining_to_review',greatest(0,v_total-v_reviewed_today),
    'all_connections_reviewed',v_reviewed_today>=v_total,
    'refresh',v_refresh,
    'public_work_email_candidate_consumer',v_candidate_receipt,
    'provider_messages_sent',0,
    'assurance','internal_facts_reviewed_not_external_delivery_proof'
  );
end;
$function$;

revoke execute on function public.powerhouse_connection_daily_pulse_v1(date,integer) from public,anon,authenticated;
grant execute on function public.powerhouse_connection_daily_pulse_v1(date,integer) to service_role;
