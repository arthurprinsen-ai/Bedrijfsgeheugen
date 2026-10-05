-- Mira continuous human video hard gate v1
-- Effective 2026-09-23. Future Instagram publication capabilities fail closed
-- unless the canonical Reel carries temporal continuity proof.

create or replace function public.enforce_mira_continuous_video_capability_v1()
returns trigger
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_proof jsonb;
  v_temporal jsonb;
  v_refs jsonb;
  v_ok boolean;
begin
  if new.channel <> 'instagram_company' then
    return new;
  end if;

  select coalesce(generation_evidence->'instagram_media_proof','{}'::jsonb)
    into v_proof
  from public.powerhouse_content_artifacts
  where run_date=new.run_date and channel='instagram_company'
  limit 1;

  if lower(coalesce(v_proof->>'media_type','')) <> 'reel' then
    raise exception 'MIRA_REEL_REQUIRED';
  end if;

  v_temporal := coalesce(v_proof->'temporal_proof', v_proof->'instagram_visual'->'temporal_proof', '{}'::jsonb);
  v_refs := coalesce(v_temporal->'evidence_refs','[]'::jsonb);

  v_ok :=
    coalesce((v_temporal->>'verified')::boolean,false)
    and coalesce((v_temporal->>'single_continuous_take')::boolean,false)
    and coalesce((v_temporal->>'continuous_motion_verified')::boolean,false)
    and coalesce((v_temporal->>'scene_continuity_verified')::boolean,false)
    and coalesce((v_temporal->>'identity_continuity_verified')::boolean,false)
    and coalesce((v_temporal->>'human_motion_verified')::boolean,false)
    and coalesce((v_temporal->>'realistic_camera_motion')::boolean,false)
    and not coalesce((v_temporal->>'slideshow_detected')::boolean,true)
    and not coalesce((v_temporal->>'still_image_animation_detected')::boolean,true)
    and lower(coalesce(v_temporal->>'evidence_method','')) in ('vision','manual_vision')
    and exists (
      select 1
      from jsonb_array_elements_text(v_refs) r(value)
      where r.value ~* '^temporal:'
    );

  if not v_ok then
    raise exception 'MIRA_CONTINUOUS_HUMAN_VIDEO_REQUIRED';
  end if;

  return new;
end
$$;

revoke execute on function public.enforce_mira_continuous_video_capability_v1() from public, anon, authenticated;

drop trigger if exists enforce_mira_continuous_video_capability_v1
  on public.powerhouse_social_publish_capabilities_v1;

create trigger enforce_mira_continuous_video_capability_v1
before insert on public.powerhouse_social_publish_capabilities_v1
for each row execute function public.enforce_mira_continuous_video_capability_v1();

insert into public.brain_records(
  tenant_id,record_id,record_type,record_kind,subject_id,correlation_id,predecessor_ids,owner_id,status,observed_at,
  executed,verified,result,evidence_ids,provenance,payload,idempotency_key,source_revision,stored_at,updated_at
) values (
  'canonical','mira-continuous-human-video-v1','Governance','governance','instagram:mira','instagram-mira-quality',
  array[]::text[],'powerhouse','VERIFIED',now(),true,true,
  jsonb_build_object(
    'enforcement','FAIL_CLOSED',
    'requirements',jsonb_build_array(
      'single_continuous_take','continuous_motion_verified','scene_continuity_verified',
      'identity_continuity_verified','human_motion_verified','realistic_camera_motion',
      'slideshow_detected=false','still_image_animation_detected=false'
    ),
    'blocked_patterns',jsonb_build_array(
      'slideshow','photo-to-video feel','still-image animation','stitched image sequence',
      'montage that reads as separate generated images','identity or scene jump between frames',
      'frozen face/body with only camera zoom or pan'
    )
  ),
  array['supabase:powerhouse-instagram-media-router:v12','supabase:bg-pre-publish-review:v18','db:enforce_mira_continuous_video_capability_v1']::text[],
  jsonb_build_object('source','user_quality_rule','recorded_by','powerhouse','date','2026-09-23'),
  jsonb_build_object(
    'policy','Mira must feel like one real human filmed in one continuous video.',
    'generation_guidance','Single continuous shot; natural face/body/hand motion; subtle handheld camera motion; consistent lighting/background/wardrobe; no cuts or slideshow transitions.',
    'verification','Temporal proof is mandatory before an Instagram publication capability can be issued.'
  ),
  'mira-continuous-human-video-v1','v1',now(),now()
)
on conflict (tenant_id,record_id) do update set
  record_type='Governance',record_kind='governance',status='VERIFIED',executed=true,verified=true,
  result=excluded.result,evidence_ids=excluded.evidence_ids,provenance=excluded.provenance,payload=excluded.payload,
  source_revision='v1',updated_at=now();
