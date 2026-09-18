-- Instagram media job materializer v1
-- Canonical flow: content obligation/recommendation -> one media job -> provider agent -> proof -> publisher.

create or replace function public.powerhouse_ensure_instagram_media_job_v1(p_date date)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_ob public.content_publication_obligations%rowtype;
  v_rec public.powerhouse_content_recommendations%rowtype;
  v_raw_type text;
  v_post_type text;
  v_route text;
  v_policy jsonb;
  v_selected text;
  v_connection text;
  v_id uuid;
begin
  select * into v_ob
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=p_date and channel='instagram';

  if not found then
    return jsonb_build_object('ok',false,'state','NO_OBLIGATION','publication_date',p_date);
  end if;

  select * into v_rec
  from public.powerhouse_content_recommendations
  where run_date=p_date
    and target_channel in ('instagram','instagram_company')
    and status in ('suggested','accepted')
  order by priority desc,updated_at desc,created_at desc
  limit 1;

  v_raw_type := lower(coalesce(
    v_ob.evidence->>'post_type',
    v_ob.evidence->>'format',
    case when found then v_rec.evidence->>'post_type' end,
    case when found then v_rec.evidence->>'format' end,
    'image'
  ));

  v_post_type := case
    when v_raw_type in ('reel','video','carousel') then v_raw_type
    else 'image'
  end;

  v_policy := public.powerhouse_instagram_provider_policy_v1(v_post_type);
  v_route := lower(coalesce(
    v_ob.evidence->>'production_route',
    case when found then v_rec.evidence->>'production_route' end,
    ''
  ));

  v_selected := nullif(v_policy->>'required_provider','');
  if v_selected is null then
    if v_route like '%placid%' and v_post_type in ('image','carousel') then
      v_selected := 'placid';
    else
      -- Mira visual default: prefer a generative scene, not a metadata/text card.
      v_selected := 'openart';
    end if;
  end if;

  if v_selected='openart' then
    v_connection := case
      when exists(select 1 from vault.decrypted_secrets where name='OPENART_API_KEY' and nullif(decrypted_secret,'') is not null)
        then 'NATIVE_RUNTIME_AVAILABLE'
      else 'AGENT_CONNECTOR_REQUIRED'
    end;
  else
    v_connection := 'NATIVE_RUNTIME_AVAILABLE';
  end if;

  insert into public.powerhouse_instagram_media_jobs_v1(
    tenant_id,publication_date,channel,post_type,status,
    required_provider,allowed_providers,selected_provider,
    asset_manifest,proof_manifest,replacement_of_external_id,republish_forbidden,
    provider_connection_state,attempts,last_error,next_action,created_at,updated_at
  )
  values(
    'canonical',p_date,'instagram',v_post_type,'QUEUED',
    nullif(v_policy->>'required_provider',''),
    array(select jsonb_array_elements_text(v_policy->'allowed_providers')),
    v_selected,
    jsonb_strip_nulls(jsonb_build_object(
      'contract','instagram-media-job-v1',
      'policy',v_policy,
      'content_id',coalesce(v_ob.content_id,case when found then v_rec.content_key else null end),
      'recommendation_id',case when found then v_rec.recommendation_id else null end,
      'recommendation_reason',case when found then v_rec.reason else null end,
      'content_brief',coalesce(v_ob.evidence->>'content_brief',case when found then v_rec.reason else null end),
      'openart_project_id','rUF5anXD47gVokckYjf9',
      'openart_project_name','Bedrijfsgeheugen Powerhouse Media',
      'exact_asset_required',true,
      'visible_mira_required',true
    )),
    '{}'::jsonb,
    v_ob.external_id,
    v_ob.external_id is not null,
    v_connection,
    0,
    null,
    case
      when v_ob.external_id is not null then 'HISTORICAL_SENT_REPUBLISH_FORBIDDEN'
      when v_selected='openart' and v_connection='AGENT_CONNECTOR_REQUIRED' then 'CLAIM_BY_OPENART_AGENT_CONNECTOR'
      when v_selected='openart' then 'GENERATE_WITH_OPENART_RUNTIME'
      else 'GENERATE_WITH_PLACID_THEN_VISION_VERIFY'
    end,
    now(),now()
  )
  on conflict (tenant_id,publication_date,channel) do update set
    post_type=excluded.post_type,
    required_provider=excluded.required_provider,
    allowed_providers=excluded.allowed_providers,
    selected_provider=case
      when public.powerhouse_instagram_media_jobs_v1.status in ('PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN')
        then public.powerhouse_instagram_media_jobs_v1.selected_provider
      else excluded.selected_provider
    end,
    provider_connection_state=excluded.provider_connection_state,
    asset_manifest=public.powerhouse_instagram_media_jobs_v1.asset_manifest || excluded.asset_manifest,
    replacement_of_external_id=coalesce(public.powerhouse_instagram_media_jobs_v1.replacement_of_external_id,excluded.replacement_of_external_id),
    republish_forbidden=public.powerhouse_instagram_media_jobs_v1.republish_forbidden or excluded.republish_forbidden,
    next_action=case
      when public.powerhouse_instagram_media_jobs_v1.status in ('PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN')
        then public.powerhouse_instagram_media_jobs_v1.next_action
      else excluded.next_action
    end,
    updated_at=now()
  returning id into v_id;

  return jsonb_build_object(
    'ok',true,'job_id',v_id,'publication_date',p_date,'post_type',v_post_type,
    'selected_provider',v_selected,'provider_connection_state',v_connection,
    'republish_forbidden',v_ob.external_id is not null
  );
