-- Protected source only: NOT EXECUTED. Original provider migration identity/review required before deployment.
-- 24 Nov 2026 original one-sender mail source correctness: CRM approval ≠ marketing-mail authority.
-- The original Gmail provider verifies the same exact recipient and permission AGAIN before any send.
-- No change to original 5/day maximum, 30-day cooldown, suppression, provider or scheduler.
CREATE OR REPLACE FUNCTION public.powerhouse_prepare_connection_relationship_email_v1(p_run_date date DEFAULT ((now() AT TIME ZONE 'Europe/Amsterdam'::text))::date, p_cap integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare v_now timestamptz:=now(); v_inserted int:=0; v_cap int:=greatest(0,least(coalesce(p_cap,3),5));
begin
  with approved as (
    select c.sleutel person_key,
      coalesce(nullif(md5(lower(btrim(c.bedrijf))),''),c.sleutel) company_key,
      c.naam person_name,btrim(c.bedrijf) company_name,btrim(c.rol) role,c.linkedin_url,lower(btrim(c.email)) email,
      row_number() over(order by c.laatst_aangeboden_op nulls first,c.bijgewerkt_op desc,c.sleutel) rn
    from public.bg_connecties c
    where length(btrim(coalesce(c.rol,'')))>=3 and length(btrim(coalesce(c.bedrijf,'')))>=2
      and nullif(btrim(coalesce(c.email,'')),'') is not null
      and c.email ~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+[.][A-Z]{2,}$'
      and coalesce(c.extra->>'human_approved','')='true'
      -- Marketing-mail permission is independent from operator CRM approval and
      -- from a first-degree LinkedIn connection. Fail closed at preparation,
      -- BEFORE a prospect enters any billable composer or provider-send lane.
      and jsonb_typeof(c.extra->'email_marketing_permission')='object'
      and (not c.extra ? 'approval_revoked'
        or c.extra->'approval_revoked' in ('null'::jsonb,'false'::jsonb,'{}'::jsonb))
      and coalesce(c.extra->'email_marketing_permission'->>'status','') <> 'revoked'
      and coalesce(c.extra->'email_marketing_permission'->>'revoked','false') <> 'true'
      and length(btrim(coalesce(c.extra->'email_marketing_permission'->>'evidence_ref','')))>=12
      and case
          when pg_input_is_valid(
            coalesce(nullif(c.extra->'email_marketing_permission'->>'observed_at',''),
                     nullif(c.extra->'email_marketing_permission'->>'granted_at',''),
                     nullif(c.extra->'email_marketing_permission'->>'recorded_at',''),''),
            'timestamp with time zone')
          then coalesce(nullif(c.extra->'email_marketing_permission'->>'observed_at',''),
                        nullif(c.extra->'email_marketing_permission'->>'granted_at',''),
                        nullif(c.extra->'email_marketing_permission'->>'recorded_at',''))::timestamptz <= v_now
          else false end
      and (
        (c.extra->'email_marketing_permission'->>'basis'='explicit_opt_in'
          and c.extra->'email_marketing_permission'->>'granted'='true'
          and c.extra->'email_marketing_permission'->>'purpose'='commercial_email')
        or
        (c.extra->'email_marketing_permission'->>'basis'='existing_customer_soft_opt_in'
          and c.extra->'email_marketing_permission'->>'existing_customer_verified'='true'
          and c.extra->'email_marketing_permission'->>'similar_products_or_services'='true'
          and c.extra->'email_marketing_permission'->>'opt_out_offered_at_collection'='true'
          and c.extra->'email_marketing_permission'->>'opt_out_available_now'='true'
          and length(btrim(coalesce(c.extra->'email_marketing_permission'->>'transaction_ref','')))>=5)
      )
      and not exists(select 1 from public.powerhouse_email_contact_suppressions x
        where x.active=true and lower(x.email)=lower(btrim(c.email)))
      and not exists(select 1 from public.powerhouse_sales_outcomes o where o.person_key=c.sleutel
        and lower(coalesce(o.outcome_type,'')) in ('unsubscribe','opt_out','do_not_contact','complaint','negative_reply'))
      and not exists(select 1 from public.powerhouse_sales_actions a where a.person_key=c.sleutel
        and a.status in ('prepared','waiting') and public.powerhouse_normalize_sales_channel_v1(a.channel) in ('email','linkedin_dm'))
      and not exists(select 1 from public.powerhouse_sales_actions a where a.person_key=c.sleutel
        and a.status='done' and a.executed_at>=v_now-interval '30 days'
        and public.powerhouse_normalize_sales_channel_v1(a.channel) in ('email','linkedin_dm'))
  )
  insert into public.powerhouse_sales_actions(
    dedupe_key,subject_key,person_key,company_key,action_type,channel,priority,reason,evidence,message_draft,
    source_url,status,due_at,expected_value_eur,person_name,company_name,role)
  select 'connection-relationship-email:'||p_run_date::text||':'||md5(a.person_key),'relationship:'||a.person_key,
    a.person_key,a.company_key,'autonomous_email','email',10,
    'Human-approved existing connection with independently documented commercial email permission.',
    jsonb_build_object('contract','powerhouse-connection-relationship-email-v1',
      'relationship_evidence',jsonb_build_object('role',a.role,'company_name',a.company_name),
      'recipient_email',a.email,
      'email_subject',a.company_name||': een concrete observatie',
      'human_approved',true,
      'authorization','independently_documented_commercial_email_permission',
      'message_requirements',jsonb_build_object('lead_with_specific_insight',true,'observed_fact_required',true,
        'prediction_must_be_labeled',true,'generic_pitch_forbidden',true),
      'guardrails',jsonb_build_object('canonical_email_executor',true,'suppression_required',true,'cooldown_required',true,
        'provider_ack_required',true,'duplicate_send_forbidden',true,'max_daily_sends',v_cap)),
    '',coalesce(a.linkedin_url,''),'prepared',v_now,0,a.person_name,a.company_name,a.role
  from approved a where a.rn<=v_cap
  on conflict(dedupe_key) do nothing;
  get diagnostics v_inserted=row_count;
  return jsonb_build_object('contract','powerhouse-connection-relationship-email-v1','run_date',p_run_date,
    'prepared',v_inserted,'cap',v_cap,'delivery_state',case when v_inserted>0 then 'PREPARED_FOR_INDEPENDENT_SEND_GATES' else 'NO_NEW_AUTHORIZED_PREPARED_RECIPIENT' end,'external_send_executed',false,'executed_at',v_now);
end $function$;
REVOKE ALL ON FUNCTION public.powerhouse_prepare_connection_relationship_email_v1(date,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_prepare_connection_relationship_email_v1(date,integer) TO service_role;

-- 24 Nov original source trigger safety: terminal, unpermitted actions must not
-- be falsely marked sendable by the existing generic source-pass rewrite.
-- The old fail-closed source selection and research waiting semantics persist.
CREATE OR REPLACE FUNCTION public.powerhouse_require_source_for_direct_outreach_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare c text:=lower(coalesce(new.channel,''));
declare v_original_research_wait boolean:=false;
declare has_source boolean; declare predictive_ready boolean:=false; declare brief jsonb;
begin
 v_original_research_wait:=(
      new.action_type='autonomous_email'
      and new.status='waiting'
      and new.evidence #>> '{execution_gate,reason}'='SOURCE_SPECIFIC_EVIDENCE_REQUIRED'
      and new.evidence #>> '{commercial_closure,decision}'='WAIT_FOR_VERIFIED_SOURCE'
      and new.evidence #>> '{commercial_closure,provider_send_forbidden}'='true'
      and new.created_at>now()-interval '48 hours'
      and nullif(btrim(coalesce(new.evidence#>>'{commercial_closure,source_handoff_deadline}','')),'')::timestamptz = new.created_at+interval '48 hours'
      and new.evidence#>>'{commercial_closure,research_dedupe_key}'='relationship-research:outreach-source:'||new.action_id::text
      and not coalesce((new.evidence#>>'{autonomous_outbound,republish_forbidden}')::boolean,false)
      and not coalesce((new.evidence#>>'{provider_ambiguity_quarantine,external_resend_forbidden}')::boolean,false)
      and not coalesce((new.evidence->>'provider_ack_verified')::boolean,false)
      and nullif(btrim(coalesce(new.evidence#>>'{native_gmail_executor,provider_message_id}','')),'') is null
      and nullif(btrim(coalesce(new.person_key,'')),'') is not null
      and nullif(btrim(coalesce(new.company_key,'')),'') is not null
      and nullif(btrim(coalesce(new.evidence#>>'{autonomous_outbound,provider_message_id}','')),'') is null
      and not coalesce((new.evidence#>>'{autonomous_outbound,needs_readback}')::boolean,false)
      and exists (
        select 1 from public.powerhouse_sales_actions research
        where research.dedupe_key='relationship-research:outreach-source:'||new.action_id::text
          and research.action_type='research_enrichment'
          and research.channel='internal'
          and research.person_key=new.person_key
          and research.company_key=new.company_key
          and research.status in ('suggested','prepared','waiting','done')
      )
    );
 if c in ('email','e-mail','linkedin dm','linkedin_dm') then
  has_source:=coalesce(nullif(new.source_url,''),'')<>'' or coalesce(nullif(new.opportunity_key,''),'')<>''
   or coalesce(nullif(new.subject_key,''),'')<>'' or coalesce(new.evidence,'{}'::jsonb)?'source_lineage'
   or coalesce(new.evidence,'{}'::jsonb)?'source_ref' or coalesce(new.evidence,'{}'::jsonb)?'predictive_signal_id';
  if new.action_type='activate_connection' and coalesce(new.person_key,'')<>'' then
   select b.commercial_state in ('HOT_TRIGGER','PREDICTIVE_TRIGGER'),b.predictive_brief
   into predictive_ready,brief
   from public.powerhouse_predictive_commercial_brief_cache_v1 b where b.person_key=new.person_key;
   if not coalesce(predictive_ready,false) then
    select exists(select 1 from public.powerhouse_opportunities o where o.person_key=new.person_key
     and coalesce(o.status,'') not in ('closed','won','lost') and coalesce(o.expected_value_eur,0)>0)
    into predictive_ready;
   end if;
  else predictive_ready:=true; end if;
  if (not has_source and not v_original_research_wait) or (coalesce(new.person_key,'')='' and coalesce(new.company_key,'')='') or not predictive_ready then
   if new.status in ('suggested','prepared','waiting') then new.status:='skipped'; end if;
   new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object(
    'source_gate','FAIL','source_gate_contract','powerhouse-predictive-outreach-gate-v3',
    'source_gate_reason',case when not has_source then 'NO_TRACEABLE_SOURCE_OR_TRIGGER'
    when coalesce(new.person_key,'')='' and coalesce(new.company_key,'')='' then 'NO_PERSON_OR_COMPANY_CONTEXT'
    else 'NO_HOT_PREDICTIVE_TRIGGER_OR_VALUED_OPPORTUNITY' end,
    'predictive_activation_ready',coalesce(predictive_ready,false),'send_forbidden',true);
  else
   new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object(
    'source_gate',case when v_original_research_wait then 'PENDING_VERIFIED_SOURCE' else 'PASS' end,'source_gate_contract','powerhouse-predictive-outreach-gate-v3',
    'predictive_activation_ready',true,'predictive_brief',coalesce(brief,'{}'::jsonb),'send_forbidden',(
      v_original_research_wait
      or new.status in ('expired','skipped','failed','cancelled')
      or new.evidence#>>'{authority_quarantine,reason}'='RECIPIENT_AUTHORITY_UNVERIFIED'
    ));
  end if;
 end if;
 return new;
end 
$function$;
REVOKE ALL ON FUNCTION public.powerhouse_require_source_for_direct_outreach_v1() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_require_source_for_direct_outreach_v1() TO service_role;


-- Use only original already-running 10-minute email watchdog owner; refresh
-- existing scoped email learning at most once each Amsterdam calendar date.
-- Fail closed: learning error produces warning, never a false healthy email.
-- Do not retry consent-rejected, forbidden or quarantined waiting actions.
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
  v_email_learning_refresh_state text := 'NOT_EVALUATED';
  v_email_learning_last_recomputed_at timestamptz;
  v_learning_due timestamptz;
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
     -- A terminal/permission-rejected candidate is NOT a retryable provider wait.
     and coalesce(a.evidence#>>'{execution_gate,reason}','') <> 'RECIPIENT_AUTHORITY_UNVERIFIED'
     and coalesce(a.evidence#>>'{authority_quarantine,reason}','') <> 'RECIPIENT_AUTHORITY_UNVERIFIED'
     and coalesce(a.evidence->>'send_forbidden','false') <> 'true'
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

  -- Refresh original derived 180-day learning at most once per Amsterdam day.
  -- The same original watchdog is already invoked by the existing mux; no new cron.
  v_learning_due := ((p_now AT TIME ZONE 'Europe/Amsterdam')::date::timestamp
                      AT TIME ZONE 'Europe/Amsterdam');
  begin
    select max(last_recomputed_at) into v_email_learning_last_recomputed_at
    from public.powerhouse_email_learning_stats
    where channel='email' and evidence->>'contract'='powerhouse-email-reply-learning-v1';
    if v_email_learning_last_recomputed_at is null
      or v_email_learning_last_recomputed_at < v_learning_due then
      perform public.powerhouse_refresh_email_learning_stats();
      select max(last_recomputed_at) into v_email_learning_last_recomputed_at
      from public.powerhouse_email_learning_stats
      where channel='email' and evidence->>'contract'='powerhouse-email-reply-learning-v1';
      v_email_learning_refresh_state := 'REFRESHED_ORIGINAL';
    else
      v_email_learning_refresh_state := 'FRESH_ALREADY_RECOMPUTED';
    end if;
  exception when others then
    v_email_learning_refresh_state := 'LEARNING_REFRESH_FAILED:' || sqlstate;
  end;

  -- Existing scheduler/watchdog owner records the stage readback on every
  -- natural run; no secondary metrics scheduler and no fabricated green.
  begin
    select to_jsonb(score) into v_handoff_scorecard
    from public.powerhouse_commercial_handoff_scorecard_v1 score;
  exception when others then
    v_handoff_scorecard := jsonb_build_object('handoff_health','MEASUREMENT_FAILED','sqlstate',sqlstate);
  end;
  v_status := case when v_overdue>0 then 'fout'
                   when v_email_learning_refresh_state like 'LEARNING_REFRESH_FAILED:%' then 'waarschuwing'
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
      'email_learning_refresh_state',v_email_learning_refresh_state,
      'email_learning_last_recomputed_at',v_email_learning_last_recomputed_at,
      'checked_at',p_now
    )
  );

  return jsonb_build_object(
    'contract','powerhouse-email-execution-watchdog-v1',
    'healthy',v_email_learning_refresh_state not like 'LEARNING_REFRESH_FAILED:%'
      and v_overdue=0 and v_held_research=0 and
      v_handoff_scorecard->>'handoff_health'='PROVIDER_DELIVERY_PROVEN_OUTCOME_LEARNING_SEPARATE',
    'requeued_stale_waiting',v_requeued,
    'overdue_prepared',v_overdue,
    'waiting',v_waiting,
    'provider_verified_sent_24h',v_sent_24h,
    'email_learning_refresh_state',v_email_learning_refresh_state,
    'email_learning_last_recomputed_at',v_email_learning_last_recomputed_at,
    'checked_at',p_now
  );
end;
$function$;
REVOKE ALL ON FUNCTION public.powerhouse_email_execution_watchdog_v1(timestamptz) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_email_execution_watchdog_v1(timestamptz) TO service_role;
