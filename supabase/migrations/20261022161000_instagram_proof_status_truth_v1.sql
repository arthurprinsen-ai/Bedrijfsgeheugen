-- P0 #4439: prevent a failed Mira identity gate from retaining a false
-- "prepublish_verified" status. This fixes evidence consistency only; it
-- never supplies identity proof, changes the 0.94 minimum or publishes media.
-- Fingerprint: mira|prepublish-status-fail-contradiction|20261022-v1
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

DO $guard$
BEGIN
  IF to_regprocedure('public.enforce_instagram_media_proof_vision_v1()') IS NULL
     OR to_regprocedure('public.powerhouse_instagram_visual_proof_valid_v1(jsonb,text)') IS NULL
  THEN
    RAISE EXCEPTION 'INSTAGRAM_PROOF_STATUS_GATE_SOURCE_MISSING';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.powerhouse_media_proof_evidence_v1'::regclass
      AND tgname = 'enforce_instagram_media_proof_vision_v1'
      AND tgenabled = 'O'
  ) THEN
    RAISE EXCEPTION 'INSTAGRAM_PROOF_STATUS_GATE_TRIGGER_MISSING';
  END IF;
END;
$guard$;

CREATE OR REPLACE FUNCTION public.enforce_instagram_media_proof_vision_v1()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_visual jsonb := coalesce(NEW.proof_lineage->'instagram_visual', '{}'::jsonb);
  v_media_type text := coalesce(NEW.proof_lineage->>'media_type', 'image');
  v_invalid_visual boolean := false;
BEGIN
  IF NEW.channel IS DISTINCT FROM 'instagram' THEN
    RETURN NEW;
  END IF;

  IF jsonb_typeof(v_visual) IS DISTINCT FROM 'object' THEN
    v_visual := '{}'::jsonb;
  END IF;

  v_invalid_visual := NEW.identity_gate_result = 'PASS'
     AND NOT public.powerhouse_instagram_visual_proof_valid_v1(v_visual, v_media_type);

  IF v_invalid_visual THEN
    NEW.identity_gate_result := 'FAIL';
    NEW.failure_reason := coalesce(
      nullif(btrim(NEW.failure_reason), ''),
      'MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED'
    );
    NEW.proof_lineage := coalesce(NEW.proof_lineage, '{}'::jsonb) ||
      jsonb_build_object(
        'semantic_visual_proof_required', true,
        'metadata_only_identity_rejected', true,
        'vision_gate_enforced_at', now()
      );
  END IF;

  -- A failed or absent terminal identity verdict is NEVER "prepublish_verified".
  -- Keep genuine provider-published status and external IDs intact, even if
  -- separate verification must be reconciled; do not erase side-effect truth.
  IF NEW.identity_gate_result IS DISTINCT FROM 'PASS'
     AND NEW.provider_status = 'prepublish_verified'
  THEN
    NEW.identity_gate_result := 'FAIL';
    NEW.provider_status := 'prepublish_rejected';
    NEW.failure_reason := coalesce(
      nullif(btrim(NEW.failure_reason), ''),
      'MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED'
    );
    NEW.proof_lineage := coalesce(NEW.proof_lineage, '{}'::jsonb) ||
      jsonb_build_object(
        'instagram_visual', v_visual || jsonb_build_object('verified', false),
        'exact_final_media_proven', false,
        'semantic_visual_proof_required', true,
        'metadata_only_identity_rejected', true,
        'prepublish_status_reconciled', true
      );
  END IF;

  RETURN NEW;
END;
$function$;

-- Verify that the conservative trigger and owner permission boundary survive.
DO $readback$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = 'public.enforce_instagram_media_proof_vision_v1()'::regprocedure
      AND prosecdef = true
  ) THEN
    RAISE EXCEPTION 'INSTAGRAM_PROOF_STATUS_GATE_SECURITY_DEFINER_DRIFT';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.powerhouse_media_proof_evidence_v1'::regclass
      AND tgname = 'enforce_instagram_media_proof_vision_v1'
      AND tgenabled = 'O'
  ) THEN
    RAISE EXCEPTION 'INSTAGRAM_PROOF_STATUS_GATE_TRIGGER_DISABLED';
  END IF;
END;
$readback$;
COMMIT;
