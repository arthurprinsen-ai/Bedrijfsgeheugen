-- Root cause: publishing the blog via the protected pipeline records LIVE_PROVEN
-- in canonical content_publication_obligations, while the daily decision's
-- delivery_evidence is subsequently replaced by the content generator without
-- provider_truth_verified. This made real provider-proven output falsely count
-- as unresolved. A permission-limited LinkedIn provider-create acknowledgement
-- is a terminal side effect but is NOT independent provider readback.
-- Reuse only canonical same-day, same-channel, exact delivery identity.
-- No new scheduler, source, public grants, recipient writes or status override.

CREATE OR REPLACE FUNCTION public.powerhouse_execution_status(
  p_run_date date DEFAULT CURRENT_DATE
) RETURNS jsonb
LANGUAGE sql STABLE
SET search_path TO 'public', 'pg_catalog'
AS $function$
WITH source_decisions AS (
  SELECT d.channel, d.decision, d.state, d.delivery_ref,
         d.delivery_evidence, o.status AS obligation_status,
         o.external_id, o.canonical_url, o.published_at,
         o.live_proven_at, o.evidence AS obligation_evidence
  FROM public.powerhouse_channel_decisions d
  LEFT JOIN public.content_publication_obligations o
    ON o.tenant_id='canonical'
   AND o.publication_date=d.run_date
   AND o.channel=CASE WHEN d.channel='instagram_company' THEN 'instagram' ELSE d.channel END
  WHERE d.run_date=p_run_date
), proofs AS (
  SELECT *,
    COALESCE((
      decision='publish'
      AND state IN ('published','measured','learned')
      AND nullif(btrim(delivery_ref),'') IS NOT NULL
      AND (
        (delivery_evidence->>'provider_truth_verified'='true'
          AND delivery_evidence->>'provider_status'='published')
        OR (
          obligation_status='LIVE_PROVEN'
          AND live_proven_at IS NOT NULL
          AND obligation_evidence->>'provider_truth_verified'='true'
          AND delivery_ref=coalesce(external_id,canonical_url)
        )
      )
    ),false) AS independently_proven,
    (
      decision='publish'
      AND state IN ('published','measured','learned')
      AND nullif(btrim(delivery_ref),'') IS NOT NULL
      AND obligation_status='PUBLISHED'
      AND published_at IS NOT NULL
      AND external_id IS NOT NULL
      AND delivery_ref=external_id
      AND obligation_evidence->>'provider_create_success'='true'
      AND obligation_evidence->>'provider_publication_ack_verified'='true'
      AND obligation_evidence->>'terminal_provider_side_effect'='true'
      AND obligation_evidence->>'readback_permission_limited'='true'
      AND obligation_evidence->>'republish_forbidden'='true'
    ),false) AS terminal_permission_limited_ack
  FROM source_decisions
), summary AS (
  SELECT
    count(*)::int decision_count,
    count(*) FILTER (WHERE decision='publish')::int publish_count,
    count(*) FILTER (WHERE independently_proven)::int delivered_publish_count,
    count(*) FILTER (WHERE terminal_permission_limited_ack)::int terminal_permission_limited_count,
    count(*) FILTER (WHERE decision='publish'
      AND NOT (independently_proven OR terminal_permission_limited_ack))::int unresolved_publish_count,
    count(*) FILTER (WHERE independently_proven
      AND channel IN ('linkedin_company','linkedin_personal','instagram_company'))::int published_social_count,
    count(*) FILTER (WHERE (independently_proven OR terminal_permission_limited_ack)
      AND channel IN ('linkedin_company','linkedin_personal','instagram_company'))::int terminal_social_count
  FROM proofs
)
SELECT jsonb_build_object(
  'contract','powerhouse-execution-status-provider-evidence-v2',
  'run_date',p_run_date,
  'decision_count',decision_count,
  'publish_count',publish_count,
  'delivered_publish_count',delivered_publish_count,
  'terminal_permission_limited_count',terminal_permission_limited_count,
  'unresolved_publish_count',unresolved_publish_count,
  'published_social_count',published_social_count,
  'terminal_social_count',terminal_social_count,
  'all_channels_decided',decision_count=7,
  'execution_complete',decision_count=7 AND unresolved_publish_count=0,
  'truth_boundary','Permission-limited provider-create acknowledgement is terminal only with exact immutable ID and republish prohibition; it never asserts independent provider readback.'
) FROM summary;
$function$;

-- Preserve the existing function's default invoker and service ACLs.
-- In particular, never grant function execution to anon/authenticated here.
COMMENT ON FUNCTION public.powerhouse_execution_status(date) IS
'Canonical daily delivery truth reconciles exact same-date, same-channel provider obligations when decision evidence is overwritten, without inventing provider readback or orders.';
