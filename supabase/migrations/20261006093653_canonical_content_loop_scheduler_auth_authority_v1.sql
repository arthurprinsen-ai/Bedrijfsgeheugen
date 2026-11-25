
create or replace function public.powerhouse_content_closed_loop_tick_v1(
  p_now timestamptz default now()
) returns bigint
language plpgsql
security definer
set search_path=public,pg_catalog,net,vault
as $$
declare
  v_request bigint;
  v_date date := (p_now at time zone 'Europe/Amsterdam')::date;
  v_token text;
begin
  perform public.powerhouse_reconcile_content_outcomes_v1(v_date);

  v_token := nullif(trim(public.bg_geheim('powerhouse_daily_scheduler_token')), '');
  if v_token is null then
    raise exception 'CONTENT_LOOP_SCHEDULER_TOKEN_UNAVAILABLE';
  end if;

  select net.http_post(
    url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-content-loop',
    headers := jsonb_build_object(
      'content-type','application/json',
      'x-powerhouse-token', v_token
    ),
    body := jsonb_build_object('runDate',v_date::text),
    timeout_milliseconds := 120000
  )
  into v_request;

  return v_request;
end
$$;

revoke execute on function public.powerhouse_content_closed_loop_tick_v1(timestamptz) from public, anon, authenticated;
grant execute on function public.powerhouse_content_closed_loop_tick_v1(timestamptz) to service_role;
