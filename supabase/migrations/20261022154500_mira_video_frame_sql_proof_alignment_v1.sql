-- Canonical P0 #4439 regression: video_frame is a vertical VIDEO, not an image.
-- Distinct fingerprint: mira|sql-proof-video-frame-portrait-dimension-false-rejection|20261022-v1
-- Preserve fail-closed strict >=94% facial identity proof, evidence and media dimensions.
-- No historical evidence rows, scheduler, credentials or external publication are changed.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';

CREATE OR REPLACE FUNCTION public.powerhouse_instagram_visual_proof_valid_v1(
  p_visual jsonb,
  p_media_type text DEFAULT 'image'
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
  SELECT
    coalesce((p_visual->>'verified')::boolean, false)
    AND coalesce((p_visual->>'semantic_verified')::boolean, false)
    AND coalesce((p_visual->>'mira_present')::boolean, false)
    AND coalesce(p_visual->>'identity_class', '') = 'mira_daily_life'
    AND lower(coalesce(p_visual->>'evidence_method', '')) = 'vision'
    AND coalesce((p_visual->>'format_verified')::boolean, false)
    AND NOT coalesce((p_visual->>'placeholder_detected')::boolean, true)
    AND coalesce((p_visual->>'visual_complete')::boolean, false)
    AND EXISTS (
      SELECT 1
      FROM jsonb_array_elements_text(coalesce(p_visual->'evidence_refs', '[]'::jsonb)) ref(value)
      WHERE value ~* '^vision:'
    )
    AND (
      CASE
        WHEN lower(coalesce(p_media_type, 'image')) IN ('video', 'reel', 'video_frame')
          THEN coalesce((p_visual->>'width')::int, 0) = 1080
            AND coalesce((p_visual->>'height')::int, 0) = 1920
        ELSE coalesce((p_visual->>'width')::int, 0) = 1080
          AND coalesce((p_visual->>'height')::int, 0) = 1350
      END
    )
    -- Frame-level proof is independently scoped to the canonical fictional Mira.
    -- Other media-type behavior remains unchanged from the preexisting function.
    AND (
      lower(coalesce(p_media_type, 'image')) <> 'video_frame'
      OR (
        coalesce((p_visual->>'face_identity_match')::boolean, false)
        AND coalesce((p_visual->>'face_identity_confidence')::numeric, 0) >= 0.94
        AND p_visual->>'canonical_reference_id' = 'Yjqu4D7v76HABNPmQPj1'
        AND p_visual->>'identity_comparison_method' = 'two_image_vision'
        AND coalesce(p_visual->>'master_reference_sha256', '') ~ '^[0-9a-f]{64}$'
      )
    );
$function$;

-- Inline fail-closed regression, with ephemeral synthetic JSON ONLY.
-- No row insert and no fabricated customer/provider publication evidence.
DO $tests$
DECLARE
  positive jsonb := jsonb_build_object(
    'verified', true, 'semantic_verified', true, 'mira_present', true,
    'identity_class', 'mira_daily_life', 'evidence_method', 'vision',
    'format_verified', true, 'placeholder_detected', false, 'visual_complete', true,
    'evidence_refs', jsonb_build_array('vision:regression:fixture'),
    'width', 1080, 'height', 1920,
    'face_identity_match', true, 'face_identity_confidence', 0.95,
    'canonical_reference_id', 'Yjqu4D7v76HABNPmQPj1',
    'identity_comparison_method', 'two_image_vision',
    'master_reference_sha256', repeat('a', 64)
  );
BEGIN
  IF NOT public.powerhouse_instagram_visual_proof_valid_v1(positive, 'video_frame') THEN
    RAISE EXCEPTION 'MIRA_SQL_VIDEO_FRAME_VALID_POSITIVE_REJECTED';
  END IF;
  IF public.powerhouse_instagram_visual_proof_valid_v1(
    jsonb_set(positive, '{face_identity_confidence}', '0.93'::jsonb), 'video_frame'
  ) THEN
    RAISE EXCEPTION 'MIRA_SQL_VIDEO_FRAME_UNDER_094_ACCEPTED';
  END IF;
  IF public.powerhouse_instagram_visual_proof_valid_v1(
    jsonb_set(positive, '{face_identity_match}', 'false'::jsonb), 'video_frame'
  ) THEN
    RAISE EXCEPTION 'MIRA_SQL_VIDEO_FRAME_WRONG_FACE_ACCEPTED';
  END IF;
  IF public.powerhouse_instagram_visual_proof_valid_v1(
    jsonb_set(positive, '{height}', '1350'::jsonb), 'video_frame'
  ) THEN
    RAISE EXCEPTION 'MIRA_SQL_VIDEO_FRAME_WRONG_HEIGHT_ACCEPTED';
  END IF;
  IF public.powerhouse_instagram_visual_proof_valid_v1(
    jsonb_set(positive, '{evidence_refs}', '[]'::jsonb), 'video_frame'
  ) THEN
    RAISE EXCEPTION 'MIRA_SQL_VIDEO_FRAME_NO_VISION_REF_ACCEPTED';
  END IF;
  IF public.powerhouse_instagram_visual_proof_valid_v1(
    jsonb_set(positive, '{canonical_reference_id}', '"other-id"'::jsonb), 'video_frame'
  ) THEN
    RAISE EXCEPTION 'MIRA_SQL_VIDEO_FRAME_WRONG_MASTER_ACCEPTED';
  END IF;
  IF NOT public.powerhouse_instagram_visual_proof_valid_v1(positive, 'reel') THEN
    RAISE EXCEPTION 'MIRA_SQL_REEL_PREEXISTING_DIMENSIONS_BROKEN';
  END IF;
  IF NOT public.powerhouse_instagram_visual_proof_valid_v1(
    jsonb_set(positive, '{height}', '1350'::jsonb), 'image'
  ) THEN
    RAISE EXCEPTION 'MIRA_SQL_IMAGE_PREEXISTING_DIMENSIONS_BROKEN';
  END IF;
END;
$tests$;
COMMIT;
