-- ORIGINAL #171 source decision owner: provider-success evidence is immutable.
-- Root cause: original JSONB || incoming payload can mask original true provider
-- success with false, despite the existing provider-side-effect fence.
-- Fail closed on ANY original/incoming provider write or conflict, retain active
-- veto in nested merges, preserve SKIPPED without a false terminal decision
-- when mandatory original decision_code/veto evidence is absent.
-- This only replaces the existing original RPC; no new cron, producer or sender.
-- Parent incident #4198. Historical source proof is NEVER fabricated.

CREATE OR REPLACE FUNCTION public.record_content_publication_skip(p_tenant_id text, p_publication_date date, p_channel text, p_reason text, p_evidence jsonb DEFAULT '{}'::jsonb)
 RETURNS content_publication_obligations
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_row public.content_publication_obligations%rowtype;
  v_reason text := btrim(coalesce(p_reason,''));
  v_original_evidence jsonb;
  v_incoming_evidence jsonb := coalesce(p_evidence,'{}'::jsonb);
  v_combined_evidence jsonb;
  v_provider_side_effect boolean := false;
  v_source_decision_complete boolean := false;
begin
  if v_reason = '' then
    raise exception 'NO_PUBLISH_REASON_REQUIRED';
  end if;
  if jsonb_typeof(v_incoming_evidence) <> 'object' then
    raise exception 'NO_PUBLISH_EVIDENCE_OBJECT_REQUIRED'
      using errcode='23514';
  end if;

  select * into v_row
  from public.content_publication_obligations
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  for update;

  if not found then
    raise exception 'PUBLICATION_OBLIGATION_NOT_FOUND';
  end if;

  -- A source-side success may NEVER be masked by a later payload with a
  -- false/null copy of the same JSON key. Evaluate both original and incoming
  -- provider evidence independently, before merging any new object fields.
  v_original_evidence := coalesce(v_row.evidence,'{}'::jsonb);
  if jsonb_typeof(v_original_evidence) <> 'object' then
    raise exception 'NO_PUBLISH_ORIGINAL_EVIDENCE_OBJECT_REQUIRED'
      using errcode='23514';
  end if;
  select coalesce(bool_or(
    public.powerhouse_jsonb_true(v_original_evidence,k)
    or public.powerhouse_jsonb_true(v_incoming_evidence,k)
  ),false) into v_provider_side_effect
  from unnest(array[
    'provider_create_success','provider_publication_ack_verified',
    'provider_truth_verified','terminal_provider_side_effect',
    'possible_provider_side_effect','reconciliation_required'
  ]) as provider_flags(k);

  -- A protected existing provider-side effect or unresolved source conflict
  -- means the original account/source owner must reconcile: no re-publish
  -- and no historical provider-truth erasure through JSONB || precedence.
  if nullif(btrim(coalesce(v_row.external_id,'')),'') is not null
     or v_row.published_at is not null
     or v_row.live_proven_at is not null
     or v_provider_side_effect
     or nullif(btrim(coalesce(v_original_evidence->>'source_state_conflict','')),'') is not null
     or nullif(btrim(coalesce(v_incoming_evidence->>'source_state_conflict','')),'') is not null
  then
    raise exception 'NO_PUBLISH_PROVIDER_REFERENCE_MUST_RECONCILE'
      using errcode='23514';
  end if;

  -- JSONB || replaces entire nested objects. Do not allow a partial incoming
  -- veto to erase an already active original veto or weaken its status.
  if v_original_evidence#>>'{veto,active}'='true'
     and v_incoming_evidence ? 'veto'
     and (jsonb_typeof(v_incoming_evidence->'veto') <> 'object'
       or ((v_incoming_evidence->'veto') ? 'active'
         and v_incoming_evidence#>>'{veto,active}' is distinct from 'true')) then
    raise exception 'NO_PUBLISH_EXISTING_VETO_CANNOT_BE_DOWNGRADED'
      using errcode='23514';
  end if;
  v_combined_evidence := v_original_evidence || v_incoming_evidence;
  if jsonb_typeof(v_original_evidence->'veto')='object'
     and jsonb_typeof(v_incoming_evidence->'veto')='object' then
    v_combined_evidence := jsonb_set(v_combined_evidence,'{veto}',
      (v_original_evidence->'veto') || (v_incoming_evidence->'veto'));
  end if;
  -- Missing source decision_code or true active veto never authorizes a
  -- terminal NO_PUBLISH; preserve SKIPPED/no-send but route an OPEN proof
  -- debt back to its original decision owner (no guessed decision codes).
  v_source_decision_complete :=
    v_combined_evidence#>>'{veto,active}'='true'
    and nullif(btrim(coalesce(v_combined_evidence->>'decision_code','')),'') is not null;

  if v_row.status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    raise exception 'NO_PUBLISH_DECISION_TOO_LATE';
  end if;

  update public.content_publication_obligations
  set status = 'SKIPPED',
      evidence = v_combined_evidence
        || jsonb_build_object(
             'decision','NO_PUBLISH',
             'no_publish_reason',v_reason,
             'decided_at',now()
           ),
      next_action = case when v_source_decision_complete
        then 'Geen publicatie vereist: expliciete no-publish-beslissing vastgelegd.'
        else 'ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND'
      end,
      last_error = case when v_source_decision_complete then null
        else 'NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE'
      end,
      updated_at = now()
  where tenant_id = p_tenant_id
    and publication_date = p_publication_date
    and channel = p_channel
  returning * into v_row;

  return v_row;
end;
$function$
;
REVOKE ALL ON FUNCTION public.record_content_publication_skip(text,date,text,text,jsonb)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.record_content_publication_skip(text,date,text,text,jsonb)
  TO service_role;
