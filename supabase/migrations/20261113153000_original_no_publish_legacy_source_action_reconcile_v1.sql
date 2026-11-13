-- Existing #171 publisher -> content_publication_obligations -> ONE BRAIN;
-- bounded source-action correction ONLY, not a new terminalizer or sender.
-- Historical incomplete SKIPPED decisions must NOT falsely claim "explicitly recorded".
-- Parent P0 #4198; original source owner remains unchanged.
-- Safe: no evidence, status, provider reference, decision_code or veto is changed.
DO $original_source_action$
DECLARE
  v_count integer;
BEGIN
  WITH candidates AS (
    SELECT p.tenant_id, p.publication_date, p.channel
    FROM public.content_publication_obligations p
    WHERE p.status = 'SKIPPED'
      AND jsonb_typeof(p.evidence) = 'object'
      AND nullif(btrim(coalesce(p.evidence->>'no_publish_reason','')),'') IS NOT NULL
      AND (
        p.evidence#>>'{veto,active}' IS DISTINCT FROM 'true'
        OR nullif(btrim(coalesce(p.evidence->>'decision_code','')),'') IS NULL
      )
      AND p.external_id IS NULL
      AND p.published_at IS NULL
      AND p.live_proven_at IS NULL
      AND NOT EXISTS (
        SELECT 1
        FROM unnest(ARRAY[
          'provider_create_success','provider_publication_ack_verified',
          'provider_truth_verified','terminal_provider_side_effect',
          'possible_provider_side_effect','reconciliation_required'
        ]) AS flag(k)
        WHERE public.powerhouse_jsonb_true(p.evidence,flag.k)
      )
      AND (
        p.next_action IS DISTINCT FROM 'ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND'
        OR p.last_error IS DISTINCT FROM 'NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE'
      )
  )
  SELECT count(*) INTO v_count FROM candidates;

  IF v_count > 64 THEN
    RAISE EXCEPTION 'NO_PUBLISH_LEGACY_ACTION_BACKFILL_SCOPE_EXCEEDED: %',v_count
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.content_publication_obligations p
     SET next_action = 'ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND',
         last_error = 'NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE',
         updated_at = now()
   WHERE p.status = 'SKIPPED'
     AND jsonb_typeof(p.evidence) = 'object'
     AND nullif(btrim(coalesce(p.evidence->>'no_publish_reason','')),'') IS NOT NULL
     AND (
       p.evidence#>>'{veto,active}' IS DISTINCT FROM 'true'
       OR nullif(btrim(coalesce(p.evidence->>'decision_code','')),'') IS NULL
     )
     AND p.external_id IS NULL AND p.published_at IS NULL
     AND p.live_proven_at IS NULL
     AND NOT EXISTS (
       SELECT 1 FROM unnest(ARRAY[
         'provider_create_success','provider_publication_ack_verified',
         'provider_truth_verified','terminal_provider_side_effect',
         'possible_provider_side_effect','reconciliation_required'
       ]) AS flag(k)
       WHERE public.powerhouse_jsonb_true(p.evidence,flag.k)
     )
     AND (
       p.next_action IS DISTINCT FROM 'ORIGINAL_NO_PUBLISH_DECISION_CODE_VETO_DATE_REASON_REQUIRED_NO_RESEND'
       OR p.last_error IS DISTINCT FROM 'NO_PUBLISH_SOURCE_DECISION_PROOF_INCOMPLETE'
     );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count > 64 THEN
    RAISE EXCEPTION 'NO_PUBLISH_LEGACY_ACTION_BACKFILL_WRITE_SCOPE_EXCEEDED: %',v_count
      USING ERRCODE = '23514';
  END IF;
END
$original_source_action$;
