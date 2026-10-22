-- P0 #4215, owner PR #4630: forward-only refinement of the preview-applied
-- 20261022120800 CTE migration. Full person-intelligence CTE was cheaper in planner
-- units but slower in measured 5/25-opportunity cohorts. This set-based alias join
-- was faster in bounded read-only production observations (818 keys, 650 matches).
-- PERFORMANCE SAMPLE ONLY; does NOT prove 50-column or tenant/financial parity.
-- This migration is release-HOLD until isolated representative acceptance.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='15s';
DO $source_guard$
BEGIN
 IF md5(pg_get_viewdef('public.powerhouse_buying_window_v2'::regclass,true))
    <> '8a9b316a512dcf55889b0a56e7026170' THEN
   RAISE EXCEPTION 'P0_4215_PERSON_CACHE_PREDECESSOR_HASH_DRIFT';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_class
    WHERE oid='public.powerhouse_buying_window_v2'::regclass
    AND 'security_invoker=true'=ANY(reloptions)) THEN
   RAISE EXCEPTION 'P0_4215_SETJOIN_PRE_SECURITY_INVOKER_MISSING';
 END IF;
 IF has_table_privilege('anon','public.powerhouse_buying_window_v2','SELECT')
    OR has_table_privilege('authenticated','public.powerhouse_buying_window_v2','SELECT') THEN
   RAISE EXCEPTION 'P0_4215_SETJOIN_PRE_BROWSER_READ_BOUNDARY_DRIFT';
 END IF;
