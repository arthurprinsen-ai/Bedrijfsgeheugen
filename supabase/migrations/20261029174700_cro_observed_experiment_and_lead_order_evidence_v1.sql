-- Read-only canonical evidence projections for existing Powerhouse agents and portal.
-- No parallel CRM, no new write path, no new scheduler, and no PII in the read model.
CREATE OR REPLACE VIEW public.powerhouse_cro_conversion_evidence_v1
WITH (security_invoker = true) AS
WITH event_rows AS (
  SELECT count(*) FILTER (WHERE event_type = 'page_view' AND is_robot IS FALSE) AS human_flagged_pageviews_7d,
         count(*) FILTER (WHERE event_type IN ('primary_cta_click','secondary_cta_click','money_link_click','cta_click')
           AND is_robot IS FALSE) AS observed_cta_events_7d,
         count(*) FILTER (WHERE event_type = 'form_submit_intent' AND is_robot IS FALSE) AS form_submit_intents_7d,
         max(occurred_at) AS last_persisted_event_at
  FROM public.growth_events
  WHERE occurred_at >= current_date - interval '6 days'
),
daily_rows AS (
  SELECT coalesce(sum(cta_clicks),0)::bigint AS daily_cta_aggregated_7d
  FROM public.growth_page_daily
  WHERE day >= current_date - 6
),
lead_rows AS (
  SELECT (SELECT count(*) FROM public.commercial_leads
          WHERE occurred_at >= now() - interval '30 days') AS recorded_leads_30d,
         (SELECT count(DISTINCT cl.lead_id) FROM public.commercial_leads cl
          JOIN public.growth_outcomes go
            ON go.stage='qualified_lead'
           AND go.attribution_root_key=coalesce(nullif(cl.attribution_root_key,''),cl.lead_id::text)
          WHERE cl.occurred_at >= now() - interval '30 days') AS linked_qualified_lead_records_30d
),
order_rows AS (
  SELECT count(*) FILTER (
    WHERE outcome_type IN ('won_order','paid_order','payment_received')
      AND revenue_eur > 0
      AND evidence->>'verification_status'='VERIFIED'
      AND nullif(evidence->>'provider_id','') IS NOT NULL
      AND nullif(evidence->>'provider_readback_id','') IS NOT NULL
    ) AS orders_with_recorded_provider_readback_30d
  FROM public.powerhouse_sales_outcomes
  WHERE occurred_at >= now() - interval '30 days'
),
assignment_rows AS (
  SELECT count(*) AS experiment_assignments_30d,
         count(*) FILTER (WHERE measurement_horizon_end<=now()
           AND assignment_arm='treatment') AS matured_treatment_30d,
         count(*) FILTER (WHERE measurement_horizon_end<=now()
           AND assignment_arm IN ('control','holdout')) AS matured_holdout_30d
  FROM public.powerhouse_experiment_assignments
  WHERE assigned_at >= now() - interval '30 days'
)
SELECT now() AS evaluated_at,
       e.human_flagged_pageviews_7d, e.observed_cta_events_7d,
       d.daily_cta_aggregated_7d,
       e.form_submit_intents_7d, e.last_persisted_event_at,
       l.recorded_leads_30d, l.linked_qualified_lead_records_30d,
       o.orders_with_recorded_provider_readback_30d,
       a.experiment_assignments_30d,a.matured_treatment_30d,a.matured_holdout_30d,
       CASE WHEN e.last_persisted_event_at IS NULL THEN 'EVENT_PIPELINE_UNVERIFIED'
            WHEN e.observed_cta_events_7d > d.daily_cta_aggregated_7d THEN 'CTA_AGGREGATION_INCONSISTENT'
            ELSE 'PERSISTED_EVENTS_OBSERVED' END AS event_evidence_status,
       CASE WHEN l.linked_qualified_lead_records_30d=0 THEN 'NO_LINKED_QUALIFIED_LEAD_PROOF'
            ELSE 'LINKED_RECORDS_REQUIRE_INDEPENDENT_BUYER_VERIFICATION' END AS lead_evidence_status,
       'EXTERNAL_PROVIDER_READBACK_REQUIRED_FOR_REVENUE_CLAIM'::text AS order_evidence_status,
       'CONTROLLED_ASSIGNMENT_AND_MATURED_OUTCOMES_REQUIRED'::text AS experiment_evidence_status
FROM event_rows e CROSS JOIN daily_rows d CROSS JOIN lead_rows l
CROSS JOIN order_rows o CROSS JOIN assignment_rows a;

CREATE OR REPLACE VIEW public.powerhouse_cro_experiment_evidence_v1
WITH (security_invoker = true) AS
SELECT a.experiment_key, coalesce(p.status,'POLICY_MISSING') AS policy_status,
       coalesce(p.primary_metric,'UNKNOWN') AS primary_metric,
       coalesce(p.min_matured_per_arm,0) AS minimum_matured_per_arm,
       count(*) AS assigned_total,
       count(*) FILTER (WHERE a.assignment_arm='treatment') AS assigned_treatment,
       count(*) FILTER (WHERE a.assignment_arm IN ('control','holdout')) AS assigned_holdout,
       count(*) FILTER (WHERE a.assignment_arm='treatment'
          AND a.measurement_horizon_end<=now()) AS matured_treatment,
       count(*) FILTER (WHERE a.assignment_arm IN ('control','holdout')
          AND a.measurement_horizon_end<=now()) AS matured_holdout,
       CASE WHEN p.experiment_key IS NULL THEN 'NO_ACTIVE_POLICY'
            WHEN count(*) FILTER (WHERE a.assignment_arm='treatment' AND a.measurement_horizon_end<=now())
                 < coalesce(p.min_matured_per_arm,1)
              OR count(*) FILTER (WHERE a.assignment_arm IN ('control','holdout') AND a.measurement_horizon_end<=now())
                 < coalesce(p.min_matured_per_arm,1)
            THEN 'INSUFFICIENT_MATURED_ASSIGNMENTS'
            ELSE 'COHORT_SIZE_REACHED_CAUSAL_PROOF_PENDING' END AS evidence_status,
       max(a.assigned_at) AS last_assignment_at
FROM public.powerhouse_experiment_assignments a
LEFT JOIN public.powerhouse_experiment_policies p ON p.experiment_key=a.experiment_key AND p.status='active'
GROUP BY a.experiment_key,p.experiment_key,p.status,p.primary_metric,p.min_matured_per_arm;

REVOKE ALL ON public.powerhouse_cro_conversion_evidence_v1 FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.powerhouse_cro_experiment_evidence_v1 FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.powerhouse_cro_conversion_evidence_v1 TO service_role;
GRANT SELECT ON public.powerhouse_cro_experiment_evidence_v1 TO service_role;
