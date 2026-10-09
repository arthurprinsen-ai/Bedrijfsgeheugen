-- P0 #4198: Do not lose real provider-inbox-verified SalesRobot DMs from the ONE Brain daily commercial proof.
-- Same function/contract/scheduler; no provider send, prospect import, CRM duplication or authorization bypass.
-- Adds explicit provider_proven_salesrobot_dm to the existing commercial proof and obligation readback.
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_output_assurance_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_now timestamptz := now();
  v_email int := 0;
  v_social int := 0;
  v_dm int := 0;
  v_dm_proofs jsonb := '[]'::jsonb;
  v_publications int := 0;
  v_publication_proofs jsonb := '[]'::jsonb;
  v_set int := 0;
  v_decisions int := 0;
  v_stale int := 0;
  v_proofs jsonb := '[]'::jsonb;
  v_proven boolean;
  v_safe_no_send boolean;
  v_result jsonb;
begin
  -- No action is provider-proven from status='done' alone.
  select count(*)::int into v_email
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('email','e-mail')
    and a.status='done'
    and (a.executed_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and (
      coalesce(a.evidence->>'provider_ack_verified','false')='true'
      or coalesce(a.evidence->>'provider_readback_verified','false')='true'
    )
    and nullif(btrim(coalesce(a.evidence->>'provider_message_id','')),'') is not null
    and nullif(btrim(coalesce(a.evidence->>'provider_thread_id','')),'') is not null;

  select count(*)::int into v_social
  from public.powerhouse_sales_actions a
  where lower(a.channel) in ('linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin dm','linkedin_dm')
    and a.status='done'
    and (a.executed_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and coalesce(a.evidence->>'provider_ack_verified','false')='true'
    and coalesce(
      nullif(btrim(a.evidence->>'provider_post_id'),''),
      nullif(btrim(a.evidence->>'provider_comment_id'),''),
      nullif(btrim(a.evidence->>'provider_object_id'),'')
    ) is not null;


  -- A SalesRobot DM is only delivered when the action FK and independent
  -- campaign-scoped provider inbox receipt agree on person, campaign and message.
  -- Existing top-level social receipts keep their original path, never double count.
  select coalesce(jsonb_agg(jsonb_build_object(
    'action_id',a.action_id,
    'event_id',e.event_id,
    'channel','linkedin_dm',
    'provider','salesrobot',
    'provider_object_id',a.evidence->>'provider_message_id',
    'provider_campaign_uuid',a.evidence->>'provider_campaign_uuid',
    'provider_inbox_readback',true,
    'executed_at',a.executed_at
  )), '[]'::jsonb)
  into v_dm_proofs
  from public.powerhouse_sales_actions a
  join public.powerhouse_runtime_events e on e.event_id=a.event_id
  where a.action_type='salesrobot_linkedin_dm'
    and a.channel='linkedin_dm'
    and a.status='done'
    and (a.executed_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and e.event_type='salesrobot_linkedin_dm_sent'
    and e.source='salesrobot'
    and e.channel='linkedin_dm'
    and e.state='observed'
    and e.data_quality='OBSERVED'
    and e.evidence->>'provider_inbox_readback'='true'
    and e.evidence->>'inbox_message_sent_by_me'='true'
    and e.evidence->>'provider_step_status'='SENT'
    and a.evidence->>'inbox_readback_verified'='true'
    and a.evidence->>'provider_message_id'=e.evidence->>'inbox_message_id'
    and a.evidence->>'provider_campaign_uuid'=e.evidence->>'provider_campaign_uuid'
    and a.person_key=e.person_key
    and nullif(btrim(a.evidence->>'provider_message_id'),'') is not null
    and nullif(btrim(a.evidence->>'provider_campaign_uuid'),'') is not null
    and not (
      a.evidence->>'provider_ack_verified'='true'
      and coalesce(nullif(btrim(a.evidence->>'provider_post_id'),''),
                   nullif(btrim(a.evidence->>'provider_comment_id'),''),
                   nullif(btrim(a.evidence->>'provider_object_id'),'')) is not null
    );
  v_dm := jsonb_array_length(v_dm_proofs);
  v_social := v_social + v_dm;

  select coalesce(jsonb_agg(jsonb_build_object(
      'action_id',a.action_id,
      'channel',a.channel,
      'provider_object_id',coalesce(
        nullif(a.evidence->>'provider_message_id',''),
        nullif(a.evidence->>'provider_post_id',''),
        nullif(a.evidence->>'provider_comment_id',''),
        nullif(a.evidence->>'provider_object_id','')
      ),
      'executed_at',a.executed_at
    )), '[]'::jsonb)
    into v_proofs
  from public.powerhouse_sales_actions a
  where a.status='done'
    and (a.executed_at at time zone 'Europe/Amsterdam')::date=p_run_date
    and (
      (
        lower(a.channel) in ('email','e-mail')
        and (coalesce(a.evidence->>'provider_ack_verified','false')='true'
             or coalesce(a.evidence->>'provider_readback_verified','false')='true')
        and nullif(btrim(coalesce(a.evidence->>'provider_message_id','')),'') is not null
        and nullif(btrim(coalesce(a.evidence->>'provider_thread_id','')),'') is not null
      )
      or (
        lower(a.channel) in ('linkedin_personal','linkedin_company','linkedin_comment','instagram','linkedin dm','linkedin_dm')
        and coalesce(a.evidence->>'provider_ack_verified','false')='true'
        and coalesce(
          nullif(btrim(a.evidence->>'provider_post_id'),''),
          nullif(btrim(a.evidence->>'provider_comment_id'),''),
          nullif(btrim(a.evidence->>'provider_object_id'),'')
        ) is not null
      )
    );

  select count(*)::int into v_set
  from public.powerhouse_sales_actions a
  where a.evidence#>>'{daily_action_set,run_date}'=p_run_date::text
    and a.evidence#>>'{daily_action_set,state}'='active'
    and a.updated_at >= (p_run_date::timestamp at time zone 'Europe/Amsterdam');

  select count(*)::int into v_decisions
  from public.powerhouse_sales_actions a
  where a.evidence#>>'{daily_action_set,run_date}'=p_run_date::text
    and a.evidence#>>'{daily_action_set,state}'='active'
    and coalesce(a.evidence#>>'{commercial_closure,decision}','')
      in ('WAIT','NURTURE','OBSERVE','SUPPRESS')
    and coalesce(
      (a.evidence#>>'{commercial_closure,decided_at}')::timestamptz,
      (a.evidence#>>'{commercial_closure,terminalized_at}')::timestamptz,
      a.updated_at
    ) >= (p_run_date::timestamp at time zone 'Europe/Amsterdam');

  select count(*)::int into v_stale
  from public.powerhouse_sales_actions a
  where coalesce(a.evidence#>>'{commercial_closure,decision}','')
      in ('WAIT','NURTURE','OBSERVE','SUPPRESS')
    and not (
      a.evidence#>>'{daily_action_set,run_date}'=p_run_date::text
      and a.evidence#>>'{daily_action_set,state}'='active'
    );

  -- Existing canonical publication owner: only explicit LIVE_PROVEN+public URL readback.
  -- GENERATED, APPROVED, PUBLISHED, queued and provider-accepted are not proof.
  select count(*)::int,
    coalesce(jsonb_agg(jsonb_build_object(
      'content_id',p.content_id,
      'channel',p.channel,
      'provider_object_id',p.external_id,
      'canonical_url',p.canonical_url,
      'live_proven_at',p.live_proven_at
    )), '[]'::jsonb)
  into v_publications,v_publication_proofs
  from public.content_publication_obligations p
  where p.publication_date=p_run_date
    and p.status in ('LIVE_PROVEN','MEASURED','LEARNED')
    and p.live_proven_at is not null
    and (
      (p.channel='blog' and p.canonical_url like 'https://www.bedrijfsgeheugen.nl/%')
      or (
        p.channel='linkedin_company'
        and p.external_id ~ '^urn:li:(share|ugcPost):[A-Za-z0-9_-]+$'
        and p.evidence->>'provider_create_success'='true'
        and p.evidence->>'provider_truth_verified'='true'
        and p.evidence->>'provider_publication_ack_verified'='true'
        and p.evidence->>'company_oauth_fresh_verified'='true'
        and p.evidence->>'organization_write_scope_verified'='true'
        and p.evidence->>'linkedin_company_admin_oauth_proven'='true'
        and p.evidence->>'author_urn'='urn:li:organization:18234216'
      )
      or (
        p.channel='linkedin_personal'
        and p.external_id ~ '^urn:li:(share|ugcPost):[A-Za-z0-9_-]+$'
        and p.evidence->>'provider_create_success'='true'
        and p.evidence->>'provider_truth_verified'='true'
        and p.evidence->>'provider_publication_ack_verified'='true'
        and p.evidence->>'personal_truth_verified'='true'
        and p.evidence->>'author_urn' ~ '^urn:li:person:[A-Za-z0-9_-]+$'
      )
      or (
        p.channel='instagram'
        and nullif(btrim(coalesce(p.external_id,'')),'') is not null
        and p.evidence->>'provider_truth_verified'='true'
        and p.evidence->>'exact_final_media_proven'='true'
        and p.evidence->>'mira_gate_passed'='true'
        and p.evidence->>'media_type' in ('reel','REEL','REELS')
      )
    );

  v_proofs := v_proofs || v_dm_proofs || v_publication_proofs;
  v_proven := v_email+v_social+v_publications>0;
  v_safe_no_send := v_set>0 and v_decisions=v_set;
  v_result := jsonb_build_object(
    'contract','powerhouse-commercial-output-assurance-v3',
    'run_date',p_run_date,
    'checked_at',v_now,
    'provider_proven_email',v_email,
    'provider_proven_social',v_social,
    'provider_proven_salesrobot_dm',v_dm,
    'provider_proven_publications',v_publications,
    'provider_proof',v_proofs,
    'commercial_day_proven',v_proven,
    'daily_commercial_execution_sla','MET_ONLY_WITH_PROVIDER_PROOF',
    'commercial_day_state',case when v_proven then 'PROVIDER_PROVEN' else 'OPEN_NO_PROVEN_ACTION' end,
    'current_daily_action_set_count',v_set,
    'fresh_current_set_non_send_decisions',v_decisions,
    'historical_decisions_excluded',v_stale,
    'safe_no_send_decision',v_safe_no_send,
    'healthy',v_proven or v_safe_no_send,
    'state',case
      when v_proven then 'PROVIDER_OUTPUT_PROVEN'
      when v_safe_no_send then 'ZERO_OUTPUT_EXPLICITLY_JUSTIFIED'
      when v_set=0 then 'DEGRADED_NO_CURRENT_DAILY_ACTION_SET'
      else 'DEGRADED_INCOMPLETE_CURRENT_SET_DECISIONS' end,
    'rule','Safety/no-send may be healthy but NEVER closes commercial-day execution without exact provider IDs'
  );

  -- One durable, idempotent daily obligation in existing canonical Brain; no duplicate scheduler or queue.
  insert into public.brain_obligations(
    obligation_type,capability_id,business_entity,business_period,business_timezone,
    payload_sha256,change_id,owner,state,evidence,created_at,updated_at,version
  ) values (
    'COMMERCIAL_EXECUTION','daily-commercial-provider-proof-v1','growth-revenue-os',p_run_date::text,
    'Europe/Amsterdam',encode(sha256(convert_to('daily-commercial-provider-proof-v1:'||p_run_date::text,'UTF8')),'hex'),
    'daily-commercial-provider-proof-v1','Powerhouse Growth & Revenue OS',
    case when v_proven then 'FULFILLED' else 'OPEN' end,
    jsonb_build_object(
      'commercial_day_proven',v_proven,
      'provider_proven_email',v_email,
      'provider_proven_social',v_social,
    'provider_proven_salesrobot_dm',v_dm,
      'provider_proven_publications',v_publications,
      'provider_proof',v_proofs,
      'safe_no_send_decision',v_safe_no_send,
      'next_owner','existing canonical Growth & Revenue OS and channel executors',
      'requires_fresh_eligible_action',not v_proven,
      'checked_at',v_now
    ),
    v_now,v_now,1
  )
  on conflict (obligation_type,capability_id,business_entity,business_period,business_timezone)
  do update set
    state=case when public.brain_obligations.state='FULFILLED' or excluded.state='FULFILLED'
      then 'FULFILLED' else 'OPEN' end,
    evidence=case when public.brain_obligations.state='FULFILLED' and excluded.state<>'FULFILLED'
      then public.brain_obligations.evidence else excluded.evidence end,
    updated_at=excluded.updated_at,
    version=public.brain_obligations.version+1;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values (
    v_now,'powerhouse-commercial-output-assurance','daily-output-sla',
    case when v_proven or v_safe_no_send then 'ok' else 'fout' end,
    case when v_proven then 'Provider-proven commercial action.'
      when v_safe_no_send then 'Safe non-send decided; commercial-day execution remains OPEN.'
      else 'Daily commercial action not provider-proven and decisions incomplete.' end,
    v_result
  );

  update public.powerhouse_daily_runs
  set state=case when v_proven or v_safe_no_send then state else 'degraded' end,
      evidence=coalesce(evidence,'{}'::jsonb)||
        jsonb_build_object('commercial_output_assurance',v_result),
      updated_at=v_now
  where run_date=p_run_date;

  return v_result;
end;
$function$;
