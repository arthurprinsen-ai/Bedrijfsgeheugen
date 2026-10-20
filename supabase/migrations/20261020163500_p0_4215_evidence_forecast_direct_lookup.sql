-- P0 #4215: contain expensive second expansion of commercial NBA v4 in maturity evidence.
-- Verified live source: maturity v1 references NBA v4 only for forecast_id.
-- Keep all existing output columns, measured-unknown policy, status & channel aggregates.
-- No cache, synthetic measurements, RLS expansion, scheduler, or sender changes.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '15s';
DO $guard$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public'
     AND tablename='powerhouse_opportunities' AND indexname='powerhouse_opportunities_opportunity_key_key'
     AND indexdef LIKE 'CREATE UNIQUE INDEX%') THEN
    RAISE EXCEPTION 'P0_4215_OPPORTUNITY_KEY_UNIQUE_GUARD_FAILED';
  END IF;
  IF position('LEFT JOIN powerhouse_commercial_next_best_action_v4 nba' IN
     pg_get_viewdef('public.powerhouse_action_evidence_maturity_v1'::regclass,true))=0
     AND position('powerhouse_opportunities opp' IN
     pg_get_viewdef('public.powerhouse_action_evidence_maturity_v1'::regclass,true))=0 THEN
    RAISE EXCEPTION 'P0_4215_MATURITY_VIEW_DRIFT_GUARD_FAILED';
  END IF;
