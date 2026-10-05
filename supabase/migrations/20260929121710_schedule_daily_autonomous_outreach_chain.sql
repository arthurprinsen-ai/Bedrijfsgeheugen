do $do$
declare r record;
begin
  for r in
    select jobid from cron.job
    where jobname in (
      'powerhouse-autonomous-outreach-prepare-daily',
      'powerhouse-autonomous-outreach-optimize-daily',
      'powerhouse-autonomous-outreach-dispatch-daily'
    )
  loop
    perform cron.unschedule(r.jobid);
  end loop;

  perform cron.schedule(
    'powerhouse-autonomous-outreach-prepare-daily',
    '20 6 * * *',
    $cmd$select public.powerhouse_prepare_autonomous_outreach_v1((now() at time zone 'Europe/Amsterdam')::date);$cmd$
  );

  perform cron.schedule(
    'powerhouse-autonomous-outreach-optimize-daily',
    '25 6 * * *',
    $cmd$select public.powerhouse_optimize_prepared_outreach_v1((now() at time zone 'Europe/Amsterdam')::date);$cmd$
  );

  perform cron.schedule(
    'powerhouse-autonomous-outreach-dispatch-daily',
    '30 6 * * *',
    $cmd$select public.powerhouse_dispatch_autonomous_outreach_v1((now() at time zone 'Europe/Amsterdam')::date);$cmd$
  );
end
$do$;
