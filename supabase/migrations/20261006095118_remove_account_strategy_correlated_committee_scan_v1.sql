create or replace view public.powerhouse_account_strategy_v1
with (security_invoker=true)
as
WITH committee AS (
         SELECT b.company_key,
            count(*)::integer AS committee_people,
            count(*) FILTER (WHERE b.inferred_buying_role = ANY (ARRAY['economic_buyer'::text, 'economic_buyer_or_blocker'::text]))::integer AS economic_buyers,
            count(*) FILTER (WHERE b.inferred_buying_role = 'technical_evaluator'::text)::integer AS technical_evaluators,
            count(*) FILTER (WHERE b.inferred_buying_role = 'champion_or_influencer'::text)::integer AS champions,
            max(b.committee_priority) AS committee_strength,
            (array_agg(b.person_key order by b.committee_priority desc nulls last,b.person_key))[1] AS best_relationship_person_key
           FROM powerhouse_buying_committee_v1 b
          GROUP BY b.company_key
        ), windows AS (
         SELECT lower(regexp_replace(TRIM(BOTH FROM COALESCE(powerhouse_buying_window_v2.company_key, powerhouse_buying_window_v2.person_company_name, ''::text)), '\s+'::text, ' '::text, 'g'::text)) AS company_key,
            count(*) FILTER (WHERE powerhouse_buying_window_v2.buying_window_state = 'hot'::text)::integer AS hot_windows,
            count(*) FILTER (WHERE powerhouse_buying_window_v2.buying_window_state = 'warm'::text)::integer AS warm_windows,
            max(powerhouse_buying_window_v2.buying_window_score) AS max_buying_window_score,
            max(powerhouse_buying_window_v2.buying_window_confidence) AS max_buying_window_confidence,
            sum(powerhouse_buying_window_v2.expected_commercial_value_eur) AS expected_account_value_eur,
            (array_agg(powerhouse_buying_window_v2.best_context ORDER BY powerhouse_buying_window_v2.expected_commercial_value_eur DESC NULLS LAST))[1] AS best_context
           FROM powerhouse_buying_window_v2
          WHERE NULLIF(TRIM(BOTH FROM COALESCE(powerhouse_buying_window_v2.company_key, powerhouse_buying_window_v2.person_company_name, ''::text)), ''::text) IS NOT NULL
          GROUP BY (lower(regexp_replace(TRIM(BOTH FROM COALESCE(powerhouse_buying_window_v2.company_key, powerhouse_buying_window_v2.person_company_name, ''::text)), '\s+'::text, ' '::text, 'g'::text)))
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
     LEFT JOIN windows w ON w.company_key = c.company_key;;
