create or replace function public.powerhouse_linkedin_personal_daily_guard_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_local_time time := (p_now at time zone 'Europe/Amsterdam')::time;
  v_ob public.content_publication_obligations%rowtype;
  v_last_guard timestamptz;
  v_action text := 'observe';
begin
  perform public.sync_content_publication_obligations(v_date,v_date);
  select * into v_ob from public.content_publication_obligations
   where tenant_id='canonical' and publication_date=v_date and channel='linkedin_personal';
  if not found then
    return jsonb_build_object('ok',false,'action','NO_OBLIGATION','publication_date',v_date);
  end if;
  if v_local_time < time '08:20' then
    return jsonb_build_object('ok',true,'action','NOT_DUE','status',v_ob.status,'publication_date',v_date);
  end if;
  begin
    v_last_guard := nullif(v_ob.evidence->>'personal_guard_checked_at','')::timestamptz;
  exception when others then v_last_guard := null;
  end;
  if v_last_guard is not null and p_now-v_last_guard < interval '20 minutes' then
    return jsonb_build_object('ok',true,'action','COOLDOWN','status',v_ob.status,'publication_date',v_date);
  end if;
  if v_ob.status in ('PLANNED','GENERATED','APPROVED','BLOCKED','FAILED') then
    update public.content_publication_obligations
       set recovery_attempts=recovery_attempts+1,
           evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
             'linkedin_personal_daily_guard','v1','personal_guard_checked_at',p_now,
             'guard_previous_status',v_ob.status,'guard_action','orchestrator_and_publisher_replay'),
           next_action='Personal LinkedIn guard: canonical orchestrator/publisher replay requested; identity/truth gates remain fail-closed.',
           updated_at=p_now
     where tenant_id='canonical' and publication_date=v_date and channel='linkedin_personal';
    perform net.http_post(
      url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-orchestrator',
      headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
      body:=jsonb_build_object('runDate',v_date::text), timeout_milliseconds:=120000);
    perform net.http_post(
      url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-social-publisher',
      headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
      body:=jsonb_build_object('runDate',v_date::text), timeout_milliseconds:=30000);
    v_action := 'repair_replay_requested';
  elsif v_ob.status='DISPATCHED' then
    update public.content_publication_obligations
       set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('linkedin_personal_daily_guard','v1','personal_guard_checked_at',p_now,'guard_action','buffer_readback'),updated_at=p_now
     where tenant_id='canonical' and publication_date=v_date and channel='linkedin_personal';
    perform public.bg_roep_functie('bg-buffer-sync');
    v_action := 'buffer_readback_requested';
  else
    update public.content_publication_obligations
       set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('linkedin_personal_daily_guard','v1','personal_guard_checked_at',p_now,'guard_action','already_covered'),updated_at=p_now
     where tenant_id='canonical' and publication_date=v_date and channel='linkedin_personal';
    v_action := 'already_covered';
  end if;
  select * into v_ob from public.content_publication_obligations where tenant_id='canonical' and publication_date=v_date and channel='linkedin_personal';
  return jsonb_build_object('ok',true,'action',v_action,'publication_date',v_date,'status',v_ob.status,'external_id',v_ob.external_id,'recovery_attempts',v_ob.recovery_attempts);
end $$;

create or replace function public.powerhouse_blog_daily_guard_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_local_time time := (p_now at time zone 'Europe/Amsterdam')::time;
  v_ob public.content_publication_obligations%rowtype;
  v_dec public.powerhouse_channel_decisions%rowtype;
  v_art public.powerhouse_content_artifacts%rowtype;
  v_last_guard timestamptz;
  v_action text := 'observe';
begin
  perform public.sync_content_publication_obligations(v_date,v_date);
  select * into v_ob from public.content_publication_obligations where tenant_id='canonical' and publication_date=v_date and channel='blog';
  if not found then return jsonb_build_object('ok',false,'action','NO_OBLIGATION','publication_date',v_date); end if;
  if v_local_time < time '07:00' then return jsonb_build_object('ok',true,'action','NOT_DUE','status',v_ob.status,'publication_date',v_date); end if;
  begin v_last_guard := nullif(v_ob.evidence->>'blog_guard_checked_at','')::timestamptz; exception when others then v_last_guard:=null; end;
  if v_last_guard is not null and p_now-v_last_guard < interval '20 minutes' then
    return jsonb_build_object('ok',true,'action','COOLDOWN','status',v_ob.status,'publication_date',v_date);
  end if;
  select * into v_dec from public.powerhouse_channel_decisions where run_date=v_date and channel='blog';
  select * into v_art from public.powerhouse_content_artifacts where run_date=v_date and channel='blog';

  if v_ob.status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','SKIPPED') then
    v_action:='already_covered';
  elsif v_art.run_date is null or v_dec.run_date is null or coalesce(v_dec.decision,'hold')<>'publish' or coalesce(v_dec.state,'decided') not in ('content_ready','scheduled','published','measured','learned') then
    update public.content_publication_obligations set recovery_attempts=recovery_attempts+1,evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('blog_daily_guard','v1','blog_guard_checked_at',p_now,'guard_action','orchestrator_replay','guard_previous_status',v_ob.status),next_action='Blog guard: generate/approve canonical blog artifact before central publisher window.',updated_at=p_now where tenant_id='canonical' and publication_date=v_date and channel='blog';
    perform net.http_post(url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-orchestrator',headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),body:=jsonb_build_object('runDate',v_date::text),timeout_milliseconds:=120000);
    v_action:='orchestrator_replay_requested';
  else
    update public.content_publication_obligations set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object('blog_daily_guard','v1','blog_guard_checked_at',p_now,'guard_action','central_queue_reconcile'),next_action='Blog guard: canonical approved-central queue reconcile requested; BG169 remains production authority.',updated_at=p_now where tenant_id='canonical' and publication_date=v_date and channel='blog';
    perform net.http_post(url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-blog-queue',headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),body:=jsonb_build_object('runDate',v_date::text),timeout_milliseconds:=120000);
    v_action:='central_queue_reconcile_requested';
  end if;
  select * into v_ob from public.content_publication_obligations where tenant_id='canonical' and publication_date=v_date and channel='blog';
  return jsonb_build_object('ok',true,'action',v_action,'publication_date',v_date,'status',v_ob.status,'slug',v_ob.slug,'external_id',v_ob.external_id,'recovery_attempts',v_ob.recovery_attempts);
end $$;

revoke all on function public.powerhouse_linkedin_personal_daily_guard_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_linkedin_personal_daily_guard_v1(timestamptz) to service_role;
revoke all on function public.powerhouse_blog_daily_guard_v1(timestamptz) from public,anon,authenticated;
grant execute on function public.powerhouse_blog_daily_guard_v1(timestamptz) to service_role;

do $$ begin
  if not exists(select 1 from cron.job where jobname='powerhouse-linkedin-personal-daily-guard-v1') then
    perform cron.schedule('powerhouse-linkedin-personal-daily-guard-v1','*/15 * * * *','select public.powerhouse_linkedin_personal_daily_guard_v1(now());');
  end if;
  if not exists(select 1 from cron.job where jobname='powerhouse-blog-daily-guard-v1') then
    perform cron.schedule('powerhouse-blog-daily-guard-v1','*/15 * * * *','select public.powerhouse_blog_daily_guard_v1(now());');
  end if;
end $$;
