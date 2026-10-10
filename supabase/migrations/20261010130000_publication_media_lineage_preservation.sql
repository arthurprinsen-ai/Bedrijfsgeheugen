-- Publication resilience: never replace an already claimed or frame-verifying OpenArt
-- asset with a newly generated placeholder during the hourly content-loop.
-- Preserve the exact asset manifest/proof until validated or explicitly failed.
-- Canonical visible-Mira/scene/digest/temporal verification remains mandatory.
CREATE OR REPLACE FUNCTION public.powerhouse_ensure_instagram_media_job_v1(p_date date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_catalog'
AS $function$
declare
  v_ob public.content_publication_obligations%rowtype;
  v_rec public.powerhouse_content_recommendations%rowtype;
  v_winner public.powerhouse_instagram_daily_winners_v1%rowtype;
  v_selection jsonb;
  v_raw_type text;
  v_post_type text;
  v_route text;
  v_policy jsonb;
  v_selected text;
  v_connection text;
  v_id uuid;
begin
  select * into v_ob from public.content_publication_obligations
   where tenant_id='canonical' and publication_date=p_date and channel='instagram';
  if not found then return jsonb_build_object('ok',false,'state','NO_OBLIGATION','publication_date',p_date); end if;

  v_selection:=public.powerhouse_select_instagram_daily_winner_v1(p_date);
  if coalesce((v_selection->>'selected')::boolean,false) is not true then
    return jsonb_build_object('ok',false,'state','NO_DAILY_WINNER','publication_date',p_date,'selection',v_selection);
  end if;

  select * into v_winner from public.powerhouse_instagram_daily_winners_v1 where run_date=p_date;
  select * into v_rec from public.powerhouse_content_recommendations where recommendation_id=v_winner.recommendation_id;
  if not found then raise exception 'DAILY_WINNER_RECOMMENDATION_MISSING'; end if;

  v_raw_type:=lower(coalesce(
    v_winner.selected_format,
    v_ob.evidence->>'post_type',v_ob.evidence->>'format',
    v_rec.evidence->>'post_type',v_rec.evidence->>'format','image'
  ));
  v_post_type:=case when v_raw_type in ('reel','video') then 'reel' else 'image' end;
  v_policy:=public.powerhouse_instagram_provider_policy_v1(v_post_type);
  v_route:=lower(coalesce(v_ob.evidence->>'production_route',v_rec.evidence->>'production_route',''));
  v_selected:=nullif(v_policy->>'required_provider','');
  if v_selected is null then
    v_selected:=case when v_route like '%placid%' and v_post_type='image' then 'placid' else 'openart' end;
  end if;

  if v_selected='openart' then
    v_connection:=case when exists(
      select 1 from vault.decrypted_secrets where name='OPENART_API_KEY' and nullif(decrypted_secret,'') is not null
    ) then 'NATIVE_RUNTIME_AVAILABLE' else 'AGENT_CONNECTOR_REQUIRED' end;
  else v_connection:='NATIVE_RUNTIME_AVAILABLE'; end if;

  insert into public.powerhouse_instagram_media_jobs_v1(
    tenant_id,publication_date,channel,post_type,status,required_provider,allowed_providers,selected_provider,
    asset_manifest,proof_manifest,replacement_of_external_id,republish_forbidden,provider_connection_state,
    attempts,last_error,next_action,created_at,updated_at
  ) values (
    'canonical',p_date,'instagram',v_post_type,'QUEUED',nullif(v_policy->>'required_provider',''),
    array(select jsonb_array_elements_text(v_policy->'allowed_providers')),v_selected,
    jsonb_strip_nulls(jsonb_build_object(
      'contract','instagram-media-job-v1',
      'winner_contract','instagram-mira-winner-selection-v1',
      'daily_winner_recommendation_id',v_winner.recommendation_id,
      'daily_winner_score_version',v_winner.score_version,
      'policy',v_policy,'content_id',v_rec.content_key,
      'recommendation_id',v_rec.recommendation_id,'recommendation_reason',v_rec.reason,
      'content_brief',coalesce(v_ob.evidence->>'content_brief',v_rec.reason),
      'openart_project_id','rUF5anXD47gVokckYjf9','openart_project_name','Bedrijfsgeheugen Powerhouse Media',
      'exact_asset_required',true,'visible_mira_required',true
    )),
    '{}'::jsonb,v_ob.external_id,v_ob.external_id is not null,v_connection,0,null,
    case when v_ob.external_id is not null then 'HISTORICAL_SENT_REPUBLISH_FORBIDDEN'
      when v_selected='openart' and v_connection='AGENT_CONNECTOR_REQUIRED' then 'CLAIM_BY_OPENART_AGENT_CONNECTOR'
      when v_selected='openart' then 'GENERATE_WITH_OPENART_RUNTIME'
      else 'GENERATE_WITH_PLACID_THEN_VISION_VERIFY' end,
    now(),now()
  )
  on conflict (tenant_id,publication_date,channel) do update set
    post_type=excluded.post_type,
    required_provider=excluded.required_provider,
    allowed_providers=excluded.allowed_providers,
    selected_provider=case when (public.powerhouse_instagram_media_jobs_v1.status in ('CLAIMED','GENERATING','VERIFYING','WAITING_PROOF','PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN')
        or nullif(public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'asset_url','') is not null
        or nullif(public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'openart_resource_id','') is not null)
      then public.powerhouse_instagram_media_jobs_v1.selected_provider else excluded.selected_provider end,
    provider_connection_state=case
      when nullif(public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'asset_url','') is not null
        then public.powerhouse_instagram_media_jobs_v1.provider_connection_state
      else excluded.provider_connection_state end,
    asset_manifest=case
      when (public.powerhouse_instagram_media_jobs_v1.status in ('CLAIMED','GENERATING','VERIFYING','WAITING_PROOF','PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN')
        or nullif(public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'asset_url','') is not null
        or nullif(public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'openart_resource_id','') is not null)
        then public.powerhouse_instagram_media_jobs_v1.asset_manifest
      else excluded.asset_manifest
    end,
    replacement_of_external_id=coalesce(public.powerhouse_instagram_media_jobs_v1.replacement_of_external_id,excluded.replacement_of_external_id),
    republish_forbidden=public.powerhouse_instagram_media_jobs_v1.republish_forbidden or excluded.republish_forbidden,
    next_action=case when (public.powerhouse_instagram_media_jobs_v1.status in ('CLAIMED','GENERATING','VERIFYING','WAITING_PROOF','PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN')
        or nullif(public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'asset_url','') is not null
        or nullif(public.powerhouse_instagram_media_jobs_v1.asset_manifest->>'openart_resource_id','') is not null)
      then public.powerhouse_instagram_media_jobs_v1.next_action else excluded.next_action end,
    updated_at=now()
  returning id into v_id;

  update public.content_publication_obligations
     set evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
       'daily_winner_recommendation_id',v_winner.recommendation_id,
       'daily_winner_score_version',v_winner.score_version,
       'daily_winner_format',v_post_type
     ), updated_at=now()
   where tenant_id='canonical' and publication_date=p_date and channel='instagram';

  return jsonb_build_object('ok',true,'job_id',v_id,'publication_date',p_date,'post_type',v_post_type,
    'selected_provider',v_selected,'provider_connection_state',v_connection,
    'daily_winner_recommendation_id',v_winner.recommendation_id,'daily_winner_score_version',v_winner.score_version,
    'republish_forbidden',v_ob.external_id is not null);
end
$function$

-- Reaffirm existing service-only executor privileges after CREATE OR REPLACE.
-- No browser/anonymous role may invoke this SECURITY DEFINER operation.
REVOKE ALL ON FUNCTION public.powerhouse_ensure_instagram_media_job_v1(date) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.powerhouse_ensure_instagram_media_job_v1(date) TO service_role;
