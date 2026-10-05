
create or replace function public.powerhouse_run_linkedin_company_platform_publisher_v1(
  p_run_date date default ((now() at time zone 'Europe/Amsterdam')::date)
) returns bigint
language plpgsql
security definer
set search_path='public','pg_catalog','net'
as $$
declare
  v_request_id bigint;
  v_token text;
begin
  v_token := public.bg_geheim('powerhouse_daily_scheduler_token');
  if coalesce(v_token,'')='' then
    raise exception 'SCHEDULER_TOKEN_MISSING';
  end if;

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-linkedin-company-platform-publisher',
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token', v_token
    ),
    body := jsonb_build_object('runDate',p_run_date::text)
  ) into v_request_id;

  return v_request_id;
end
$$;

revoke all on function public.powerhouse_run_linkedin_company_platform_publisher_v1(date) from public;
grant execute on function public.powerhouse_run_linkedin_company_platform_publisher_v1(date) to service_role;
