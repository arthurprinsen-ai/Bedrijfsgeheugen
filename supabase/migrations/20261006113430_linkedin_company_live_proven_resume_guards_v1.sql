-- Production-proven forward reconciliation for same-claim publication recovery.
-- 1) Same reservation key + same normalized hash is idempotent even when provider-safe typography/raw text differs.
-- 2) Expired, unconsumed publication capabilities are leases and are auto-revoked before reissue.
-- Consumed capabilities remain the permanent same-day provider-side-effect fence.

CREATE OR REPLACE FUNCTION public.powerhouse_reserve_unique_publication_v1(p_publication_date date, p_channel text, p_body text, p_similarity_threshold numeric DEFAULT 0.62, p_story_fingerprint text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
declare
  v_norm text;
  v_raw_hash text;
  v_norm_hash text;
  v_key text;
  v_existing public.powerhouse_publication_uniqueness_v1%rowtype;
  v_row public.powerhouse_publication_uniqueness_v1%rowtype;
  v_candidate text[];
  v_other text[];
  v_keywords text[];
  v_other_keywords text[];
  v_intersection integer;
  v_union integer;
  v_similarity numeric;
  v_keyword_intersection integer;
  v_keyword_union integer;
  v_keyword_similarity numeric;
  v_keyword_overlap numeric;
  v_keyword_count integer;
  v_other_keyword_count integer;
  v_best_similarity numeric := 0;
  v_best_keyword_similarity numeric := 0;
  v_best_key text := null;
begin
  perform pg_advisory_xact_lock(hashtext('powerhouse-global-post-uniqueness-v1'));

  v_norm := public.powerhouse_normalize_publication_text_v1(p_body);
  if length(v_norm) < 12 then
    return jsonb_build_object('allowed',false,'reason','CONTENT_TOO_SHORT_FOR_UNIQUENESS');
  end if;

  v_raw_hash := encode(extensions.digest(trim(coalesce(p_body,'')),'sha256'),'hex');
  v_norm_hash := encode(extensions.digest(v_norm,'sha256'),'hex');
  v_key := 'claim:' || p_publication_date::text || ':' || p_channel;

  select * into v_existing
  from public.powerhouse_publication_uniqueness_v1
  where tenant_id='canonical' and reservation_key=v_key;

  if found then
    if v_existing.normalized_hash=v_norm_hash then
      return jsonb_build_object(
        'allowed',true,'reason','CLAIM_ALREADY_RESERVED_SAME_CONTENT',
        'reservation_key',v_key,'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash,
        'story_fingerprint',p_story_fingerprint
      );
    end if;
    return jsonb_build_object(
      'allowed',false,'reason','CLAIM_ALREADY_RESERVED_DIFFERENT_CONTENT',
      'reservation_key',v_key,'matched_reservation_key',v_existing.reservation_key
    );
  end if;

  if nullif(trim(coalesce(p_story_fingerprint,'')),'') is not null then
    select * into v_row
    from public.powerhouse_publication_uniqueness_v1
    where tenant_id='canonical'
      and story_fingerprint=p_story_fingerprint
    order by created_at asc
    limit 1;

    if found then
      return jsonb_build_object(
        'allowed',false,'reason','STORY_FINGERPRINT_DUPLICATE',
        'matched_reservation_key',v_row.reservation_key,
        'matched_channel',v_row.channel,
        'matched_publication_date',v_row.publication_date,
        'story_fingerprint',p_story_fingerprint
      );
    end if;
  end if;

  select * into v_row
  from public.powerhouse_publication_uniqueness_v1
  where tenant_id='canonical'
    and (raw_hash=v_raw_hash or normalized_hash=v_norm_hash)
  order by created_at asc
  limit 1;

  if found then
    return jsonb_build_object(
      'allowed',false,'reason','EXACT_DUPLICATE',
      'matched_reservation_key',v_row.reservation_key,
      'matched_channel',v_row.channel,
      'matched_publication_date',v_row.publication_date,
      'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash
    );
  end if;

  v_candidate := public.powerhouse_publication_shingles_v1(v_norm);
  v_keywords := public.powerhouse_publication_keywords_v1(v_norm);
  v_keyword_count := coalesce(array_length(v_keywords,1),0);

  for v_row in
    select *
    from public.powerhouse_publication_uniqueness_v1
    where tenant_id='canonical'
      and normalized_text is not null
      and length(normalized_text) >= 12
    order by publication_date desc nulls last, created_at desc
    limit 2000
  loop
    v_other := public.powerhouse_publication_shingles_v1(v_row.normalized_text);
    v_other_keywords := public.powerhouse_publication_keywords_v1(v_row.normalized_text);
    v_other_keyword_count := coalesce(array_length(v_other_keywords,1),0);

    if coalesce(array_length(v_candidate,1),0) > 0 and coalesce(array_length(v_other,1),0) > 0 then
      select count(*) into v_intersection
      from (
        select distinct unnest(v_candidate) as x
        intersect
        select distinct unnest(v_other) as x
      ) s;

      select count(*) into v_union
      from (
        select distinct unnest(v_candidate) as x
        union
        select distinct unnest(v_other) as x
      ) s;

      v_similarity := case when v_union=0 then 0 else v_intersection::numeric/v_union::numeric end;

      if v_similarity > v_best_similarity then
        v_best_similarity := v_similarity;
        v_best_key := v_row.reservation_key;
      end if;

      if v_similarity >= p_similarity_threshold then
        return jsonb_build_object(
          'allowed',false,'reason','NEAR_DUPLICATE',
          'similarity',round(v_similarity,4),
          'threshold',p_similarity_threshold,
          'matched_reservation_key',v_row.reservation_key,
          'matched_channel',v_row.channel,
          'matched_publication_date',v_row.publication_date
        );
      end if;
    end if;

    if v_keyword_count > 0 and v_other_keyword_count > 0 then
      select count(*) into v_keyword_intersection
      from (
        select distinct unnest(v_keywords) as x
        intersect
        select distinct unnest(v_other_keywords) as x
      ) s;

      select count(*) into v_keyword_union
      from (
        select distinct unnest(v_keywords) as x
        union
        select distinct unnest(v_other_keywords) as x
      ) s;

      v_keyword_similarity := case when v_keyword_union=0 then 0 else v_keyword_intersection::numeric/v_keyword_union::numeric end;
      v_keyword_overlap := case
        when least(v_keyword_count,v_other_keyword_count)=0 then 0
        else v_keyword_intersection::numeric/least(v_keyword_count,v_other_keyword_count)::numeric
      end;

      if v_keyword_similarity > v_best_keyword_similarity then
        v_best_keyword_similarity := v_keyword_similarity;
        v_best_key := v_row.reservation_key;
      end if;

      if (v_keyword_intersection >= 8 and v_keyword_similarity >= 0.30)
         or (v_keyword_intersection >= 10 and v_keyword_overlap >= 0.30) then
        return jsonb_build_object(
          'allowed',false,'reason','STORY_FAMILY_DUPLICATE',
          'keyword_similarity',round(v_keyword_similarity,4),
          'keyword_overlap',round(v_keyword_overlap,4),
          'shared_keywords',v_keyword_intersection,
          'jaccard_threshold',0.30,
          'overlap_threshold',0.30,
          'matched_reservation_key',v_row.reservation_key,
          'matched_channel',v_row.channel,
          'matched_publication_date',v_row.publication_date
        );
      end if;
    end if;
  end loop;

  insert into public.powerhouse_publication_uniqueness_v1(
    tenant_id,reservation_key,publication_date,channel,raw_hash,normalized_hash,
    normalized_text,story_fingerprint,source_kind,source_ref,state
  ) values (
    'canonical',v_key,p_publication_date,p_channel,v_raw_hash,v_norm_hash,
    v_norm,nullif(trim(coalesce(p_story_fingerprint,'')),''),
    'publication_claim',v_key,'reserved'
  );

  return jsonb_build_object(
    'allowed',true,'reason','UNIQUE_RESERVED',
    'reservation_key',v_key,'raw_hash',v_raw_hash,'normalized_hash',v_norm_hash,
    'story_fingerprint',p_story_fingerprint,
    'best_historical_similarity',round(v_best_similarity,4),
    'best_keyword_similarity',round(v_best_keyword_similarity,4),
    'best_historical_match',v_best_key
  );
end;
$function$


CREATE OR REPLACE FUNCTION public.powerhouse_issue_social_publish_capability_v1(p_run_date date, p_channel text, p_channel_id text, p_final_text_hash text, p_final_media_sha256 text, p_policy_version text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
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

  update public.powerhouse_social_publish_capabilities_v1
  set revoked_at=now(),
      evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
        'revocation_reason','EXPIRED_UNCONSUMED_LEASE_AUTO_REVOKED',
        'revoked_at',now()
      )
  where run_date=p_run_date
    and channel=p_channel
    and revoked_at is null
    and consumed_at is null
    and expires_at<=now();

  if exists(
    select 1 from public.powerhouse_social_publish_capabilities_v1
    where run_date=p_run_date and channel=p_channel and revoked_at is null
  ) then
    if exists(
      select 1 from public.powerhouse_social_publish_capabilities_v1
      where run_date=p_run_date and channel=p_channel
        and revoked_at is null and consumed_at is not null
    ) then
      return jsonb_build_object('authorized',false,'reason','DAILY_CHANNEL_PUBLICATION_ALREADY_CONSUMED');
    end if;
    return jsonb_build_object('authorized',false,'reason','DAILY_CHANNEL_PUBLICATION_ALREADY_CLAIMED');
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
$function$

