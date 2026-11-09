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

  v_status := case when v_overdue>0 then 'fout' when v_held_research>0 then 'waarschuwing' else 'ok' end;

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
      'provider_verified_sent_24h',v_sent_24h,
      'checked_at',p_now
    )
  );

  return jsonb_build_object(
    'contract','powerhouse-email-execution-watchdog-v1',
    'healthy',v_overdue=0 and v_held_research=0,
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
