-- P0 #4198 ORIGINAL composer fairness. The historical composer rowtype is
-- deployed in production but absent from Supabase clean-room preview because
-- the foundational source was archived in repository-only migration history.
-- Fail truthfully: preview absence is NOT production behavior proof.
-- No parallel owner, send permission, scheduler or fake preview type.
BEGIN;
DO $guard$
BEGIN
  IF to_regclass('public.powerhouse_commercial_message_plan_v1') IS NULL THEN
    RAISE NOTICE 'ORIGINAL_COMPOSER_PREVIEW_DEPENDENCY_MISSING: no rowtype; no function altered. Original production SQL readback mandatory.';
  ELSE
    EXECUTE $original_source$
CREATE OR REPLACE FUNCTION public.powerhouse_commercial_message_candidates_v1(
  p_limit integer DEFAULT 10,
  p_channels text[] DEFAULT NULL::text[],
  p_action_ids uuid[] DEFAULT NULL::uuid[]
)
RETURNS SETOF public.powerhouse_commercial_message_plan_v1
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'pg_catalog','public'
AS $candidate$
  WITH eligible AS MATERIALIZED (
    SELECT
      p.action_id,
      p.channel_norm,
      row_number() OVER (
        PARTITION BY CASE
          WHEN p.channel_norm IN ('email','e-mail') THEN 'email'
          ELSE 'other'
        END
        ORDER BY
          CASE WHEN p.status = 'prepared' THEN 0
               WHEN p.status = 'waiting' THEN 1 ELSE 2 END,
          p.priority DESC,
          p.action_id
      ) AS lane_rank
    FROM public.powerhouse_commercial_message_plan_v1 p
    WHERE p.status IN ('prepared','suggested','waiting')
      AND (p_channels IS NULL OR cardinality(p_channels)=0
           OR p.channel_norm = ANY(p_channels))
      AND (p_action_ids IS NULL OR cardinality(p_action_ids)=0
           OR p.action_id = ANY(p_action_ids))
      AND (
        coalesce(p.evidence#>>'{commercial_intelligence,composer,contract}','')
           <> 'powerhouse-human-commercial-message-composer-v2'
        OR coalesce(p.evidence#>>'{commercial_intelligence,quality_passed}','false')
           <> 'true'
        OR coalesce(p.message_draft,'')=''
      )
  )
  SELECT p.*
  FROM public.powerhouse_commercial_message_plan_v1 p
  JOIN eligible e ON e.action_id = p.action_id
  ORDER BY
    CASE
      WHEN p.channel_norm IN ('email','e-mail')
       AND e.lane_rank <= LEAST(2,
         GREATEST(1, CEIL(GREATEST(1,LEAST(coalesce(p_limit,10),50))::numeric * 0.4)::int))
      THEN 0 ELSE 1 END,
    p.priority DESC, p.action_id
  LIMIT GREATEST(1,LEAST(coalesce(p_limit,10),50));
$candidate$;
$original_source$;
    EXECUTE $original_comment$
COMMENT ON FUNCTION public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[])
IS 'Existing original composer selector. Reserve at most two of its existing batch slots for eligible email candidates to prevent LinkedIn-DM priority starvation; no grant, send or status bypass.';
$original_comment$;
  END IF;
END
$guard$;
COMMIT;
