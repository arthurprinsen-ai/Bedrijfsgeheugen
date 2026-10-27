select cron.unschedule(jobid) from cron.job where jobname='powerhouse-blog-queue-daytime';
