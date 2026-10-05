create or replace function public.powerhouse_linkedin_company_daily_guard_v1(
  p_now timestamptz default now()
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_time time := (p_now at time zone 'Europe/Amsterdam')::time;
  v_status text;
  v_external_id text;
  v_recovery integer := 0;
  v_action text := 'none';
begin
  perform public.sync_content_publication_obligations(v_date, v_date);

  select status, external_id
    into v_status, v_external_id
  from public.content_publication_obligations
  where tenant_id = 'canonical'
    and publication_date = v_date
    and channel = 'linkedin_company';

  if not found then
    return jsonb_build_object('ok',false,'state','NO_OBLIGATION','publication_date',v_date);
  end if;

  -- Before the normal morning production window: observe only.
  if v_time < time '08:20' then
    return jsonb_build_object('ok',true,'state','NOT_DUE','publication_date',v_date,'status',v_status);
  end if;

  -- Missing/blocked pre-dispatch state: reuse canonical orchestrator and publisher.
  if v_status in ('PLANNED','GENERATED','APPROVED','BLOCKED','FAILED') then
    update public.content_publication_obligations
       set recovery_attempts = recovery_attempts + 1,
           next_action = 'Daily company guard: repair via canonical orchestrator → publisher → provider readback.',
           evidence = coalesce(evidence,'{}'::jsonb) || jsonb_build_object(
             'linkedin_company_daily_guard','v1',
             'guard_checked_at',p_now,
             'guard_previous_status',v_status,
             'guard_action','orchestrator_and_publisher_replay'
           ),
           updated_at = now()
     where tenant_id='canonical' and publication_date=v_date and channel='linkedin_company';

    perform net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-orchestrator',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
      ),
      body := jsonb_build_object('runDate',v_date::text),
      timeout_milliseconds := 120000
    );

    perform net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-social-publisher',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
      ),
      body := jsonb_build_object('runDate',v_date::text),
      timeout_milliseconds := 30000
    );
    v_action := 'repair_replay_requested';
  elsif v_status = 'DISPATCHED' then
    -- Provider queue exists: refresh Buffer truth so sent/live state can be reconciled.
    perform public.bg_roep_functie('bg-buffer-sync');
    v_action := 'buffer_readback_requested';
  elsif v_status in ('PUBLISHED','LIVE_PROVEN','MEASURED','LEARNED') then
    v_action := 'already_covered';
  end if;

  select status, external_id, recovery_attempts
    into v_status, v_external_id, v_recovery
  from public.content_publication_obligations
  where tenant_id='canonical' and publication_date=v_date and channel='linkedin_company';

  return jsonb_build_object(
    'ok',true,
    'publication_date',v_date,
    'channel','linkedin_company',
    'status',v_status,
    'external_id',v_external_id,
    'recovery_attempts',v_recovery,
    'action',v_action
  );
end;
$$;

revoke all on function public.powerhouse_linkedin_company_daily_guard_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_linkedin_company_daily_guard_v1(timestamptz) to service_role;

select cron.schedule(
  'powerhouse-linkedin-company-daily-guard-v1',
  '*/15 * * * *',
  $$select public.powerhouse_linkedin_company_daily_guard_v1(now());$$
);
