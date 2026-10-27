-- instagram-mira-reel-only-v3
create or replace function public.powerhouse_instagram_provider_policy_v1(p_post_type text)
returns jsonb language sql immutable set search_path = public, pg_catalog as $$
select case lower(coalesce(p_post_type,''))
 when 'reel' then jsonb_build_object(
   'post_type','reel','required_provider','openart','allowed_providers',jsonb_build_array('openart'),
   'media_kind','video','mime','video/mp4','width',1080,'height',1920,
   'frame_positions',jsonb_build_array('start','middle','end'),
   'identity','mira','content_class','mira_daily_life'
 )
 else jsonb_build_object(
   'post_type',lower(coalesce(p_post_type,'')),'blocked',true,'allowed_providers','[]'::jsonb,
   'reason','INSTAGRAM_MIRA_REEL_ONLY_V3'
 )
 end;
$$;

create or replace function public.powerhouse_validate_instagram_media_job_v1()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
declare p jsonb:=public.powerhouse_instagram_provider_policy_v1(new.post_type);
begin
 if lower(coalesce(new.post_type,'')) <> 'reel' then raise exception 'INSTAGRAM_MIRA_REEL_ONLY_V3'; end if;
 new.allowed_providers:=array(select jsonb_array_elements_text(p->'allowed_providers'));
 new.required_provider:=nullif(p->>'required_provider','');
 if new.selected_provider is not null and not(new.selected_provider=any(new.allowed_providers)) then raise exception 'INSTAGRAM_PROVIDER_NOT_ALLOWED';end if;
 if new.required_provider is not null and new.selected_provider is not null and new.selected_provider<>new.required_provider then raise exception 'INSTAGRAM_PROVIDER_REQUIRED:%',new.required_provider;end if;
 if new.status in('PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN') then
  if coalesce((new.proof_manifest->>'exact_final_media_proven')::boolean,false) is not true then raise exception 'INSTAGRAM_EXACT_FINAL_MEDIA_PROOF_REQUIRED';end if;
  if coalesce(new.proof_manifest->>'identity_gate_result','')<>'PASS' then raise exception 'INSTAGRAM_VISIBLE_IDENTITY_PROOF_REQUIRED';end if;
  if coalesce(new.proof_manifest#>>'{instagram_visual,identity_class}','')<>'mira_daily_life' then raise exception 'INSTAGRAM_MIRA_VISUAL_REQUIRED';end if;
  if coalesce((new.proof_manifest#>>'{instagram_visual,mira_present}')::boolean,false) is not true then raise exception 'INSTAGRAM_VISIBLE_MIRA_REQUIRED';end if;
  if coalesce((new.proof_manifest#>>'{instagram_visual,mira_central_subject}')::boolean,false) is not true then raise exception 'INSTAGRAM_MIRA_CENTRAL_SUBJECT_REQUIRED';end if;
  if coalesce((new.proof_manifest#>>'{instagram_visual,daily_life_scene}')::boolean,false) is not true then raise exception 'INSTAGRAM_DAILY_LIFE_SCENE_REQUIRED';end if;
  if coalesce((new.proof_manifest#>>'{instagram_visual,text_dominant}')::boolean,true) is not false then raise exception 'INSTAGRAM_TEXT_DOMINANT_CREATIVE_BLOCKED';end if;
  if coalesce((new.proof_manifest#>>'{instagram_visual,brand_template_dominant}')::boolean,true) is not false then raise exception 'INSTAGRAM_BRAND_TEMPLATE_DOMINANT_BLOCKED';end if;
 end if;
 if new.replacement_of_external_id is not null then new.republish_forbidden:=true;end if;
 if new.status in('PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN') then
  if lower(coalesce(new.proof_manifest->>'media_type','')) <> 'reel' then raise exception 'INSTAGRAM_MIRA_REEL_ONLY_V3'; end if;
  if coalesce(nullif(new.proof_manifest#>>'{instagram_visual,width}',''),'0')::int <> 1080
     or coalesce(nullif(new.proof_manifest#>>'{instagram_visual,height}',''),'0')::int <> 1920 then
    raise exception 'INSTAGRAM_REEL_DIMENSIONS_REQUIRED';
  end if;
 end if;
 new.updated_at:=now();return new;
end;
$$;

create or replace function public.powerhouse_issue_social_publish_capability_v1(
  p_run_date date,p_channel text,p_channel_id text,p_final_text_hash text,p_final_media_sha256 text,p_policy_version text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_decision record; v_artifact record; v_proof jsonb; v_visual jsonb;
  v_token text; v_token_hash text; v_id uuid; v_content_id text; v_obligation_id text;
  v_expected_channel_id text; v_media_type text;
begin
  v_expected_channel_id:=case p_channel
    when 'linkedin_personal' then '6a70381699afb44349f0fb35'
    when 'linkedin_company' then '6a70381699afb44349f0fb36'
    when 'instagram_company' then '6a70384d99afb44349f0fba9'
    else null end;
  if v_expected_channel_id is null or p_channel_id<>v_expected_channel_id then
    return jsonb_build_object('authorized',false,'reason','CHANNEL_IDENTITY_MISMATCH');
  end if;
  select state,decision,delivery_evidence into v_decision
  from public.powerhouse_channel_decisions where run_date=p_run_date and channel=p_channel limit 1;
  if v_decision is null or v_decision.decision<>'publish' or v_decision.state<>'dispatching' then
    return jsonb_build_object('authorized',false,'reason','CANONICAL_DISPATCHING_STATE_REQUIRED');
  end if;
  if coalesce(v_decision.delivery_evidence->>'pre_publish_gate','')<>'passed'
     or coalesce(v_decision.delivery_evidence->>'final_text_hash','')<>p_final_text_hash then
    return jsonb_build_object('authorized',false,'reason','PRE_PUBLISH_GATE_PROOF_REQUIRED');
  end if;
  select body,generation_evidence into v_artifact
  from public.powerhouse_content_artifacts where run_date=p_run_date and channel=p_channel limit 1;
  if v_artifact is null or encode(digest(trim(coalesce(v_artifact.body,'')),'sha256'),'hex')<>p_final_text_hash then
    return jsonb_build_object('authorized',false,'reason','FINAL_TEXT_HASH_MISMATCH');
  end if;
  v_content_id:=coalesce(nullif(v_artifact.generation_evidence->>'content_id',''),p_run_date::text||'|'||p_channel);
  v_obligation_id:=p_run_date::text||'|'||p_channel||'|publish';
  if p_channel='instagram_company' then
    if p_policy_version not like '%instagram-mira-reel-only-v3%' then
      return jsonb_build_object('authorized',false,'reason','INSTAGRAM_POLICY_VERSION_REQUIRED');
    end if;
    v_proof:=coalesce(v_artifact.generation_evidence->'instagram_media_proof','{}'::jsonb);
    v_visual:=coalesce(v_proof->'instagram_visual','{}'::jsonb);
    v_media_type:=lower(coalesce(v_proof->>'media_type',''));
    if v_media_type <> 'reel'
      or coalesce((v_proof->>'exact_final_media_proven')::boolean,false) is not true
      or coalesce(v_proof->>'final_media_sha256','')='' or v_proof->>'final_media_sha256'<>p_final_media_sha256
      or coalesce(v_proof->>'mira_gate_result','')<>'PASS'
      or lower(coalesce(v_proof->>'media_provider',v_proof->>'media_source',''))<>'openart'
      or coalesce((v_visual->>'verified')::boolean,false) is not true
      or coalesce((v_visual->>'semantic_verified')::boolean,false) is not true
      or lower(coalesce(v_visual->>'evidence_method',''))<>'vision'
      or coalesce((v_visual->>'mira_present')::boolean,false) is not true
      or coalesce((v_visual->>'mira_central_subject')::boolean,false) is not true
      or coalesce((v_visual->>'daily_life_scene')::boolean,false) is not true
      or coalesce((v_visual->>'text_dominant')::boolean,true) is not false
      or coalesce((v_visual->>'brand_template_dominant')::boolean,true) is not false
      or coalesce(v_visual->>'identity_class','')<>'mira_daily_life'
      or (v_media_type='reel' and (coalesce((v_visual->>'width')::int,0)<>1080 or coalesce((v_visual->>'height')::int,0)<>1920))
    then
      return jsonb_build_object('authorized',false,'reason','EXACT_FINAL_MIRA_REEL_PROOF_REQUIRED');
    end if;
  elsif coalesce(p_final_media_sha256,'')<>'' then
    return jsonb_build_object('authorized',false,'reason','UNEXPECTED_MEDIA_HASH');
  end if;
  v_token:=encode(gen_random_bytes(32),'hex');
  v_token_hash:=encode(digest(v_token,'sha256'),'hex');
  insert into public.powerhouse_social_publish_capabilities_v1(
    token_hash,run_date,channel,channel_id,content_id,obligation_id,final_text_hash,final_media_sha256,policy_version,expires_at,evidence
  ) values (
    v_token_hash,p_run_date,p_channel,p_channel_id,v_content_id,v_obligation_id,p_final_text_hash,coalesce(p_final_media_sha256,''),p_policy_version,
    now()+interval '5 minutes',
    jsonb_build_object('pre_publish_gate','passed','decision_state','dispatching','authority','social-publication-authority-v1')
  ) returning capability_id into v_id;
  return jsonb_build_object('authorized',true,'token',v_token,'capability_id',v_id,'expires_in_seconds',300,'policy_version',p_policy_version);
end $$;

revoke execute on function public.powerhouse_issue_social_publish_capability_v1(date,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.powerhouse_issue_social_publish_capability_v1(date,text,text,text,text,text) to service_role;

comment on function public.powerhouse_instagram_provider_policy_v1(text) is
'Instagram company is fail-closed Mira Reel only: OpenArt MP4 1080x1920; no image/card/carousel fallback.';
