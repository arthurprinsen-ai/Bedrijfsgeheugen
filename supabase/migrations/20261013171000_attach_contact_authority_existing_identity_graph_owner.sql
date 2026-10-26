-- Mirror the already-applied production repair in Git. Reuse the sole canonical identity-graph cron.
-- Idempotent: never schedule a second job and never append duplicate calls.
do $attach$
declare v_id bigint; v_command text;
begin
  select jobid,command into v_id,v_command
  from cron.job where jobname='powerhouse-identity-graph-v1' and active=true
  order by jobid limit 1;
  if v_id is null then
    raise notice 'canonical identity graph job is not available in preview; no scheduler created';
    return;
  end if;
  if position('powerhouse_contact_authority_review_batch_v1' in v_command)>0 then return; end if;
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
