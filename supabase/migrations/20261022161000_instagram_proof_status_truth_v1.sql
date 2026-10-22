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

-- The producer/verifier calls exact extracted video frames "video_frame".
-- Previously this was treated as a 1080x1350 static image, rejecting even a
-- genuine 1080x1920 face match. Keep the original >=0.94 identity gate.
CREATE OR REPLACE FUNCTION public.powerhouse_instagram_visual_proof_valid_v1(
  p_visual jsonb, p_media_type text DEFAULT 'image'::text
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_catalog'
AS $validator$
  SELECT
    coalesce((p_visual->>'verified')::boolean, false)
    AND coalesce((p_visual->>'semantic_verified')::boolean, false)
    AND coalesce((p_visual->>'mira_present')::boolean, false)
    AND coalesce(p_visual->>'identity_class', '') = 'mira_daily_life'
    AND lower(coalesce(p_visual->>'evidence_method', '')) = 'vision'
    AND coalesce((p_visual->>'format_verified')::boolean, false)
    AND coalesce((p_visual->>'visual_complete')::boolean, false)
    AND coalesce((p_visual->>'daily_life_scene')::boolean, false)
    AND coalesce((p_visual->>'mira_central_subject')::boolean, false)
    AND NOT coalesce((p_visual->>'placeholder_detected')::boolean, true)
    AND NOT coalesce((p_visual->>'text_dominant')::boolean, true)
    AND NOT coalesce((p_visual->>'brand_template_dominant')::boolean, true)
    AND coalesce((p_visual->>'confidence')::numeric, 0) >= 0.90
    AND coalesce((p_visual->>'face_identity_match')::boolean, false)
    AND coalesce((p_visual->>'face_identity_confidence')::numeric, 0) >= 0.94
    AND coalesce(p_visual->>'identity_comparison_method', '') = 'two_image_vision'
    AND coalesce(p_visual->>'canonical_reference_id', '') = 'Yjqu4D7v76HABNPmQPj1'
    AND coalesce(p_visual->>'canonical_reference_url', '') =
      'https://cdn.openart.ai/openart-ai/production/2026-09/create-image/WZvuT1BzGx566fWaFo8F/image_1790665568080_41c2e10a_1790665568142_c6e526dd.jpg'
    AND coalesce(p_visual->>'master_reference_sha256', '') ~ '^[0-9a-f]{64}
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
     AND public.powerhouse_instagram_visual_proof_valid_v1(v_visual, v_media_type) IS NOT TRUE;

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
DECLARE
  v_good jsonb := jsonb_build_object(
    'verified', true,
    'semantic_verified', true,
    'mira_present', true,
    'identity_class', 'mira_daily_life',
    'evidence_method', 'vision',
    'format_verified', true,
    'visual_complete', true,
    'daily_life_scene', true,
    'mira_central_subject', true,
    'placeholder_detected', false,
    'text_dominant', false,
    'brand_template_dominant', false,
    'confidence', 0.95,
    'face_identity_match', true,
    'face_identity_confidence', 0.95,
    'identity_comparison_method', 'two_image_vision',
    'canonical_reference_id', 'Yjqu4D7v76HABNPmQPj1',
    'canonical_reference_url', 'https://cdn.openart.ai/openart-ai/production/2026-09/create-image/WZvuT1BzGx566fWaFo8F/image_1790665568080_41c2e10a_1790665568142_c6e526dd.jpg',
    'master_reference_sha256', repeat('a', 64),
    'evidence_refs', jsonb_build_array('vision:synthetic-contract-unit-test'),
    'width', 1080,
    'height', 1920
  );
BEGIN
  -- These are synthetic predicate tests; no media row is inserted or marked live.
  IF public.powerhouse_instagram_visual_proof_valid_v1(v_good, 'video_frame') IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'INSTAGRAM_PROOF_STATUS_VALID_VERTICAL_FRAME_REJECTED';
  END IF;
  IF public.powerhouse_instagram_visual_proof_valid_v1(
      v_good || jsonb_build_object('face_identity_confidence', 0.92), 'video_frame'
    ) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'INSTAGRAM_PROOF_STATUS_WEAK_FACE_ACCEPTED';
  END IF;
  IF public.powerhouse_instagram_visual_proof_valid_v1(
      v_good || jsonb_build_object('height', 1350), 'video_frame'
    ) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'INSTAGRAM_PROOF_STATUS_WRONG_REEL_ASPECT_ACCEPTED';
  END IF;
  IF public.powerhouse_instagram_visual_proof_valid_v1(
      v_good || jsonb_build_object('canonical_reference_id', 'different-person'), 'video_frame'
    ) IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'INSTAGRAM_PROOF_STATUS_WRONG_MASTER_ACCEPTED';
  END IF;
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

    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(
        coalesce(p_visual->'evidence_refs', '[]'::jsonb)
      ) ref(value)
      WHERE value ~* '^vision:'
    )
    AND (
      CASE
        WHEN lower(coalesce(p_media_type, '')) IN ('video', 'reel', 'video_frame')
          THEN coalesce((p_visual->>'width')::int, 0) = 1080
            AND coalesce((p_visual->>'height')::int, 0) = 1920
        WHEN lower(coalesce(p_media_type, '')) IN ('image', 'static_image')
          THEN coalesce((p_visual->>'width')::int, 0) = 1080
            AND coalesce((p_visual->>'height')::int, 0) = 1350
        ELSE false
      END
    );
$validator$;

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
