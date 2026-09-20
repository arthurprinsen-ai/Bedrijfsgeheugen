-- instagram-daily-winner-lineage-v1
-- One immutable ex-ante Instagram winner per day. The winner must remain attached
-- through media generation, artifact generation, publication authority, provider
-- readback and outcome learning.

create table if not exists public.powerhouse_instagram_daily_winners_v1 (
  run_date date primary key,
  recommendation_id uuid not null references public.powerhouse_content_recommendations(recommendation_id),
  score_version text not null,
  selected_priority numeric not null,
  selected_format text not null,
  selected_at timestamptz not null default now(),
  selector_evidence jsonb not null default '{}'::jsonb,
  outcome_evidence jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.powerhouse_instagram_daily_winners_v1 enable row level security;
revoke all on public.powerhouse_instagram_daily_winners_v1 from public, anon, authenticated;
grant select,insert,update on public.powerhouse_instagram_daily_winners_v1 to service_role;

create or replace function public.powerhouse_select_instagram_daily_winner_v1(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_existing public.powerhouse_instagram_daily_winners_v1%rowtype;
  v_rec public.powerhouse_content_recommendations%rowtype;
  v_format text;
  v_score_version text := 'instagram-mira-daily-winner-score-v1';
begin
  if p_date is null then raise exception 'PUBLICATION_DATE_REQUIRED'; end if;

  select * into v_existing
  from public.powerhouse_instagram_daily_winners_v1
  where run_date=p_date
  for update;
  if found then
    return jsonb_build_object(
      'selected',true,'immutable_reuse',true,'run_date',v_existing.run_date,
      'recommendation_id',v_existing.recommendation_id,'score_version',v_existing.score_version,
      'format',v_existing.selected_format,'selected_priority',v_existing.selected_priority
    );
  end if;

  select * into v_rec
  from public.powerhouse_content_recommendations r
  where r.run_date=p_date
    and r.target_channel in ('instagram','instagram_company')
    and r.status in ('suggested','accepted')
    and lower(coalesce(r.evidence->>'character',''))='mira'
    and lower(coalesce(r.evidence->>'character_mode','daily_life'))='daily_life'
    and coalesce((r.evidence->>'forced_business_bridge_forbidden')::boolean,true)=true
    and lower(coalesce(r.evidence->>'format','')) in ('reel','image','visual')
    and (
      lower(coalesce(r.evidence->>'format','')) not in ('reel','video')
      or (
        lower(coalesce(r.evidence->>'reel_generator',''))='openart'
        and lower(coalesce(r.evidence->>'production_route','')) like '%openart%'
      )
    )
  order by
    r.priority desc,
    r.updated_at desc,
    r.recommendation_id
  limit 1
  for update;

  if not found then
    return jsonb_build_object('selected',false,'reason','NO_ELIGIBLE_MIRA_DAILY_WINNER','run_date',p_date);
  end if;

  v_format:=case lower(coalesce(v_rec.evidence->>'format',''))
    when 'reel' then 'reel'
    else 'image'
  end;

  insert into public.powerhouse_instagram_daily_winners_v1(
    run_date,recommendation_id,score_version,selected_priority,selected_format,selector_evidence
  ) values (
    p_date,v_rec.recommendation_id,v_score_version,v_rec.priority,v_format,
    jsonb_build_object(
      'contract','instagram-mira-winner-selection-v1',
      'selection_phase','EX_ANTE_BEFORE_MEDIA_AND_PUBLICATION',
      'topic_key',v_rec.topic_key,
      'content_key',v_rec.content_key,
      'recommendation_type',v_rec.recommendation_type,
      'reason',v_rec.reason,
      'ranking','priority_desc_then_updated_at_then_id',
      'mira_persona',true,
      'daily_life',true,
      'selected_evidence',v_rec.evidence
    )
  );

  update public.powerhouse_content_recommendations
     set status='accepted',
         evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
           'daily_winner',true,
           'daily_winner_selected_at',now(),
           'daily_winner_score_version',v_score_version
         ),
         updated_at=now()
   where recommendation_id=v_rec.recommendation_id;

  update public.powerhouse_channel_decisions
     set delivery_evidence=coalesce(delivery_evidence,'{}'::jsonb) || jsonb_build_object(
           'daily_winner_recommendation_id',v_rec.recommendation_id,
           'daily_winner_score_version',v_score_version,
           'daily_winner_format',v_format,
           'daily_winner_selected_at',now()
         ),
         updated_at=now()
   where run_date=p_date and channel='instagram_company';

  return jsonb_build_object(
    'selected',true,'immutable_reuse',false,'run_date',p_date,
    'recommendation_id',v_rec.recommendation_id,'score_version',v_score_version,
    'format',v_format,'selected_priority',v_rec.priority
  );
end
$function$;
revoke execute on function public.powerhouse_select_instagram_daily_winner_v1(date) from public, anon, authenticated;
grant execute on function public.powerhouse_select_instagram_daily_winner_v1(date) to service_role;

-- Existing media-job materialization now consumes only the persisted winner.
create or replace function public.powerhouse_ensure_instagram_media_job_v1(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
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
    selected_provider=case when public.powerhouse_instagram_media_jobs_v1.status in ('PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN')
      then public.powerhouse_instagram_media_jobs_v1.selected_provider else excluded.selected_provider end,
    provider_connection_state=excluded.provider_connection_state,
    asset_manifest=case
      when public.powerhouse_instagram_media_jobs_v1.status in ('PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN')
        then public.powerhouse_instagram_media_jobs_v1.asset_manifest
      else excluded.asset_manifest
    end,
    replacement_of_external_id=coalesce(public.powerhouse_instagram_media_jobs_v1.replacement_of_external_id,excluded.replacement_of_external_id),
    republish_forbidden=public.powerhouse_instagram_media_jobs_v1.republish_forbidden or excluded.republish_forbidden,
    next_action=case when public.powerhouse_instagram_media_jobs_v1.status in ('PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN')
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
$function$;
revoke execute on function public.powerhouse_ensure_instagram_media_job_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_ensure_instagram_media_job_v1(date) to service_role;

-- Publication authority must prove artifact/media lineage to the ex-ante winner.
create or replace function public.powerhouse_issue_social_publish_capability_v1(
  p_run_date date,p_channel text,p_channel_id text,p_final_text_hash text,p_final_media_sha256 text,p_policy_version text
) returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $function$
declare
  v_decision record; v_artifact record; v_proof jsonb; v_visual jsonb;
  v_token text; v_token_hash text; v_id uuid; v_content_id text; v_obligation_id text;
  v_expected_channel_id text; v_media_type text; v_winner public.powerhouse_instagram_daily_winners_v1%rowtype;
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
    select * into v_winner from public.powerhouse_instagram_daily_winners_v1 where run_date=p_run_date;
    if not found then return jsonb_build_object('authorized',false,'reason','INSTAGRAM_DAILY_WINNER_REQUIRED'); end if;
    if coalesce(v_artifact.generation_evidence->>'daily_winner_recommendation_id','')<>v_winner.recommendation_id::text
       or coalesce(v_artifact.generation_evidence->>'daily_winner_score_version','')<>v_winner.score_version then
      return jsonb_build_object('authorized',false,'reason','INSTAGRAM_DAILY_WINNER_LINEAGE_MISMATCH');
    end if;
    if coalesce(v_decision.delivery_evidence->>'daily_winner_recommendation_id','')<>v_winner.recommendation_id::text then
      return jsonb_build_object('authorized',false,'reason','INSTAGRAM_DECISION_WINNER_LINEAGE_MISMATCH');
    end if;
    if p_policy_version not like '%instagram-mira-visual-reel-only-v2%' then
      return jsonb_build_object('authorized',false,'reason','INSTAGRAM_POLICY_VERSION_REQUIRED');
    end if;
    v_proof:=coalesce(v_artifact.generation_evidence->'instagram_media_proof','{}'::jsonb);
    v_visual:=coalesce(v_proof->'instagram_visual','{}'::jsonb);
    v_media_type:=lower(coalesce(v_proof->>'media_type',''));
    if v_media_type not in ('image','reel')
      or v_media_type<>v_winner.selected_format
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
      or (v_media_type='image' and (coalesce((v_visual->>'width')::int,0)<>1080 or coalesce((v_visual->>'height')::int,0)<>1350))
      or (v_media_type='reel' and (coalesce((v_visual->>'width')::int,0)<>1080 or coalesce((v_visual->>'height')::int,0)<>1920))
    then return jsonb_build_object('authorized',false,'reason','EXACT_FINAL_MIRA_MEDIA_PROOF_REQUIRED'); end if;
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
    jsonb_build_object(
      'pre_publish_gate','passed','decision_state','dispatching','authority','social-publication-authority-v1',
      'daily_winner_recommendation_id',case when p_channel='instagram_company' then v_winner.recommendation_id else null end,
      'daily_winner_score_version',case when p_channel='instagram_company' then v_winner.score_version else null end
    )
  ) returning capability_id into v_id;
  return jsonb_build_object('authorized',true,'token',v_token,'capability_id',v_id,'expires_in_seconds',300,'policy_version',p_policy_version,
    'daily_winner_recommendation_id',case when p_channel='instagram_company' then v_winner.recommendation_id else null end);
end
$function$;
revoke execute on function public.powerhouse_issue_social_publish_capability_v1(date,text,text,text,text,text) from public,anon,authenticated;
grant execute on function public.powerhouse_issue_social_publish_capability_v1(date,text,text,text,text,text) to service_role;

alter table public.social_posts add column if not exists winner_recommendation_id uuid;
alter table public.social_posts add column if not exists winner_score_version text;

create or replace function public.powerhouse_normalize_instagram_winner_lineage_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
declare
  v_date date;
  v_winner public.powerhouse_instagram_daily_winners_v1%rowtype;
  v_media_type text;
begin
  if lower(coalesce(new.platform,''))<>'instagram' then return new; end if;
  if new.published_at is null then return new; end if;
  v_date:=(new.published_at at time zone 'Europe/Amsterdam')::date;
  select * into v_winner from public.powerhouse_instagram_daily_winners_v1 where run_date=v_date;
  if found then
    new.winner_recommendation_id:=v_winner.recommendation_id;
    new.winner_score_version:=v_winner.score_version;
    v_media_type:=v_winner.selected_format;
    if v_media_type='reel' then new.format:='reel';
    elsif v_media_type='image' then new.format:='image';
    end if;
  end if;
  return new;
end
$function$;
revoke execute on function public.powerhouse_normalize_instagram_winner_lineage_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_normalize_instagram_winner_lineage_v1() to service_role;
drop trigger if exists a_powerhouse_normalize_instagram_winner_lineage_v1 on public.social_posts;
create trigger a_powerhouse_normalize_instagram_winner_lineage_v1
before insert or update on public.social_posts
for each row execute function public.powerhouse_normalize_instagram_winner_lineage_v1();

create or replace function public.powerhouse_capture_instagram_winner_outcome_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $function$
begin
  if new.winner_recommendation_id is null then return new; end if;
  update public.powerhouse_instagram_daily_winners_v1
     set outcome_evidence=coalesce(outcome_evidence,'{}'::jsonb) || jsonb_build_object(
       'post_id',new.post_id,'external_post_id',new.external_post_id,'published_at',new.published_at,
       'format',new.format,'learning_status',new.learning_status,'learning_id',new.learning_id,
       'captured_at',now()
     ), updated_at=now()
   where recommendation_id=new.winner_recommendation_id;
  return new;
end
$function$;
revoke execute on function public.powerhouse_capture_instagram_winner_outcome_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_capture_instagram_winner_outcome_v1() to service_role;
drop trigger if exists z_powerhouse_capture_instagram_winner_outcome_v1 on public.social_posts;
create trigger z_powerhouse_capture_instagram_winner_outcome_v1
after insert or update on public.social_posts
for each row execute function public.powerhouse_capture_instagram_winner_outcome_v1();

comment on table public.powerhouse_instagram_daily_winners_v1 is
'Immutable ex-ante Instagram Mira winner lineage from recommendation through publication and learning.';
