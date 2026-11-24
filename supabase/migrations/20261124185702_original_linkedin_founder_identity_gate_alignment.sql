-- Exact candidate trigger bodies validated by 19 isolated PostgreSQL scenarios.
-- CLI-generated migration filename, original gates retained, no production data rewrite.
CREATE OR REPLACE FUNCTION public.enforce_linkedin_personal_artifact_identity_gate_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  e jsonb;
  truth_ok boolean;
  observational_ok boolean;
  builder_ok boolean;
  founder_ok boolean;
  founder_mode boolean;
begin
  -- Preserve the original identity gate and decode only losslessly serialized JSON objects.
  if new.channel='linkedin_personal' and jsonb_typeof(new.generation_evidence)='string'
     and pg_input_is_valid(new.generation_evidence#>>'{}','jsonb') then
    if jsonb_typeof((new.generation_evidence#>>'{}')::jsonb)='object' then
      new.generation_evidence := (new.generation_evidence#>>'{}')::jsonb;
    end if;
  end if;
  if new.channel='linkedin_personal'
     and new.status in ('scheduled','published','measured','learned') then
    e := case
      when jsonb_typeof(public.powerhouse_jsonb_object_v1(new.generation_evidence)->'identity_gate_evidence')='object'
        then public.powerhouse_jsonb_object_v1(new.generation_evidence)->'identity_gate_evidence'
      else public.powerhouse_jsonb_object_v1(new.generation_evidence)
    end;

    truth_ok :=
      public.powerhouse_jsonb_true(e,'personal_truth_verified') is true
      and public.powerhouse_jsonb_true(e,'arthur_anchor_verified') is true
      and public.powerhouse_jsonb_true(e,'first_person_claims_verified') is true
      and public.powerhouse_jsonb_true(e,'concrete_personal_anchor') is true
      and coalesce(e->>'identity_gate_result','PASS')='PASS';

    observational_ok :=
      public.powerhouse_jsonb_true(e,'observational_personal_theme_verified') is true
      and public.powerhouse_jsonb_true(e,'public_theme_source_verified') is true
      and coalesce((e->>'first_person_claims_present')::boolean,true)=false
      and public.powerhouse_jsonb_true(e,'personal_life_topic') is true
      and coalesce((e->>'business_topic')::boolean,false)=false;

    builder_ok :=
      public.powerhouse_jsonb_true(e,'ai_native_builder_story_verified') is true
      and coalesce(e->>'ai_native_builder_policy','')='personal-linkedin-ai-native-builder-v1'
      and public.powerhouse_jsonb_true(e,'build_event_verified') is true
      and public.powerhouse_jsonb_true(e,'arthur_anchor_verified') is true
      and coalesce((e->>'business_topic')::boolean,false)=true
      and coalesce((e->>'first_person_claims_present')::boolean,false)=true
      and jsonb_typeof(e->'source_lineage')='array'
      and jsonb_array_length(e->'source_lineage')>0;

    founder_mode := (coalesce((e)->>'personal_founder_perspective_verified','false')='true' OR coalesce((e)->>'personal_founder_perspective_policy','')='personal-linkedin-trusted-advisor-perspective-v1' OR coalesce((e)->>'source_kind','')='verified_founder_perspective' OR EXISTS (SELECT 1 FROM public.powerhouse_content_recommendations f WHERE f.recommendation_id::text=public.powerhouse_jsonb_object_v1(new.generation_evidence)->>'recommendation_id' AND (f.evidence->>'personal_founder_perspective_verified'='true' OR f.evidence->>'personal_founder_perspective_policy'='personal-linkedin-trusted-advisor-perspective-v1')));
    founder_ok := EXISTS (
      SELECT 1 FROM public.powerhouse_content_recommendations r
      WHERE r.recommendation_id::text=public.powerhouse_jsonb_object_v1(new.generation_evidence)->>'recommendation_id'
        AND r.run_date=new.run_date AND r.target_channel='linkedin_personal'
        AND r.status IN ('suggested','accepted')
        AND new.artifact_type='linkedin_post'
        AND (r.topic_key <> 'daily-dream-journey'
        AND r.evidence->>'personal_founder_perspective_verified' = 'true'
        AND r.evidence->>'personal_founder_perspective_policy' = 'personal-linkedin-trusted-advisor-perspective-v1'
        AND r.evidence->>'founder_view_event_verified' = 'true'
        AND r.evidence->>'founder_view_event_kind' IN
          ('direct_user_stated_opinion','direct_user_stated_design_preference','direct_user_approved_research_synthesis')
        AND r.evidence->>'source_backed' = 'true'
        AND r.evidence->>'personal_truth_verified' = 'true'
        AND r.evidence->>'arthur_anchor_verified' = 'true'
        AND r.evidence->>'first_person_claims_verified' = 'true'
        AND r.evidence->>'first_person_claims_present' = 'true'
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
        AND r.evidence->>'source_kind' IN ('verified_personal_source','verified_founder_perspective')
        AND length(trim(coalesce(r.evidence->>'content_id',''))) > 0
        AND length(trim(coalesce(r.evidence->>'source_text',''))) >= 70
        AND (coalesce(r.evidence->>'sensitive_private_detail','false') <> 'true'
          OR r.evidence->>'sensitive_private_approval' = 'true')
        -- A provenance flag supplied by an external article is not user evidence.
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(r.evidence->'source_lineage') = 'array'
            THEN r.evidence->'source_lineage' ELSE '[]'::jsonb END
          ) AS source_fact(fact_ref)
          WHERE source_fact.fact_ref ~*
            '^(current-chat:user-fact|chat-history:user-fact|user-submitted-personal|user-verified-personal|user-authored-personal)'
        )
        AND coalesce(r.evidence->'source_lineage','[]'::jsonb)::text !~*
          '(powerhouse_content_artifacts:|powerhouse_mira_problem_signals_v1:|bg_externe_signalen:)'
        -- Claims about external research also require their own source checks.
        AND (
          coalesce(r.evidence->>'research_claims_present','false') <> 'true'
          OR (
            jsonb_typeof(r.evidence->'research_source_evidence') = 'array'
            AND jsonb_array_length(r.evidence->'research_source_evidence') > 0
            AND NOT EXISTS (
              SELECT 1
              FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(r.evidence->'research_source_evidence') = 'array'
                THEN r.evidence->'research_source_evidence' ELSE '[]'::jsonb END
              ) AS src(item)
              WHERE src.item->>'verified' IS DISTINCT FROM 'true'
                 OR coalesce(src.item->>'url','') !~* '^https://[^[:space:]]+'
                 OR coalesce(src.item->>'checked_at','') !~ '^20[0-9]{2}-[01][0-9]-[0-3][0-9]'
            )
          )
        ))
        AND NOT EXISTS (
          SELECT 1 FROM unnest(ARRAY['content_id','source_text','source_lineage','source_kind','source_backed','identity_contract','identity_gate_version','personal_founder_perspective_verified','personal_founder_perspective_policy','founder_view_event_verified','founder_view_event_kind','personal_truth_verified','arthur_anchor_verified','first_person_claims_verified','first_person_claims_present','business_topic','personal_life_topic','corporate_voice','company_page_interchangeable','forced_business_moral']) AS keylist(k)
          WHERE (e)->keylist.k IS DISTINCT FROM r.evidence->keylist.k
        )
        AND coalesce((e)->>'sensitive_private_detail','false')=coalesce(r.evidence->>'sensitive_private_detail','false')
        AND coalesce((e)->>'sensitive_private_approval','false')=coalesce(r.evidence->>'sensitive_private_approval','false')
        AND coalesce((e)->>'research_claims_present','false')=coalesce(r.evidence->>'research_claims_present','false')
        AND coalesce((e)->'research_source_evidence','[]'::jsonb)=coalesce(r.evidence->'research_source_evidence','[]'::jsonb)
        AND coalesce((e)->>'ai_native_builder_story_verified','false')='false'
        AND coalesce((e)->>'observational_personal_theme_verified','false')='false'
        AND coalesce((e)->>'public_theme_source_verified','false')='false'
        AND coalesce(new.body,'') <> ''
        AND new.body !~* $claim$(\m(ik|wij)\s+(zie[n]?|merk(en)?|ervaar|ervaren|hoor|horen)\s+((dit|dat|het)\s+)?(wekelijks|dagelijks|regelmatig|vaak|telkens|steeds\s+weer)\M|\mwaar\s+(ik|wij)\s+((vaak|regelmatig|wekelijks|dagelijks|telkens|steeds\s+weer)\s+)?tegenaan\s+(loop|lopen)\M|\m(ik|wij)\s+(zie[n]?|merk(en)?|ervaar|ervaren|hoor|horen)\s+bij\s+(een\s+)?klant(en)?\M)$claim$
    );

    if coalesce((e->>'corporate_style')::boolean,false)=true
       or coalesce((e->>'corporate_voice')::boolean,false)=true
       or coalesce((e->>'company_page_interchangeable')::boolean,false)=true
       or not (CASE WHEN founder_mode THEN founder_ok ELSE (truth_ok or observational_ok or builder_ok) END) then
      raise exception using
        errcode='P0001',
        message='LINKEDIN_PERSONAL_IDENTITY_GATE_BLOCKED: verified personal truth, verified observational personal-life source, or verified AI-native builder-event lineage required before scheduling/publishing';
    end if;
  end if;
  return new;
end;
$function$;

CREATE OR REPLACE FUNCTION public.enforce_linkedin_personal_obligation_identity_gate_v3()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  gate_ok boolean;
begin
  if new.channel='linkedin_personal'
     and new.status in ('DISPATCHED','PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    select exists (
      select 1
      from public.powerhouse_content_artifacts a
      cross join lateral (
        select case
          when jsonb_typeof(public.powerhouse_jsonb_object_v1(a.generation_evidence)->'identity_gate_evidence')='object'
            then public.powerhouse_jsonb_object_v1(a.generation_evidence)->'identity_gate_evidence'
          else public.powerhouse_jsonb_object_v1(a.generation_evidence)
        end as e
      ) g
      where a.run_date=new.publication_date
        and a.channel='linkedin_personal'
        and a.artifact_type='linkedin_post'
        and a.status not in ('blocked','failed')
        and coalesce((g.e->>'corporate_style')::boolean,false)=false
        and coalesce((g.e->>'corporate_voice')::boolean,false)=false
        and coalesce((g.e->>'company_page_interchangeable')::boolean,false)=false
        and (
          (NOT (coalesce((g.e)->>'personal_founder_perspective_verified','false')='true' OR coalesce((g.e)->>'personal_founder_perspective_policy','')='personal-linkedin-trusted-advisor-perspective-v1' OR coalesce((g.e)->>'source_kind','')='verified_founder_perspective' OR EXISTS (SELECT 1 FROM public.powerhouse_content_recommendations f WHERE f.recommendation_id::text=public.powerhouse_jsonb_object_v1(a.generation_evidence)->>'recommendation_id' AND (f.evidence->>'personal_founder_perspective_verified'='true' OR f.evidence->>'personal_founder_perspective_policy'='personal-linkedin-trusted-advisor-perspective-v1'))) AND (
          (
            coalesce((g.e->>'business_topic')::boolean,false)=false
            and public.powerhouse_jsonb_true(g.e,'personal_life_topic') is true
            and (
              (
                public.powerhouse_jsonb_true(g.e,'personal_truth_verified') is true
                and public.powerhouse_jsonb_true(g.e,'arthur_anchor_verified') is true
                and public.powerhouse_jsonb_true(g.e,'first_person_claims_verified') is true
              )
              or
              (
                public.powerhouse_jsonb_true(g.e,'observational_personal_theme_verified') is true
                and public.powerhouse_jsonb_true(g.e,'public_theme_source_verified') is true
                and coalesce((g.e->>'first_person_claims_present')::boolean,true)=false
              )
            )
          )
          or
          (
            public.powerhouse_jsonb_true(g.e,'ai_native_builder_story_verified') is true
            and coalesce(g.e->>'ai_native_builder_policy','')='personal-linkedin-ai-native-builder-v1'
            and public.powerhouse_jsonb_true(g.e,'build_event_verified') is true
            and public.powerhouse_jsonb_true(g.e,'arthur_anchor_verified') is true
            and coalesce((g.e->>'business_topic')::boolean,false)=true
            and coalesce((g.e->>'first_person_claims_present')::boolean,false)=true
            and jsonb_typeof(g.e->'source_lineage')='array'
            and jsonb_array_length(g.e->'source_lineage')>0
          )
          ))
          or (
            new.tenant_id='canonical' AND EXISTS (
      SELECT 1 FROM public.powerhouse_content_recommendations r
      WHERE r.recommendation_id::text=public.powerhouse_jsonb_object_v1(a.generation_evidence)->>'recommendation_id'
        AND r.run_date=a.run_date AND r.target_channel='linkedin_personal'
        AND r.status IN ('suggested','accepted')
        AND a.artifact_type='linkedin_post'
        AND (r.topic_key <> 'daily-dream-journey'
        AND r.evidence->>'personal_founder_perspective_verified' = 'true'
        AND r.evidence->>'personal_founder_perspective_policy' = 'personal-linkedin-trusted-advisor-perspective-v1'
        AND r.evidence->>'founder_view_event_verified' = 'true'
        AND r.evidence->>'founder_view_event_kind' IN
          ('direct_user_stated_opinion','direct_user_stated_design_preference','direct_user_approved_research_synthesis')
        AND r.evidence->>'source_backed' = 'true'
        AND r.evidence->>'personal_truth_verified' = 'true'
        AND r.evidence->>'arthur_anchor_verified' = 'true'
        AND r.evidence->>'first_person_claims_verified' = 'true'
        AND r.evidence->>'first_person_claims_present' = 'true'
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
        AND r.evidence->>'source_kind' IN ('verified_personal_source','verified_founder_perspective')
        AND length(trim(coalesce(r.evidence->>'content_id',''))) > 0
        AND length(trim(coalesce(r.evidence->>'source_text',''))) >= 70
        AND (coalesce(r.evidence->>'sensitive_private_detail','false') <> 'true'
          OR r.evidence->>'sensitive_private_approval' = 'true')
        -- A provenance flag supplied by an external article is not user evidence.
        AND EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(
            CASE WHEN jsonb_typeof(r.evidence->'source_lineage') = 'array'
            THEN r.evidence->'source_lineage' ELSE '[]'::jsonb END
          ) AS source_fact(fact_ref)
          WHERE source_fact.fact_ref ~*
            '^(current-chat:user-fact|chat-history:user-fact|user-submitted-personal|user-verified-personal|user-authored-personal)'
        )
        AND coalesce(r.evidence->'source_lineage','[]'::jsonb)::text !~*
          '(powerhouse_content_artifacts:|powerhouse_mira_problem_signals_v1:|bg_externe_signalen:)'
        -- Claims about external research also require their own source checks.
        AND (
          coalesce(r.evidence->>'research_claims_present','false') <> 'true'
          OR (
            jsonb_typeof(r.evidence->'research_source_evidence') = 'array'
            AND jsonb_array_length(r.evidence->'research_source_evidence') > 0
            AND NOT EXISTS (
              SELECT 1
              FROM jsonb_array_elements(
                CASE WHEN jsonb_typeof(r.evidence->'research_source_evidence') = 'array'
                THEN r.evidence->'research_source_evidence' ELSE '[]'::jsonb END
              ) AS src(item)
              WHERE src.item->>'verified' IS DISTINCT FROM 'true'
                 OR coalesce(src.item->>'url','') !~* '^https://[^[:space:]]+'
                 OR coalesce(src.item->>'checked_at','') !~ '^20[0-9]{2}-[01][0-9]-[0-3][0-9]'
            )
          )
        ))
        AND NOT EXISTS (
          SELECT 1 FROM unnest(ARRAY['content_id','source_text','source_lineage','source_kind','source_backed','identity_contract','identity_gate_version','personal_founder_perspective_verified','personal_founder_perspective_policy','founder_view_event_verified','founder_view_event_kind','personal_truth_verified','arthur_anchor_verified','first_person_claims_verified','first_person_claims_present','business_topic','personal_life_topic','corporate_voice','company_page_interchangeable','forced_business_moral']) AS keylist(k)
          WHERE (g.e)->keylist.k IS DISTINCT FROM r.evidence->keylist.k
        )
        AND coalesce((g.e)->>'sensitive_private_detail','false')=coalesce(r.evidence->>'sensitive_private_detail','false')
        AND coalesce((g.e)->>'sensitive_private_approval','false')=coalesce(r.evidence->>'sensitive_private_approval','false')
        AND coalesce((g.e)->>'research_claims_present','false')=coalesce(r.evidence->>'research_claims_present','false')
        AND coalesce((g.e)->'research_source_evidence','[]'::jsonb)=coalesce(r.evidence->'research_source_evidence','[]'::jsonb)
        AND coalesce((g.e)->>'ai_native_builder_story_verified','false')='false'
        AND coalesce((g.e)->>'observational_personal_theme_verified','false')='false'
        AND coalesce((g.e)->>'public_theme_source_verified','false')='false'
        AND coalesce(a.body,'') <> ''
        AND a.body !~* $claim$(\m(ik|wij)\s+(zie[n]?|merk(en)?|ervaar|ervaren|hoor|horen)\s+((dit|dat|het)\s+)?(wekelijks|dagelijks|regelmatig|vaak|telkens|steeds\s+weer)\M|\mwaar\s+(ik|wij)\s+((vaak|regelmatig|wekelijks|dagelijks|telkens|steeds\s+weer)\s+)?tegenaan\s+(loop|lopen)\M|\m(ik|wij)\s+(zie[n]?|merk(en)?|ervaar|ervaren|hoor|horen)\s+bij\s+(een\s+)?klant(en)?\M)$claim$
    )
          )
        )
    ) into gate_ok;

    if not coalesce(gate_ok,false) then
      raise exception using
        errcode='P0001',
        message='LINKEDIN_PERSONAL_DISPATCH_BLOCKED: no artifact with verified personal truth, verified observational personal-life source, or verified AI-native builder-event lineage';
    end if;
  end if;
  return new;
end;
$function$;
