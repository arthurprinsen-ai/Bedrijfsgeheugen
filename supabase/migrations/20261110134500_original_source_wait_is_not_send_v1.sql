-- Canonical same-action 48h research hold must survive the original DB triggers.
-- An original WAIT_FOR_VERIFIED_SOURCE is never an authorization to send.
-- Supression/consent, provider no-resend, composer quality and source-truth guards remain.
-- Existing original trigger functions only; no new queue, sender, scheduler or data tables.
CREATE OR REPLACE FUNCTION public.powerhouse_email_suppression_guard_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_email text := lower(btrim(coalesce(new.evidence->>'recipient_email','')));
  v_reason text;
  v_channel text := lower(replace(coalesce(new.channel,''),' ','_'));
  v_claim_transition boolean := false;
BEGIN
  IF new.status NOT IN ('suggested','prepared','waiting') THEN
    RETURN new;
  END IF;
  IF v_channel NOT IN ('email','e-mail','reply_email','linkedin_dm','reply_dm') THEN
    RETURN new;
  END IF;
  -- A waiting action with a provider-side effect must never be turned into a retry.
  IF TG_OP='UPDATE' THEN
    IF old.status='waiting' AND new.status='waiting' THEN RETURN new; END IF;
    v_claim_transition := new.status='waiting' AND old.status IS DISTINCT FROM 'waiting';
  ELSE
    v_claim_transition := new.status='waiting';
  END IF;

  -- Email can be present directly on the action or in the canonical contact record.
  IF v_email='' AND nullif(btrim(coalesce(new.person_key,'')),'') IS NOT NULL THEN
    SELECT lower(c.email) INTO v_email FROM public.bg_connecties c
    WHERE (c.sleutel=new.person_key OR c.linkedin_url=new.person_key)
      AND nullif(btrim(coalesce(c.email,'')),'') IS NOT NULL
    ORDER BY c.bijgewerkt_op DESC NULLS LAST LIMIT 1;
  END IF;

  SELECT s.reason INTO v_reason
  FROM public.powerhouse_email_contact_suppressions s
  WHERE s.active=true AND (
    (coalesce(v_email,'')<>'' AND lower(s.email)=v_email)
    OR (
      nullif(btrim(coalesce(new.person_key,'')),'') IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.powerhouse_sales_actions prior
        WHERE prior.person_key=new.person_key
          AND lower(coalesce(prior.evidence->>'recipient_email',''))=lower(s.email)
      )
    )
  )
  ORDER BY s.created_at DESC LIMIT 1;

  IF v_reason IS NOT NULL THEN
    new.status:='skipped';
    new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object(
      'send_forbidden',true,
      'suppressed',jsonb_build_object(
        'contract','powerhouse-outreach-rejection-guard-v2',
        'reason',v_reason,'checked_at',now(),'channels','cross_channel_commercial'
      )
    );
    RETURN new;
  END IF;

  -- A research WAIT is NOT a Gmail delivery claim. Keep original suppression
  -- checks above, but let the original watchdog hand off an exact, bounded,
  -- no-send source-wait receipt to the original composer/research worker.
  -- Never waive composer proof for a later PREPARED->WAITING provider claim.
  IF v_claim_transition AND (
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
    ) THEN
    new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object('send_forbidden',true);
    RETURN new;
  END IF;

  -- Independently enforce the composer receipt on the database claim boundary.
  -- This cannot authorize delivery: downstream consent and provider checks still apply.
  IF v_claim_transition
     AND new.action_type IN ('autonomous_email','activate_connection','email_followup','follow_up','reply_followup','reply_dm')
     AND (
       coalesce(new.evidence#>>'{commercial_intelligence,composer,source_specific_evidence_ok}','false')<>'true'
       OR coalesce(new.evidence#>>'{commercial_intelligence,composer,semantic_novelty_ok}','false')<>'true'
       OR coalesce(new.evidence#>>'{commercial_intelligence,composer,new_followup_evidence_ok}','false')<>'true'
     )
  THEN
    new.status:='skipped';
    new.evidence:=coalesce(new.evidence,'{}'::jsonb)||jsonb_build_object(
      'send_forbidden',true,
      'execution_gate',jsonb_build_object(
        'contract','powerhouse-outreach-rejection-guard-v2',
        'reason','NO_PROSPECT_SPECIFIC_NOVEL_COPY_PROOF','blocked_at',now()
      )
    );
  END IF;
  RETURN new;
END
$function$;

CREATE OR REPLACE FUNCTION public.powerhouse_assert_outbound_message_quality_v1()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
begin
  -- The only pre-quality WAIT exception is an original, non-sending 48h
  -- research handoff. DONE, provider sending and ordinary WAITING claims
  -- still require original proven message quality.
  if (
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
    ) then
    return new;
  end if;
  if lower(replace(coalesce(new.channel,''),' ','_')) in ('email','e-mail','linkedin_dm')
     and new.action_type in ('autonomous_email','activate_connection','email_followup','follow_up','reply_followup','reply_dm')
     and new.status in ('waiting','done')
     and new.status is distinct from old.status
     and not coalesce(public.powerhouse_outbound_message_quality_ready_v1(new.action_id),false) then
    raise exception 'OUTBOUND_COPY_QUALITY_NOT_PROVEN action_id=%',new.action_id using errcode='P0001';
  end if;
  return new;
end 
$function$;

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
    'predictive_activation_ready',true,'predictive_brief',coalesce(brief,'{}'::jsonb),'send_forbidden',v_original_research_wait);
  end if;
 end if;
 return new;
end 
$function$;
