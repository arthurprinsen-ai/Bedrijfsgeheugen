-- P0 #4198: exact canonical publication proof reconciliation in the EXISTING
-- daily execution status. No second scheduler, publisher or provider side effect.
-- The prior evaluator read only decision.delivery_evidence. This missed a
-- same-day LIVE_PROVEN blog despite exact Netlify+public GET provider proof,
-- and classified a permission-limited but immutable provider-create ACK as
-- an unverified publication attempt. Keep these two proof tiers separate.
--
-- Do not equate ACK-only with independently verified provider readback.
-- Do not count SKIPPED, BLOCKED, another day, another ref or bare URNs.
-- Instagram media proof and predictive calibration remain independent guards.

CREATE OR REPLACE FUNCTION public.powerhouse_execution_status(
  p_run_date date DEFAULT current_date
) RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
WITH decisions AS (
  SELECT d.channel, d.decision, d.state, d.delivery_ref,
    COALESCE((
      d.decision='publish'
      AND d.state IN ('published','measured','learned')
      AND NULLIF(btrim(d.delivery_ref),'') IS NOT NULL
      AND d.delivery_evidence->>'provider_truth_verified'='true'
      AND d.delivery_evidence->>'provider_status'='published'
    ),false) AS direct_provider_proven,

    COALESCE((
      d.decision='publish'
      AND d.channel='blog'
      AND d.state IN ('published','measured','learned')
      AND o.channel='blog'
      AND o.status IN ('LIVE_PROVEN','MEASURED','LEARNED')
      AND o.live_proven_at IS NOT NULL
      AND NULLIF(btrim(d.delivery_ref),'')=NULLIF(btrim(o.canonical_url),'')
      AND o.canonical_url LIKE 'https://%'
      AND o.evidence->>'provider_truth_verified'='true'
      AND o.evidence->>'artifact_truth_verified'='true'
      AND o.evidence->>'netlify_deploy_state'='ready'
      AND o.evidence->>'public_http_status'='200'
      AND o.evidence->>'production_commit_sha' ~ '^[a-f0-9]{40}$'
    ),false) AS canonical_blog_proven,

    COALESCE((
      d.decision='publish'
      AND d.state IN ('published','measured','learned')
      AND d.channel IN ('linkedin_company','linkedin_personal','instagram_company')
      AND o.status='PUBLISHED'
      AND NULLIF(btrim(d.delivery_ref),'') IS NOT NULL
      AND NULLIF(btrim(o.external_id),'')=NULLIF(btrim(d.delivery_ref),'')
      AND d.delivery_evidence->>'terminal_provider_side_effect'='true'
      AND d.delivery_evidence->>'provider_publication_ack_verified'='true'
      AND d.delivery_evidence->>'provider_create_success'='true'
      AND d.delivery_evidence->>'readback_permission_limited'='true'
      AND d.delivery_evidence->>'republish_forbidden'='true'
      AND o.evidence->>'terminal_provider_side_effect'='true'
      AND o.evidence->>'provider_publication_ack_verified'='true'
      AND o.evidence->>'provider_create_success'='true'
      AND o.evidence->>'readback_permission_limited'='true'
      AND o.evidence->>'republish_forbidden'='true'
      AND o.evidence->>'provider_truth_verified' <> 'true'
    ),false) AS canonical_limited_create_ack
  FROM public.powerhouse_channel_decisions d
  LEFT JOIN public.content_publication_obligations o
    ON o.tenant_id='canonical'
   AND o.publication_date=d.run_date
   AND o.channel=CASE WHEN d.channel='instagram_company'
                      THEN 'instagram' ELSE d.channel END
  WHERE d.run_date=p_run_date
), proof AS (
  SELECT *,
    (direct_provider_proven OR canonical_blog_proven) AS independently_proven,
    (NOT (direct_provider_proven OR canonical_blog_proven)
      AND canonical_limited_create_ack) AS limited_ack_only,
    (direct_provider_proven OR canonical_blog_proven
      OR canonical_limited_create_ack) AS terminal_provider_side_effect
  FROM decisions
), d AS (
  SELECT
    count(*)::int AS decision_count,
    count(*) FILTER (WHERE decision='publish')::int AS publish_count,
    count(*) FILTER (WHERE terminal_provider_side_effect)::int AS delivered_publish_count,
    count(*) FILTER (WHERE independently_proven)::int AS independently_verified_publish_count,
    count(*) FILTER (WHERE limited_ack_only)::int AS limited_ack_publish_count,
    count(*) FILTER (WHERE decision='publish' AND NOT terminal_provider_side_effect)::int AS unresolved_publish_count,
    count(*) FILTER (
      WHERE independently_proven
        AND channel IN ('linkedin_company','linkedin_personal','instagram_company')
    )::int AS published_social_count,
    count(*) FILTER (
      WHERE terminal_provider_side_effect
        AND channel IN ('linkedin_company','linkedin_personal','instagram_company')
    )::int AS terminal_social_count
  FROM proof
)
SELECT jsonb_build_object(
  'run_date',p_run_date,
  'decision_count',d.decision_count,
  'publish_count',d.publish_count,
  'delivered_publish_count',d.delivered_publish_count,
  'independently_verified_publish_count',d.independently_verified_publish_count,
  'limited_ack_publish_count',d.limited_ack_publish_count,
  'unresolved_publish_count',d.unresolved_publish_count,
  'published_social_count',d.published_social_count,
  'terminal_social_count',d.terminal_social_count,
  'all_channels_decided',d.decision_count=7,
  'execution_complete',d.decision_count=7 AND d.unresolved_publish_count=0,
  'publication_proof_boundary',
    'independent verified source or exact matched immutable provider-create ACK; ACK alone is not provider readback',
  'publication_authority','public.content_publication_obligations',
  'actual_publication_guard','public.powerhouse_publication_proof_health'
)
FROM d;
$function$;

-- Preserve original invoker privileges; never make service-role data browser-visible.
REVOKE ALL ON FUNCTION public.powerhouse_execution_status(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_execution_status(date) TO service_role;

COMMENT ON FUNCTION public.powerhouse_execution_status(date) IS
'Exact same-day source-to-decision reconciliation with strict blog Netlify proof and separately labeled immutable ACK-only provider creation. Never counts skips/unknown as a publish, never authorizes sending or relaxes downstream proof guards.';
