select cron.alter_job(job_id := (select jobid from cron.job where jobname='bg-bedrijfsnieuws-werkdagen'),schedule := '31 6 * * *');
