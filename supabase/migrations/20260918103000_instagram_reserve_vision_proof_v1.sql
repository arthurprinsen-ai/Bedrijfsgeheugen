-- Instagram reserve vision proof closure v1
-- A reserve/template label can never prove visible Mira identity.
-- Reuse the existing 5-minute content loop; no parallel scheduler.

create or replace function public.powerhouse_instagram_visual_proof_valid_v1(
  p_visual jsonb,
  p_media_type text default 'image'
)
returns boolean
language sql
immutable
set search_path = public, pg_catalog
as $$
  select
    coalesce((p_visual->>'verified')::boolean,false)
    and coalesce((p_visual->>'semantic_verified')::boolean,false)
    and coalesce((p_visual->>'mira_present')::boolean,false)
    and coalesce(p_visual->>'identity_class','')='mira_daily_life'
    and lower(coalesce(p_visual->>'evidence_method',''))='vision'
    and coalesce((p_visual->>'format_verified')::boolean,false)
    and not coalesce((p_visual->>'placeholder_detected')::boolean,true)
    and coalesce((p_visual->>'visual_complete')::boolean,false)
    and exists (
      select 1
      from jsonb_array_elements_text(coalesce(p_visual->'evidence_refs','[]'::jsonb)) ref(value)
      where value ~* '^vision:'
    )
    and (
      case when lower(coalesce(p_media_type,'image')) in ('video','reel')
        then coalesce((p_visual->>'width')::int,0)=1080 and coalesce((p_visual->>'height')::int,0)=1920
        else coalesce((p_visual->>'width')::int,0)=1080 and coalesce((p_visual->>'height')::int,0)=1350
      end
    );
$$;

revoke all on function public.powerhouse_instagram_visual_proof_valid_v1(jsonb,text) from public,anon,authenticated;
grant execute on function public.powerhouse_instagram_visual_proof_valid_v1(jsonb,text) to service_role;

create or replace function public.enforce_instagram_media_proof_vision_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_visual jsonb := coalesce(new.proof_lineage->'instagram_visual','{}'::jsonb);
  v_media_type text := coalesce(new.proof_lineage->>'media_type','image');
begin
  if new.channel='instagram'
     and new.identity_gate_result='PASS'
     and not public.powerhouse_instagram_visual_proof_valid_v1(v_visual,v_media_type)
  then
    new.identity_gate_result := 'FAIL';
    new.failure_reason := coalesce(new.failure_reason,'MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED');
    new.proof_lineage := coalesce(new.proof_lineage,'{}'::jsonb)
      || jsonb_build_object(
        'semantic_visual_proof_required',true,
        'metadata_only_identity_rejected',true,
        'vision_gate_enforced_at',now()
      );
  end if;
  return new;
end
$$;

revoke execute on function public.enforce_instagram_media_proof_vision_v1() from public,anon,authenticated;
grant execute on function public.enforce_instagram_media_proof_vision_v1() to service_role;

drop trigger if exists enforce_instagram_media_proof_vision_v1 on public.powerhouse_media_proof_evidence_v1;
create trigger enforce_instagram_media_proof_vision_v1
before insert or update on public.powerhouse_media_proof_evidence_v1
for each row execute function public.enforce_instagram_media_proof_vision_v1();

create or replace function public.enforce_instagram_obligation_vision_v1()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_visual jsonb;
  v_media_type text;
  v_claims_pass boolean;
begin
  if new.tenant_id<>'canonical' or new.channel<>'instagram' then
    return new;
  end if;

  v_visual := coalesce(
    new.evidence->'instagram_visual',
    new.evidence->'instagram_media_proof'->'instagram_visual',
    '{}'::jsonb
  );
  v_media_type := coalesce(
    new.evidence->>'media_type',
    new.evidence->'instagram_media_proof'->>'media_type',
    'image'
  );
  v_claims_pass :=
    coalesce(new.evidence->>'mira_gate_result','')='PASS'
    or coalesce((new.evidence->>'mira_gate_passed')::boolean,false)
    or coalesce((new.evidence->>'exact_final_media_proven')::boolean,false);

  if v_claims_pass and not public.powerhouse_instagram_visual_proof_valid_v1(v_visual,v_media_type) then
    new.evidence := coalesce(new.evidence,'{}'::jsonb) || jsonb_build_object(
      'mira_gate_result','FAIL',
      'mira_gate_passed',false,
      'exact_final_media_proven',false,
      'semantic_visual_proof_required',true,
      'metadata_only_identity_rejected',true
    );
    new.last_error := 'MIRA_VISIBLE_IDENTITY_PROOF_REQUIRED';
    new.next_action := 'Laat de exacte finale media vision-verifiëren; metadata/template/layer bewijs is nooit voldoende.';
    if new.status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
      new.status := 'BLOCKED';
    end if;
  end if;
  return new;
end
$$;

revoke execute on function public.enforce_instagram_obligation_vision_v1() from public,anon,authenticated;
grant execute on function public.enforce_instagram_obligation_vision_v1() to service_role;

