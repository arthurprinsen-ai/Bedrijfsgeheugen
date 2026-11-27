-- Protected migration; original pg_get_functiondef 2026-11-23 and no manual deployment.
-- Exact existing v2 security definer, fixed search path and legacy builder/identity gates preserved.
CREATE OR REPLACE FUNCTION public.powerhouse_materialize_source_backed_channel_candidates_v2(p_date date DEFAULT (timezone('Europe/Amsterdam'::text, now()))::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
DECLARE
  v_base jsonb;
  v_quarantined integer := 0;
  v_builder_id uuid;
  v_perspective_id uuid;
BEGIN
  v_base := public.powerhouse_materialize_source_backed_channel_candidates_v1(p_date);

  WITH classified AS (
    SELECT
      r.recommendation_id,
      r.topic_key,
      (
        r.topic_key = 'daily-dream-journey'
        OR coalesce(r.evidence->>'business_topic','false') = 'true'
        OR coalesce(r.evidence->>'ai_native_builder_story_verified','false') = 'true'
        OR coalesce(r.evidence->>'founder_story_policy','') <> ''
      ) AS is_legacy_business_proposal,
      (
        r.topic_key <> 'daily-dream-journey'
        AND r.evidence->>'ai_native_builder_story_verified' = 'true'
        AND r.evidence->>'ai_native_builder_policy' = 'personal-linkedin-ai-native-builder-v1'
        AND r.evidence->>'build_event_verified' = 'true'
        AND r.evidence->>'source_backed' = 'true'
        AND r.evidence->>'personal_truth_verified' = 'true'
        AND r.evidence->>'arthur_anchor_verified' = 'true'
        AND r.evidence->>'first_person_claims_verified' = 'true'
        AND r.evidence->>'business_topic' = 'true'
        AND r.evidence->>'corporate_voice' = 'false'
        AND r.evidence->>'company_page_interchangeable' = 'false'
        AND r.evidence->>'forced_business_moral' = 'false'
        AND coalesce(r.evidence->>'observational_personal_theme_verified','false') <> 'true'
        AND coalesce(r.evidence->>'public_theme_source_verified','false') <> 'true'
        AND r.evidence->>'identity_contract' = 'arthur-personal-linkedin-identity-v4'
        AND r.evidence->>'identity_gate_version' = 'channel-identity-hard-gate-v3'
        AND length(trim(coalesce(r.evidence->>'source_text',''))) >= 70
        AND (coalesce(r.evidence->>'sensitive_private_detail','false') <> 'true'
          OR r.evidence->>'sensitive_private_approval' = 'true')
        -- A claim from GitHub, generated marketing or a public MKB radar is NOT
        -- evidence that Arthur experienced it. A genuine direct user fact is.
        AND EXISTS (
          SELECT 1
          FROM jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(r.evidence->'source_lineage') = 'array'
              THEN r.evidence->'source_lineage' ELSE '[]'::jsonb END
          ) AS source_fact(fact_ref)
          WHERE source_fact.fact_ref ~* '^(current-chat:user-fact|chat-history:user-fact|user-submitted-personal|user-verified-personal|user-authored-personal)'
        )
        AND coalesce(r.evidence->'source_lineage','[]'::jsonb)::text !~*
          '(powerhouse_content_artifacts:|powerhouse_mira_problem_signals_v1:|bg_externe_signalen:)'
      ) AS is_verified_user_founder,
      (
        r.topic_key <> 'daily-dream-journey'
        AND r.evidence->>'personal_founder_perspective_verified' = 'true'
        AND r.evidence->>'personal_founder_perspective_policy' = 'personal-linkedin-trusted-advisor-perspective-v1'
        AND r.evidence->>'founder_view_event_verified' = 'true'
        AND r.evidence->>'founder_view_event_kind' IN ('direct_user_stated_opinion','direct_user_stated_design_preference','direct_user_approved_research_synthesis')
        AND r.evidence->>'source_kind' IN ('verified_personal_source','verified_founder_perspective')
        AND r.evidence->>'source_backed' = 'true'
        AND r.evidence->>'personal_truth_verified' = 'true'
        AND r.evidence->>'first_person_claims_verified' = 'true'
        AND r.evidence->>'first_person_claims_present' = 'true'
        AND r.evidence->>'arthur_anchor_verified' = 'true'
        AND r.evidence->>'business_topic' = 'true'
        AND r.evidence->>'personal_life_topic' = 'false'
        AND r.evidence->>'corporate_voice' = 'false'
        AND r.evidence->>'company_page_interchangeable' = 'false'
        AND r.evidence->>'forced_business_moral' = 'false'
        AND coalesce(r.evidence->>'ai_native_builder_story_verified','false') <> 'true'
        AND coalesce(r.evidence->>'observational_personal_theme_verified','false') <> 'true'
        AND coalesce(r.evidence->>'public_theme_source_verified','false') <> 'true'
        AND r.evidence->>'identity_contract' = 'arthur-personal-linkedin-identity-v4'
        AND r.evidence->>'identity_gate_version' = 'channel-identity-hard-gate-v3'
        AND length(trim(coalesce(r.evidence->>'content_id',''))) > 0
        AND length(trim(coalesce(r.evidence->>'source_text',''))) >= 70
        AND (coalesce(r.evidence->>'sensitive_private_detail','false') <> 'true'
          OR r.evidence->>'sensitive_private_approval' = 'true')
        AND EXISTS (SELECT 1 FROM jsonb_array_elements_text(
          CASE WHEN jsonb_typeof(r.evidence->'source_lineage')='array'
            THEN r.evidence->'source_lineage' ELSE '[]'::jsonb END
          ) AS owner_fact(source_ref)
          WHERE owner_fact.source_ref ~* '^(current-chat:user-fact|chat-history:user-fact|user-submitted-personal|user-verified-personal|user-authored-personal)')
        AND coalesce(r.evidence->'source_lineage','[]'::jsonb)::text !~*
          '(powerhouse_content_artifacts:|powerhouse_mira_problem_signals_v1:|bg_externe_signalen:)'
        AND (
          coalesce(r.evidence->>'research_claims_present','false') <> 'true'
          OR (
            jsonb_typeof(r.evidence->'research_source_evidence') = 'array'
            AND jsonb_array_length(CASE WHEN jsonb_typeof(r.evidence->'research_source_evidence')='array'
              THEN r.evidence->'research_source_evidence' ELSE '[]'::jsonb END) > 0
            AND NOT EXISTS (
              SELECT 1 FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(r.evidence->'research_source_evidence')='array'
                  THEN r.evidence->'research_source_evidence' ELSE '[]'::jsonb END) AS rs(ref)
              WHERE coalesce(rs.ref->>'verified','false') <> 'true'
                OR coalesce(rs.ref->>'url','') !~* '^https://[^[:space:]]+$'
                OR coalesce(rs.ref->>'checked_at','') !~ '^20[0-9]{2}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}'
            )
          )
        )
      ) AS is_verified_user_perspective
    FROM public.powerhouse_content_recommendations r
    WHERE r.run_date = p_date
      AND r.target_channel = 'linkedin_personal'
      AND r.status IN ('suggested','accepted')
  ), quarantine AS (
    UPDATE public.powerhouse_content_recommendations r
    SET status = 'skipped',
        evidence = coalesce(r.evidence,'{}'::jsonb)
          || jsonb_build_object(
            'personal_editorial_rejection','PERSONAL_BUSINESS_SOURCE_FORBIDDEN',
            'personal_life_only_policy','personal-linkedin-personal-life-only-v1',
            'personal_truth_verified',false,
            'original_candidate_not_published',true,
            'source_repair_owner','powerhouse-content-orchestrator'
          ),
        updated_at = now()
    FROM classified c
    WHERE r.recommendation_id = c.recommendation_id
      AND c.is_legacy_business_proposal
      AND NOT (c.is_verified_user_founder OR c.is_verified_user_perspective)
    RETURNING r.recommendation_id
  )
  SELECT
    (SELECT count(*)::integer FROM quarantine),
    (SELECT c.recommendation_id FROM classified c
      WHERE c.is_verified_user_founder ORDER BY c.recommendation_id LIMIT 1),
    (SELECT c.recommendation_id FROM classified c WHERE c.is_verified_user_perspective ORDER BY c.recommendation_id LIMIT 1)
  INTO v_quarantined, v_builder_id, v_perspective_id;

  RETURN coalesce(v_base,'{}'::jsonb) || jsonb_build_object(
    'contract','powerhouse-source-backed-all-channels-v2',
    'linkedin_personal_ai_native_builder_recommendation_id',v_builder_id,
    'personal_life_only_policy','personal-linkedin-personal-life-only-v1',
    'verified_user_founder_exception','first_person_source_backed_with_original_review',
    'linkedin_personal_founder_perspective_recommendation_id',v_perspective_id,
    'verified_user_perspective_exception','direct_user_anchored_source_with_original_review',
    'personal_first_person_source_required',true,
    'legacy_personal_business_candidates_quarantined',v_quarantined,
    'personal_writer_authority','original-powerhouse-social-publisher',
    'personal_source_status',
      CASE WHEN v_builder_id IS NOT NULL OR v_perspective_id IS NOT NULL
        THEN 'VERIFIED_USER_FOUNDER_SOURCE_PENDING_INDEPENDENT_FINAL_TEXT_REVIEW'
        ELSE 'ORIGINAL_USER_FACT_REQUIRED_IF_NONE_VERIFIED' END
  );
END;
$function$;
