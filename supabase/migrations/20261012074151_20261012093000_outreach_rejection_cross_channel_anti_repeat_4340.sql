-- #4340: extend the EXISTING suppression guard, never add a sender/scheduler.
-- A polite decline to sales outreach is a cross-channel commercial no-contact signal.
-- Preserve existing action history; only future or not-yet-claimed actions are withheld.
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

-- Existing BEFORE INSERT / UPDATE trigger remains attached; no duplicate trigger.
REVOKE EXECUTE ON FUNCTION public.powerhouse_email_suppression_guard_v1() FROM PUBLIC, anon, authenticated;
