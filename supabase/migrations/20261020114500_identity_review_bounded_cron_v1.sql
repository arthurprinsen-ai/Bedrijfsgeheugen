-- P0 #4198: bound high-contention canonical identity/contact review cron without disabling its owner.
-- Verified original command: 2x 500 connection pulse + four 500 contact authority batches/quarter hour.
-- This migration supports both the original and the already-live intermediary bounded configuration.
-- The final six slots exclude minute 52, reserved by existing hourly outreach assurance.
do $bounded_contact_review$
declare
  v_id bigint;
  v_schedule text;
  v_old text;
  v_new text;
  v_orig_pulse text := 'perform public.powerhouse_connection_daily_pulse_v1(v_date,500);';
  v_bound_pulse text := 'perform public.powerhouse_connection_daily_pulse_v1(v_date,200);';
  v_target_schedule text := '2,17,32,42,47,57 * * * *';
begin
  select jobid,schedule,command into v_id,v_schedule,v_old
    from cron.job where jobname='powerhouse-identity-graph-v1' and active=true;
  if v_id is null then raise exception 'CANONICAL_IDENTITY_GRAPH_JOB_MISSING'; end if;
  if v_schedule not in (
      '2,17,32,47 * * * *',
      '2,17,32,42,52,57 * * * *',
      v_target_schedule
  ) then raise exception 'CANONICAL_IDENTITY_GRAPH_CRON_SCHEDULE_DRIFT'; end if;
  if strpos(v_old,'if extract(minute from now())::integer=32 then')=0
     or strpos(v_old,'powerhouse_sync_identity_graph_batch_v1(100)')=0
     or strpos(v_old,'powerhouse_contact_authority_review_batch_v1(')=0
     then raise exception 'CANONICAL_IDENTITY_GRAPH_COMMAND_DRIFT'; end if;

  v_new:=v_old;
  if strpos(v_old,v_orig_pulse||E'\n    '||v_orig_pulse)>0
     and strpos(v_old,'for i in 1..4 loop')>0
  then
     v_new:=replace(v_new,v_orig_pulse||E'\n    '||v_orig_pulse,v_bound_pulse);
     v_new:=replace(v_new,'for i in 1..4 loop','for i in 1..1 loop');
     v_new:=replace(v_new,'v_date,500);','v_date,200);');
     v_new:=replace(v_new,'::date,500);','::date,200);');
  elsif strpos(v_old,v_bound_pulse)>0
    and strpos(v_old,'for i in 1..1 loop')>0
    and strpos(v_old,'v_date,200);')>0
  then
    v_new:=replace(v_new,'::date,500);','::date,200);');
  else
    raise exception 'CANONICAL_IDENTITY_GRAPH_BOUNDED_SOURCE_DRIFT';
  end if;

  if strpos(v_new,v_orig_pulse)>0 or strpos(v_new,'for i in 1..4 loop')>0
     or strpos(v_new,'v_date,500);')>0
     or strpos(v_new,'::date,500);')>0
     or strpos(v_new,'::date,200);')=0
     or strpos(v_new,'powerhouse_contact_authority_review_batch_v1(')=0
     or strpos(v_new,v_bound_pulse)=0
     or strpos(v_new,'if extract(minute from now())::integer=32 then')=0
     then raise exception 'CANONICAL_IDENTITY_GRAPH_BOUNDS_FAILED'; end if;
  if v_schedule is distinct from v_target_schedule or v_new is distinct from v_old then
    perform cron.alter_job(v_id,schedule=>v_target_schedule,command=>v_new);
  end if;
end
$bounded_contact_review$;
