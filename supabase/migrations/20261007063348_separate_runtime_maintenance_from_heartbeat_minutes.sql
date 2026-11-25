
do $$
begin
  perform cron.unschedule('powerhouse-runtime-maintenance-v1');
exception when others then
  null;
end
$$;

select cron.schedule(
  'powerhouse-runtime-maintenance-v1',
  '1,3,7,9,11,13,17,19,21,23,27,29,31,33,37,39,41,43,47,49,51,53,57,59 * * * *',
  'select public.powerhouse_runtime_maintenance_tick_v1(now());'
);
