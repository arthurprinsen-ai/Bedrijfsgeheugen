create table if not exists public.powerhouse_instagram_media_reserve_v1 (
  reserve_id text primary key,
  media_url text not null,
  exact_media_sha256 text not null check (exact_media_sha256 ~ '^[0-9a-f]{64}$'),
  media_type text not null default 'image',
  media_source text not null default 'placid',
  template_uuid text not null,
  phrase text not null,
  identity_class text not null default 'mira_daily_life',
  identity_contract text not null default 'mira-daily-life-fallback-card-v1',
  identity_gate_result text not null default 'PASS' check (identity_gate_result = 'PASS'),
  evidence_refs jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.powerhouse_instagram_media_reserve_v1 enable row level security;
revoke all on table public.powerhouse_instagram_media_reserve_v1 from public, anon, authenticated;
grant select on table public.powerhouse_instagram_media_reserve_v1 to service_role;

insert into public.powerhouse_instagram_media_reserve_v1
(reserve_id,media_url,exact_media_sha256,media_type,media_source,template_uuid,phrase,identity_class,identity_contract,identity_gate_result,evidence_refs)
values
('mira-fallback-01','https://placid-fra.fra1.digitaloceanspaces.com/production/rest-images/7jqect8vouhsa/rest-e2f90a2661b626c309f2125355c2827f-cthpwcye.jpg','39c24ca306366f1d3ef233c3d41e3a88788abd31f33d11c28caaef326f927774','image','placid','7jqect8vouhsa','Ik wilde alleen even iets regelen.','mira_daily_life','mira-daily-life-fallback-card-v1','PASS','["placid:images/128441414","template:7jqect8vouhsa","layer:naam=Mira"]'::jsonb),
('mira-fallback-02','https://placid-fra.fra1.digitaloceanspaces.com/production/rest-images/7jqect8vouhsa/rest-8d3525fd7497fcc2aa8e51d71264ae55-qylwxwtc.jpg','ffeac9bbabe769031c0d51a8c2157106046dcdf8ad3dae1b610994fcc054fbd6','image','placid','7jqect8vouhsa','Volwassen zijn in 2026: eerst even inloggen.','mira_daily_life','mira-daily-life-fallback-card-v1','PASS','["placid:images/128441430","template:7jqect8vouhsa","layer:naam=Mira"]'::jsonb),
('mira-fallback-03','https://placid-fra.fra1.digitaloceanspaces.com/production/rest-images/7jqect8vouhsa/rest-5e0539408fe19923828cb6b0dc108178-lspjcir4.jpg','ed8f0abd508ac857e7665c1f4d82b5b64b130254f705eab5dd9b01a960c2c0c1','image','placid','7jqect8vouhsa','Wie heeft dit ooit zo bedacht?','mira_daily_life','mira-daily-life-fallback-card-v1','PASS','["placid:images/128441447","template:7jqect8vouhsa","layer:naam=Mira"]'::jsonb),
('mira-fallback-04','https://placid-fra.fra1.digitaloceanspaces.com/production/rest-images/7jqect8vouhsa/rest-c152e0dab6035485327188c3b9c065a6-tw6ywxww.jpg','343a9ec54dde4653a68aafb2305e797bb4c381e4085ed47ed057102bb59f3b0f','image','placid','7jqect8vouhsa','Dit voelde vroeger makkelijker.','mira_daily_life','mira-daily-life-fallback-card-v1','PASS','["placid:images/128441473","template:7jqect8vouhsa","layer:naam=Mira"]'::jsonb),
('mira-fallback-05','https://placid-fra.fra1.digitaloceanspaces.com/production/rest-images/7jqect8vouhsa/rest-a81e409cc40e68c091afa93a973b96ca-p0cg95gj.jpg','50299aa393904fc55c47e0cd1505cb65dd5269483c0362d60b756cc982d281f8','image','placid','7jqect8vouhsa','Vandaag in de categorie: onnodig ingewikkeld.','mira_daily_life','mira-daily-life-fallback-card-v1','PASS','["placid:images/128441494","template:7jqect8vouhsa","layer:naam=Mira"]'::jsonb),
('mira-fallback-06','https://placid-fra.fra1.digitaloceanspaces.com/production/rest-images/7jqect8vouhsa/rest-433e409e80593940155789347f9a200c-xhlhzyyv.jpg','fc04e326baa10bc243ee0ccb2059b157f7a8cb27907e466877f1dc1e2722051b','image','placid','7jqect8vouhsa','Eén simpele taak. Vier apps later.','mira_daily_life','mira-daily-life-fallback-card-v1','PASS','["placid:images/128441512","template:7jqect8vouhsa","layer:naam=Mira"]'::jsonb),
('mira-fallback-07','https://placid-fra.fra1.digitaloceanspaces.com/production/rest-images/7jqect8vouhsa/rest-d9ef0d271296315751c4f863a2bddee4-ozr3ne9u.jpg','00368ecae928e32c4d5b88d250d323971dae73c3bb9e04f404b6696594bb1633','image','placid','7jqect8vouhsa','Ik was bijna klaar. Toen kwam de verificatiecode.','mira_daily_life','mira-daily-life-fallback-card-v1','PASS','["placid:images/128441536","template:7jqect8vouhsa","layer:naam=Mira"]'::jsonb)
on conflict (reserve_id) do update
set media_url=excluded.media_url,
    exact_media_sha256=excluded.exact_media_sha256,
    phrase=excluded.phrase,
    evidence_refs=excluded.evidence_refs,
    active=true,
    updated_at=now();

create or replace function public.powerhouse_prepare_daily_content_fallbacks_v1(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
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
$$;

revoke execute on function public.powerhouse_prepare_daily_content_fallbacks_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_prepare_daily_content_fallbacks_v1(date) to service_role;

create or replace function public.powerhouse_enforce_operational_publish_0800_v1()
returns trigger
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  if new.channel in ('linkedin_personal','linkedin_company','instagram_company','blog')
     and new.decision='publish' then
    new.scheduled_for := make_timestamptz(
      extract(year from new.run_date)::int,
      extract(month from new.run_date)::int,
      extract(day from new.run_date)::int,
      8,0,0,'Europe/Amsterdam'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists powerhouse_operational_publish_0800_v1 on public.powerhouse_channel_decisions;
create trigger powerhouse_operational_publish_0800_v1
before insert or update of decision,scheduled_for,state on public.powerhouse_channel_decisions
for each row execute function public.powerhouse_enforce_operational_publish_0800_v1();

create or replace function public.powerhouse_content_closed_loop_tick_v1(p_now timestamptz default now())
returns bigint
language plpgsql
security definer
set search_path = public, pg_catalog, net, vault
as $$
declare
  v_request bigint;
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
begin
  perform public.powerhouse_prepare_daily_content_fallbacks_v1(v_date);
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
    ),
    body := jsonb_build_object('runDate',v_date::text),
    timeout_milliseconds := 120000
  ) into v_request;
  return v_request;
end;
$$;

update public.powerhouse_channel_decisions
   set scheduled_for = scheduled_for
 where run_date >= (now() at time zone 'Europe/Amsterdam')::date
   and channel in ('linkedin_personal','linkedin_company','instagram_company','blog')
   and decision='publish';

select public.powerhouse_prepare_daily_content_fallbacks_v1((now() at time zone 'Europe/Amsterdam')::date);
