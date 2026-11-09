-- Existing commercial closure owner. Wait for approved canonical research instead of expiring a held email after 6h.
-- The canonical composer may resume; only original authenticated/suppressed/ack'd provider executor sends.
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_action_closure_watchdog_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_research int:=0;
  v_social_expired int:=0;
  v_quality_blocked int:=0;
  v_source_wait int:=0;
  -- Stage-specific observability inside the EXISTING commercial closure owner.
  v_email_7d integer:=0;
  v_research_linked_7d integer:=0;
  v_research_done_7d integer:=0;
  v_research_done_expired_7d integer:=0;
  v_composer_checked_7d integer:=0;
  v_research_without_composer_7d integer:=0;
  v_quality_passed_7d integer:=0;
  v_prepared_and_quality_7d integer:=0;
  v_ack_with_provider_id_7d integer:=0;
  v_readback_with_provider_id_7d integer:=0;
  v_reply_7d integer:=0;
  v_expired_7d integer:=0;
  v_matured_treatment_30d integer:=0;
  v_matured_holdout_30d integer:=0;
  v_experiment_assigned_30d integer:=0;
  v_experiment_min_per_arm integer:=20;
  v_experiment_active boolean:=false;

  v_external_wait int:=0;
  v_bad_research int:=0;
  v_bad_social int:=0;
  v_bad_quality int:=0;
  v_payload jsonb;
