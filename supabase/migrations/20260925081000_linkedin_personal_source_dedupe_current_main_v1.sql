-- linkedin-personal-source-dedupe-current-main-v1
-- Canonicalize the full production function that previously existed only as a runtime hotfix.
-- Exact production function definition captured 2026-09-25; privileges remain fail-closed.
CREATE OR REPLACE FUNCTION public.powerhouse_prepare_daily_content_fallbacks_v1(p_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_personal_source record;
  v_personal_evidence jsonb;
  v_media public.powerhouse_instagram_media_reserve_v1%rowtype;
  v_media_count integer;
  v_offset integer;
  v_created text[] := '{}';
begin
  perform public.sync_content_publication_obligations(p_date,p_date);

  if not exists (
    select 1 from public.powerhouse_content_recommendations r
    where r.run_date=p_date and r.target_channel='linkedin_personal'
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
    select a.*,
           case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                then a.generation_evidence->'identity_gate_evidence'
                else coalesce(a.generation_evidence,'{}'::jsonb) end as verified_evidence
      into v_personal_source
      from public.powerhouse_content_artifacts a
     where a.channel='linkedin_personal'
       and a.run_date < p_date
       and a.run_date >= p_date - 90
       and a.status not in ('blocked','failed')
       and public.powerhouse_jsonb_true(
             case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                  then a.generation_evidence->'identity_gate_evidence'
                  else coalesce(a.generation_evidence,'{}'::jsonb) end,
             'personal_truth_verified')
       and coalesce(
             (case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                   then a.generation_evidence->'identity_gate_evidence'
                   else coalesce(a.generation_evidence,'{}'::jsonb) end)->>'identity_gate_result',
             (case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                   then a.generation_evidence->'identity_gate_evidence'
                   else coalesce(a.generation_evidence,'{}'::jsonb) end)->>'identity_gate',
             '') ilike '%PASS%'
       and public.powerhouse_jsonb_true(
             case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                  then a.generation_evidence->'identity_gate_evidence'
                  else coalesce(a.generation_evidence,'{}'::jsonb) end,
             'arthur_anchor_verified')
       and not exists (
         select 1
           from public.powerhouse_content_recommendations prior
          where prior.target_channel='linkedin_personal'
            and prior.run_date < p_date
            and coalesce(prior.evidence->>'content_id','') <> ''
            and prior.evidence->>'content_id' =
                coalesce(
                  (case when jsonb_typeof(a.generation_evidence->'identity_gate_evidence')='object'
                        then a.generation_evidence->'identity_gate_evidence'
                        else coalesce(a.generation_evidence,'{}'::jsonb) end)->>'content_id',
                  'fallback-source:'||a.run_date::text
                )
       )
     order by md5(p_date::text || coalesce(a.title,'') || a.run_date::text)
     limit 1;

    if found then
      v_personal_evidence := v_personal_source.verified_evidence
        || jsonb_build_object(
          'identity_contract','arthur-personal-linkedin-identity-v4',
          'identity_gate_version','channel-identity-hard-gate-v3',
          'personal_truth_verified',true,
          'arthur_anchor_verified',true,
          'first_person_claims_verified',true,
          'personal_life_topic',true,
          'business_topic',false,
          'corporate_voice',false,
          'company_page_interchangeable',false,
          'forced_business_moral',false,
          'sensitive_private_detail',false,
          'content_id',coalesce(v_personal_source.verified_evidence->>'content_id','fallback-source:'||v_personal_source.run_date::text),
          'source_lineage',jsonb_build_array(
             'powerhouse_content_artifacts:'||v_personal_source.run_date::text||':linkedin_personal',
             'no-gap-fallback:'||p_date::text
          ),
          'source_text',v_personal_source.body,
          'source_title',v_personal_source.title,
          'source_artifact_run_date',v_personal_source.run_date,
          'no_gap_fallback',true
        );

      insert into public.powerhouse_content_recommendations
        (recommendation_id,dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status,created_at,updated_at)
      values
        (gen_random_uuid(),'no-gap-personal-source:'||p_date::text,p_date,'personal_daily_life',
         'no-gap-personal:'||p_date::text,'linkedin_personal','verified_personal_source_fallback',90,
         'Maak een nieuwe, niet-identieke Arthur-post uitsluitend uit source_text. Geen nieuwe feiten, geen businessbrug, geen managementles, geen verzonnen ervaring.',
         v_personal_evidence,'suggested',now(),now())
      on conflict (dedupe_key) do nothing;
      v_created := array_append(v_created,'linkedin_personal_source');
    end if;
  end if;

  if not exists (
    select 1 from public.powerhouse_content_recommendations
    where run_date=p_date and target_channel='linkedin_company' and status in ('suggested','accepted')
  ) then
    insert into public.powerhouse_content_recommendations
      (recommendation_id,dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status)
    values
      (gen_random_uuid(),'no-gap-linkedin-company:'||p_date::text,p_date,'kennisoverdracht',
       'no-gap-linkedin-company:'||p_date::text,'linkedin_company','evergreen_no_gap_fallback',60,
       'Evergreen Bedrijfsgeheugen problem-awareness: kennisoverdracht, handovers, losse afspraken of kennis die in hoofden blijft. Schrijf een verse bedrijfspost zonder cijfers, klantclaims of onbewezen resultaten.',
       '{"no_gap_fallback":true,"truth_mode":"evergreen_no_external_claims","brand":"Bedrijfsgeheugen"}'::jsonb,'suggested')
    on conflict (dedupe_key) do nothing;
    v_created := array_append(v_created,'linkedin_company');
  end if;

  if not exists (
    select 1 from public.powerhouse_content_recommendations
    where run_date=p_date and target_channel='blog' and status in ('suggested','accepted')
  ) then
    insert into public.powerhouse_content_recommendations
      (recommendation_id,dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status)
    values
      (gen_random_uuid(),'no-gap-blog:'||p_date::text,p_date,'kennis-borgen-mkb',
       'no-gap-blog:'||p_date::text,'blog','evergreen_no_gap_fallback',60,
       'Evergreen SEO/problem-awareness over kennis borgen, overdracht, proceskennis en bedrijfscontinuïteit in het MKB. Kies een unieke invalshoek; geen onbewezen cijfers of klantclaims en geen bestaand artikel kopiëren.',
       '{"no_gap_fallback":true,"truth_mode":"evergreen_no_external_claims","unique_angle_required":true}'::jsonb,'suggested')
    on conflict (dedupe_key) do nothing;
    v_created := array_append(v_created,'blog');
  end if;

  if not exists (
    select 1 from public.powerhouse_content_recommendations
    where run_date=p_date and target_channel in ('instagram','instagram_company') and status in ('suggested','accepted')
  ) then
    insert into public.powerhouse_content_recommendations
      (recommendation_id,dedupe_key,run_date,topic_key,content_key,target_channel,recommendation_type,priority,reason,evidence,status)
    values
      (gen_random_uuid(),'no-gap-instagram:'||p_date::text,p_date,'mira-daily-life',
       'no-gap-instagram:'||p_date::text,'instagram','mira_no_gap_fallback',60,
       'Mira daily-life fallback: één simpele dagelijkse taak wordt onnodig ingewikkeld. Warm, observerend en grappig; geen kantoorprobleem, geen geforceerde zakelijke moraal, geen onbewezen feiten.',
       '{"no_gap_fallback":true,"character":"Mira","character_mode":"daily_life","forced_business_bridge_forbidden":true,"format":"image","production_route":"placid_reserve"}'::jsonb,'suggested')
    on conflict (dedupe_key) do nothing;
    v_created := array_append(v_created,'instagram_recommendation');
  end if;

  if not exists (
    select 1 from public.powerhouse_media_proof_evidence_v1
    where publication_date=p_date and channel='instagram'
      and exact_media_retrievable=true
      and exact_media_sha256 is not null
      and identity_gate_result='PASS'
  ) then
    select count(*) into v_media_count
      from public.powerhouse_instagram_media_reserve_v1
     where active;
    if v_media_count > 0 then
      v_offset := mod(extract(doy from p_date)::int - 1, v_media_count);
      select * into v_media
        from public.powerhouse_instagram_media_reserve_v1
       where active
       order by reserve_id
       offset v_offset limit 1;

      insert into public.powerhouse_media_proof_evidence_v1
        (fingerprint,publication_date,channel,provider,provider_post_id,provider_external_url,media_url,provider_status,
         canonical_copy,exact_copy_verified,exact_media_retrievable,exact_media_sha256,exact_media_verified_at,
         identity_contract,identity_gate_result,proof_lineage,failure_reason,created_at,updated_at)
      values
        ('instagram-fallback-media:'||p_date::text||':'||v_media.reserve_id,p_date,'instagram','placid_reserve',
         'reserve:'||v_media.reserve_id,null,v_media.media_url,'preverified_asset',
         '',false,true,v_media.exact_media_sha256,now(),v_media.identity_contract,'PASS',
         jsonb_build_object(
           'contract','instagram-preverified-fallback-reserve-v1',
           'reserve_id',v_media.reserve_id,
           'template_uuid',v_media.template_uuid,
           'media_type','image',
           'media_source','placid',
           'phrase',v_media.phrase,
           'identity_class','mira_daily_life',
           'evidence_refs',v_media.evidence_refs,
           'exact_final_media_proven',true,
           'fallback_only',true
         ),null,now(),now())
      on conflict (fingerprint) do nothing;

      update public.content_publication_obligations
         set evidence = coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
           'exact_final_media_proven',true,
           'final_media_sha256',v_media.exact_media_sha256,
           'media_url',v_media.media_url,
           'media_provider','placid',
           'media_type','image',
           'mira_gate_result','PASS',
           'mira_gate_passed',true,
           'fallback_media_reserve_id',v_media.reserve_id,
           'instagram_visual',jsonb_build_object(
             'verified',true,
             'evidence_refs',v_media.evidence_refs,
             'asset_url',v_media.media_url,
             'identity_class','mira_daily_life',
             'placeholder_detected',false,
             'format_verified',true
           )
         ),
         last_error = null,
         next_action = 'Gebruik exact bewezen fallback-asset via canonieke social publisher; vervang alleen door betere verse media als die vóór dispatch volledig bewezen is.',
         updated_at = now()
       where tenant_id='canonical' and publication_date=p_date and channel='instagram';
      v_created := array_append(v_created,'instagram_media_proof');
    end if;
  end if;

  return jsonb_build_object('ok',true,'run_date',p_date,'prepared',to_jsonb(v_created));
end;
$function$
;

revoke execute on function public.powerhouse_prepare_daily_content_fallbacks_v1(date)
from public, anon, authenticated;
grant execute on function public.powerhouse_prepare_daily_content_fallbacks_v1(date)
to service_role;
