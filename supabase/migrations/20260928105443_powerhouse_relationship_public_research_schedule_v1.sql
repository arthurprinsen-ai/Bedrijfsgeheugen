-- Historical relationship public research scheduler introduction v1.
-- This migration was superseded in the same lineage by single-scheduler v1 below.
do $$
begin
  if exists(select 1 from cron.job where jobname='powerhouse-relationship-public-research-hourly') then
    perform cron.unschedule('powerhouse-relationship-public-research-hourly');
  end if;
end
$$;

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
