-- instagram-media-provider-routing-preproof-v1
create table if not exists public.powerhouse_instagram_media_jobs_v1 (
 id uuid primary key default gen_random_uuid(), tenant_id text not null default 'canonical', publication_date date not null,
 channel text not null default 'instagram', post_type text not null, status text not null default 'PLANNED',
 required_provider text, allowed_providers text[] not null default '{}'::text[], selected_provider text,
 asset_manifest jsonb not null default '{}'::jsonb, proof_manifest jsonb not null default '{}'::jsonb,
 replacement_of_external_id text, republish_forbidden boolean not null default false,
 provider_connection_state text not null default 'UNKNOWN', attempts integer not null default 0,
 last_error text, next_action text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(tenant_id,publication_date,channel));
alter table public.powerhouse_instagram_media_jobs_v1 enable row level security;
revoke all on public.powerhouse_instagram_media_jobs_v1 from public,anon,authenticated;
grant select,insert,update on public.powerhouse_instagram_media_jobs_v1 to service_role;
create or replace function public.powerhouse_instagram_provider_policy_v1(p_post_type text) returns jsonb language sql immutable set search_path=public,pg_catalog as $$
select case lower(coalesce(p_post_type,''))
 when 'reel' then jsonb_build_object('post_type','reel','required_provider','openart','allowed_providers',jsonb_build_array('openart'),'media_kind','video','mime','video/mp4','width',1080,'height',1920,'frame_positions',jsonb_build_array('start','middle','end'))
 when 'video' then jsonb_build_object('post_type','video','required_provider','openart','allowed_providers',jsonb_build_array('openart'),'media_kind','video','mime','video/mp4','width',1080,'height',1920,'frame_positions',jsonb_build_array('start','middle','end'))
 when 'carousel' then jsonb_build_object('post_type','carousel','required_provider',null,'allowed_providers',jsonb_build_array('openart','placid'),'image_allowed_providers',jsonb_build_array('openart','placid'),'video_allowed_providers',jsonb_build_array('openart'),'image_width',1080,'image_height',1350,'image_mime','image/jpeg','video_mime','video/mp4')
 else jsonb_build_object('post_type','image','required_provider',null,'allowed_providers',jsonb_build_array('openart','placid'),'media_kind','image','mime','image/jpeg','width',1080,'height',1350) end;$$;
revoke all on function public.powerhouse_instagram_provider_policy_v1(text) from public,anon,authenticated;
grant execute on function public.powerhouse_instagram_provider_policy_v1(text) to service_role;
create or replace function public.powerhouse_validate_instagram_media_job_v1() returns trigger language plpgsql security definer set search_path=public,pg_catalog as $$
declare p jsonb:=public.powerhouse_instagram_provider_policy_v1(new.post_type);s jsonb;sp text;sk text;
begin
 new.allowed_providers:=array(select jsonb_array_elements_text(p->'allowed_providers'));new.required_provider:=nullif(p->>'required_provider','');
 if new.selected_provider is not null and not(new.selected_provider=any(new.allowed_providers)) then raise exception 'INSTAGRAM_PROVIDER_NOT_ALLOWED';end if;
 if new.required_provider is not null and new.selected_provider is not null and new.selected_provider<>new.required_provider then raise exception 'INSTAGRAM_PROVIDER_REQUIRED:%',new.required_provider;end if;
 if lower(new.post_type)='carousel' and jsonb_typeof(new.asset_manifest->'slides')='array' then
  for s in select * from jsonb_array_elements(new.asset_manifest->'slides') loop
   sp:=lower(coalesce(s->>'provider',''));sk:=lower(coalesce(s->>'kind','image'));
   if sk='video' and sp<>'openart' then raise exception 'INSTAGRAM_CAROUSEL_VIDEO_OPENART_REQUIRED';end if;
   if sk='image' and sp not in('openart','placid') then raise exception 'INSTAGRAM_CAROUSEL_IMAGE_PROVIDER_INVALID';end if;
  end loop;
 end if;
 if new.status in('PROOF_VERIFIED','READY_TO_PUBLISH','LIVE_PROVEN') then
  if coalesce((new.proof_manifest->>'exact_final_media_proven')::boolean,false) is not true then raise exception 'INSTAGRAM_EXACT_FINAL_MEDIA_PROOF_REQUIRED';end if;
  if coalesce(new.proof_manifest->>'identity_gate_result','')<>'PASS' then raise exception 'INSTAGRAM_VISIBLE_IDENTITY_PROOF_REQUIRED';end if;
 end if;
 if new.replacement_of_external_id is not null then new.republish_forbidden:=true;end if;
 new.updated_at:=now();return new;end;$;
revoke execute on function public.powerhouse_validate_instagram_media_job_v1() from public,anon,authenticated;
grant execute on function public.powerhouse_validate_instagram_media_job_v1() to service_role;
drop trigger if exists powerhouse_validate_instagram_media_job_v1 on public.powerhouse_instagram_media_jobs_v1;
create trigger powerhouse_validate_instagram_media_job_v1 before insert or update on public.powerhouse_instagram_media_jobs_v1 for each row execute function public.powerhouse_validate_instagram_media_job_v1();