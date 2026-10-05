select cron.unschedule(jobid) from cron.job where jobname='powerhouse-execution-guard-hourly';
select cron.schedule('powerhouse-execution-guard-hourly','47 * * * *','select public.powerhouse_daily_execution_guard();');
