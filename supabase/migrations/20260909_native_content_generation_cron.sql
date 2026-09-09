do $$
begin
  if exists (select 1 from cron.job where jobname = 'bg-native-content-generate-daily') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'bg-native-content-generate-daily' limit 1));
  end if;
end $$;

select cron.schedule(
  'bg-native-content-generate-daily',
  '15 2 * * *',
  $$
    select http_post(
      'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-native-content-generate',
      '{}'::jsonb,
      '{"content-type":"application/json"}'::jsonb
    ) as http_result;
  $$
);
