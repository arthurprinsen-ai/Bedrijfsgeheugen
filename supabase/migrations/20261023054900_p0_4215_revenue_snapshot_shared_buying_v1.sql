-- Forward-only P0 #4215 owned by PR #4630. FULL RELEASE HOLD / NO FORCE DEPLOY.
-- Real read-only full snapshot 838-row SELECT measured 77.606s with shared CTE.
-- Existing 90s local cron budget and 120s provider timeout preserved.
-- All 50-column/source finance/tenant HTTP gates and successful natural Cron #46 remain required.
BEGIN;
SET LOCAL lock_timeout='2s';
SET LOCAL statement_timeout='15s';
DO $source_guard$
BEGIN
 IF md5(pg_get_functiondef('public.powerhouse_refresh_revenue_intelligence_snapshot_v1()'::regprocedure))
 <> '8559eb2824c31d41de5db065f4b92ac8' THEN
  RAISE EXCEPTION 'P0_4215_SNAPSHOT_FUNCTION_SOURCE_DRIFT';
 END IF;
 IF md5(pg_get_viewdef('public.powerhouse_buying_window_v2'::regclass,true))
 <> 'dcac5a8d2543147d3d5e294cc14a599e' THEN
  RAISE EXCEPTION 'P0_4215_SNAPSHOT_BUYING_VIEW_DRIFT';
 END IF;
 IF md5(pg_get_viewdef('public.powerhouse_account_strategy_v1'::regclass,true)) <> '867cb0b816a67a8ac98e6aab2a3224d8' THEN RAISE EXCEPTION 'P0_4215_SNAPSHOT_SOURCE_DRIFT: powerhouse_account_strategy_v1'; END IF;
 IF md5(pg_get_viewdef('public.powerhouse_research_queue_v1'::regclass,true)) <> '5c621fb3e6f4b05e8029e39e40af6b1b' THEN RAISE EXCEPTION 'P0_4215_SNAPSHOT_SOURCE_DRIFT: powerhouse_research_queue_v1'; END IF;
 IF md5(pg_get_viewdef('public.powerhouse_commercial_next_best_action_v2'::regclass,true)) <> 'bbf43d61a78c9f3d74a9cfce544b3568' THEN RAISE EXCEPTION 'P0_4215_SNAPSHOT_SOURCE_DRIFT: powerhouse_commercial_next_best_action_v2'; END IF;
 IF md5(pg_get_viewdef('public.powerhouse_commercial_next_best_action_v3'::regclass,true)) <> '36c2e99c626db297707e887253012ccf' THEN RAISE EXCEPTION 'P0_4215_SNAPSHOT_SOURCE_DRIFT: powerhouse_commercial_next_best_action_v3'; END IF;
 IF md5(pg_get_viewdef('public.powerhouse_commercial_next_best_action_v4'::regclass,true)) <> 'fb00a29e1bb1706ff0994d8ad5fb3dba' THEN RAISE EXCEPTION 'P0_4215_SNAPSHOT_SOURCE_DRIFT: powerhouse_commercial_next_best_action_v4'; END IF;
 IF md5(pg_get_viewdef('public.powerhouse_commercial_next_best_action_v5'::regclass,true)) <> '4411b435b176e3f0c440bf9b7a0b84b9' THEN RAISE EXCEPTION 'P0_4215_SNAPSHOT_SOURCE_DRIFT: powerhouse_commercial_next_best_action_v5'; END IF;
 IF NOT EXISTS(SELECT 1 FROM pg_class WHERE oid='public.powerhouse_buying_window_v2'::regclass
  AND 'security_invoker=true'=ANY(reloptions))
 OR has_table_privilege('anon','public.powerhouse_buying_window_v2','SELECT')
 OR has_table_privilege('authenticated','public.powerhouse_buying_window_v2','SELECT')
 OR NOT has_table_privilege('service_role','public.powerhouse_buying_window_v2','SELECT')
 OR has_function_privilege('anon','public.powerhouse_refresh_revenue_intelligence_snapshot_v1()','EXECUTE')
 OR has_function_privilege('authenticated','public.powerhouse_refresh_revenue_intelligence_snapshot_v1()','EXECUTE')
 OR NOT has_function_privilege('service_role','public.powerhouse_refresh_revenue_intelligence_snapshot_v1()','EXECUTE')
 THEN RAISE EXCEPTION 'P0_4215_SNAPSHOT_SECURITY_PRECONDITION'; END IF;
