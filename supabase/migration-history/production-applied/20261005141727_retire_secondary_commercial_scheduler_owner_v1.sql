
do $$
begin
  if exists (
    select 1
    from cron.job
    where jobname = 'powerhouse-one-commercial-loop-daily-v1'
      and active
  ) then
    perform cron.unschedule('powerhouse-one-commercial-loop-daily-v1');
  end if;
end
$$;
