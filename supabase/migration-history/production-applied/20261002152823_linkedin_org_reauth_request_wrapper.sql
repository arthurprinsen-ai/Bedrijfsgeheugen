
create or replace function public.powerhouse_request_linkedin_org_reauth_v1()
returns bigint
language plpgsql
security definer
set search_path to 'public','pg_catalog','net','vault'
as $$
declare
  v_token text;
  v_req bigint;
begin
  select decrypted_secret into v_token
  from vault.decrypted_secrets
  where name='powerhouse_daily_scheduler_token'
  order by created_at desc
  limit 1;

  if v_token is null or v_token='' then
    raise exception 'powerhouse_daily_scheduler_token missing';
  end if;

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-composio-linkedin-repair-link',
    headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',v_token),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  ) into v_req;

  return v_req;
end;
$$;
