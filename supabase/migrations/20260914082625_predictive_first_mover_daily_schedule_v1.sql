do $$ begin
  if exists(select 1 from cron.job where jobname='powerhouse-forecast-calibrator-daily') then perform cron.unschedule('powerhouse-forecast-calibrator-daily'); end if;
  if exists(select 1 from cron.job where jobname='powerhouse-predictive-engine-daily') then perform cron.unschedule('powerhouse-predictive-engine-daily'); end if;
end $$;

select cron.schedule('powerhouse-forecast-calibrator-daily','50 5 * * *',$cmd$
select net.http_post(
  url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-forecast-calibrator',
  headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
  body := '{}'::jsonb,
  timeout_milliseconds := 120000
);
$cmd$);

select cron.schedule('powerhouse-predictive-engine-daily','8 6 * * *',$cmd$
select net.http_post(
  url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-predictive-engine',
  headers := jsonb_build_object('content-type','application/json','x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)),
  body := jsonb_build_object('runDate',(now() at time zone 'Europe/Amsterdam')::date::text),
  timeout_milliseconds := 120000
);
$cmd$);