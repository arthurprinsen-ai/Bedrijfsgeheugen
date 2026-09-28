-- Powerhouse relationship public research scheduler v1
-- Reuses the canonical scheduler token and runs before the hourly commercial learning cycle.

do $$
begin
  perform cron.unschedule('powerhouse-relationship-public-research-hourly');
exception when others then null;
end $$;

select cron.schedule(
  'powerhouse-relationship-public-research-hourly',
  '24 * * * *',
  $cron$
    select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-relationship-public-research',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
  $cron$
);
