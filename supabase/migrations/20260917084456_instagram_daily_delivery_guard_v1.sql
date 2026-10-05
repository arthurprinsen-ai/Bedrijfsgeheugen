create or replace function public.powerhouse_instagram_daily_guard_v1(p_now timestamptz default now())
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
  v_mira text;
  v_provider_status text;
begin
  perform public.sync_content_publication_obligations(v_date,v_date);
  select * into v_ob
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=v_date and channel='instagram';

  if not found then
    return jsonb_build_object('ok',false,'action','NO_OBLIGATION','publication_date',v_date);
  end if;

  if v_local_time < time '08:20' then
    return jsonb_build_object('ok',true,'action','NOT_DUE','status',v_ob.status,'publication_date',v_date);
  end if;

  begin
    v_last_guard := nullif(v_ob.evidence->>'instagram_guard_checked_at','')::timestamptz;
  exception when others then
    v_last_guard := null;
  end;

  if v_last_guard is not null and p_now-v_last_guard < interval '20 minutes' then
    return jsonb_build_object('ok',true,'action','COOLDOWN','status',v_ob.status,'publication_date',v_date);
  end if;

  v_mira := coalesce(v_ob.evidence->>'mira_gate_result','');
  v_provider_status := coalesce(v_ob.evidence->>'provider_status','');

  if v_ob.status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED','SKIPPED') then
    update public.content_publication_obligations
       set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
             'instagram_daily_guard','v1','instagram_guard_checked_at',p_now,'guard_action','already_covered'),
           updated_at=p_now
     where tenant_id='canonical' and publication_date=v_date and channel='instagram';
    v_action := 'already_covered';

  elsif v_ob.status='BLOCKED' and v_provider_status='sent' and v_mira<>'PASS' then
    update public.content_publication_obligations
       set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
             'instagram_daily_guard','v1','instagram_guard_checked_at',p_now,
             'guard_action','exact_final_media_verification_required',
             'republish_forbidden',true),
           next_action='Instagram guard: inspect exact already-sent final media and matching copy; do not republish or substitute until Mira final-media identity gate is proven.',
           updated_at=p_now
     where tenant_id='canonical' and publication_date=v_date and channel='instagram';
    perform public.bg_roep_functie('bg-buffer-sync');
    v_action := 'exact_final_media_verification_required';

  elsif v_ob.status='DISPATCHED' then
    update public.content_publication_obligations
       set evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
             'instagram_daily_guard','v1','instagram_guard_checked_at',p_now,'guard_action','buffer_readback'),
           updated_at=p_now
     where tenant_id='canonical' and publication_date=v_date and channel='instagram';
    perform public.bg_roep_functie('bg-buffer-sync');
    v_action := 'buffer_readback_requested';

  elsif v_ob.status in ('PLANNED','GENERATED','APPROVED','FAILED','BLOCKED') then
    update public.content_publication_obligations
       set recovery_attempts=recovery_attempts+1,
           evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
             'instagram_daily_guard','v1','instagram_guard_checked_at',p_now,
             'guard_previous_status',v_ob.status,'guard_action','orchestrator_and_publisher_replay'),
           next_action='Instagram guard: repair via canonical orchestrator/publisher; Mira identity gate remains fail-closed.',
           updated_at=p_now
     where tenant_id='canonical' and publication_date=v_date and channel='instagram';

    perform net.http_post(
      url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-orchestrator',
      headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
      body:=jsonb_build_object('runDate',v_date::text), timeout_milliseconds:=120000);
    perform net.http_post(
      url:='https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-social-publisher',
      headers:=jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
      body:=jsonb_build_object('runDate',v_date::text), timeout_milliseconds:=30000);
    v_action := 'repair_replay_requested';
  end if;

  select * into v_ob
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=v_date and channel='instagram';

  return jsonb_build_object(
    'ok',true,'action',v_action,'publication_date',v_date,'status',v_ob.status,
    'external_id',v_ob.external_id,'recovery_attempts',v_ob.recovery_attempts,
    'mira_gate_result',coalesce(v_ob.evidence->>'mira_gate_result',''),
    'provider_status',coalesce(v_ob.evidence->>'provider_status',''));
end $$;

revoke all on function public.powerhouse_instagram_daily_guard_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_instagram_daily_guard_v1(timestamptz) to service_role;

do $$
begin
  if exists(select 1 from cron.job where jobname='powerhouse-instagram-daily-guard-v1') then
    perform cron.unschedule((select jobid from cron.job where jobname='powerhouse-instagram-daily-guard-v1' limit 1));
  end if;
  perform cron.schedule('powerhouse-instagram-daily-guard-v1','*/15 * * * *', 'select public.powerhouse_instagram_daily_guard_v1(now());');
end $$;
