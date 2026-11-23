-- EXISTING canonical source-rotation v2: authoritative guarded replacement (not a second publisher).
-- Incident: 2026-10-29 runtime selected a historical undated source and revived it on same-date retry.
-- Keep the existing security-definer owner and explicit role grant. No new scheduler, lease or publisher.
-- No backdating via observed_at: only provider source_published_at may satisfy age checks.
-- No reset of global duplicate claims and no modification of already-created provider posts.
create or replace function public.powerhouse_ensure_personal_source_rotation_v2(p_date date)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_signal record;
  v_evidence jsonb;
begin
  if exists (
    select 1
      from public.powerhouse_content_recommendations r
     where r.run_date=p_date
       and r.target_channel='linkedin_personal'
       and r.status in ('suggested','accepted')
       and r.recommendation_type not in ('verified_personal_source_rotation','verified_unused_personal_source')
       and (
         public.powerhouse_jsonb_true(r.evidence,'personal_truth_verified')
         or (
           public.powerhouse_jsonb_true(r.evidence,'observational_personal_theme_verified')
           and exists (
             select 1
               from public.powerhouse_mira_problem_signals_v1 s_existing
              where s_existing.source_url = r.evidence->>'public_theme_source_url'
                and s_existing.eligible = true
                and s_existing.source_published_at is not null
                and s_existing.source_published_at::date between (p_date - 45) and p_date
                and s_existing.topic_key in (
                  'bezorging-en-pakketten','schoolapps-en-oudercommunicatie',
                  'wachtwoord-en-inloggen','dagelijkse-digitale-frictie',
                  'parkeren-en-apps','appstapeling-en-digitale-frictie',
                  'abonnementen-en-opzeggen','meldingen-en-groepsapps',
                  'chatbots-en-klantenservice'
                )
           )
         )
       )
  ) then
    return jsonb_build_object('ok',true,'action','already_has_eligible_personal_source');
  end if;

  select s.*
    into v_signal
    from public.powerhouse_mira_problem_signals_v1 s
   where s.eligible=true
     and s.total_score >= 0.72
     and s.source_url like 'https://%'
     and length(trim(s.title)) >= 12
     and length(trim(s.excerpt)) >= 60
     and s.source_published_at is not null
     and s.source_published_at::date between (p_date - 45) and p_date
     and s.topic_key in (
       'bezorging-en-pakketten','schoolapps-en-oudercommunicatie',
       'wachtwoord-en-inloggen','dagelijkse-digitale-frictie',
       'parkeren-en-apps','appstapeling-en-digitale-frictie',
       'abonnementen-en-opzeggen','meldingen-en-groepsapps',
       'chatbots-en-klantenservice'
     )
     and not exists (
       select 1
         from public.powerhouse_content_recommendations r
        where r.target_channel='linkedin_personal'
          and coalesce(r.evidence->>'public_theme_source_url','')=s.source_url
     )
   order by s.total_score desc nulls last, s.observed_at desc
   limit 1;

  if not found then
    return jsonb_build_object('ok',false,'action','no_fresh_dated_unused_personal_life_source','reason','SOURCE_SUPPLY_REQUIRED','run_date',p_date,'max_source_age_days',45);
  end if;

  v_evidence := jsonb_build_object(
    'identity_contract','arthur-personal-linkedin-identity-v4',
    'identity_gate_version','channel-identity-hard-gate-v3',
    'observational_personal_theme_verified',true,
    'public_theme_source_verified',true,
    'first_person_claims_present',false,
    'personal_truth_verified',false,
    'arthur_anchor_verified',false,
    'first_person_claims_verified',false,
    'personal_life_topic',true,
    'personal_life_only_policy','personal-linkedin-personal-life-only-v1',
    'personal_life_only_verified',true,
    'business_topic',false,
    'corporate_voice',false,
    'company_page_interchangeable',false,
    'forced_business_moral',false,
    'sensitive_private_detail',false,
    'public_theme_source_url',v_signal.source_url,
    'public_theme_source_published_at',v_signal.source_published_at,
    'public_theme_source_observed_at',v_signal.observed_at,
    'source_publication_date_present',true,
    'source_text',v_signal.excerpt,
    'source_title',v_signal.title,
    'source_lineage',jsonb_build_array('powerhouse_mira_problem_signals_v1:'||v_signal.signal_id::text,v_signal.source_url),
    'content_id','observational-personal-theme:'||v_signal.signal_id::text||':'||p_date::text,
    'calendar_date',p_date::text,
    'prediction_lineage_present',true,
    'prior_prediction_decision_id','decision:'||p_date::text||':linkedin_personal',
    'publication_intent','publish',
    'verbatim_reuse_forbidden',true,
    'new_angle_required',true,
    'no_business_bridge',true,
    'story_family_reuse_forbidden',true
  );

  insert into public.powerhouse_content_recommendations
    (recommendation_id,dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status,created_at,updated_at)
  values
    (gen_random_uuid(),'observational-personal-theme:'||p_date::text||':'||v_signal.signal_id::text,p_date,coalesce(v_signal.topic_key,'daily_life'),
     'observational-personal-theme:'||p_date::text||':'||v_signal.signal_id::text,'linkedin_personal','verified_public_theme_observation',92,
     'Schrijf observerend, menselijk en herkenbaar over dit dagelijkse probleem. Geen ik/mijn/mij/me, geen claim dat Arthur dit zelf meemaakte, geen zakelijke brug en geen managementles. Gebruik alleen source_text als feitelijke basis.',
     v_evidence,'suggested',now(),now())
  on conflict (dedupe_key) do update
     set evidence=excluded.evidence,reason=excluded.reason,status='suggested',updated_at=now();

  return jsonb_build_object('ok',true,'action','observational_personal_theme_created','source_url',v_signal.source_url);
end;
$$;


revoke execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) from public, anon, authenticated;
grant execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) to service_role, postgres;
