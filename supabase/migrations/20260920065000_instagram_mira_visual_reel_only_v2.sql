-- instagram-mira-visual-reel-only-v2
create or replace function public.powerhouse_instagram_provider_policy_v1(p_post_type text)
returns jsonb language sql immutable set search_path = public, pg_catalog as $$
select case lower(coalesce(p_post_type,''))
 when 'reel' then jsonb_build_object('post_type','reel','required_provider','openart','allowed_providers',jsonb_build_array('openart'),'media_kind','video','mime','video/mp4','width',1080,'height',1920,'frame_positions',jsonb_build_array('start','middle','end'))
 when 'image' then jsonb_build_object('post_type','image','required_provider','openart','allowed_providers',jsonb_build_array('openart'),'media_kind','image','mime','image/jpeg','width',1080,'height',1350)
 else jsonb_build_object('post_type',lower(coalesce(p_post_type,'')),'blocked',true,'allowed_providers','[]'::jsonb,'reason','INSTAGRAM_MIRA_VISUAL_OR_REEL_ONLY')
 end;
$$;

create or replace function public.powerhouse_validate_instagram_media_job_v1()
returns trigger language plpgsql security definer set search_path = public, pg_catalog as $$
declare p jsonb:=public.powerhouse_instagram_provider_policy_v1(new.post_type);
begin
 if lower(coalesce(new.post_type,'')) not in ('image','reel') then raise exception 'INSTAGRAM_MIRA_VISUAL_OR_REEL_ONLY'; end if;
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
 new.updated_at:=now();return new;
end;
$$;
revoke execute on function public.powerhouse_validate_instagram_media_job_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_validate_instagram_media_job_v1() to service_role;
