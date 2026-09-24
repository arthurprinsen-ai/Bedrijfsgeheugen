-- Powerhouse SEO opportunity resolver v1
-- Runs after DataForSEO (04:20 UTC) and GSC sync (05:15 UTC), before the canonical daily blog window.
do $$
begin
  if exists(select 1 from cron.job where jobname='powerhouse-seo-opportunity-resolver-daily') then
    perform cron.unschedule('powerhouse-seo-opportunity-resolver-daily');
  end if;
end
$$;

select cron.schedule('powerhouse-seo-opportunity-resolver-daily','25 5 * * *',$cmd$
select net.http_post(
  url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-seo-opportunity-resolver',
  headers := jsonb_build_object(
    'content-type','application/json',
    'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 120000
);
$cmd$);
