do $attach$
declare v_id bigint; v_command text;
begin
  select jobid, command into v_id,v_command
  from cron.job where jobname='powerhouse-identity-graph-v1' and active=true
  order by jobid limit 1;
  if v_id is null then
    -- The native preview has no production-only identity-graph owner.
    -- Never install or schedule a new executor during historical replay.
    if exists(select 1 from cron.job where jobname like 'powerhouse-identity-graph%') then
      raise exception 'CANONICAL_IDENTITY_EXECUTOR_IDENTITY_MISMATCH';
    end if;
    raise notice 'CANONICAL_IDENTITY_EXECUTOR_ABSENT_IN_PREVIEW_NO_OP';
    return;
  end if;
  if position('powerhouse_contact_authority_review_batch_v1' in v_command)>0 then
    raise notice 'Contact authority already attached to canonical owner';
    return;
  end if;
  perform cron.alter_job(v_id,command=>v_command||$continuation$
do $authority$
begin
  for i in 1..4 loop
    begin
      perform public.powerhouse_contact_authority_review_batch_v1(
        (now() at time zone 'Europe/Amsterdam')::date,500);
    exception when others then
      raise warning 'Contact authority review failed independently: % %',sqlstate,sqlerrm;
      exit;
    end;
  end loop;
end;
$authority$;
$continuation$);
end;
$attach$;
