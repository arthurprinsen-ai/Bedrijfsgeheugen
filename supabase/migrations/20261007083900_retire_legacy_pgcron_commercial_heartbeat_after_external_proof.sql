do $block$
declare
  v_count integer;
  r record;
begin
  select count(*) into v_count
  from cron.job
  where jobname='powerhouse-one-commercial-heartbeat-v1'
    and active;

  if v_count = 0 then
    return;
  end if;

  if v_count <> 1 then
    raise exception 'LEGACY_COMMERCIAL_HEARTBEAT_OWNER_COUNT_INVALID:%', v_count;
  end if;

  for r in
    select jobid
    from cron.job
    where jobname='powerhouse-one-commercial-heartbeat-v1'
  loop
    perform cron.unschedule(r.jobid);
  end loop;
end
$block$;

comment on function public.powerhouse_commercial_heartbeat_v1(timestamptz) is
  'Canonical commercial heartbeat transaction. Scheduling authority is external Netlify -> Supabase Edge after durable VERIFIED cutover proof on 2026-10-07; legacy pg_cron owner retired.';
