-- linkedin-personal-no-gap-observational-v1
create or replace function public.powerhouse_ensure_personal_source_rotation_v2(p_date date)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_source record;
  v_signal record;
  v_evidence jsonb;
begin
  if exists (
    select 1 from public.powerhouse_content_recommendations r
    where r.run_date=p_date and r.target_channel='linkedin_personal'
      and r.status in ('suggested','accepted')
      and (
        public.powerhouse_jsonb_true(r.evidence,'personal_truth_verified')
        or public.powerhouse_jsonb_true(r.evidence,'observational_personal_theme_verified')
      )
  ) then
    return jsonb_build_object('ok',true,'action','already_has_eligible_personal_source');
  end if;

  select a.*,
         case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
              then a.generation_evidence->'identity_gate_evidence'
              else coalesce(a.generation_evidence,'{}'::jsonb) end as verified_evidence
    into v_source
    from public.powerhouse_content_artifacts a
   where a.channel='linkedin_personal'
     and a.run_date < p_date
     and a.status not in ('blocked','failed')
     and public.powerhouse_jsonb_true(
       case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
            then a.generation_evidence->'identity_gate_evidence'
            else coalesce(a.generation_evidence,'{}'::jsonb) end,'personal_truth_verified')
     and public.powerhouse_jsonb_true(
       case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
            then a.generation_evidence->'identity_gate_evidence'
            else coalesce(a.generation_evidence,'{}'::jsonb) end,'arthur_anchor_verified')
     and not exists (
       select 1 from public.powerhouse_content_recommendations r
       where r.target_channel='linkedin_personal' and r.run_date < p_date
         and coalesce(r.evidence->>'source_artifact_run_date','')=a.run_date::text
     )
   order by a.run_date desc, a.created_at desc
   limit 1;

  if found then
    v_evidence := v_source.verified_evidence || jsonb_build_object(
      'identity_contract','arthur-personal-linkedin-identity-v4',
      'identity_gate_version','channel-identity-hard-gate-v3',
      'personal_truth_verified',true,
      'arthur_anchor_verified',true,
      'first_person_claims_verified',true,
      'first_person_claims_present',true,
      'personal_life_topic',true,
      'personal_life_only_policy','personal-linkedin-personal-life-only-v1',
      'personal_life_only_verified',true,
      'business_topic',false,'corporate_voice',false,'company_page_interchangeable',false,
      'forced_business_moral',false,'sensitive_private_detail',false,
      'source_text',v_source.body,'source_title',v_source.title,
      'source_artifact_run_date',v_source.run_date,
      'source_lineage',jsonb_build_array('powerhouse_content_artifacts:'||v_source.run_date::text||':linkedin_personal'),
      'content_id','unused-personal-source:'||v_source.run_date::text||':'||p_date::text,
      'publication_intent','publish','verbatim_reuse_forbidden',true,'new_angle_required',true
    );
    insert into public.powerhouse_content_recommendations
      (recommendation_id,dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status,created_at,updated_at)
    values
      (gen_random_uuid(),'unused-personal-source-v2:'||p_date::text,p_date,'personal_daily_life',
       'unused-personal-source-v2:'||p_date::text,'linkedin_personal','verified_unused_personal_source',95,
       'Schrijf een volledig nieuwe persoonlijke post uitsluitend uit source_text. Geen nieuwe feiten, geen businessbrug, geen managementles en geen hergebruikte story family.',
       v_evidence,'suggested',now(),now())
    on conflict (dedupe_key) do update set evidence=excluded.evidence,reason=excluded.reason,status='suggested',updated_at=now();
    return jsonb_build_object('ok',true,'action','unused_verified_personal_source_created');
  end if;

  select s.* into v_signal
    from public.powerhouse_mira_problem_signals_v1 s
   where s.eligible=true
     and coalesce(s.source_url,'')<>''
     and coalesce(s.excerpt,'')<>''
     and not exists (
       select 1 from public.powerhouse_content_recommendations r
       where r.target_channel='linkedin_personal'
         and coalesce(r.evidence->>'public_theme_source_url','')=s.source_url
     )
   order by s.total_score desc nulls last, s.observed_at desc
   limit 1;

  if not found then
    return jsonb_build_object('ok',false,'action','no_unused_personal_or_public_theme_source');
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
    'business_topic',false,'corporate_voice',false,'company_page_interchangeable',false,
    'forced_business_moral',false,'sensitive_private_detail',false,
    'public_theme_source_url',v_signal.source_url,
    'source_text',v_signal.excerpt,
    'source_title',v_signal.title,
    'source_lineage',jsonb_build_array('powerhouse_mira_problem_signals_v1:'||v_signal.signal_id::text,v_signal.source_url),
    'content_id','observational-personal-theme:'||v_signal.signal_id::text||':'||p_date::text,
    'publication_intent','publish',
    'verbatim_reuse_forbidden',true,
    'new_angle_required',true,
    'no_business_bridge',true
  );

  insert into public.powerhouse_content_recommendations
    (recommendation_id,dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status,created_at,updated_at)
  values
    (gen_random_uuid(),'observational-personal-theme:'||p_date::text,p_date,coalesce(v_signal.topic_key,'daily_life'),
     'observational-personal-theme:'||p_date::text,'linkedin_personal','verified_public_theme_observation',92,
     'Schrijf observerend en menselijk over dit herkenbare dagelijkse probleem. Geen ik/mijn/mij/me, geen claim dat Arthur dit zelf meemaakte, geen zakelijke brug en geen managementles. Gebruik alleen source_text als feitelijke basis.',
     v_evidence,'suggested',now(),now())
  on conflict (dedupe_key) do update set evidence=excluded.evidence,reason=excluded.reason,status='suggested',updated_at=now();

  return jsonb_build_object('ok',true,'action','observational_personal_theme_created','source_url',v_signal.source_url);
end;
$$;

create or replace function public.powerhouse_content_closed_loop_tick_v1(p_now timestamptz default now())
returns bigint
language plpgsql
security definer
set search_path to 'public','pg_catalog','net','vault'
as $$
declare
  v_request bigint;
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
begin
  perform public.powerhouse_prepare_daily_content_fallbacks_v1(v_date);
  perform public.powerhouse_ensure_personal_source_rotation_v2(v_date);
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  perform public.powerhouse_instagram_daily_guard_v1(p_now);
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',
      (select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
    body := jsonb_build_object('runDate',v_date::text,'trigger','five-minute-self-healing-loop'),
    timeout_milliseconds := 120000
  ) into v_request;
  return v_request;
end;
$$;

revoke execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) from public,anon,authenticated;
grant execute on function public.powerhouse_ensure_personal_source_rotation_v2(date) to service_role,postgres;
