do $$ declare v_jobid bigint; begin select jobid into v_jobid from cron.job where jobname='powerhouse-daily-revenue-growth'; if v_jobid is not null then perform cron.unschedule(v_jobid); end if; end $$;

select cron.schedule(
  'powerhouse-daily-revenue-growth',
  '5 6 * * *',
  $cron$
    select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/powerhouse-runtime/daily',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(select decrypted_secret from vault.decrypted_secrets where name='powerhouse_daily_scheduler_token' order by created_at desc limit 1)
      ),
      body := jsonb_build_object('runDate', current_date::text)
    );
  $cron$
);