END
$source_guard$;
CREATE OR REPLACE VIEW public.powerhouse_buying_window_v2 WITH (security_invoker=true) AS
WITH person_intelligence_cache AS MATERIALIZED (SELECT * FROM public.powerhouse_person_intelligence_v1),
person_aliases AS (
 SELECT p1.person_key AS match_key, p1.* FROM person_intelligence_cache p1
 WHERE p1.person_key IS NOT NULL
 UNION ALL
 SELECT p1.linkedin_url AS match_key, p1.* FROM person_intelligence_cache p1
 WHERE p1.linkedin_url IS NOT NULL AND p1.linkedin_url IS DISTINCT FROM p1.person_key
),
person_matches AS (
 SELECT DISTINCT ON (o.opportunity_key) o.opportunity_key, pa.*
 FROM public.powerhouse_opportunities o
 LEFT JOIN person_aliases pa ON pa.match_key = o.person_key
 ORDER BY o.opportunity_key, pa.last_relevant_at DESC NULLS LAST
),
base AS (
         SELECT o.opportunity_id,
            o.opportunity_key,
            o.subject_key,
            o.person_key,
            o.company_key,
            o.content_key,
            o.topic_key,
            o.campaign_key,
            o.stage,
            o.expected_value_eur,
            o.probability,
            o.confidence,
            o.expected_revenue_value,
            o.score_components,
            o.evidence,
            o.last_evidence_at,
            o.last_action_at,
            o.next_action_at,
            o.status,
            o.created_at,
            o.updated_at,
            p.person_name,
            p.company_name AS person_company_name,
            p.role,
            p.linkedin_url,
            p.email,
            p.available_channels,
            COALESCE(p.relationship_warmth, 0::numeric) AS relationship_warmth,
            COALESCE(p.decision_influence, 0.35) AS decision_influence,
            p.aanleiding,
            COALESCE(c.company_intent_score, 0::numeric) AS company_intent_score,
            COALESCE(c.known_people, 0) AS known_people,
            COALESCE(c.likely_decision_makers, 0) AS likely_decision_makers,
            f.forecast_id,
            f.probability AS forecast_probability,
            f.confidence AS forecast_confidence,
            f.predicted_problem,
            f.predicted_buying_trigger,
                CASE
                    WHEN p.person_key IS NOT NULL THEN 1
                    ELSE 0
                END AS person_evidence,
                CASE
                    WHEN c.company_key IS NOT NULL THEN 1
                    ELSE 0
                END AS company_evidence,
                CASE
                    WHEN f.forecast_id IS NOT NULL THEN 1
                    ELSE 0
                END AS forecast_evidence
           FROM powerhouse_opportunities o
             LEFT JOIN person_matches p ON p.opportunity_key = o.opportunity_key
             LEFT JOIN powerhouse_company_intelligence_v1 c ON c.company_key = lower(regexp_replace(TRIM(BOTH FROM COALESCE(o.company_key, p.company_name, ''::text)), '\s+'::text, ' '::text, 'g'::text))
             LEFT JOIN LATERAL ( SELECT f1.forecast_id,
                    f1.forecast_key,
                    f1.created_at,
                    f1.horizon_start,
                    f1.horizon_end,
                    f1.scope,
                    f1.scope_key,
                    f1.topic_key,
                    f1.predicted_event,
                    f1.predicted_problem,
                    f1.predicted_question,
                    f1.predicted_search_intent,
                    f1.predicted_buying_trigger,
                    f1.probability,
                    f1.confidence,
                    f1.expected_lead_days,
                    f1.first_mover_score,
                    f1.strategic_fit,
                    f1.revenue_potential,
                    f1.evidence_signal_ids,
                    f1.evidence,
                    f1.status,
                    f1.claimed_at,
                    f1.materialized_at,
                    f1.outcome,
                    f1.updated_at,
                    f1.expected_by,
                    f1.signal_acceleration,
                    f1.market_saturation,
                    f1.whitespace_score,
                    f1.prediction_mode,
                    f1.last_scored_at
                   FROM powerhouse_forecasts f1
                  WHERE (f1.status = ANY (ARRAY['active'::text, 'claimed'::text])) AND (o.company_key IS NOT NULL AND lower(f1.scope_key) = lower(o.company_key) OR o.topic_key IS NOT NULL AND f1.topic_key = o.topic_key OR o.person_key IS NOT NULL AND lower(f1.scope_key) = lower(o.person_key))
                  ORDER BY (COALESCE(f1.probability, 0::numeric) * COALESCE(f1.confidence, 0::numeric) * GREATEST(COALESCE(f1.first_mover_score, 1::numeric), 1::numeric)) DESC, f1.updated_at DESC
                 LIMIT 1) f ON true
          WHERE COALESCE(o.status, ''::text) <> ALL (ARRAY['closed'::text, 'won'::text, 'lost'::text])
        ), scored AS (
         SELECT b.opportunity_id,
            b.opportunity_key,
            b.subject_key,
            b.person_key,
            b.company_key,
            b.content_key,
            b.topic_key,
            b.campaign_key,
            b.stage,
            b.expected_value_eur,
            b.probability,
            b.confidence,
            b.expected_revenue_value,
            b.score_components,
            b.evidence,
            b.last_evidence_at,
            b.last_action_at,
            b.next_action_at,
            b.status,
            b.created_at,
            b.updated_at,
            b.person_name,
            b.person_company_name,
            b.role,
            b.linkedin_url,
            b.email,
            b.available_channels,
            b.relationship_warmth,
            b.decision_influence,
            b.aanleiding,
            b.company_intent_score,
            b.known_people,
            b.likely_decision_makers,
            b.forecast_id,
            b.forecast_probability,
            b.forecast_confidence,
            b.predicted_problem,
            b.predicted_buying_trigger,
            b.person_evidence,
            b.company_evidence,
            b.forecast_evidence,
            LEAST(1::numeric, GREATEST(0::numeric, 0.22 * COALESCE(b.probability, 0::numeric) + 0.15 * COALESCE(b.confidence, 0::numeric) + 0.18 * b.relationship_warmth + 0.12 * b.decision_influence + 0.16 * b.company_intent_score + 0.10 * COALESCE(b.forecast_probability, 0::numeric) + 0.07 * COALESCE(b.forecast_confidence, 0::numeric))) AS buying_window_score_raw,
            LEAST(1::numeric, GREATEST(0::numeric, 0.35 * COALESCE(b.confidence, 0::numeric) + 0.20 * b.person_evidence::numeric + 0.15 * b.company_evidence::numeric + 0.15 * b.forecast_evidence::numeric + 0.15 *
                CASE
                    WHEN b.last_evidence_at >= (now() - '30 days'::interval) THEN 1
                    ELSE 0
                END::numeric)) AS buying_window_confidence_raw
           FROM base b
        )
 SELECT opportunity_id,
    opportunity_key,
    subject_key,
    person_key,
    company_key,
    content_key,
    topic_key,
    campaign_key,
    stage,
    expected_value_eur,
    probability,
    confidence,
    expected_revenue_value,
    score_components,
    evidence,
    last_evidence_at,
    last_action_at,
    next_action_at,
    status,
    created_at,
    updated_at,
    person_name,
    person_company_name,
    role,
    linkedin_url,
    email,
    available_channels,
    relationship_warmth,
    decision_influence,
    aanleiding,
    company_intent_score,
    known_people,
    likely_decision_makers,
    forecast_id,
    forecast_probability,
    forecast_confidence,
    predicted_problem,
    predicted_buying_trigger,
    person_evidence,
    company_evidence,
    forecast_evidence,
    buying_window_score_raw,
    buying_window_confidence_raw,
    round(buying_window_score_raw, 4) AS buying_window_score,
    round(buying_window_confidence_raw, 4) AS buying_window_confidence,
    round(buying_window_score_raw * buying_window_confidence_raw, 4) AS commercial_progression_probability,
    round(GREATEST(0::numeric, COALESCE(expected_value_eur, 0::numeric) * buying_window_score_raw * buying_window_confidence_raw), 2) AS expected_commercial_value_eur,
    round((person_evidence + company_evidence + forecast_evidence +
        CASE
            WHEN NULLIF(TRIM(BOTH FROM COALESCE(aanleiding, ''::text)), ''::text) IS NOT NULL THEN 1
            ELSE 0
        END +
        CASE
            WHEN last_evidence_at >= (now() - '30 days'::interval) THEN 1
            ELSE 0
        END)::numeric / 5.0, 4) AS evidence_density,
    COALESCE(NULLIF(TRIM(BOTH FROM predicted_problem), ''::text), NULLIF(TRIM(BOTH FROM aanleiding), ''::text), NULLIF(TRIM(BOTH FROM predicted_buying_trigger), ''::text), ''::text) AS best_context,
        CASE
            WHEN buying_window_score_raw >= 0.72 THEN 'hot'::text
            WHEN buying_window_score_raw >= 0.55 THEN 'warm'::text
            WHEN buying_window_score_raw >= 0.38 THEN 'developing'::text
            ELSE 'research'::text
        END AS buying_window_state
   FROM scored s;
