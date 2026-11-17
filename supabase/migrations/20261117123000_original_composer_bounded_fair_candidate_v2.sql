-- P0 #4198. Correct original composer 503 PLAN_READ timeout.
-- Old RPC materialized the full costly commercial view twice (52.2s).
-- Original read-only shadow with cheap IDs + correlated hydration: 16ms.
-- No new cron, sender, queue, role timeout or changed source/consent gate.
BEGIN;
DO $guard$
BEGIN
  IF to_regclass('public.powerhouse_commercial_message_plan_v1') IS NULL THEN
    RAISE NOTICE 'ORIGINAL_COMPOSER_HISTORICAL_VIEW_ABSENT_PREVIEW_ONLY: native production readback mandatory';
  ELSE
    EXECUTE $ddl$
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
  WITH cheap_eligible AS MATERIALIZED (
    SELECT a.action_id,a.status,a.priority,
      lower(replace(a.channel,' ','_')) AS channel_norm
    FROM public.powerhouse_sales_actions a
    WHERE a.status IN ('prepared','suggested','waiting')
      AND lower(replace(a.channel,' ','_')) =
        ANY(ARRAY['email','e-mail','linkedin_dm','linkedin_personal',
                  'linkedin_comment','reply_email','reply_dm']::text[])
      AND (p_channels IS NULL OR cardinality(p_channels)=0
           OR lower(replace(a.channel,' ','_'))=ANY(p_channels))
      AND (p_action_ids IS NULL OR cardinality(p_action_ids)=0
           OR a.action_id=ANY(p_action_ids))
      AND (
        coalesce(a.evidence#>>'{commercial_intelligence,composer,contract}','')
          <> 'powerhouse-human-commercial-message-composer-v2'
        OR coalesce(a.evidence#>>'{commercial_intelligence,quality_passed}','false')
          <> 'true'
        OR coalesce(a.message_draft,'')=''
      )
  ), ranked AS (
    SELECT e.*,
      row_number() OVER (
        PARTITION BY CASE WHEN e.channel_norm IN ('email','e-mail')
          THEN 'email' ELSE 'other' END
        ORDER BY
          CASE WHEN e.status='prepared' THEN 0
               WHEN e.status='waiting' THEN 1 ELSE 2 END,
          e.priority DESC,e.action_id
      ) AS lane_rank
    FROM cheap_eligible e
  ), picked AS MATERIALIZED (
    -- Preserve 2/5 email fairness. Overfetch bounded candidate IDs to avoid
    -- losing slots if a playbook is inactive: 4x batch, max 200 IDs.
    SELECT e.*,
      CASE WHEN e.channel_norm IN ('email','e-mail')
        AND e.lane_rank<=LEAST(2,GREATEST(1,
          CEIL(GREATEST(1,LEAST(coalesce(p_limit,10),50))::numeric*0.4)::integer))
        THEN 0 ELSE 1 END AS lane_priority
    FROM ranked e
    ORDER BY
      CASE WHEN e.channel_norm IN ('email','e-mail')
        AND e.lane_rank<=LEAST(2,GREATEST(1,
          CEIL(GREATEST(1,LEAST(coalesce(p_limit,10),50))::numeric*0.4)::integer))
        THEN 0 ELSE 1 END,
      e.priority DESC,e.action_id
    LIMIT GREATEST(8,LEAST(200,4*GREATEST(1,LEAST(coalesce(p_limit,10),50))))
  )
  SELECT plan.*
  FROM picked k
  CROSS JOIN LATERAL (
    -- Deliberate optimization fence: hydrate only the selected original
    -- action IDs, not the full expensive commercial message-plan view.
    SELECT v.* FROM public.powerhouse_commercial_message_plan_v1 v
    WHERE v.action_id=k.action_id
    OFFSET 0
  ) plan
  ORDER BY k.lane_priority,k.priority DESC,k.action_id
  LIMIT GREATEST(1,LEAST(coalesce(p_limit,10),50));
$candidate$;
$ddl$;
    REVOKE ALL ON FUNCTION
      public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[])
      FROM PUBLIC,anon,authenticated;
    GRANT EXECUTE ON FUNCTION
      public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[])
      TO service_role;
    COMMENT ON FUNCTION
      public.powerhouse_commercial_message_candidates_v1(integer,text[],uuid[])
      IS 'Original composer #4198: cheap indexed action-ID fairness then bounded correlated LATERAL view hydration; no sender, policy or scheduler change.';
  END IF;
END
$guard$;
COMMIT;