end
$$;

revoke all on function public.powerhouse_ensure_instagram_media_job_v1(date) from public,anon,authenticated;
grant execute on function public.powerhouse_ensure_instagram_media_job_v1(date) to service_role;

create or replace function public.powerhouse_claim_instagram_media_job_v1(
  p_worker text,
  p_now timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_job public.powerhouse_instagram_media_jobs_v1%rowtype;
begin
  if nullif(btrim(p_worker),'') is null then
    raise exception 'WORKER_REQUIRED';
  end if;

  select * into v_job
  from public.powerhouse_instagram_media_jobs_v1
  where tenant_id='canonical'
    and publication_date >= (p_now at time zone 'Europe/Amsterdam')::date
    and status in ('QUEUED','RETRY')
    and republish_forbidden=false
  order by publication_date,created_at,id
  for update skip locked
  limit 1;

  if not found then
    return jsonb_build_object('ok',true,'state','NO_CLAIMABLE_JOB');
  end if;

  update public.powerhouse_instagram_media_jobs_v1
  set status='CLAIMED',
      attempts=attempts+1,
      asset_manifest=coalesce(asset_manifest,'{}'::jsonb) || jsonb_build_object(
        'claimed_by',p_worker,
        'claimed_at',p_now
      ),
      last_error=null,
      next_action='GENERATE_EXACT_ASSET',
      updated_at=p_now
  where id=v_job.id;

  return jsonb_build_object(
    'ok',true,'state','CLAIMED','job_id',v_job.id,'publication_date',v_job.publication_date,
    'post_type',v_job.post_type,'selected_provider',v_job.selected_provider,
    'required_provider',v_job.required_provider,'allowed_providers',to_jsonb(v_job.allowed_providers),
    'asset_manifest',v_job.asset_manifest,'attempt',v_job.attempts+1
  );
end
$$;

revoke all on function public.powerhouse_claim_instagram_media_job_v1(text,timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_claim_instagram_media_job_v1(text,timestamptz) to service_role;

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
  perform public.powerhouse_ensure_instagram_media_job_v1(v_date);
  perform public.powerhouse_instagram_daily_guard_v1(p_now);

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
end
$$;

revoke all on function public.powerhouse_content_closed_loop_tick_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_content_closed_loop_tick_v1(timestamptz) to service_role;

comment on function public.powerhouse_ensure_instagram_media_job_v1(date) is
'Idempotently materializes the one canonical Instagram media execution job from the daily publication obligation and recommendation.';
comment on function public.powerhouse_claim_instagram_media_job_v1(text,timestamptz) is
'Atomically claims the next canonical Instagram media job. SKIP LOCKED prevents duplicate agent execution.';


create or replace function public.powerhouse_complete_instagram_media_job_v1(
  p_job_id uuid,
  p_worker text,
  p_asset_manifest jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_job public.powerhouse_instagram_media_jobs_v1%rowtype;
  v_url text;
  v_provider text;
  v_media_type text;
  v_request bigint;
begin
  if nullif(btrim(p_worker),'') is null then raise exception 'WORKER_REQUIRED'; end if;
  if jsonb_typeof(p_asset_manifest)<>'object' then raise exception 'ASSET_MANIFEST_OBJECT_REQUIRED'; end if;

  select * into v_job
  from public.powerhouse_instagram_media_jobs_v1
  where id=p_job_id
  for update;

  if not found then raise exception 'MEDIA_JOB_NOT_FOUND'; end if;
  if v_job.status<>'CLAIMED' then raise exception 'MEDIA_JOB_NOT_CLAIMED:%',v_job.status; end if;
  if coalesce(v_job.asset_manifest->>'claimed_by','')<>p_worker then raise exception 'MEDIA_JOB_CLAIM_OWNER_MISMATCH'; end if;
  if v_job.republish_forbidden then raise exception 'MEDIA_JOB_REPUBLISH_FORBIDDEN'; end if;

  v_url := nullif(btrim(p_asset_manifest->>'asset_url'),'');
  v_provider := lower(coalesce(nullif(btrim(p_asset_manifest->>'provider'),''),v_job.selected_provider,''));
  v_media_type := lower(coalesce(nullif(btrim(p_asset_manifest->>'media_type'),''),case when v_job.post_type in ('reel','video') then 'video' else 'image' end));

  if v_url is null or v_url !~ '^https://' then raise exception 'EXACT_ASSET_URL_REQUIRED'; end if;
  if v_provider<>coalesce(v_job.selected_provider,'') then raise exception 'MEDIA_PROVIDER_MISMATCH'; end if;
  if not (v_provider=any(v_job.allowed_providers)) then raise exception 'MEDIA_PROVIDER_NOT_ALLOWED'; end if;
  if v_job.required_provider is not null and v_provider<>v_job.required_provider then raise exception 'MEDIA_PROVIDER_REQUIRED:%',v_job.required_provider; end if;

  update public.powerhouse_instagram_media_jobs_v1
  set status='VERIFYING',
      provider_connection_state='CONNECTED',
      asset_manifest=coalesce(asset_manifest,'{}'::jsonb) || p_asset_manifest || jsonb_build_object(
        'completed_by',p_worker,
        'completed_at',now()
      ),
      next_action=case when v_media_type='image' then 'VISION_VERIFY_EXACT_ASSET' else 'VIDEO_FRAME_PROOF_REQUIRED' end,
      last_error=null,
      updated_at=now()
  where id=p_job_id;

  update public.content_publication_obligations
  set evidence=coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
        'media_url',v_url,
        'media_provider',v_provider,
        'media_type',v_media_type,
        'media_job_id',p_job_id,
        'exact_final_media_proven',false,
        'mira_gate_result','UNPROVEN',
        'mira_gate_passed',false
      ),
      next_action=case when v_media_type='image'
        then 'Exact generated asset ready; canonical vision verifier must PASS before dispatch.'
        else 'Exact generated video ready; start/middle/end frame proof must PASS before dispatch.'
      end,
      updated_at=now()
  where tenant_id=v_job.tenant_id and publication_date=v_job.publication_date and channel=v_job.channel
    and external_id is null;

  if v_media_type='image' then
    v_request := public.bg_roep_functie(
      'powerhouse-instagram-media-verifier',
      jsonb_build_object(
        'publicationDate',v_job.publication_date::text,
        'mediaUrl',v_url,
        'mediaType','image',
        'provider',v_provider,
        'providerPostId','preflight:'||p_job_id::text
      )
    );
    update public.powerhouse_instagram_media_jobs_v1
    set asset_manifest=asset_manifest || jsonb_build_object('verification_request_id',v_request)
    where id=p_job_id;
  end if;

  return jsonb_build_object(
    'ok',true,'state','VERIFYING','job_id',p_job_id,'media_url',v_url,
    'provider',v_provider,'media_type',v_media_type,'verification_request_id',v_request
  );
end
$$;

revoke all on function public.powerhouse_complete_instagram_media_job_v1(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.powerhouse_complete_instagram_media_job_v1(uuid,text,jsonb) to service_role;

comment on function public.powerhouse_complete_instagram_media_job_v1(uuid,text,jsonb) is
'Bounded agent writeback for an atomically claimed Instagram media job. It can attach exact generated media and request proof, but cannot publish or mark identity PASS.';
