do $$
declare j bigint;
begin
  select jobid into j from cron.job where jobname='powerhouse-email-reply-loop-hourly-v1' limit 1;
  if j is not null then perform cron.unschedule(j); end if;
  perform cron.schedule(
    'powerhouse-email-reply-loop-hourly-v1',
    '12 * * * *',
    $cmd$
    select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-email-reply-loop',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
      ),
      body := '{}'::jsonb,
      timeout_milliseconds := 120000
    );
    $cmd$
  );
end $$;
