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

  select count(*)::int,
    count(*) filter(where lower(coalesce(assignment_arm,''))='treatment'
        and measurement_horizon_end<=p_now)::int,
    count(*) filter(where lower(coalesce(assignment_arm,''))='holdout'
        and measurement_horizon_end<=p_now)::int
  into v_experiment_assigned_30d,v_matured_treatment_30d,v_matured_holdout_30d
  from public.powerhouse_experiment_assignments
  where assigned_at>=p_now-interval '30 days' and assigned_at<=p_now;

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
      'experiment_assignments_last_30d',v_experiment_assigned_30d,
      'matured_treatment_last_30d',v_matured_treatment_30d,
      'matured_holdout_last_30d',v_matured_holdout_30d,
      'experiment_evidence_state',
        case when v_matured_treatment_30d>=20 and v_matured_holdout_30d>=20
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
