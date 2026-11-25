-- Powerhouse relationship public research single scheduler v1
-- Retires the temporary parallel research cron and proves the existing commercial cycle remains the sole owner.

do $$
begin
  perform cron.unschedule('powerhouse-relationship-public-research-hourly');
exception when others then null;
end $$;

do $$
begin
  if not exists (
    select 1 from cron.job
    where jobname='powerhouse-commercial-learning-v1'
      and active is true
      and command='select public.powerhouse_trigger_based_mkb_acquisition_cycle_v1();'
  ) then
    raise exception 'canonical commercial scheduler missing or changed';
  end if;
end $$;