END $source_guard$;
CREATE OR REPLACE FUNCTION public.powerhouse_refresh_revenue_intelligence_snapshot_v1()
RETURNS TABLE(row_count bigint,refreshed_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_catalog'
AS $p0_4215_shared_source$
DECLARE
 v_refreshed_at timestamptz := clock_timestamp();
 v_row_count bigint := 0;
BEGIN
 DELETE FROM public.powerhouse_revenue_command_center_snapshot_v1;
  insert into public.powerhouse_revenue_command_center_snapshot_v1(
    revenue_rank,opportunity_key,person_key,company_key,person_name,role,why_now,
    account_thesis,recommended_account_move,recommended_action,recommended_channel,message_strategy,
    effective_recommended_asset,verified_asset_reference,recommended_cta,pressure_state,cooldown_until,next_follow_up_at,
    prediction_reply,prediction_meeting,prediction_proposal,prediction_win,prediction_confidence,prediction_model_version,
    prediction_sample_size,expected_commercial_value_eur,action_confidence,buying_window_score,buying_window_confidence,
    evidence_density,research_reason,missing_evidence,identity_conflict,structural_lineage_gap,command_evidence,refreshed_at
  )
WITH
  p0_buying AS MATERIALIZED (
SELECT * FROM public.powerhouse_buying_window_v2
  ),
  p0_account AS (
WITH committee AS (
         SELECT b.company_key,
            count(*)::integer AS committee_people,
            count(*) FILTER (WHERE b.inferred_buying_role = ANY (ARRAY['economic_buyer'::text, 'economic_buyer_or_blocker'::text]))::integer AS economic_buyers,
            count(*) FILTER (WHERE b.inferred_buying_role = 'technical_evaluator'::text)::integer AS technical_evaluators,
            count(*) FILTER (WHERE b.inferred_buying_role = 'champion_or_influencer'::text)::integer AS champions,
            max(b.committee_priority) AS committee_strength,
            (array_agg(b.person_key ORDER BY b.committee_priority DESC NULLS LAST, b.person_key))[1] AS best_relationship_person_key
           FROM powerhouse_buying_committee_v1 b
          GROUP BY b.company_key
        ), windows AS (
         SELECT lower(regexp_replace(TRIM(BOTH FROM COALESCE(p0_buying.company_key, p0_buying.person_company_name, ''::text)), '\s+'::text, ' '::text, 'g'::text)) AS company_key,
            count(*) FILTER (WHERE p0_buying.buying_window_state = 'hot'::text)::integer AS hot_windows,
            count(*) FILTER (WHERE p0_buying.buying_window_state = 'warm'::text)::integer AS warm_windows,
            max(p0_buying.buying_window_score) AS max_buying_window_score,
            max(p0_buying.buying_window_confidence) AS max_buying_window_confidence,
            sum(p0_buying.expected_commercial_value_eur) AS expected_account_value_eur,
            (array_agg(p0_buying.best_context ORDER BY p0_buying.expected_commercial_value_eur DESC NULLS LAST))[1] AS best_context
           FROM p0_buying
          WHERE NULLIF(TRIM(BOTH FROM COALESCE(p0_buying.company_key, p0_buying.person_company_name, ''::text)), ''::text) IS NOT NULL
          GROUP BY (lower(regexp_replace(TRIM(BOTH FROM COALESCE(p0_buying.company_key, p0_buying.person_company_name, ''::text)), '\s+'::text, ' '::text, 'g'::text)))
        )
 SELECT c.company_key,
    c.company_name,
    c.known_people,
    c.likely_decision_makers,
    c.company_intent_score,
    c.external_signal_score,
    c.signal_topics,
    c.last_relevant_at,
    COALESCE(k.committee_people, 0) AS committee_people,
    COALESCE(k.economic_buyers, 0) AS economic_buyers,
    COALESCE(k.technical_evaluators, 0) AS technical_evaluators,
    COALESCE(k.champions, 0) AS champions,
    COALESCE(k.committee_strength, 0::numeric) AS committee_strength,
    k.best_relationship_person_key,
    COALESCE(w.hot_windows, 0) AS hot_windows,
    COALESCE(w.warm_windows, 0) AS warm_windows,
    COALESCE(w.max_buying_window_score, 0::numeric) AS max_buying_window_score,
    COALESCE(w.max_buying_window_confidence, 0::numeric) AS max_buying_window_confidence,
    COALESCE(w.expected_account_value_eur, 0::numeric) AS expected_account_value_eur,
    w.best_context,
        CASE
            WHEN NULLIF(TRIM(BOTH FROM w.best_context), ''::text) IS NOT NULL THEN concat('Actuele accountthese op basis van geobserveerde context: ', w.best_context)
            WHEN COALESCE(c.predictive_signals_30d, 0) > 0 THEN 'Account heeft recente voorspellende signalen; eerst context verifiëren.'::text
            ELSE 'Onvoldoende bewijs voor een specifieke accountthese; aanvullende research nodig.'::text
        END AS account_thesis,
        CASE
            WHEN COALESCE(w.max_buying_window_score, 0::numeric) >= 0.65 AND COALESCE(k.economic_buyers, 0) > 0 THEN 'engage_economic_buyer'::text
            WHEN COALESCE(w.max_buying_window_score, 0::numeric) >= 0.55 AND k.best_relationship_person_key IS NOT NULL THEN 'warm_intro_or_champion'::text
            WHEN COALESCE(k.economic_buyers, 0) = 0 THEN 'map_economic_buyer'::text
            WHEN COALESCE(c.company_intent_score, 0::numeric) < 0.30 THEN 'research'::text
            ELSE 'nurture'::text
        END AS recommended_account_move,
    jsonb_build_object('economic_buyers', COALESCE(k.economic_buyers, 0), 'technical_evaluators', COALESCE(k.technical_evaluators, 0), 'champions', COALESCE(k.champions, 0), 'committee_strength', COALESCE(k.committee_strength, 0::numeric)) AS buying_committee_summary
   FROM powerhouse_company_intelligence_v1 c
     LEFT JOIN committee k ON k.company_key = c.company_key
     LEFT JOIN windows w ON w.company_key = c.company_key
  ),
  p0_research AS (
SELECT b.opportunity_key,
    b.person_key,
    b.company_key,
    b.topic_key,
    b.person_name,
    b.role,
    b.expected_commercial_value_eur,
    b.buying_window_score,
    b.buying_window_confidence,
    b.evidence_density,
    f.freshness_state,
    f.contradiction_detected,
        CASE
            WHEN b.person_evidence = 0 THEN 'identity_or_person_context_missing'::text
            WHEN b.company_evidence = 0 THEN 'company_context_missing'::text
            WHEN b.forecast_evidence = 0 THEN 'forecast_missing'::text
            WHEN COALESCE(f.contradiction_detected, false) THEN 'contradictory_evidence'::text
            WHEN COALESCE(f.freshness_state, 'stale'::text) = 'stale'::text THEN 'stale_evidence'::text
            WHEN b.buying_window_confidence < 0.55 THEN 'low_confidence'::text
            WHEN b.evidence_density < 0.60 THEN 'evidence_density_low'::text
            ELSE 'no_research_needed'::text
        END AS research_reason,
    array_remove(ARRAY[
        CASE
            WHEN b.person_evidence = 0 THEN 'person_evidence'::text
            ELSE NULL::text
        END,
        CASE
            WHEN b.company_evidence = 0 THEN 'company_evidence'::text
            ELSE NULL::text
        END,
        CASE
            WHEN b.forecast_evidence = 0 THEN 'forecast_evidence'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(f.contradiction_detected, false) THEN 'contradiction_resolution'::text
            ELSE NULL::text
        END,
        CASE
            WHEN COALESCE(f.freshness_state, 'stale'::text) = 'stale'::text THEN 'fresh_evidence'::text
            ELSE NULL::text
        END], NULL::text) AS missing_evidence,
    LEAST(100::numeric, GREATEST(0::numeric, 40::numeric + COALESCE(b.expected_commercial_value_eur, 0::numeric) / 1000::numeric + (1::numeric - COALESCE(b.buying_window_confidence, 0::numeric)) * 30::numeric)) AS research_priority
   FROM p0_buying b
     LEFT JOIN powerhouse_freshness_contradiction_cache_v1 f ON f.opportunity_key = b.opportunity_key
  WHERE b.person_evidence = 0 OR b.company_evidence = 0 OR b.forecast_evidence = 0 OR COALESCE(f.contradiction_detected, false) OR COALESCE(f.freshness_state, 'stale'::text) = 'stale'::text OR b.buying_window_confidence < 0.55 OR b.evidence_density < 0.60
  ),
  p0_v2 AS (
WITH planned AS (
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
            b.buying_window_score_raw,
            b.buying_window_confidence_raw,
            b.buying_window_score,
            b.buying_window_confidence,
            b.commercial_progression_probability,
            b.expected_commercial_value_eur,
            b.evidence_density,
            b.best_context,
            b.buying_window_state,
                CASE
                    WHEN COALESCE(b.expected_value_eur, 0::numeric) > 0::numeric AND b.buying_window_score >= 0.62 AND ('linkedin'::text = ANY (COALESCE(b.available_channels, ARRAY[]::text[]))) THEN 'linkedin_dm'::text
                    WHEN COALESCE(b.expected_value_eur, 0::numeric) > 0::numeric AND b.buying_window_score >= 0.62 AND ('email'::text = ANY (COALESCE(b.available_channels, ARRAY[]::text[]))) THEN 'email'::text
                    WHEN b.buying_window_score >= 0.38 AND ('linkedin'::text = ANY (COALESCE(b.available_channels, ARRAY[]::text[]))) THEN 'linkedin_comment'::text
                    ELSE 'internal_research'::text
                END AS recommended_channel,
                CASE
                    WHEN COALESCE(b.expected_value_eur, 0::numeric) > 0::numeric AND b.buying_window_score >= 0.72 THEN 'direct_problem_value'::text
                    WHEN COALESCE(b.expected_value_eur, 0::numeric) > 0::numeric AND b.buying_window_score >= 0.55 THEN 'permission_first_evidence'::text
                    WHEN b.buying_window_score >= 0.38 THEN 'insight_nurture'::text
                    ELSE 'research_enrichment'::text
                END AS message_strategy,
                CASE
                    WHEN lower(COALESCE(b.best_context, ''::text)) ~ '(m&a|merger|acquisition|due diligence|overname)'::text THEN 'ma_due_diligence_onepager'::text
                    WHEN lower(COALESCE(b.best_context, ''::text)) ~ '(ai|artificial intelligence|kunstmatige intelligentie)'::text THEN 'ai_ready_organisation_onepager'::text
                    WHEN COALESCE(b.expected_value_eur, 0::numeric) > 0::numeric AND b.buying_window_score >= 0.76 THEN 'frisse_blik_scan'::text
                    WHEN COALESCE(b.expected_value_eur, 0::numeric) > 0::numeric AND b.buying_window_score >= 0.55 THEN 'frisse_blik_diagnostic'::text
                    WHEN b.buying_window_score >= 0.38 THEN 'relevant_case_or_onepager'::text
                    ELSE 'none'::text
                END AS recommended_asset,
                CASE
                    WHEN COALESCE(b.expected_value_eur, 0::numeric) > 0::numeric AND b.buying_window_score >= 0.76 THEN 'propose_short_diagnostic_call'::text
                    WHEN COALESCE(b.expected_value_eur, 0::numeric) > 0::numeric AND b.buying_window_score >= 0.55 THEN 'ask_permission_to_share_evidence'::text
                    WHEN b.buying_window_score >= 0.38 THEN 'ask_one_contextual_question'::text
                    ELSE 'gather_more_evidence'::text
                END AS recommended_cta
           FROM p0_buying b
        ), with_asset AS (
         SELECT p.opportunity_id,
            p.opportunity_key,
            p.subject_key,
            p.person_key,
            p.company_key,
            p.content_key,
            p.topic_key,
            p.campaign_key,
            p.stage,
            p.expected_value_eur,
            p.probability,
            p.confidence,
            p.expected_revenue_value,
            p.score_components,
            p.evidence,
            p.last_evidence_at,
            p.last_action_at,
            p.next_action_at,
            p.status,
            p.created_at,
            p.updated_at,
            p.person_name,
            p.person_company_name,
            p.role,
            p.linkedin_url,
            p.email,
            p.available_channels,
            p.relationship_warmth,
            p.decision_influence,
            p.aanleiding,
            p.company_intent_score,
            p.known_people,
            p.likely_decision_makers,
            p.forecast_id,
            p.forecast_probability,
            p.forecast_confidence,
            p.predicted_problem,
            p.predicted_buying_trigger,
            p.person_evidence,
            p.company_evidence,
            p.forecast_evidence,
            p.buying_window_score_raw,
            p.buying_window_confidence_raw,
            p.buying_window_score,
            p.buying_window_confidence,
            p.commercial_progression_probability,
            p.expected_commercial_value_eur,
            p.evidence_density,
            p.best_context,
            p.buying_window_state,
            p.recommended_channel,
            p.message_strategy,
            p.recommended_asset,
            p.recommended_cta,
            ca.title AS evidence_asset_title,
            ca.artifact_type AS evidence_asset_type,
            ca.channel AS evidence_asset_channel,
            ca.run_date AS evidence_asset_run_date
           FROM planned p
             LEFT JOIN LATERAL ( SELECT a.title,
                    a.artifact_type,
                    a.channel,
                    a.run_date
                   FROM powerhouse_content_artifacts a
                  WHERE (a.status = ANY (ARRAY['published'::text, 'content_ready'::text])) AND p.topic_key IS NOT NULL AND POSITION((lower(p.topic_key)) IN (lower((((COALESCE(a.title, ''::text) || ' '::text) || COALESCE(a.content_brief, ''::text)) || ' '::text) || COALESCE(a.body, ''::text)))) > 0
                  ORDER BY a.run_date DESC, a.updated_at DESC
                 LIMIT 1) ca ON true
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
    buying_window_score,
    buying_window_confidence,
    commercial_progression_probability,
    expected_commercial_value_eur,
    evidence_density,
    best_context,
    buying_window_state,
    recommended_channel,
    message_strategy,
    recommended_asset,
    recommended_cta,
    evidence_asset_title,
    evidence_asset_type,
    evidence_asset_channel,
    evidence_asset_run_date,
    evidence_asset_title IS NOT NULL AS asset_ready,
    evidence_asset_title AS recommended_asset_reference,
    round(commercial_progression_probability * GREATEST(0.25, evidence_density), 4) AS action_confidence,
    jsonb_build_object('person', jsonb_build_object('person_key', person_key, 'name', person_name, 'role', role, 'relationship_warmth', relationship_warmth, 'decision_influence', decision_influence), 'company', jsonb_build_object('company_key', company_key, 'intent_score', company_intent_score, 'known_people', known_people, 'likely_decision_makers', likely_decision_makers), 'prediction', jsonb_build_object('buying_window_score', buying_window_score, 'confidence', buying_window_confidence, 'commercial_progression', commercial_progression_probability, 'forecast_id', forecast_id), 'strategy', jsonb_build_object('recommended_channel', recommended_channel, 'message_strategy', message_strategy, 'recommended_asset', recommended_asset, 'recommended_cta', recommended_cta), 'evidence', jsonb_build_object('best_context', best_context, 'evidence_density', evidence_density, 'asset_ready', evidence_asset_title IS NOT NULL, 'asset_reference', evidence_asset_title)) AS commercial_intelligence
   FROM with_asset w
  ),
  p0_v3 AS (
WITH funnel AS (
         SELECT COALESCE(a.channel, 'unknown'::text) AS channel,
            count(DISTINCT a.action_id)::numeric AS actions,
            count(DISTINCT o.outcome_id) FILTER (WHERE lower(o.outcome_type) ~ '(reply|response|meeting|appointment|proposal|qualified|won|order|revenue)'::text)::numeric AS positive,
            count(DISTINCT o.outcome_id) FILTER (WHERE lower(o.outcome_type) ~ '(meeting|appointment)'::text)::numeric AS meetings,
            count(DISTINCT o.outcome_id) FILTER (WHERE lower(o.outcome_type) ~ '(proposal|offerte)'::text)::numeric AS proposals,
            count(DISTINCT o.outcome_id) FILTER (WHERE lower(o.outcome_type) ~ '(won|order|revenue)'::text)::numeric AS wins
           FROM powerhouse_sales_actions a
             LEFT JOIN powerhouse_sales_outcomes o ON o.action_id = a.action_id
          WHERE a.created_at >= (now() - '180 days'::interval)
          GROUP BY (COALESCE(a.channel, 'unknown'::text))
        ), base AS (
         SELECT n.opportunity_id,
            n.opportunity_key,
            n.subject_key,
            n.person_key,
            n.company_key,
            n.content_key,
            n.topic_key,
            n.campaign_key,
            n.stage,
            n.expected_value_eur,
            n.probability,
            n.confidence,
            n.expected_revenue_value,
            n.score_components,
            n.evidence,
            n.last_evidence_at,
            n.last_action_at,
            n.next_action_at,
            n.status,
            n.created_at,
            n.updated_at,
            n.person_name,
            n.person_company_name,
            n.role,
            n.linkedin_url,
            n.email,
            n.available_channels,
            n.relationship_warmth,
            n.decision_influence,
            n.aanleiding,
            n.company_intent_score,
            n.known_people,
            n.likely_decision_makers,
            n.forecast_id,
            n.forecast_probability,
            n.forecast_confidence,
            n.predicted_problem,
            n.predicted_buying_trigger,
            n.person_evidence,
            n.company_evidence,
            n.forecast_evidence,
            n.buying_window_score_raw,
            n.buying_window_confidence_raw,
            n.buying_window_score,
            n.buying_window_confidence,
            n.commercial_progression_probability,
            n.expected_commercial_value_eur,
            n.evidence_density,
            n.best_context,
            n.buying_window_state,
            n.recommended_channel,
            n.message_strategy,
            n.recommended_asset,
            n.recommended_cta,
            n.evidence_asset_title,
            n.evidence_asset_type,
            n.evidence_asset_channel,
            n.evidence_asset_run_date,
            n.asset_ready,
            n.recommended_asset_reference,
            n.action_confidence,
            n.commercial_intelligence,
            cp.pressure_state,
            cp.cooldown_until,
            cp.next_follow_up_at,
            cp.pending_response,
            ac.account_thesis,
            ac.recommended_account_move,
            ac.committee_strength,
            ac.economic_buyers,
            rq.research_reason,
            rq.missing_evidence,
            rq.research_priority,
            COALESCE(fn.actions, 0::numeric) AS prediction_sample_size,
            LEAST(1::numeric, GREATEST(0::numeric, (COALESCE(fn.positive, 0::numeric) + 2::numeric) / (COALESCE(fn.actions, 0::numeric) + 8::numeric))) AS empirical_reply_rate,
            LEAST(1::numeric, GREATEST(0::numeric, (COALESCE(fn.meetings, 0::numeric) + 1::numeric) / (COALESCE(fn.actions, 0::numeric) + 12::numeric))) AS empirical_meeting_rate,
            LEAST(1::numeric, GREATEST(0::numeric, (COALESCE(fn.proposals, 0::numeric) + 1::numeric) / (COALESCE(fn.actions, 0::numeric) + 16::numeric))) AS empirical_proposal_rate,
            LEAST(1::numeric, GREATEST(0::numeric, (COALESCE(fn.wins, 0::numeric) + 1::numeric) / (COALESCE(fn.actions, 0::numeric) + 24::numeric))) AS empirical_win_rate
           FROM p0_v2 n
             LEFT JOIN powerhouse_contact_pressure_v1 cp ON cp.person_key = n.person_key
             LEFT JOIN p0_account ac ON ac.company_key = lower(regexp_replace(TRIM(BOTH FROM COALESCE(n.company_key, n.person_company_name, ''::text)), '\s+'::text, ' '::text, 'g'::text))
             LEFT JOIN p0_research rq ON rq.opportunity_key = n.opportunity_key
             LEFT JOIN funnel fn ON lower(fn.channel) = lower(n.recommended_channel)
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
    buying_window_score,
    buying_window_confidence,
    commercial_progression_probability,
    expected_commercial_value_eur,
    evidence_density,
    best_context,
    buying_window_state,
    recommended_channel,
    message_strategy,
    recommended_asset,
    recommended_cta,
    evidence_asset_title,
    evidence_asset_type,
    evidence_asset_channel,
    evidence_asset_run_date,
    asset_ready,
    recommended_asset_reference,
    action_confidence,
    commercial_intelligence,
    pressure_state,
    cooldown_until,
    next_follow_up_at,
    pending_response,
    account_thesis,
    recommended_account_move,
    committee_strength,
    economic_buyers,
    research_reason,
    missing_evidence,
    research_priority,
    prediction_sample_size,
    empirical_reply_rate,
    empirical_meeting_rate,
    empirical_proposal_rate,
    empirical_win_rate,
        CASE
            WHEN pressure_state = 'cooldown'::text THEN 'wait'::text
            WHEN research_reason IS NOT NULL THEN 'research'::text
            WHEN recommended_account_move = 'warm_intro_or_champion'::text AND relationship_warmth >= 0.55 THEN 'warm_intro_request'::text
            WHEN recommended_channel = 'linkedin_dm'::text THEN 'linkedin_dm'::text
            WHEN recommended_channel = 'email'::text THEN 'email'::text
            WHEN recommended_channel = 'linkedin_comment'::text THEN 'linkedin_comment'::text
            ELSE 'research'::text
        END AS recommended_action,
        CASE
            WHEN pressure_state = 'cooldown'::text THEN cooldown_until
            WHEN research_reason IS NOT NULL THEN now()
            ELSE next_follow_up_at
        END AS next_follow_up_at_v3,
        CASE
            WHEN asset_ready THEN recommended_asset_reference
            ELSE NULL::text
        END AS verified_asset_reference,
        CASE
            WHEN asset_ready THEN recommended_asset
            ELSE 'none'::text
        END AS effective_recommended_asset,
    LEAST(0.98, GREATEST(0.01, empirical_reply_rate * (0.60 + 0.40 * commercial_progression_probability))) AS prediction_reply,
    LEAST(0.98, GREATEST(0.005, LEAST(empirical_reply_rate, empirical_meeting_rate * (0.65 + 0.35 * commercial_progression_probability)))) AS prediction_meeting,
    LEAST(0.95, GREATEST(0.002, LEAST(empirical_meeting_rate, empirical_proposal_rate * (0.65 + 0.35 * commercial_progression_probability)))) AS prediction_proposal,
    LEAST(0.90, GREATEST(0.001, LEAST(empirical_proposal_rate, empirical_win_rate * (0.65 + 0.35 * commercial_progression_probability)))) AS prediction_win,
    'nba-v3-empirical-smoothed'::text AS prediction_model_version,
    LEAST(1::numeric, GREATEST(0.15, COALESCE(buying_window_confidence, 0::numeric) * LEAST(1::numeric, (prediction_sample_size + 5::numeric) / 25::numeric))) AS prediction_confidence
   FROM base b
  ),
  p0_v4 AS (
WITH channel_economics AS (
         SELECT powerhouse_action_business_value_v1.channel,
            count(*) FILTER (WHERE powerhouse_action_business_value_v1.economics_observations > 0 OR powerhouse_action_business_value_v1.outcome_observations > 0 OR powerhouse_action_business_value_v1.resource_observations > 0) AS business_evidence_actions,
            count(*) FILTER (WHERE powerhouse_action_business_value_v1.observed_cost_eur IS NOT NULL) AS cost_observed_actions,
            count(*) FILTER (WHERE powerhouse_action_business_value_v1.realized_revenue_eur IS NOT NULL) AS revenue_observed_actions,
            sum(powerhouse_action_business_value_v1.observed_cost_eur) FILTER (WHERE powerhouse_action_business_value_v1.observed_cost_eur IS NOT NULL) AS observed_cost_eur,
            sum(powerhouse_action_business_value_v1.realized_revenue_eur) FILTER (WHERE powerhouse_action_business_value_v1.realized_revenue_eur IS NOT NULL) AS realized_revenue_eur,
            avg(powerhouse_action_business_value_v1.environmental_factor_coverage) FILTER (WHERE powerhouse_action_business_value_v1.environmental_factor_coverage IS NOT NULL) AS environmental_factor_coverage
           FROM powerhouse_action_business_value_v1
          GROUP BY powerhouse_action_business_value_v1.channel
        ), efficiency AS (
         SELECT c.channel,
            c.business_evidence_actions,
            c.cost_observed_actions,
            c.revenue_observed_actions,
            c.observed_cost_eur,
            c.realized_revenue_eur,
            c.environmental_factor_coverage,
                CASE
                    WHEN c.cost_observed_actions >= 3 AND c.revenue_observed_actions >= 3 AND c.observed_cost_eur > 0::numeric AND c.realized_revenue_eur IS NOT NULL THEN LEAST(1::numeric, GREATEST(0::numeric, c.realized_revenue_eur / NULLIF(c.realized_revenue_eur + c.observed_cost_eur, 0::numeric)))
                    ELSE NULL::numeric
                END AS cost_efficiency_evidence
           FROM channel_economics c
        )
 SELECT n.opportunity_id,
    n.opportunity_key,
    n.subject_key,
    n.person_key,
    n.company_key,
    n.content_key,
    n.topic_key,
    n.campaign_key,
    n.stage,
    n.expected_value_eur,
    n.probability,
    n.confidence,
    n.expected_revenue_value,
    n.score_components,
    n.evidence,
    n.last_evidence_at,
    n.last_action_at,
    n.next_action_at,
    n.status,
    n.created_at,
    n.updated_at,
    n.person_name,
    n.person_company_name,
    n.role,
    n.linkedin_url,
    n.email,
    n.available_channels,
    n.relationship_warmth,
    n.decision_influence,
    n.aanleiding,
    n.company_intent_score,
    n.known_people,
    n.likely_decision_makers,
    n.forecast_id,
    n.forecast_probability,
    n.forecast_confidence,
    n.predicted_problem,
    n.predicted_buying_trigger,
    n.person_evidence,
    n.company_evidence,
    n.forecast_evidence,
    n.buying_window_score_raw,
    n.buying_window_confidence_raw,
    n.buying_window_score,
    n.buying_window_confidence,
    n.commercial_progression_probability,
    n.expected_commercial_value_eur,
    n.evidence_density,
    n.best_context,
    n.buying_window_state,
    n.recommended_channel,
    n.message_strategy,
    n.recommended_asset,
    n.recommended_cta,
    n.evidence_asset_title,
    n.evidence_asset_type,
    n.evidence_asset_channel,
    n.evidence_asset_run_date,
    n.asset_ready,
    n.recommended_asset_reference,
    n.action_confidence,
    n.commercial_intelligence,
    n.pressure_state,
    n.cooldown_until,
    n.next_follow_up_at,
    n.pending_response,
    n.account_thesis,
    n.recommended_account_move,
    n.committee_strength,
    n.economic_buyers,
    n.research_reason,
    n.missing_evidence,
    n.research_priority,
    n.prediction_sample_size,
    n.empirical_reply_rate,
    n.empirical_meeting_rate,
    n.empirical_proposal_rate,
    n.empirical_win_rate,
    n.recommended_action,
    n.next_follow_up_at_v3,
    n.verified_asset_reference,
    n.effective_recommended_asset,
    n.prediction_reply,
    n.prediction_meeting,
    n.prediction_proposal,
    n.prediction_win,
    n.prediction_model_version,
    n.prediction_confidence,
    COALESCE(e.business_evidence_actions, 0::bigint) AS business_evidence_actions,
    COALESCE(e.cost_observed_actions, 0::bigint) AS cost_observed_actions,
    COALESCE(e.revenue_observed_actions, 0::bigint) AS revenue_observed_actions,
    e.observed_cost_eur AS historical_observed_cost_eur,
    e.realized_revenue_eur AS historical_realized_revenue_eur,
    e.environmental_factor_coverage AS historical_environmental_factor_coverage,
        CASE
            WHEN e.business_evidence_actions > 0 THEN e.cost_efficiency_evidence
            ELSE NULL::numeric
        END AS cost_efficiency_evidence,
        CASE
            WHEN e.business_evidence_actions > 0 THEN 'observed'::text
            ELSE 'unknown'::text
        END AS business_efficiency_evidence_status
   FROM p0_v3 n
     LEFT JOIN efficiency e ON lower(e.channel) = lower(n.recommended_channel)
  ),
  p0_maturity AS (
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
     LEFT JOIN channel_counts cc ON cc.channel = b.channel
  ),
  p0_v5 AS (
WITH constants AS (
         SELECT 5::bigint AS minimum_comparable_outcomes
        ), channel_evidence AS (
         SELECT p0_maturity.channel,
            count(*) FILTER (WHERE p0_maturity.calibration_eligible) AS calibration_eligible_actions,
            count(*) FILTER (WHERE p0_maturity.forecast_evidence_status = 'measured'::text AND p0_maturity.outcome_evidence_status = 'measured'::text) AS comparable_outcomes,
            count(*) FILTER (WHERE p0_maturity.resource_evidence_status = 'measured'::text) AS measured_resource_actions,
            count(*) FILTER (WHERE p0_maturity.economics_evidence_status = 'measured'::text) AS measured_economics_actions,
            count(*) FILTER (WHERE p0_maturity.outcome_evidence_status = 'measured'::text) AS measured_outcome_actions,
            sum(p0_maturity.human_feedback_observations)::bigint AS human_feedback_observations
           FROM p0_maturity
          GROUP BY p0_maturity.channel
        )
 SELECT nba.opportunity_id,
    nba.opportunity_key,
    nba.subject_key,
    nba.person_key,
    nba.company_key,
    nba.content_key,
    nba.topic_key,
    nba.campaign_key,
    nba.stage,
    nba.expected_value_eur,
    nba.probability,
    nba.confidence,
    nba.expected_revenue_value,
    nba.score_components,
    nba.evidence,
    nba.last_evidence_at,
    nba.last_action_at,
    nba.next_action_at,
    nba.status,
    nba.created_at,
    nba.updated_at,
    nba.person_name,
    nba.person_company_name,
    nba.role,
    nba.linkedin_url,
    nba.email,
    nba.available_channels,
    nba.relationship_warmth,
    nba.decision_influence,
    nba.aanleiding,
    nba.company_intent_score,
    nba.known_people,
    nba.likely_decision_makers,
    nba.forecast_id,
    nba.forecast_probability,
    nba.forecast_confidence,
    nba.predicted_problem,
    nba.predicted_buying_trigger,
    nba.person_evidence,
    nba.company_evidence,
    nba.forecast_evidence,
    nba.buying_window_score_raw,
    nba.buying_window_confidence_raw,
    nba.buying_window_score,
    nba.buying_window_confidence,
    nba.commercial_progression_probability,
    nba.expected_commercial_value_eur,
    nba.evidence_density,
    nba.best_context,
    nba.buying_window_state,
    nba.recommended_channel,
    nba.message_strategy,
    nba.recommended_asset,
    nba.recommended_cta,
    nba.evidence_asset_title,
    nba.evidence_asset_type,
    nba.evidence_asset_channel,
    nba.evidence_asset_run_date,
    nba.asset_ready,
    nba.recommended_asset_reference,
    nba.action_confidence,
    nba.commercial_intelligence,
    nba.pressure_state,
    nba.cooldown_until,
    nba.next_follow_up_at,
    nba.pending_response,
    nba.account_thesis,
    nba.recommended_account_move,
    nba.committee_strength,
    nba.economic_buyers,
    nba.research_reason,
    nba.missing_evidence,
    nba.research_priority,
    nba.prediction_sample_size,
    nba.empirical_reply_rate,
    nba.empirical_meeting_rate,
    nba.empirical_proposal_rate,
    nba.empirical_win_rate,
    nba.recommended_action,
    nba.next_follow_up_at_v3,
    nba.verified_asset_reference,
    nba.effective_recommended_asset,
    nba.prediction_reply,
    nba.prediction_meeting,
    nba.prediction_proposal,
    nba.prediction_win,
    nba.prediction_model_version,
    nba.prediction_confidence,
    nba.business_evidence_actions,
    nba.cost_observed_actions,
    nba.revenue_observed_actions,
    nba.historical_observed_cost_eur,
    nba.historical_realized_revenue_eur,
    nba.historical_environmental_factor_coverage,
    nba.cost_efficiency_evidence,
    nba.business_efficiency_evidence_status,
    c.minimum_comparable_outcomes,
    COALESCE(e.comparable_outcomes, 0::bigint) AS comparable_outcomes,
    COALESCE(e.calibration_eligible_actions, 0::bigint) AS calibration_eligible_actions,
    COALESCE(e.measured_resource_actions, 0::bigint) AS measured_resource_actions,
    COALESCE(e.measured_economics_actions, 0::bigint) AS measured_economics_actions,
    COALESCE(e.measured_outcome_actions, 0::bigint) AS measured_outcome_actions,
    COALESCE(e.human_feedback_observations, 0::bigint) AS human_feedback_observations,
        CASE
            WHEN COALESCE(e.comparable_outcomes, 0::bigint) < c.minimum_comparable_outcomes THEN NULL::numeric
            WHEN COALESCE(e.measured_resource_actions, 0::bigint) < c.minimum_comparable_outcomes THEN NULL::numeric
            ELSE nba.cost_efficiency_evidence
        END AS cost_resource_efficiency_evidence,
        CASE
            WHEN COALESCE(e.comparable_outcomes, 0::bigint) < c.minimum_comparable_outcomes THEN 'insufficient_comparable_outcomes'::text
            WHEN COALESCE(e.measured_resource_actions, 0::bigint) < c.minimum_comparable_outcomes THEN 'insufficient_resource_evidence'::text
            WHEN nba.business_efficiency_evidence_status <> 'observed'::text THEN nba.business_efficiency_evidence_status
            ELSE 'observed_evidence_ready'::text
        END AS evidence_gated_business_efficiency_status
   FROM p0_v4 nba
     CROSS JOIN constants c
     LEFT JOIN channel_evidence e ON e.channel = nba.recommended_channel
  )
select
    row_number() over(
      order by (coalesce(v.expected_commercial_value_eur,0)*coalesce(v.action_confidence,.25)) desc,
               coalesce(v.buying_window_score,0) desc,
               v.opportunity_key
    ) as revenue_rank,
    v.opportunity_key,v.person_key,v.company_key,v.person_name,v.role,v.best_context as why_now,
    v.account_thesis,v.recommended_account_move,v.recommended_action,v.recommended_channel,v.message_strategy,
    v.effective_recommended_asset,v.verified_asset_reference,v.recommended_cta,v.pressure_state,v.cooldown_until,v.next_follow_up_at,
    v.prediction_reply,v.prediction_meeting,v.prediction_proposal,v.prediction_win,v.prediction_confidence,v.prediction_model_version,
    v.prediction_sample_size,v.expected_commercial_value_eur,v.action_confidence,v.buying_window_score,v.buying_window_confidence,
    v.evidence_density,v.research_reason,v.missing_evidence,
    (v.person_key is null or nullif(trim(v.person_key),'') is null) as identity_conflict,
    (v.recommended_action in ('linkedin_dm','email','warm_intro_request') and v.forecast_id is null) as structural_lineage_gap,
    jsonb_build_object(
      'source','powerhouse-commercial-next-best-action-v5',
      'forecast_id',v.forecast_id,
      'asset_ready',v.asset_ready,
      'pressure_state',v.pressure_state,
      'pending_response',coalesce(v.pending_response,false),
      'research_reason',v.research_reason,
      'prediction_basis','canonical-nba-view-materialization'
    ) as command_evidence,
    v_refreshed_at
  from p0_v5 v;
 GET DIAGNOSTICS v_row_count = ROW_COUNT;
 RETURN QUERY SELECT v_row_count,v_refreshed_at;
END
$p0_4215_shared_source$;
REVOKE ALL ON FUNCTION public.powerhouse_refresh_revenue_intelligence_snapshot_v1() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_refresh_revenue_intelligence_snapshot_v1() TO service_role;
DO $postcheck$
BEGIN
 IF position('p0_buying AS MATERIALIZED' IN pg_get_functiondef('public.powerhouse_refresh_revenue_intelligence_snapshot_v1()'::regprocedure))=0
 OR position('p0_maturity AS' IN pg_get_functiondef('public.powerhouse_refresh_revenue_intelligence_snapshot_v1()'::regprocedure))=0
 OR (SELECT NOT prosecdef FROM pg_proc WHERE oid='public.powerhouse_refresh_revenue_intelligence_snapshot_v1()'::regprocedure)
 OR has_function_privilege('anon','public.powerhouse_refresh_revenue_intelligence_snapshot_v1()','EXECUTE')
 OR has_function_privilege('authenticated','public.powerhouse_refresh_revenue_intelligence_snapshot_v1()','EXECUTE')
 OR NOT has_function_privilege('service_role','public.powerhouse_refresh_revenue_intelligence_snapshot_v1()','EXECUTE')
 THEN RAISE EXCEPTION 'P0_4215_SNAPSHOT_SHARED_CTE_OR_ACL_POSTWRITE_DRIFT'; END IF;
END $postcheck$;
COMMIT;