-- Preserve private service-side invoker semantics. Never expose client roles.
REVOKE ALL ON public.powerhouse_buying_window_v2 FROM PUBLIC, anon, authenticated;
DO $readback$
BEGIN
 IF md5(pg_get_viewdef('public.powerhouse_buying_window_v2'::regclass,true))
    <> 'dcac5a8d2543147d3d5e294cc14a599e' THEN
   RAISE EXCEPTION 'P0_4215_SETJOIN_POST_SOURCE_HASH_DRIFT';
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_class
    WHERE oid='public.powerhouse_buying_window_v2'::regclass
    AND 'security_invoker=true'=ANY(reloptions)) THEN
   RAISE EXCEPTION 'P0_4215_SETJOIN_POST_SECURITY_INVOKER_MISSING';
 END IF;
 IF has_table_privilege('anon','public.powerhouse_buying_window_v2','SELECT')
    OR has_table_privilege('authenticated','public.powerhouse_buying_window_v2','SELECT') THEN
   RAISE EXCEPTION 'P0_4215_SETJOIN_POST_BROWSER_READ_BOUNDARY_DRIFT';
 END IF;
 IF (SELECT count(*) FROM pg_attribute WHERE attrelid='public.powerhouse_buying_window_v2'::regclass
    AND attnum>0 AND NOT attisdropped) <> 50 THEN
   RAISE EXCEPTION 'P0_4215_SETJOIN_50_COLUMN_SCHEMA_DRIFT';
 END IF;
END
$readback$;
COMMIT;
