do $$
begin
  if exists(select 1 from pg_extension where extname='pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname='powerhouse-revenue-flywheel-health-v1';
    perform cron.schedule('powerhouse-revenue-flywheel-health-v1','17 * * * *','select public.powerhouse_record_flywheel_health_v1();');
  end if;
end $$;
