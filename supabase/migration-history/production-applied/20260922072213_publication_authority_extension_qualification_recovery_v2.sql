create or replace function public.powerhouse_issue_social_publish_capability_v1(
  p_run_date date,
  p_channel text,
  p_channel_id text,
  p_final_text_hash text,
  p_final_media_sha256 text,
  p_policy_version text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
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
  if v_artifact is null or encode(extensions.digest(trim(coalesce(v_artifact.body,'')),'sha256'),'hex')<>p_final_text_hash then
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
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  v_token_hash:=encode(extensions.digest(v_token,'sha256'),'hex');
  insert into public.powerhouse_social_publish_capabilities_v1(
    token_hash,run_date,channel,channel_id,content_id,obligation_id,final_text_hash,final_media_sha256,policy_version,expires_at,evidence
  ) values (
    v_token_hash,p_run_date,p_channel,p_channel_id,v_content_id,v_obligation_id,p_final_text_hash,coalesce(p_final_media_sha256,''),p_policy_version,
    now()+interval '5 minutes',
    jsonb_build_object('pre_publish_gate','passed','decision_state','dispatching','authority','social-publication-authority-v1')
  ) returning capability_id into v_id;
  return jsonb_build_object('authorized',true,'token',v_token,'capability_id',v_id,'expires_in_seconds',300,'policy_version',p_policy_version);
end
$function$;