drop trigger if exists enforce_instagram_obligation_vision_v1 on public.content_publication_obligations;
create trigger enforce_instagram_obligation_vision_v1
before insert or update on public.content_publication_obligations
for each row execute function public.enforce_instagram_obligation_vision_v1();

insert into public.brain_ai_governance_registry(
  tenant_id,use_case_id,name,provider,model_id,purpose,owner_id,lifecycle_status,risk_class,
  human_oversight,data_categories,prohibited_data_categories,retention_policy,
  transparency_required,impact_assessment_required,approved,approval_evidence_ids,evidence_ids,
  last_reviewed_at,next_review_at,inference_platform,training_use,processing_scope,
  cross_border_transfer,subprocessors,transfer_safeguard,provider_evidence_urls,updated_at
)
values(
  'canonical','supabase-powerhouse-instagram-media-verifier-v1',
  'Powerhouse Instagram Final Media Vision Verifier','Anthropic','claude-sonnet-5',
  'Fail-closed visual verification of the exact final Instagram asset before publication.',
  'content-growth','ACTIVE','LIMITED',
  'Verifier may only write proof/block state. It cannot publish. Existing sent posts are never republished or promoted by verification.',
  array['content_context','generated_media'],
  array['secrets','raw_private_payloads','raw_dm_bodies','personal_contact_data'],
  'Store only digest, dimensions, verdict, reason and evidence reference; no raw image bytes or prompt retained.',
  true,true,true,
  array['DECISION-20260910-ARTHUR-GEEN-MAKE-BESLIS-ZELF'],
  array['fingerprint:instagram-visible-mira-source-proof-v1','supabase:function:powerhouse-instagram-media-verifier'],
  now(),now()+interval '30 days','Anthropic API','NO','GLOBAL','POSSIBLE_OUTSIDE_EEA',
  array['Anthropic'],'Anthropic Commercial Terms + DPA met SCCs; geen training op API-invoer',
  '{}'::text[],now()
)
on conflict (tenant_id,use_case_id) do update set
  model_id=excluded.model_id,
  lifecycle_status='ACTIVE',
  approved=true,
  human_oversight=excluded.human_oversight,
  evidence_ids=excluded.evidence_ids,
  last_reviewed_at=excluded.last_reviewed_at,
  next_review_at=excluded.next_review_at,
  updated_at=now();

create or replace function public.powerhouse_instagram_daily_guard_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_ob public.content_publication_obligations%rowtype;
  v_action text;
  v_request bigint;
  v_media_url text;
  v_media_type text;
  v_provider text;
begin
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);
  select * into v_ob
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=v_date and channel='instagram';

  if not found then
    return jsonb_build_object('ok',false,'action','NO_OBLIGATION');
  end if;

  v_media_url := coalesce(v_ob.evidence->>'media_url',v_ob.evidence->'instagram_media_proof'->>'media_url');
  v_media_type := coalesce(v_ob.evidence->>'media_type',v_ob.evidence->'instagram_media_proof'->>'media_type','image');
  v_provider := coalesce(v_ob.evidence->>'media_provider',v_ob.evidence->'instagram_media_proof'->>'media_provider','unknown');

  if v_ob.status='BLOCKED'
     and v_ob.external_id is null
     and nullif(v_media_url,'') is not null
     and not public.powerhouse_instagram_visual_proof_valid_v1(
       coalesce(v_ob.evidence->'instagram_visual',v_ob.evidence->'instagram_media_proof'->'instagram_visual','{}'::jsonb),
       v_media_type
     )
  then
    v_request := public.bg_roep_functie(
      'powerhouse-instagram-media-verifier',
      jsonb_build_object(
        'publicationDate',v_date::text,
        'mediaUrl',v_media_url,
        'mediaType',v_media_type,
        'provider',v_provider,
        'providerPostId','preflight:'||v_date::text
      )
    );
    v_action := 'vision_verification_requested';
  elsif v_ob.status='BLOCKED' then
    v_action := 'exact_final_media_verification_required';
  elsif v_ob.status='DISPATCHED' then
    perform public.bg_roep_functie('bg-buffer-sync');
    v_action := 'provider_reconcile_requested';
  elsif v_ob.status in ('PLANNED','GENERATED','APPROVED','FAILED') then
    v_action := 'canonical_loop_required';
  else
    v_action := 'already_covered';
  end if;

  return jsonb_build_object(
    'ok',v_ob.status not in ('BLOCKED','FAILED'),
    'action',v_action,
    'request_id',v_request,
    'status',v_ob.status,
    'publication_date',v_date,
    'external_id',v_ob.external_id,
    'provider_truth_verified',public.powerhouse_jsonb_true(v_ob.evidence,'provider_truth_verified')
  );
end
$$;

revoke execute on function public.powerhouse_instagram_daily_guard_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_instagram_daily_guard_v1(timestamptz) to service_role;

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

revoke execute on function public.powerhouse_content_closed_loop_tick_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_content_closed_loop_tick_v1(timestamptz) to service_role;

comment on function public.powerhouse_instagram_visual_proof_valid_v1(jsonb,text) is
'Canonical visible-Mira proof predicate. Metadata/template/layer labels are never identity proof; vision evidence and exact publish dimensions are mandatory.';
