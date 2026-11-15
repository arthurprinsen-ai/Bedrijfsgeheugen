-- P0 #4215 / Original Company Intelligence OS / ONE BRAIN outcome authority
-- A JSON evidence container is not an independently observed outcome.
-- Preserve the existing private security-invoker view and all column identities.
-- No new scheduler, table, provider writer, synthetic value, or public grant.

CREATE OR REPLACE VIEW public.powerhouse_outcome_memory_v1
WITH (security_invoker=true) AS
SELECT
  'sales_outcome'::text AS memory_type,
  o.outcome_id::text AS memory_id,
  NULLIF(lower(regexp_replace(trim(coalesce(o.company_key,'')), '\s+',' ','g')),'') AS company_key,
  o.person_key,
  o.action_id::text AS origin_action_id,
  o.outcome_type AS outcome_class,
  o.revenue_eur AS realized_value,
  'EUR'::text AS unit,
  o.evidence,
  o.occurred_at AS observed_at,
  'powerhouse_sales_outcomes:'::text || o.outcome_id::text AS canonical_ref,
  coalesce((
    -- Only an actual observed provider/source event can be a verified
    -- commercial outcome. "sent", skipped and execution_completed are
    -- operational statuses, not customer behaviour or economic impact.
    o.outcome_type NOT IN ('sent','not_executed','execution_completed')
    AND coalesce(o.evidence->>'synthetic_business_result','false') <> 'true'
    AND o.evidence->>'source_data_quality' = 'VERIFIED'
    AND NULLIF(btrim(o.evidence->>'source_event_id'),'') IS NOT NULL
    AND NULLIF(btrim(o.evidence->>'source_event_type'),'') IS NOT NULL
    AND NULLIF(btrim(o.evidence->>'source_dedupe_key'),'') IS NOT NULL
    AND e.event_id IS NOT NULL
    AND e.event_type = o.evidence->>'source_event_type'
    AND e.dedupe_key = o.evidence->>'source_dedupe_key'
    AND e.data_quality = 'VERIFIED'
    AND e.state IN ('observed','actioned','done','completed')
    AND e.evidence IS NOT NULL AND e.evidence <> '{}'::jsonb
    AND e.company_key IS NOT DISTINCT FROM o.company_key
    AND e.person_key IS NOT DISTINCT FROM o.person_key
    AND e.occurred_at <= o.occurred_at
  ),false) AS verified
FROM public.powerhouse_sales_outcomes o
LEFT JOIN public.powerhouse_runtime_events e
  ON e.event_id::text = o.evidence->>'source_event_id'

UNION ALL
SELECT
  'realized_value'::text AS memory_type,
  r.observation_id::text AS memory_id,
  NULL::text AS company_key,
  NULL::text AS person_key,
  r.cycle_id::text AS origin_action_id,
  r.value_type AS outcome_class,
  r.numeric_value AS realized_value,
  coalesce(r.currency,r.unit) AS unit,
  jsonb_build_object(
    'evidence_ref',r.evidence_ref,'provenance',r.provenance,
    'source_entity_type',r.source_entity_type,'source_entity_id',r.source_entity_id
  ) AS evidence,
  r.observed_at,
  'powerhouse_realized_values:'::text || r.observation_id::text AS canonical_ref,
  coalesce((
    NULLIF(btrim(coalesce(r.evidence_ref,'')),'') IS NOT NULL
    AND r.numeric_value IS NOT NULL
    AND r.provenance->>'independent_readback_verified'='true'
    AND NULLIF(btrim(r.provenance->>'source_revision'),'') IS NOT NULL
    AND NULLIF(btrim(r.provenance->>'baseline_id'),'') IS NOT NULL
    AND NULLIF(btrim(r.provenance->>'period_id'),'') IS NOT NULL
  ),false) AS verified
FROM public.powerhouse_realized_values r;

REVOKE ALL ON public.powerhouse_outcome_memory_v1 FROM public, anon, authenticated;
GRANT SELECT ON public.powerhouse_outcome_memory_v1 TO service_role;

COMMENT ON VIEW public.powerhouse_outcome_memory_v1 IS
'Original private Outcome Memory: only matching independently observed source-event lineage or explicit independent realized-value proof is verified. Evidence JSON alone, no-send, sent ACK and missing cost/actual are not verified outcomes; preserving the source-to-learning boundary.';
