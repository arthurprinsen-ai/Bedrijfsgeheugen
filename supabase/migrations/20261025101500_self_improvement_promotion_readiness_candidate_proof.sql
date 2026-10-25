-- Correction for canonical Brain self-improvement promotion (2026-10-25).
-- The nine READY quality events do not promote nine EVIDENCE_PENDING optimization
-- candidates. Correlate a READY compiler candidate to the same independently
-- reviewed, delivered, learned and verified outcome cycle.
-- No scheduler, queue, user data, tenant ACL or action executor is changed.
-- Existing full view column order and security_invoker are preserved.

CREATE OR REPLACE VIEW public.powerhouse_self_improvement_control_v1
WITH (security_invoker = true) AS
WITH candidate_state AS (
         SELECT count(*)::integer AS candidate_total,
            count(*) FILTER (WHERE p.independent_observations > 0 AND p.delivery_proven AND p.review_proven)::integer AS candidate_measured,
            count(*) FILTER (WHERE p.independent_observations > 0
                AND p.review_proven AND p.delivery_proven
                AND p.learning_proven AND p.observed_cycle_verified
                AND EXISTS (
                    SELECT 1 FROM public.powerhouse_learning_compiler_queue_v1 eligible
                    WHERE eligible.source_type='optimization_candidate'
                      AND eligible.source_key=c_1.candidate_id::text
                      AND eligible.compiler_state='READY'
                ))::integer AS candidate_ready
           FROM powerhouse_optimization_candidate_v1 c_1
             LEFT JOIN powerhouse_optimization_closure_truth_v1 p ON p.candidate_id = c_1.candidate_id
        ), compiler_state AS (
         SELECT count(*) FILTER (WHERE powerhouse_learning_compiler_queue_v1.compiler_state = 'READY'::text)::integer AS compiler_ready,
            count(*) FILTER (WHERE powerhouse_learning_compiler_queue_v1.compiler_state = 'EVIDENCE_PENDING'::text)::integer AS compiler_evidence_pending,
            count(*) FILTER (WHERE powerhouse_learning_compiler_queue_v1.compiler_state = 'REGRESSION_PENDING'::text)::integer AS compiler_regression_pending
           FROM powerhouse_learning_compiler_queue_v1
        ), quality_state AS (
         SELECT count(*) FILTER (WHERE powerhouse_quality_events.escaped_to_production = true AND NULLIF(TRIM(BOTH FROM COALESCE(powerhouse_quality_events.regression_guard_ref, ''::text)), ''::text) IS NULL)::integer AS escaped_defects_without_regression
           FROM powerhouse_quality_events
        ), model_state AS (
         SELECT count(*) FILTER (WHERE lower(COALESCE(powerhouse_model_health_v1.model_health, ''::text)) = ANY (ARRAY['degraded'::text, 'red'::text, 'failing'::text, 'unhealthy'::text]))::integer AS model_health_degraded,
            count(*) FILTER (WHERE powerhouse_model_health_v1.model_health IS NULL OR (lower(powerhouse_model_health_v1.model_health) = ANY (ARRAY['unknown'::text, 'unmeasured'::text])))::integer AS model_health_unknown
           FROM powerhouse_model_health_v1
        ), auto_state AS (
         SELECT count(*) FILTER (WHERE lower(COALESCE(powerhouse_autonomous_improvement_control_v1.state, ''::text)) <> ALL (ARRAY['done'::text, 'completed'::text, 'closed'::text, 'terminal'::text, 'live_bewezen'::text]))::integer AS autonomous_improvement_open
           FROM powerhouse_autonomous_improvement_control_v1
        ), company_state AS (
         SELECT count(*) FILTER (WHERE powerhouse_compound_intelligence_v1.verified_outcomes > 0)::integer AS learning_companies,
            COALESCE(sum(powerhouse_compound_intelligence_v1.verified_outcomes), 0::bigint) AS verified_outcomes
           FROM powerhouse_compound_intelligence_v1
        )
 SELECT now() AS observed_at,
    c.candidate_total,
    c.candidate_measured,
    l.compiler_ready,
    l.compiler_evidence_pending,
    l.compiler_regression_pending,
    q.escaped_defects_without_regression,
    m.model_health_degraded,
    m.model_health_unknown,
    a.autonomous_improvement_open,
    co.learning_companies,
    co.verified_outcomes,
        CASE
            WHEN q.escaped_defects_without_regression > 0 OR m.model_health_degraded > 0 THEN 'GUARDRAIL_BLOCKED'::text
            WHEN c.candidate_ready > 0 THEN 'READY_FOR_CONTROLLED_PROMOTION'::text
            WHEN c.candidate_total > 0 OR co.verified_outcomes > 0 THEN 'LEARNING'::text
            ELSE 'OBSERVE'::text
        END AS self_improvement_state,
    jsonb_build_object('contract', 'powerhouse-self-improvement-layer.v1', 'north_star', 'Powerhouse must function measurably better tomorrow than today without degrading reliability, safety or code quality.', 'loop', jsonb_build_array('observe', 'detect', 'hypothesize', 'build', 'test', 'evaluate', 'compare', 'promote', 'measure', 'learn'), 'hard_rules', jsonb_build_array('no_learning_without_evidence', 'no_change_without_evaluation', 'no_deployment_without_regression_proof', 'no_intelligence_without_measurable_outcome', 'no_uncontrolled_self_modification', 'unknown_is_not_green'), 'protected_delivery_reused', true, 'parallel_learning_store_created', false, 'candidate_closure_truth_authority', 'public.powerhouse_optimization_closure_truth_v1', 'measured_not_inferred_from_json', true, 'eligible_optimization_candidates', c.candidate_ready, 'ready_quality_event_is_not_candidate_promotion', true) AS contract
   FROM candidate_state c
     CROSS JOIN compiler_state l
     CROSS JOIN quality_state q
     CROSS JOIN model_state m
     CROSS JOIN auto_state a
     CROSS JOIN company_state co;

REVOKE ALL ON public.powerhouse_self_improvement_control_v1 FROM public, anon, authenticated;
GRANT SELECT ON public.powerhouse_self_improvement_control_v1 TO service_role;

COMMENT ON VIEW public.powerhouse_self_improvement_control_v1 IS
'Canonical cross-layer self-improvement truth: unrelated quality READY entries do not promote optimization candidates; only same-candidate independent closure plus compiler proof may be ready.';