begin
  update public.powerhouse_sales_actions a
  set status='expired',
      updated_at=p_now,
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'commercial_closure',jsonb_build_object(
          'contract','powerhouse-commercial-action-closure-v3',
          'decision','OBSERVE',
          'terminalized_at',p_now,
          'reason','stale internal research is evidence work, not an external execution obligation',
          'reopen_rule','only fresh material evidence may create/update a canonical next-best-action'
        )
      )
  where a.action_type='research_enrichment'
    and a.channel in ('internal','internal_research')
    and a.status in ('suggested','prepared','waiting')
    and coalesce(a.due_at,a.created_at)<p_now-interval '30 minutes';
  get diagnostics v_research=row_count;

  update public.powerhouse_sales_actions a
  set status='expired',
      updated_at=p_now,
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'commercial_closure',jsonb_build_object(
          'contract','powerhouse-commercial-action-closure-v3',
          'decision','OBSERVE',
          'terminalized_at',p_now,
          'reason','stale contextual social action lost freshness; never publish old context as delayed outreach',
          'reopen_rule','fresh provider/source evidence must generate a new deduped action through the canonical LinkedIn sales machine'
        )
      )
  where a.channel in ('linkedin_comment','linkedin_personal','linkedin_company','instagram')
    and a.status in ('suggested','prepared','waiting')
    and coalesce(a.due_at,a.created_at)<p_now-interval '24 hours'
    and not coalesce((a.evidence->>'provider_ack_verified')::boolean,false);
  get diagnostics v_social_expired=row_count;

  -- Canonical P0 research hold: keep the original action waiting (not sent).
  -- No new scheduler and no alternative provider. 48 hour maximum.
  update public.powerhouse_sales_actions a
  set status='waiting',updated_at=p_now,
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'commercial_closure',jsonb_build_object(
          'contract','powerhouse-commercial-action-closure-v4',
          'decision','WAIT_FOR_VERIFIED_SOURCE',
          'source_handoff_deadline',a.created_at+interval '48 hours',
          'research_dedupe_key','relationship-research:outreach-source:'||a.action_id::text,
          'composer_owner','powerhouse-commercial-message-composer',
          'provider_send_forbidden',true))
  where a.action_type='autonomous_email'
    and lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail')
    and a.status in ('suggested','prepared')
    and a.evidence #>> '{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
    and a.created_at>p_now-interval '48 hours'
    and coalesce(a.due_at,a.created_at)<p_now-interval '6 hours'
    and not coalesce((a.evidence->>'provider_ack_verified')::boolean,false)
    and exists(
      select 1 from public.powerhouse_sales_actions r
      where r.dedupe_key='relationship-research:outreach-source:'||a.action_id::text
        and r.action_type='research_enrichment'
        and r.channel='internal'
        and r.person_key=a.person_key
        and r.company_key=a.company_key
        and r.status in ('suggested','prepared','waiting','done')
    );
  get diagnostics v_source_wait=row_count;

  -- If no usable approved source appeared within 48 hours, expire safely.
  update public.powerhouse_sales_actions a
  set status='expired',updated_at=p_now,
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'commercial_closure',jsonb_build_object(
          'contract','powerhouse-commercial-action-closure-v4',
          'decision','EXPIRE_AFTER_RESEARCH_WINDOW',
          'terminalized_at',p_now,
          'provider_send_forbidden',true,
          'reopen_rule','fresh approved evidence must generate a new deduped canonical action'))
  where a.action_type='autonomous_email'
    and lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail')
    and a.status='waiting'
    and a.evidence #>> '{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
    and a.created_at<=p_now-interval '48 hours'
    and not coalesce((a.evidence->>'provider_ack_verified')::boolean,false)
    and not coalesce(public.powerhouse_outbound_message_quality_ready_v1(a.action_id),false);

  update public.powerhouse_sales_actions a
  set status='expired',
      updated_at=p_now,
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'commercial_closure',jsonb_build_object(
          'contract','powerhouse-commercial-action-closure-v3',
          'decision','OBSERVE',
          'terminalized_at',p_now,
          'reason','outbound copy quality not proven; external send remains forbidden',
          'send_forbidden',true,
          'quality_gate','powerhouse_outbound_message_quality_ready_v1',
          'reopen_rule','only a fresh quality-ready canonical action may re-enter external execution'
        )
      )
  where lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
    and a.action_type in ('autonomous_email','activate_connection','email_followup','follow_up','reply_followup','reply_dm')
    and a.status in ('suggested','prepared')
    and coalesce(a.due_at,a.created_at)<p_now-interval '6 hours'
    and not coalesce(public.powerhouse_outbound_message_quality_ready_v1(a.action_id),false);
  get diagnostics v_quality_blocked=row_count;

  update public.powerhouse_sales_actions a
  set status='waiting',
      updated_at=p_now,
      evidence=coalesce(a.evidence,'{}'::jsonb)||jsonb_build_object(
        'commercial_closure',jsonb_build_object(
          'contract','powerhouse-commercial-action-closure-v3',
          'decision','WAIT',
          'decided_at',p_now,
          'reason','fresh external action remains owned by canonical channel executor',
          'wait_deadline',p_now+interval '30 minutes',
          'provider_proof_required',true
        )
      )
  where a.channel not in ('internal','internal_research','linkedin_comment','linkedin_personal','linkedin_company','instagram')
    and a.status in ('suggested','prepared')
    and coalesce(a.due_at,a.created_at)<p_now-interval '6 hours'
    and a.action_type<>'autonomous_email'
    and (
      lower(replace(coalesce(a.channel,''),' ','_')) not in ('email','e-mail','linkedin_dm')
      or a.action_type not in ('activate_connection','email_followup','follow_up','reply_followup','reply_dm')
      or coalesce(public.powerhouse_outbound_message_quality_ready_v1(a.action_id),false)
    );
  get diagnostics v_external_wait=row_count;

  select count(*) into v_bad_research
  from public.powerhouse_sales_actions
  where action_type='research_enrichment'
    and channel in ('internal','internal_research')
    and status in ('suggested','prepared','waiting')
    and coalesce(due_at,created_at)<p_now-interval '30 minutes';

  select count(*) into v_bad_social
  from public.powerhouse_sales_actions
  where channel in ('linkedin_comment','linkedin_personal','linkedin_company','instagram')
    and status in ('suggested','prepared','waiting')
    and coalesce(due_at,created_at)<p_now-interval '24 hours';

  select count(*) into v_bad_quality
  from public.powerhouse_sales_actions a
  where lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
    and a.action_type in ('autonomous_email','activate_connection','email_followup','follow_up','reply_followup','reply_dm')
    and a.status in ('suggested','prepared','waiting')
    and coalesce(a.due_at,a.created_at)<p_now-interval '6 hours'
    and not coalesce(public.powerhouse_outbound_message_quality_ready_v1(a.action_id),false)
    and not (
      a.action_type='autonomous_email' and a.status='waiting'
      and a.evidence #>> '{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
      and a.created_at>p_now-interval '48 hours'
      and exists (
        select 1 from public.powerhouse_sales_actions r
        where r.dedupe_key='relationship-research:outreach-source:'||a.action_id::text
          and r.action_type='research_enrichment' and r.channel='internal'
          and r.person_key=a.person_key and r.company_key=a.company_key
          and r.status in ('suggested','prepared','waiting','done')
      )
    );

  -- Read-only funnel analysis for the exact same 7-day email action cohort.
  -- A cron success, internal research=done or quality pass is not email delivery.
  with recent as (
    select a.action_id,a.status,a.person_key,a.company_key,a.evidence,a.executed_at,
      exists(select 1 from public.powerhouse_sales_actions r
        where r.dedupe_key='relationship-research:outreach-source:'||a.action_id::text
          and r.action_type='research_enrichment' and r.person_key=a.person_key
          and r.company_key=a.company_key) as research_linked,
      exists(select 1 from public.powerhouse_sales_actions r
        where r.dedupe_key='relationship-research:outreach-source:'||a.action_id::text
          and r.action_type='research_enrichment' and r.person_key=a.person_key
          and r.company_key=a.company_key and r.status='done'
          and nullif(r.evidence#>>'{public_research_execution,source_url}','') is not null) as research_done,
      (select q.passed from public.powerhouse_message_quality_v1 q
        where q.action_id=a.action_id order by q.evaluated_at desc limit 1) as latest_quality,
      exists(select 1 from public.powerhouse_message_quality_v1 q
        where q.action_id=a.action_id) as composer_checked,
      exists(select 1 from public.powerhouse_email_reply_events e
        where e.action_id=a.action_id and e.provider_message_id is not null) as has_provider_reply,
      nullif(coalesce(a.evidence->>'provider_message_id',
        a.evidence#>>'{autonomous_outbound,provider_message_id}',
        a.evidence#>>'{native_gmail_executor,provider_message_id}'),'') as external_id,
      (
        a.evidence->>'provider_ack_verified'='true'
        or a.evidence#>>'{autonomous_outbound,provider_ack_verified}'='true'
        or a.evidence#>>'{native_gmail_executor,provider_ack_verified}'='true'
      ) as provider_ack,
      (
        a.evidence->>'provider_readback_verified'='true'
        or a.evidence#>>'{autonomous_outbound,provider_readback_verified}'='true'
        or a.evidence#>>'{native_gmail_executor,provider_readback_verified}'='true'
      ) as provider_readback
    from public.powerhouse_sales_actions a
    where a.action_type='autonomous_email'
      and a.created_at>=p_now-interval '7 days'
      and a.created_at<=p_now
  )
  select count(*)::int,
    count(*) filter(where research_linked)::int,
    count(*) filter(where research_done)::int,
    count(*) filter(where research_done and status='expired')::int,
    count(*) filter(where composer_checked)::int,
    count(*) filter(where research_done and not composer_checked)::int,
    count(*) filter(where latest_quality is true)::int,
    count(*) filter(where status='prepared' and latest_quality is true)::int,
    count(*) filter(where status='done' and executed_at is not null and provider_ack and external_id is not null)::int,
    count(*) filter(where status='done' and executed_at is not null and provider_ack and provider_readback and external_id is not null)::int,
    count(*) filter(where has_provider_reply)::int,
    count(*) filter(where status='expired')::int
  into v_email_7d, v_research_linked_7d, v_research_done_7d,
    v_research_done_expired_7d, v_composer_checked_7d,
    v_research_without_composer_7d, v_quality_passed_7d,
    v_prepared_and_quality_7d, v_ack_with_provider_id_7d,
    v_readback_with_provider_id_7d, v_reply_7d, v_expired_7d
  from recent;

  select greatest(1,coalesce(min(min_matured_per_arm),20)),
    count(*)>0
  into v_experiment_min_per_arm,v_experiment_active
  from public.powerhouse_experiment_policies
  where experiment_key='persuasion-revenue-optimizer-v1' and status='active';

  select count(*)::int,
    count(*) filter(where lower(coalesce(assignment_arm,''))='treatment'
        and measurement_horizon_end<=p_now)::int,
    count(*) filter(where lower(coalesce(assignment_arm,''))='holdout'
        and measurement_horizon_end<=p_now)::int
  into v_experiment_assigned_30d,v_matured_treatment_30d,v_matured_holdout_30d
  from public.powerhouse_experiment_assignments
  where experiment_key='persuasion-revenue-optimizer-v1'
    and assigned_at>=p_now-interval '30 days' and assigned_at<=p_now;

  v_payload:=jsonb_build_object(
    'contract','powerhouse-commercial-action-closure-v3',
    'checked_at',p_now,
    'research_terminalized_observe',v_research,
    'stale_social_terminalized_observe',v_social_expired,
    'quality_blocked_terminalized_observe',v_quality_blocked,
    'original_outreach_moved_to_bounded_source_wait',v_source_wait,
    'source_wait_contract','ORIGINAL_ACTION_48H_RESEARCH_TO_COMPOSER',
    'external_actions_owned_wait',v_external_wait,
    'overdue_research_nonterminal',v_bad_research,
    'stale_social_nonterminal',v_bad_social,
    'stale_quality_unproven_nonterminal',v_bad_quality,
    'healthy',v_bad_research=0 and v_bad_social=0 and v_bad_quality=0,
    'invariant','WAIT requires executable provider-owned work; quality-unproven outbound is terminalized OBSERVE and remains send-forbidden'
  );

  -- This readback is written to the EXISTING bg_gezondheid by the existing
  -- closure watchdog. It is not a new publisher, scheduler or outcome store.
  v_payload:=v_payload || jsonb_build_object(
    'handoff_measurement',jsonb_build_object(
      'contract','POWERHOUSE_ORIGINAL_COMMERCIAL_HANDOFF_MEASUREMENT_V1',
      'cohort','autonomous_email_created_last_7d',
      'measured_at',p_now,
      'created_7d',v_email_7d,
      'linked_original_research_7d',v_research_linked_7d,
      'research_done_with_source_7d',v_research_done_7d,
      'research_done_but_original_expired_7d',v_research_done_expired_7d,
      'composer_evaluated_7d',v_composer_checked_7d,
      'research_done_without_composer_evaluation_7d',v_research_without_composer_7d,
      'last_composer_quality_passed_7d',v_quality_passed_7d,
      'quality_passed_and_prepared_now_7d',v_prepared_and_quality_7d,
      'provider_ack_with_external_message_id_7d',v_ack_with_provider_id_7d,
      'provider_readback_with_external_message_id_7d',v_readback_with_provider_id_7d,
      'provider_linked_reply_7d',v_reply_7d,
      'original_expired_7d',v_expired_7d,
      'research_to_composer_evaluation_pct',
        case when v_research_done_7d>0
          then round(100.0*(v_research_done_7d-v_research_without_composer_7d)
            /v_research_done_7d,2) else null end,
      'commercial_delivery_proven',v_readback_with_provider_id_7d>0,
      'handoff_problem',
        case when v_research_done_expired_7d>0
          then 'RESEARCH_DONE_BUT_ORIGINAL_EMAIL_EXPIRED'
          when v_research_without_composer_7d>0
          then 'VERIFIED_RESEARCH_NOT_CONSUMED_BY_COMPOSER'
          when v_quality_passed_7d>0 and v_ack_with_provider_id_7d=0
          then 'QUALITY_PASSED_NO_PROVIDER_ACCEPTANCE'
          when v_ack_with_provider_id_7d>v_readback_with_provider_id_7d
          then 'PROVIDER_ACCEPTED_NO_INDEPENDENT_READBACK'
          when v_email_7d=0 then 'NO_EMAIL_ACTION_ELIGIBLE'
          else 'NO_PROVEN_COMMERCIAL_DELIVERY_YET' end,
      'experiment_policy_key','persuasion-revenue-optimizer-v1',
      'experiment_policy_active',v_experiment_active,
      'min_matured_per_arm',v_experiment_min_per_arm,
      'experiment_assignments_last_30d',v_experiment_assigned_30d,
      'matured_treatment_last_30d',v_matured_treatment_30d,
      'matured_holdout_last_30d',v_matured_holdout_30d,
      'experiment_evidence_state',
        case when not v_experiment_active then 'NO_ACTIVE_EXPERIMENT_POLICY'
          when v_matured_treatment_30d>=v_experiment_min_per_arm
            and v_matured_holdout_30d>=v_experiment_min_per_arm
          then 'READY_FOR_CAUSAL_EFFECT_ANALYSIS'
          else 'INSUFFICIENT_EVIDENCE_NOT_LEARNED' end,
      'critical_evidence_rule',
        'Only same-action provenance, latest composer quality, immutable external provider ID, independent readback and matured treatment/holdout outcomes count.'
    )
  );

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(
    p_now,
    'powerhouse-commercial-action-closure',
    'commercial-execution-handoff',
    case when v_bad_research=0 and v_bad_social=0 and v_bad_quality=0 then 'ok' else 'fout' end,
    'Commercial action lifecycle v3 reconciled with outbound quality gate.',
    v_payload
  );

  return v_payload;
end
$function$;

-- Original email watchdog must not requeue evidence-research waits.
CREATE OR REPLACE FUNCTION public.powerhouse_email_execution_watchdog_v1(p_now timestamp with time zone DEFAULT now())
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_requeued int := 0;
  v_overdue int := 0;
  v_waiting int := 0;
  v_held_research int := 0;
  v_sent_24h int := 0;
  v_status text;
  v_handoff_scorecard jsonb := jsonb_build_object('handoff_health','NOT_MEASURED');
begin
  update public.powerhouse_sales_actions a
     set status='prepared',
         updated_at=p_now,
         evidence=coalesce(a.evidence,'{}'::jsonb) ||
           jsonb_build_object(
             'email_executor_watchdog',
             jsonb_build_object(
               'contract','powerhouse-email-execution-watchdog-v1',
               'requeued_at',p_now,
               'reason','stale_waiting_without_provider_ack'
             )
           )
   where a.action_type='autonomous_email'
     and lower(a.channel)='email'
     and a.status='waiting'
     -- Existing research waits are only resumed by the original composer after
     -- source verification AND complete message quality approval.
     and coalesce(a.evidence#>>'{execution_gate,reason}','') <> 'SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
     and a.updated_at < p_now - interval '20 minutes'
     and not coalesce((a.evidence->>'provider_ack_verified')::boolean,false)
     and not coalesce((a.evidence#>>'{autonomous_outbound,provider_ack_verified}')::boolean,false)
     and not coalesce((a.evidence#>>'{native_gmail_executor,provider_ack_verified}')::boolean,false);
  get diagnostics v_requeued=row_count;

  select count(*) into v_overdue
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email'
    and lower(a.channel)='email'
    and a.status='prepared'
    and a.due_at <= p_now - interval '15 minutes';

  select count(*) into v_waiting
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email'
    and lower(a.channel)='email'
    and a.status='waiting';

  select count(*) into v_held_research
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email'
    and lower(a.channel)='email'
    and a.status='waiting'
    and a.evidence#>>'{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED';

  select count(*) into v_sent_24h
  from public.powerhouse_sales_actions a
  where a.action_type='autonomous_email'
    and lower(a.channel)='email'
    and a.status='done'
    and a.executed_at >= p_now - interval '24 hours'
    and (
      coalesce((a.evidence->>'provider_ack_verified')::boolean,false)
      or coalesce((a.evidence#>>'{autonomous_outbound,provider_ack_verified}')::boolean,false)
      or coalesce((a.evidence#>>'{native_gmail_executor,provider_ack_verified}')::boolean,false)
    );

  -- Existing scheduler/watchdog owner records the stage readback on every
  -- natural run; no secondary metrics scheduler and no fabricated green.
  begin
    select to_jsonb(score) into v_handoff_scorecard
    from public.powerhouse_commercial_handoff_scorecard_v1 score;
  exception when others then
    v_handoff_scorecard := jsonb_build_object('handoff_health','MEASUREMENT_FAILED','sqlstate',sqlstate);
  end;
  v_status := case when v_overdue>0 then 'fout'
                   when v_held_research>0 or coalesce(v_handoff_scorecard->>'handoff_health','NOT_MEASURED')
                         not in ('PROVIDER_DELIVERY_PROVEN_OUTCOME_LEARNING_SEPARATE') then 'waarschuwing'
                   else 'ok' end;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values(
    p_now,
    'powerhouse-email-executor',
    'autonomous-email-execution',
    v_status,
    case when v_overdue>0
      then 'Prepared outreach is overdue and requires canonical executor consumption.'
      when v_held_research>0 then 'Original emails are awaiting verified company evidence and composer approval; not provider sent.'
      else 'Autonomous email queue has no overdue prepared actions.'
    end,
    jsonb_build_object(
      'contract','powerhouse-email-execution-watchdog-v1',
      'requeued_stale_waiting',v_requeued,
      'overdue_prepared',v_overdue,
      'waiting',v_waiting,
      'awaiting_verified_source',v_held_research,
      'original_handoff_scorecard_7d',v_handoff_scorecard,
      'provider_verified_sent_24h',v_sent_24h,
      'checked_at',p_now
    )
  );

  return jsonb_build_object(
    'contract','powerhouse-email-execution-watchdog-v1',
    'healthy',v_overdue=0 and v_held_research=0 and
      v_handoff_scorecard->>'handoff_health'='PROVIDER_DELIVERY_PROVEN_OUTCOME_LEARNING_SEPARATE',
    'requeued_stale_waiting',v_requeued,
    'overdue_prepared',v_overdue,
    'waiting',v_waiting,
    'provider_verified_sent_24h',v_sent_24h,
    'checked_at',p_now
  );
end;
$function$;

-- Match independently read-back production ACL: postgres and service_role only.
-- No browser or PUBLIC execution on the existing SECURITY DEFINER watchdog.
revoke all on function public.powerhouse_email_execution_watchdog_v1(timestamptz)
  from public, anon, authenticated;
grant execute on function public.powerhouse_email_execution_watchdog_v1(timestamptz)
  to service_role;


-- Read-only instrumentation of the ORIGINAL commercial chain, no new executor.
-- A green cron/quality draft is never counted as provider or revenue proof.
create or replace view public.powerhouse_commercial_handoff_telemetry_v1
with (security_invoker = true) as
with joined as (
 select
   a.action_id, a.created_at, a.updated_at, a.status as action_status,
   a.evidence #>> '{execution_gate,reason}' as execution_hold,
   r.status as research_status, r.executed_at as research_completed_at,
   r.action_id as research_action_id,
   nullif(btrim(coalesce(r.evidence #>> '{public_research_execution,source_url}','')),'') as research_source_url,
   coalesce(q.passed,false) as latest_quality_passed,
   q.evaluated_at as latest_quality_evaluated_at,
   coalesce(nullif(a.evidence->>'provider_message_id',''),
            nullif(a.evidence #>> '{autonomous_outbound,provider_message_id}',''),
            nullif(a.evidence #>> '{native_gmail_executor,provider_message_id}','')) as provider_message_id,
   coalesce((
     a.evidence->>'provider_ack_verified'='true'
     or a.evidence #>> '{autonomous_outbound,provider_ack_verified}'='true'
     or a.evidence #>> '{native_gmail_executor,provider_ack_verified}'='true'
   ),false) as provider_ack_observed,
   coalesce((
     a.evidence->>'provider_readback_verified'='true'
     or a.evidence #>> '{autonomous_outbound,provider_readback_verified}'='true'
     or a.evidence #>> '{native_gmail_executor,provider_readback_verified}'='true'
   ),false) as provider_readback_observed,
   a.executed_at as action_executed_at,
   exists(
     select 1 from public.powerhouse_email_reply_events re
     where re.action_id=a.action_id
   ) as actual_reply_observed,
   exists(
     select 1 from public.powerhouse_sales_outcomes o
     where o.action_id=a.action_id and o.outcome_type in ('meeting_booked','appointment_booked','meeting_confirmed')
   ) as meeting_observed,
   (
     select coalesce(sum(o.revenue_eur),0)::numeric
     from public.powerhouse_sales_outcomes o
     where o.action_id=a.action_id and o.revenue_eur>0
       and o.outcome_type in ('realized_revenue','payment_received','invoice_paid','order_paid')
   ) as realized_revenue_eur,
   exists(
     select 1 from public.powerhouse_experiment_assignments ex
     where ex.treatment_action_id=a.action_id
   ) as assigned_experiment_treatment
 from public.powerhouse_sales_actions a
 left join lateral (
   select r.action_id,r.status,r.executed_at,r.evidence
   from public.powerhouse_sales_actions r
   where r.dedupe_key='relationship-research:outreach-source:'||a.action_id::text
     and r.action_type='research_enrichment' and r.channel='internal'
     and r.person_key is not distinct from a.person_key
     and r.company_key is not distinct from a.company_key
   order by r.created_at desc,r.action_id
   limit 1
 ) r on true
 left join lateral (
   select q.passed,q.evaluated_at
   from public.powerhouse_message_quality_v1 q
   where q.action_id=a.action_id
   order by q.evaluated_at desc,q.quality_id
   limit 1
 ) q on true
 where a.action_type='autonomous_email'
   and lower(replace(coalesce(a.channel,''),' ','_')) in ('email','e-mail')
   and a.created_at>=now()-interval '7 days'
)
select
 j.action_id,j.created_at,j.updated_at,j.action_status,j.execution_hold,
 j.research_status,j.research_action_id,j.research_completed_at,
 j.research_source_url is not null and j.research_status='done' as research_evidence_recorded,
 j.latest_quality_passed,j.latest_quality_evaluated_at,
 coalesce((j.research_completed_at is not null and j.latest_quality_passed
   and j.latest_quality_evaluated_at>=j.research_completed_at),false) as research_to_composer_confirmed,
 j.provider_message_id is not null as provider_id_recorded,
 j.provider_ack_observed,
 j.provider_readback_observed,
 (j.provider_message_id is not null and j.provider_ack_observed and j.provider_readback_observed) as provider_delivery_proven,
 j.action_executed_at,j.actual_reply_observed,j.meeting_observed,j.realized_revenue_eur,
 j.assigned_experiment_treatment,
 case
   when j.action_status='expired' and j.research_status='done'
     and not coalesce((j.latest_quality_passed and j.latest_quality_evaluated_at>=j.research_completed_at),false)
     then 'BROKEN_RESEARCH_TO_COMPOSER_EXPIRED'
   when j.research_status='done'
     and j.research_completed_at<now()-interval '60 minutes'
     and not coalesce((j.latest_quality_passed and j.latest_quality_evaluated_at>=j.research_completed_at),false)
     then 'BROKEN_RESEARCH_TO_COMPOSER_SLA'
   when j.latest_quality_passed and j.action_status='expired' and not j.provider_ack_observed
     then 'BROKEN_COMPOSER_TO_PROVIDER_EXPIRED'
   when j.latest_quality_passed and j.latest_quality_evaluated_at<now()-interval '30 minutes'
     and not j.provider_ack_observed
     then 'COMPOSER_TO_PROVIDER_UNPROVEN'
   when j.provider_ack_observed and
     (j.provider_message_id is null or not j.provider_readback_observed)
     then 'PROVIDER_READBACK_MISSING'
   when j.provider_message_id is not null and j.provider_ack_observed and j.provider_readback_observed
     then 'PROVIDER_DELIVERY_PROVEN'
   when j.action_status='expired' then 'EXPIRED_WITHOUT_DELIVERY'
   when j.execution_hold='SOURCE_SPECIFIC_EVIDENCE_REQUIRED' then 'WAITING_FOR_VERIFIED_SOURCE'
   else 'PENDING_WITHOUT_EXTERNAL_PROOF'
 end as handoff_state,
 case when j.research_completed_at is not null and j.latest_quality_evaluated_at>=j.research_completed_at
      then round((extract(epoch from j.latest_quality_evaluated_at-j.research_completed_at)/60)::numeric,1)
      else null end as research_to_quality_minutes
from joined j;

revoke all on table public.powerhouse_commercial_handoff_telemetry_v1 from public,anon,authenticated;
grant select on table public.powerhouse_commercial_handoff_telemetry_v1 to service_role;

-- One service-only, read-only seven-day operational scorecard.
create or replace view public.powerhouse_commercial_handoff_scorecard_v1
with (security_invoker = true) as
select
 now() as measured_at,
 count(*)::integer as original_email_actions_7d,
 count(*) filter(where research_status='done')::integer as research_completed_7d,
 count(*) filter(where research_to_composer_confirmed)::integer as research_consumed_by_quality_7d,
 count(*) filter(where latest_quality_passed)::integer as quality_passed_7d,
 count(*) filter(where provider_id_recorded and provider_ack_observed)::integer as provider_accepted_with_id_7d,
 count(*) filter(where provider_delivery_proven)::integer as provider_readback_proven_7d,
 count(*) filter(where actual_reply_observed and provider_delivery_proven)::integer as provider_linked_replies_7d,
 count(*) filter(where meeting_observed and provider_delivery_proven)::integer as provider_linked_meetings_7d,
 coalesce(sum(realized_revenue_eur) filter(where provider_delivery_proven),0)::numeric as provider_linked_realized_revenue_eur_7d,
 count(*) filter(where assigned_experiment_treatment)::integer as linked_experiment_treatments_7d,
 count(*) filter(where handoff_state like 'BROKEN_%'
                       or handoff_state in ('COMPOSER_TO_PROVIDER_UNPROVEN','PROVIDER_READBACK_MISSING','EXPIRED_WITHOUT_DELIVERY'))::integer as broken_or_unproven_handoffs_7d,
 count(*) filter(where handoff_state='BROKEN_RESEARCH_TO_COMPOSER_EXPIRED')::integer as research_completed_but_expired_7d,
 case when count(*)=0 then 'NO_ELIGIBLE_ACTIONS_OBSERVED'
      when count(*) filter(where handoff_state like 'BROKEN_%'
                          or handoff_state in ('COMPOSER_TO_PROVIDER_UNPROVEN','PROVIDER_READBACK_MISSING','EXPIRED_WITHOUT_DELIVERY'))>0 then 'DEGRADED'
      when count(*) filter(where provider_delivery_proven)=0 then 'NO_PROVIDER_DELIVERY_PROVEN'
      else 'PROVIDER_DELIVERY_PROVEN_OUTCOME_LEARNING_SEPARATE' end as handoff_health
from public.powerhouse_commercial_handoff_telemetry_v1;

revoke all on table public.powerhouse_commercial_handoff_scorecard_v1 from public,anon,authenticated;
grant select on table public.powerhouse_commercial_handoff_scorecard_v1 to service_role;

-- P0 original content-to-measure-to-learn handoff receipts, on the EXISTING hourly content executor.
-- Uses ONLY existing obligations, runtime events and health, no new cron/table/side-effect.
create or replace function public.powerhouse_original_handoff_receipt_audit_v1(
  p_now timestamp with time zone default now()
)
returns jsonb
language plpgsql
set search_path to 'public','pg_catalog'
as $handoff$
declare
  r record;
  v_stage text;
  v_owner text;
  v_due timestamp with time zone;
  v_overdue boolean;
  v_provider_proven boolean;
  v_metric_proven boolean;
  v_analysis_proven boolean;
  v_experiment_proven boolean;
  v_application_proven boolean;
  v_next_run_proven boolean;
  v_source_event text;
  v_original_key text;
  v_evidence jsonb;
  v_checked int:=0;
  v_pending int:=0;
  v_overdue_count int:=0;
  v_verified int:=0;
  v_stages jsonb:='{}'::jsonb;
  v_snapshot jsonb;
  v_commercial jsonb:='{}'::jsonb;
begin
  if p_now is null then raise exception 'ORIGINAL_HANDOFF_TIME_REQUIRED'; end if;
  for r in
    select o.* from public.content_publication_obligations o
    where o.tenant_id='canonical'
      and o.channel in ('linkedin_personal','linkedin_company','instagram','blog')
      and o.publication_date between
        (p_now at time zone 'Europe/Amsterdam')::date-8
        and (p_now at time zone 'Europe/Amsterdam')::date
    order by o.publication_date,o.channel
  loop
    v_checked:=v_checked+1;
    v_original_key:='content-publication:'||r.publication_date::text||':'||r.channel;
    v_owner:=case
      when r.channel='blog' then 'original Powerhouse blog queue + protected CMS publisher'
      when r.channel='instagram' then 'original Mira media producer + Instagram publisher'
      else 'original Powerhouse social publisher'
    end;
    v_due:=(r.publication_date+time '20:30')
             at time zone 'Europe/Amsterdam';
    v_provider_proven:=r.status in ('LIVE_PROVEN','MEASURED','LEARNED')
      and r.live_proven_at is not null
      and nullif(r.external_id,'') is not null
      and (r.channel not in ('blog','linkedin_personal','linkedin_company')
        or nullif(r.canonical_url,'') is not null);
    v_source_event:=nullif(r.metrics#>>'{original_provider_metric_handoff,source_event_id}','');
    -- Only original source-bound metrics are admitted; older measured_at stamps
    -- with no provider/GA4/GSC provenance never count as a received handoff.
    if r.channel='blog' then
      v_source_event:=coalesce(
        nullif(r.metrics#>>'{ga4,source_event_id}',''),
        nullif(r.metrics#>>'{gsc,source_event_id}',''),
        nullif(r.metrics#>>'{original_provider_metric_handoff,source_event_id}',''));
    end if;
    v_metric_proven:=r.measured_at is not null and v_source_event is not null;
    v_analysis_proven:=false;
    v_experiment_proven:=false;
    v_application_proven:=false;
    if r.channel in ('linkedin_personal','linkedin_company','instagram') then
      select exists (
        select 1
        from public.social_posts sp
        join public.social_learning_evaluations le
          on le.post_id=sp.post_id and le.tenant_id=sp.tenant_id
        where sp.external_post_id=r.external_id
          and sp.channel_kind=r.channel
          and sp.tenant_id=case when r.channel='linkedin_company'
            then 'bedrijfsgeheugen' else 'canonical' end
          and le.observed_at>=r.published_at
      ) into v_analysis_proven;
      select exists (
        select 1
        from public.social_posts sp
        join public.social_learning_applications la
          on la.post_id=sp.post_id and la.tenant_id=sp.tenant_id
        where sp.external_post_id=r.external_id and sp.channel_kind=r.channel
          and sp.tenant_id=case when r.channel='linkedin_company'
            then 'bedrijfsgeheugen' else 'canonical' end
          and la.verification_status in
            ('APPLIED_NEXT_RUN_VERIFIED','CONTROLLED_EXPERIMENT_OUTCOME_VERIFIED')
      ) into v_application_proven;
    else
      v_analysis_proven:=nullif(r.evidence#>>'{blog_analysis,source_event_id}','') is not null;
      v_application_proven:=coalesce(
        r.evidence#>>'{blog_learning,application_verified}','false')='true';
    end if;
    -- Policy evidence for a real control/holdout, not merely calendar experiment_id.
    v_experiment_proven:=coalesce(
      r.evidence#>>'{experiment,controlled_outcome_verified}','false')='true'
      and nullif(r.evidence#>>'{experiment,experiment_id}','') is not null
      and exists (
        select 1 from public.social_experiments se
        where se.experiment_id=r.evidence#>>'{experiment,experiment_id}'
          and se.tenant_id='bedrijfsgeheugen' and se.status='COMPLETE'
          and se.ended_at is not null
          and coalesce((se.resultaat->>'effect_is_causal')::boolean,false)
          and nullif(se.resultaat->>'provider_outcome_source_event_id','') is not null
          and nullif(se.resultaat->>'control_provider_source_event_id','') is not null
          and (se.resultaat->>'treatment_matured') ~ '^[0-9]+$'
          and (se.resultaat->>'control_matured') ~ '^[0-9]+$'
          and (se.resultaat->>'treatment_matured')::int >= greatest(coalesce(se.min_steekproef,20),20)
          and (se.resultaat->>'control_matured')::int >= greatest(coalesce(se.min_steekproef,20),20)
      );
    v_next_run_proven:=coalesce(
      r.evidence#>>'{learning,next_original_run_readback_verified}','false')='true'
      and nullif(r.evidence#>>'{learning,next_original_provider_id}','') is not null
      and nullif(r.evidence#>>'{learning,next_original_content_id}','') is not null
      and nullif(r.evidence#>>'{learning,learning_id}','') is not null
      and r.learned_at is not null
      and exists (
        select 1 from public.content_publication_obligations later
        where later.tenant_id=r.tenant_id and later.channel=r.channel
          and later.publication_date>r.publication_date
          and later.status in ('LIVE_PROVEN','MEASURED','LEARNED')
          and later.live_proven_at>r.learned_at
          and later.external_id=r.evidence#>>'{learning,next_original_provider_id}'
          and later.content_id=r.evidence#>>'{learning,next_original_content_id}'
          and later.content_id is distinct from r.content_id
          and later.evidence#>>'{learning,applied_learning_id}'=
            r.evidence#>>'{learning,learning_id}'
          and coalesce((later.evidence->>'provider_truth_verified')::boolean,false)
          and coalesce((later.evidence->>'provider_publication_ack_verified')::boolean,false)
      );

    if not v_provider_proven then
      v_stage:=case when r.status in ('BLOCKED','FAILED') then 'PUBLICATION_BLOCKED'
         else 'ORIGINAL_PUBLICATION_NOT_PROVEN' end;
    elsif not v_metric_proven then
      v_stage:=case when r.measured_at is null then 'PROVIDER_TO_METRICS_PENDING'
        else 'MEASUREMENT_STAMP_WITHOUT_SOURCE_RECEIPT' end;
      v_due:=r.live_proven_at+
        case when r.channel='blog' then interval '8 days' else interval '78 hours' end;
      v_owner:=case when r.channel='blog' then 'original SEO/GA4/GSC data spine'
        else 'original bg-social-metrics-sync and channel provider analytics' end;
    elsif not v_analysis_proven then
      v_stage:='METRICS_TO_ANALYST_ACK_MISSING';
      v_due:=r.measured_at+interval '36 hours';
      v_owner:='original Powerhouse analyst / social learning';
    elsif not v_experiment_proven then
      v_stage:='EXPERIMENT_OUTCOME_NOT_PROVEN';
      v_due:=r.measured_at+interval '8 days';
      v_owner:='original CRO/Innovation experiment owner';
    elsif not v_application_proven or r.learned_at is null then
      v_stage:='LEARNING_APPLICATION_ACK_MISSING';
      v_due:=r.measured_at+interval '8 days';
      v_owner:='original Powerhouse learning and improvement owner';
    elsif not v_next_run_proven then
      v_stage:='NEXT_NATURAL_RUN_READBACK_MISSING';
      v_due:=r.learned_at+interval '2 days';
      v_owner:='original Powerhouse publisher and learning owner';
    else
      v_stage:='END_TO_END_VERIFIED';
      v_due:=null;
      v_owner:='original ONE BRAIN terminal verifier';
    end if;
    v_overdue:=v_due is not null and p_now>v_due
      and v_stage<>'END_TO_END_VERIFIED';
    if v_overdue then v_overdue_count:=v_overdue_count+1;
    elsif v_stage='END_TO_END_VERIFIED' then v_verified:=v_verified+1;
    else v_pending:=v_pending+1;
    end if;
    v_stages:=jsonb_set(v_stages,array[v_stage],
      to_jsonb(coalesce((v_stages->>v_stage)::int,0)+1),true);
    v_evidence:=jsonb_build_object(
      'contract','POWERHOUSE_ORIGINAL_HANDOFF_ACK_V1',
      'original_id',v_original_key,
      'original_status',r.status,
      'source_content_id',r.content_id,
      'provider_id',r.external_id,
      'provider_url',r.canonical_url,
      'last_proven_stage',case
        when v_next_run_proven and v_application_proven and v_experiment_proven
          and v_analysis_proven and v_metric_proven then 'NEXT_RUN_VERIFIED'
        when v_metric_proven and v_analysis_proven then 'ANALYZED'
        when v_metric_proven then 'MEASURED_WITH_SOURCE'
        when v_provider_proven then 'PROVIDER_LIVE_VERIFIED'
        else 'NOT_LIVE_PROVEN' end,
      'next_stage',v_stage,'expected_owner',v_owner,
      'receipt_missing',v_stage<>'END_TO_END_VERIFIED',
      'original_provider_proven',v_provider_proven,
      'metric_source_event',v_source_event,
      'metric_receipt_proven',v_metric_proven,
      'analysis_ack_proven',v_analysis_proven,
      'controlled_experiment_proven',v_experiment_proven,
      'application_ack_proven',v_application_proven,
      'next_natural_run_ack_proven',v_next_run_proven,
      'deadline_utc',v_due,'deadline_overdue',v_overdue,
      'checked_at_utc',p_now,
      'repair_policy','original-owner-only; preserve original ID and provider idempotency; never invent publication, sample or revenue',
      'next_action',case
        when v_stage in ('PUBLICATION_BLOCKED','ORIGINAL_PUBLICATION_NOT_PROVEN')
          then 'Original publisher: check immutable external side effect first; correct approval/media/CMS cause, then prove exact provider URL without duplicate write.'
        when v_stage in ('PROVIDER_TO_METRICS_PENDING','MEASUREMENT_STAMP_WITHOUT_SOURCE_RECEIPT')
          then 'Original provider analytics owner: fetch exact post/URL source event after proper maturity, attach scope+UTC to original date/channel; no synthetic zero.'
        when v_stage='METRICS_TO_ANALYST_ACK_MISSING'
          then 'Original analyst: join exact original provider source ID to evaluation, report denominators, diagnosis and evidence.'
        when v_stage='EXPERIMENT_OUTCOME_NOT_PROVEN'
          then 'Original CRO owner: run eligible treatment/holdout with guardrails; label no sample explicitly; no unsupported lift.'
        when v_stage='LEARNING_APPLICATION_ACK_MISSING'
          then 'Original improvement owner: apply approved source-backed result via protected release and read back deployed result.'
        when v_stage='NEXT_NATURAL_RUN_READBACK_MISSING'
          then 'Original publisher and learning owner: verify next natural provider run uses approved change and exact live readback.'
        else 'No recovery required; original end-to-end proof closed.' end,
      'original_next_action',r.next_action,
      'learning_state',case when v_stage='END_TO_END_VERIFIED' then 'CLOSED_WITH_NEXT_RUN_PROOF'
        when not v_experiment_proven then 'INSUFFICIENT_EVIDENCE_NOT_LEARNED'
        else 'APPLICATION_PENDING' end);
    insert into public.powerhouse_runtime_events (
      dedupe_key,event_type,source,subject_key,channel,occurred_at,
      evidence,context,state,data_quality,confidence,updated_at)
    values (
      'original-handoff:'||r.publication_date::text||':'||r.channel,
      'original_content_handoff_ack_audit',
      'powerhouse-content-closed-loop-tick-v1',
      v_original_key,r.channel,p_now,v_evidence,
      jsonb_build_object('publication_date',r.publication_date,
        'original_tenant','canonical','canonical_owner',v_owner,
        'existing_scheduler','powerhouse-content-orchestrator-daily-v1'),
      case when v_overdue then 'error'
        when v_stage='END_TO_END_VERIFIED' then 'closed'
        else 'observed' end,
      'OBSERVED',1,p_now)
    on conflict(dedupe_key) do update
      set evidence=excluded.evidence,context=excluded.context,
          state=excluded.state,data_quality=excluded.data_quality,
          confidence=excluded.confidence,occurred_at=excluded.occurred_at,
          updated_at=excluded.updated_at;
  end loop;
  -- Read the EXISTING original email scorecard, not a second sender/collector.
  select to_jsonb(t) into v_commercial
  from public.powerhouse_commercial_handoff_scorecard_v1 t
  limit 1;
  v_snapshot:=jsonb_build_object(
    'contract','POWERHOUSE_ORIGINAL_HANDOFF_ACK_V1',
    'checked_at_utc',p_now,
    'original_count',v_checked,
    'overdue_count',v_overdue_count,
    'pending_count',v_pending,
    'complete_with_next_run_proof',v_verified,
    'by_stage',v_stages,
    'new_executor_created',false,
    'original_scheduler','powerhouse-content-orchestrator-daily-v1',
    'email_delivery_owner','existing autonomous commercial sender',
    'commercial_email_handoff',coalesce(v_commercial,'{}'::jsonb),
    'release_state','measured only after exact source, UTC and original readback');
  insert into public.bg_gezondheid
    (gemeten_op,onderdeel,soort,status,detail,gegevens)
  values (p_now,'powerhouse-original-handoff-ack',
    'original-content-metrics-experiment-application',
    case when v_overdue_count>0 then 'fout'
      when v_pending>0 then 'waarschuwing' else 'ok' end,
    'Original ID, owner, SLA and receipt audited; green only after independently proven applied learning on next natural run.',
    v_snapshot);
  return v_snapshot;
end
$handoff$;

-- This internal maintenance function is not a public browser API.
revoke all on function public.powerhouse_original_handoff_receipt_audit_v1(timestamp with time zone)
  from public,anon,authenticated;
grant execute on function public.powerhouse_original_handoff_receipt_audit_v1(timestamp with time zone)
  to service_role;


-- Wire assurance into existing cron #140 owner; retain authenticated publisher and security behavior.
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
$function$;
