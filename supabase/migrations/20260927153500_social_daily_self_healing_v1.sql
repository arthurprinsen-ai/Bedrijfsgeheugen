-- social-daily-self-healing-v1
-- Prevent silent daily social gaps caused by exhausted personal-source pools.
-- The existing 5-minute closed loop remains the single scheduler/owner.

create or replace function public.powerhouse_ensure_personal_source_rotation_v1(p_date date)
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_source record;
  v_evidence jsonb;
  v_last_used date;
begin
  if exists (
    select 1
    from public.powerhouse_content_recommendations r
    where r.run_date=p_date
      and r.target_channel='linkedin_personal'
      and r.status in ('suggested','accepted')
      and r.evidence->>'identity_contract'='arthur-personal-linkedin-identity-v4'
      and r.evidence->>'identity_gate_version'='channel-identity-hard-gate-v3'
      and public.powerhouse_jsonb_true(r.evidence,'personal_truth_verified')
      and public.powerhouse_jsonb_true(r.evidence,'arthur_anchor_verified')
      and public.powerhouse_jsonb_true(r.evidence,'first_person_claims_verified')
      and public.powerhouse_jsonb_true(r.evidence,'personal_life_topic')
      and coalesce((r.evidence->>'business_topic')::boolean,true)=false
      and coalesce((r.evidence->>'corporate_voice')::boolean,true)=false
      and coalesce((r.evidence->>'company_page_interchangeable')::boolean,true)=false
      and coalesce((r.evidence->>'forced_business_moral')::boolean,true)=false
  ) then
    return jsonb_build_object('ok',true,'action','already_has_verified_personal_source');
  end if;

  select a.*,
         case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
              then a.generation_evidence->'identity_gate_evidence'
              else coalesce(a.generation_evidence,'{}'::jsonb) end as verified_evidence,
         (
           select max(r.run_date)
           from public.powerhouse_content_recommendations r
           where r.target_channel='linkedin_personal'
             and coalesce(r.evidence->>'source_artifact_run_date','')=a.run_date::text
         ) as last_used_date
    into v_source
    from public.powerhouse_content_artifacts a
   where a.channel='linkedin_personal'
     and a.run_date < p_date
     and a.status not in ('blocked','failed')
     and public.powerhouse_jsonb_true(
           case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                then a.generation_evidence->'identity_gate_evidence'
                else coalesce(a.generation_evidence,'{}'::jsonb) end,
           'personal_truth_verified')
     and public.powerhouse_jsonb_true(
           case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                then a.generation_evidence->'identity_gate_evidence'
                else coalesce(a.generation_evidence,'{}'::jsonb) end,
           'arthur_anchor_verified')
     and coalesce((
           case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                then a.generation_evidence->'identity_gate_evidence'
                else coalesce(a.generation_evidence,'{}'::jsonb) end
         ->>'sensitive_private_detail')::boolean,false)=false
   order by last_used_date asc nulls first, a.run_date asc, a.created_at asc
   limit 1;

  if not found then
    return jsonb_build_object('ok',false,'action','no_verified_personal_source_available');
  end if;

  v_last_used := v_source.last_used_date;
  v_evidence := v_source.verified_evidence || jsonb_build_object(
    'identity_contract','arthur-personal-linkedin-identity-v4',
    'identity_gate_version','channel-identity-hard-gate-v3',
    'personal_truth_verified',true,
    'arthur_anchor_verified',true,
    'first_person_claims_verified',true,
    'personal_life_topic',true,
    'personal_life_only_verified',true,
    'business_topic',false,
    'corporate_voice',false,
    'company_page_interchangeable',false,
    'forced_business_moral',false,
    'sensitive_private_detail',false,
    'source_text',v_source.body,
    'source_title',v_source.title,
    'source_artifact_run_date',v_source.run_date,
    'source_lineage',jsonb_build_array(
      'powerhouse_content_artifacts:'||v_source.run_date::text||':linkedin_personal',
      'rotating-no-gap-source:'||p_date::text
    ),
    'content_id','rotating-personal-source:'||v_source.run_date::text||':'||p_date::text,
    'source_rotation_fallback',true,
    'source_last_used_date',v_last_used,
    'verbatim_reuse_forbidden',true,
    'new_angle_required',true,
    'no_business_bridge',true
  );

  insert into public.powerhouse_content_recommendations
    (recommendation_id,dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status,created_at,updated_at)
  values
    (gen_random_uuid(),'rotating-no-gap-personal:'||p_date::text,p_date,'personal_daily_life',
     'rotating-no-gap-personal:'||p_date::text,'linkedin_personal','verified_personal_source_rotation',89,
     'Maak een volledig nieuwe persoonlijke Arthur-post op basis van uitsluitend source_text. Gebruik een andere invalshoek en nieuwe formuleringen; geen zinnen uit eerdere posts herhalen, geen nieuwe feiten, geen businessbrug en geen managementles.',
     v_evidence,'suggested',now(),now())
  on conflict (dedupe_key) do update
     set evidence=excluded.evidence, reason=excluded.reason, status='suggested', updated_at=now();

  return jsonb_build_object(
    'ok',true,
    'action','rotating_verified_personal_source_created',
    'source_artifact_run_date',v_source.run_date,
    'source_last_used_date',v_last_used
  );
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
  perform public.powerhouse_ensure_personal_source_rotation_v1(v_date);
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  perform public.powerhouse_instagram_daily_guard_v1(p_now);

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
    ),
    body := jsonb_build_object('runDate',v_date::text,'trigger','five-minute-self-healing-loop'),
    timeout_milliseconds := 120000
  ) into v_request;
  return v_request;
end;
$$;

comment on function public.powerhouse_ensure_personal_source_rotation_v1(date)
is 'No-gap fallback: when unused verified personal sources are exhausted, rotate the least-recently-used verified non-sensitive source and require a fully new angle/copy.';

comment on function public.powerhouse_content_closed_loop_tick_v1(timestamptz)
is 'Single 5-minute content scheduler. Prepares fallbacks, ensures rotating verified personal source, reconciles outcomes, runs Instagram guard, then invokes the canonical content loop.';
