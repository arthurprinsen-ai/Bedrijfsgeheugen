
create or replace function public.powerhouse_email_provider_preflight_dispatch_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_token text;
  v_request_id bigint;
begin
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc
  limit 1;

  if nullif(v_token,'') is null then
    insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
    values (
      p_now,'powerhouse-email-provider-preflight','provider-preflight','fout',
      'Scheduler token missing; provider preflight could not run.',
      jsonb_build_object('contract','powerhouse-email-provider-preflight-v1','reason','scheduler_token_missing')
    );
    return jsonb_build_object('ok',false,'reason','scheduler_token_missing');
  end if;

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-autonomous-outreach',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := jsonb_build_object('dry_run',true,'run_date',(p_now at time zone 'Europe/Amsterdam')::date),
    timeout_milliseconds := 30000
  ) into v_request_id;

  insert into public.bg_functie_aanroep(request_id,functie,aangeroepen_op)
  values (v_request_id,'powerhouse-email-provider-preflight',p_now)
  on conflict do nothing;

  return jsonb_build_object(
    'ok',true,'contract','powerhouse-email-provider-preflight-v1',
    'request_id',v_request_id,'dispatched_at',p_now
  );
end;
$$;

create or replace function public.powerhouse_email_provider_preflight_reconcile_v1(p_now timestamptz default now())
returns jsonb
language plpgsql
security definer
set search_path to 'public','pg_catalog'
as $$
declare
  v_request_id bigint;
  v_called_at timestamptz;
  v_status_code int;
  v_content text;
  v_ok boolean := false;
  v_account_resolved boolean := false;
  v_user_resolved boolean := false;
  v_status text;
  v_detail text;
begin
  select request_id,aangeroepen_op
    into v_request_id,v_called_at
  from public.bg_functie_aanroep
  where functie='powerhouse-email-provider-preflight'
  order by aangeroepen_op desc
  limit 1;

  if v_request_id is null then
    v_status:='fout';
    v_detail:='No provider preflight request has been recorded.';
  else
    select status_code,content
      into v_status_code,v_content
    from net._http_response
    where id=v_request_id;

    if v_status_code=200 then
      begin
        v_ok := coalesce((v_content::jsonb->>'ok')::boolean,false);
        v_account_resolved := coalesce((v_content::jsonb->>'account_resolved')::boolean,false);
        v_user_resolved := coalesce((v_content::jsonb->>'account_user_resolved')::boolean,false);
      exception when others then
        v_ok:=false;
      end;
    end if;

    if v_ok and v_account_resolved and v_user_resolved then
      v_status:='ok';
      v_detail:='Canonical Gmail provider preflight passed.';
    elsif v_status_code is null and v_called_at >= p_now-interval '5 minutes' then
      v_status:='waarschuwing';
      v_detail:='Provider preflight is still awaiting HTTP readback.';
    else
      v_status:='fout';
      v_detail:='Canonical Gmail provider preflight failed; prepared mail remains recoverable and must not be marked sent without provider acknowledgement.';
    end if;
  end if;

  insert into public.bg_gezondheid(gemeten_op,onderdeel,soort,status,detail,gegevens)
  values (
    p_now,'powerhouse-email-provider-preflight','provider-preflight',v_status,v_detail,
    jsonb_build_object(
      'contract','powerhouse-email-provider-preflight-v1',
      'request_id',v_request_id,
      'request_dispatched_at',v_called_at,
      'status_code',v_status_code,
      'provider_ok',v_ok,
      'account_resolved',v_account_resolved,
      'account_user_resolved',v_user_resolved,
      'fail_closed',true,
      'prepared_queue_preserved_on_failure',true
    )
  );

  return jsonb_build_object(
    'ok',v_status='ok',
    'contract','powerhouse-email-provider-preflight-v1',
    'status',v_status,
    'request_id',v_request_id,
    'status_code',v_status_code,
    'account_resolved',v_account_resolved,
    'account_user_resolved',v_user_resolved
  );
end;
$$;

do $$
declare
  vdef text;
begin
  select pg_get_functiondef(p.oid) into vdef
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='powerhouse_refresh_autonomous_outreach_assurance_v1'
  limit 1;

  if vdef is not null
     and position('native_gmail_executor,provider_ack_verified' in vdef)=0 then
    vdef := replace(
      vdef,
      'or coalesce((a.evidence->>''provider_ack_verified'')::boolean,false)=true',
      'or coalesce((a.evidence->>''provider_ack_verified'')::boolean,false)=true
      or coalesce((a.evidence#>>''{native_gmail_executor,provider_ack_verified}'')::boolean,false)=true'
    );
    execute vdef;
  end if;
end $$;

select cron.unschedule(jobid)
from cron.job
where jobname in (
  'powerhouse-email-provider-preflight-hourly-v1',
  'powerhouse-email-provider-preflight-reconcile-hourly-v1'
);

select cron.schedule(
  'powerhouse-email-provider-preflight-hourly-v1',
  '17 * * * *',
  'select public.powerhouse_email_provider_preflight_dispatch_v1(now());'
);

select cron.schedule(
  'powerhouse-email-provider-preflight-reconcile-hourly-v1',
  '19 * * * *',
  'select public.powerhouse_email_provider_preflight_reconcile_v1(now());'
);
