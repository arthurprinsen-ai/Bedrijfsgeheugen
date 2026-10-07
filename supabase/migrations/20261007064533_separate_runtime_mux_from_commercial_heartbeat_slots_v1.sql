
do $block$
declare
  v_mux_count integer;
  v_heartbeat_count integer;
  r record;
begin
  select count(*) into v_mux_count
  from cron.job
  where jobname='powerhouse-runtime-scheduler-mux-v1'
    and active;

  select count(*) into v_heartbeat_count
  from cron.job
  where jobname='powerhouse-one-commercial-heartbeat-v1'
    and active;

  if v_mux_count <> 1 then
    raise exception 'MUX_OWNER_COUNT_INVALID:%', v_mux_count;
  end if;

  if v_heartbeat_count <> 1 then
    raise exception 'HEARTBEAT_OWNER_COUNT_INVALID:%', v_heartbeat_count;
  end if;

  for r in
    select jobid
    from cron.job
    where jobname='powerhouse-runtime-scheduler-mux-v1'
  loop
    perform cron.alter_job(
      r.jobid,
      schedule := '1-4,6-9,11-14,16-19,21-24,26-29,31-34,36-39,41-44,46-49,51-54,56-59 * * * *'
    );
  end loop;
end
$block$;
