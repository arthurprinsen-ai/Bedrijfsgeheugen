-- P0 #4198 — add read-only SalesRobot provider preflight to EXISTING hourly assurance job.
-- Never create a second scheduler, sender, campaign, provider action or recipient approval.
create or replace function public.powerhouse_salesrobot_provider_preflight_tick_v1()
returns jsonb language plpgsql security invoker
set search_path=pg_catalog,public
as $fn$
declare
  v_token text;
  v_request_id bigint;
begin
  select public.bg_geheim('powerhouse_daily_scheduler_token') into v_token;
  if nullif(v_token,'') is null then
    return jsonb_build_object('ok',false,'reason','CANONICAL_TOKEN_MISSING');
  end if;
  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-linkedin-sales-machine',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := '{"mode":"provider_preflight"}'::jsonb,
    timeout_milliseconds := 30000
  ) into v_request_id;
  insert into public.bg_functie_aanroep(request_id,functie,aangeroepen_op)
  values(v_request_id,'powerhouse-salesrobot-provider-preflight',now())
  on conflict do nothing;
  return jsonb_build_object('ok',true,'dispatched',true,'request_id',v_request_id,
    'provider','salesrobot','mode','provider_preflight',
    'external_send',false,'scheduler_owner','powerhouse-autonomous-outreach-assurance-hourly-v1');
exception when others then
  return jsonb_build_object('ok',false,'reason','PREFLIGHT_DISPATCH_FAILED','sqlstate',sqlstate);
end;
$fn$;
revoke all on function public.powerhouse_salesrobot_provider_preflight_tick_v1() from public,anon,authenticated;

do $attach$
declare
  v_job bigint;
  v_command text;
  v_new_command text;
begin
  select jobid,command into v_job,v_command from cron.job
  where jobname='powerhouse-autonomous-outreach-assurance-hourly-v1' and active=true
  for update;
  if v_job is null then
    raise exception 'CANONICAL_OUTREACH_ASSURANCE_CRON_MISSING';
  end if;
  if strpos(v_command,'powerhouse_salesrobot_provider_preflight_tick_v1')=0 then
    if strpos(v_command,'   if not (coalesce')=0
       or strpos(v_command,'powerhouse_refresh_autonomous_outreach_assurance_v1')=0
       or strpos(v_command,'powerhouse_refresh_loop_assurance_v1')=0
       or strpos(v_command,'powerhouse_daily_omnichannel_assurance_v1')=0 then
      raise exception 'CANONICAL_ASSURANCE_JOB_CHANGED_REVIEW_REQUIRED';
    end if;
    v_new_command := replace(v_command,
      '   if not (coalesce',
      '   perform public.powerhouse_salesrobot_provider_preflight_tick_v1();' || E'\n' ||
      '   if not (coalesce');
    perform cron.alter_job(v_job,command=>v_new_command);
  end if;
end;
$attach$;
