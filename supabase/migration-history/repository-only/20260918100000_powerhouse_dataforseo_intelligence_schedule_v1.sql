-- Native DataForSEO producer for the unified Powerhouse data spine.
do $$
begin
  if exists(select 1 from cron.job where jobname='powerhouse-dataforseo-intelligence-daily') then
    perform cron.unschedule('powerhouse-dataforseo-intelligence-daily');
  end if;
end
$$;

select cron.schedule('powerhouse-dataforseo-intelligence-daily','20 4 * * *',$cmd$
select net.http_post(
  url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-dataforseo-intelligence',
  headers := jsonb_build_object(
    'content-type','application/json',
    'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 120000
);
$cmd$);