END
$guard$;
CREATE OR REPLACE VIEW public.powerhouse_action_evidence_maturity_v1 WITH (security_invoker=true) AS
WITH constants AS (
         SELECT 5::bigint AS minimum_comparable_outcomes
        ), forecast_calibration AS (
         SELECT fc.forecast_id,
            count(*) AS calibration_observations,
            max(fc.measured_at) AS latest_calibration_at,
            avg(abs(fc.probability_error)) FILTER (WHERE fc.probability_error IS NOT NULL) AS mean_absolute_probability_error
           FROM powerhouse_forecast_calibration fc
          GROUP BY fc.forecast_id
        ), human_feedback AS (
         SELECT hf.action_id,
            count(*) AS human_feedback_observations,
            max(hf.observed_at) AS latest_human_feedback_at,
            array_agg(DISTINCT hf.feedback_type ORDER BY hf.feedback_type) AS human_feedback_types
           FROM powerhouse_human_feedback_events hf
          WHERE hf.action_id IS NOT NULL
          GROUP BY hf.action_id
        ), base AS (
         SELECT bv.action_id,
            bv.dedupe_key,
            bv.opportunity_key,
            bv.subject_key,
            bv.person_key,
            bv.company_key,
            bv.action_type,
            bv.channel,
            bv.status,
            bv.expected_value_eur,
            bv.opportunity_expected_revenue_value,
            bv.opportunity_probability,
            bv.opportunity_confidence,
            bv.resource_observations,
            bv.calculated_impact_observations,
            bv.energy_kwh,
            bv.co2e_kg,
            bv.water_liters,
            bv.tenant_ids,
            bv.latest_resource_observed_at,
            bv.economics_observations,
            bv.provider_cost_eur,
            bv.external_cost_eur,
            bv.human_minutes,
            bv.latest_economics_observed_at,
            bv.outcome_observations,
            bv.realized_revenue_eur,
            bv.latest_outcome_observed_at,
            bv.observed_cost_eur,
            bv.environmental_factor_coverage,
            bv.realized_net_value_eur,
            bv.realized_roi,
            bv.business_value_status,
            f.forecast_id,
            COALESCE(cal.calibration_observations, 0::bigint) AS calibration_observations,
            cal.latest_calibration_at,
            cal.mean_absolute_probability_error,
            COALESCE(hf.human_feedback_observations, 0::bigint) AS human_feedback_observations,
            hf.latest_human_feedback_at,
            COALESCE(hf.human_feedback_types, ARRAY[]::text[]) AS human_feedback_types,
                CASE
                    WHEN COALESCE(bv.resource_observations, 0::bigint) = 0 THEN 'unknown'::text
                    WHEN cardinality(COALESCE(bv.tenant_ids, ARRAY[]::text[])) = 1 THEN 'measured'::text
                    ELSE 'partial'::text
                END AS resource_evidence_status,
                CASE
                    WHEN COALESCE(bv.economics_observations, 0::bigint) = 0 THEN 'unknown'::text
                    WHEN bv.observed_cost_eur IS NOT NULL THEN 'measured'::text
                    ELSE 'partial'::text
                END AS economics_evidence_status,
                CASE
                    WHEN COALESCE(bv.outcome_observations, 0::bigint) = 0 THEN 'unknown'::text
                    ELSE 'measured'::text
                END AS outcome_evidence_status,
                CASE
                    WHEN f.forecast_id IS NULL THEN 'unknown'::text
                    WHEN COALESCE(cal.calibration_observations, 0::bigint) > 0 THEN 'measured'::text
                    ELSE 'partial'::text
                END AS forecast_evidence_status
           FROM powerhouse_action_business_value_v1 bv
             LEFT JOIN public.powerhouse_opportunities opp ON opp.opportunity_key=bv.opportunity_key
  AND COALESCE(opp.status,'') NOT IN ('closed','won','lost')
  LEFT JOIN LATERAL (
    SELECT pf.forecast_id FROM public.powerhouse_forecasts pf
    WHERE pf.status IN ('active','claimed')
      AND (
        (opp.company_key IS NOT NULL AND lower(pf.scope_key)=lower(opp.company_key))
        OR (opp.topic_key IS NOT NULL AND pf.topic_key=opp.topic_key)
        OR (opp.person_key IS NOT NULL AND lower(pf.scope_key)=lower(opp.person_key))
      )
    ORDER BY (COALESCE(pf.probability,0)*COALESCE(pf.confidence,0)*GREATEST(COALESCE(pf.first_mover_score,1),1)) DESC, pf.updated_at DESC
    LIMIT 1
  ) f ON true
             LEFT JOIN forecast_calibration cal ON cal.forecast_id = f.forecast_id
             LEFT JOIN human_feedback hf ON hf.action_id = bv.action_id
        ), channel_counts AS (
         SELECT base.channel,
            count(*) FILTER (WHERE base.forecast_evidence_status = 'measured'::text AND base.outcome_evidence_status = 'measured'::text) AS comparable_outcomes
           FROM base
          GROUP BY base.channel
        )
 SELECT b.action_id,
    b.dedupe_key,
    b.opportunity_key,
    b.subject_key,
    b.person_key,
    b.company_key,
    b.action_type,
    b.channel,
    b.status,
    b.expected_value_eur,
    b.opportunity_expected_revenue_value,
    b.opportunity_probability,
    b.opportunity_confidence,
    b.resource_observations,
    b.calculated_impact_observations,
    b.energy_kwh,
    b.co2e_kg,
    b.water_liters,
    b.tenant_ids,
    b.latest_resource_observed_at,
    b.economics_observations,
    b.provider_cost_eur,
    b.external_cost_eur,
    b.human_minutes,
    b.latest_economics_observed_at,
    b.outcome_observations,
    b.realized_revenue_eur,
    b.latest_outcome_observed_at,
    b.observed_cost_eur,
    b.environmental_factor_coverage,
    b.realized_net_value_eur,
    b.realized_roi,
    b.business_value_status,
    b.forecast_id,
    b.calibration_observations,
    b.latest_calibration_at,
    b.mean_absolute_probability_error,
    b.human_feedback_observations,
    b.latest_human_feedback_at,
    b.human_feedback_types,
    b.resource_evidence_status,
    b.economics_evidence_status,
    b.outcome_evidence_status,
    b.forecast_evidence_status,
    c.minimum_comparable_outcomes,
    COALESCE(cc.comparable_outcomes, 0::bigint) AS comparable_outcomes,
        CASE
            WHEN b.resource_evidence_status = 'measured'::text AND b.economics_evidence_status = 'measured'::text AND b.outcome_evidence_status = 'measured'::text AND b.forecast_evidence_status = 'measured'::text THEN 'measured'::text
            WHEN b.resource_evidence_status <> 'unknown'::text OR b.economics_evidence_status <> 'unknown'::text OR b.outcome_evidence_status <> 'unknown'::text OR b.forecast_evidence_status <> 'unknown'::text OR b.human_feedback_observations > 0 THEN 'partial'::text
            ELSE 'unknown'::text
        END AS evidence_maturity,
        CASE
            WHEN b.forecast_evidence_status <> 'measured'::text THEN false
            WHEN b.outcome_evidence_status <> 'measured'::text THEN false
            WHEN COALESCE(cc.comparable_outcomes, 0::bigint) < c.minimum_comparable_outcomes THEN false
            ELSE true
        END AS calibration_eligible,
        CASE
            WHEN b.forecast_evidence_status = 'unknown'::text THEN 'missing_pre_action_forecast'::text
            WHEN b.forecast_evidence_status = 'partial'::text THEN 'forecast_not_calibrated'::text
            WHEN b.outcome_evidence_status <> 'measured'::text THEN 'missing_observed_outcome'::text
            WHEN COALESCE(cc.comparable_outcomes, 0::bigint) < c.minimum_comparable_outcomes THEN 'insufficient_comparable_outcomes'::text
            ELSE 'eligible'::text
        END AS calibration_eligibility_reason,
        CASE
            WHEN b.observed_cost_eur IS NULL THEN NULL::numeric
            WHEN b.realized_revenue_eur IS NULL THEN NULL::numeric
            ELSE b.realized_revenue_eur - b.observed_cost_eur
        END AS verified_net_realized_value_eur,
        CASE
            WHEN b.observed_cost_eur IS NULL OR b.observed_cost_eur <= 0::numeric THEN NULL::numeric
            WHEN b.realized_revenue_eur IS NULL THEN NULL::numeric
            ELSE (b.realized_revenue_eur - b.observed_cost_eur) / b.observed_cost_eur
        END AS verified_roi_ratio
   FROM base b
     CROSS JOIN constants c
     LEFT JOIN channel_counts cc ON cc.channel = b.channel;
-- Restore existing tenant-safe internal view boundary on every deployment.
REVOKE ALL ON public.powerhouse_action_evidence_maturity_v1 FROM PUBLIC, anon, authenticated;
COMMIT;
