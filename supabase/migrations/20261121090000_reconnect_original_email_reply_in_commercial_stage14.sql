-- 21 Nov 2026, P0 #6098. The original Gmail reply-loop is deployed and source-
-- verified but not called by any active scheduler since Oct 20. Keep EXACTLY
-- one canonical commercial scheduler (#116) and the existing 14 independent
-- hourly stages; stage 14 already runs at minute 40 UTC.
--
-- NO additional cron.schedule, no second Gmail collector/sender, no consent
-- elevation, no mass email. Reuse the existing service-role-only bg_roep_functie
-- which supplies the existing Vault-backed x-powerhouse-token, tracks the
-- pg_net request_id in bg_functie_aanroep and preserves provider readback.
--
-- A running cron is NOT a verified Gmail reply. The reply Edge function must
-- produce an independent bg_gezondheid receipt before operational closure.

do $reconnect_original_reply$
declare
  v_job record;
  v_old constant text := '  perform public.powerhouse_commercial_hourly_stage_v1(v_stage);';
  v_new text;
  v_extension text := $stage14$
  -- An original, existing commercial scheduler stage; no second cron.
  if v_stage = 14 then
    begin
      if length(coalesce(public.bg_geheim('powerhouse_daily_scheduler_token'),'')) < 16 then
        perform powerhouse_ops.enqueue(
          'commercial_email_reply_dispatch_review',
          'cron116:reply:'||v_slot,
          jsonb_build_object('reason','SCHEDULER_TOKEN_MISSING',
            'original_job_id',116,'external_send_authorized',false)
        );
        raise warning 'ORIGINAL_EMAIL_REPLY_DISPATCH_TOKEN_REQUIRED';
      else
        perform public.bg_roep_functie(
          'powerhouse-email-reply-loop',
          jsonb_build_object(
            'source','original-commercial-learning-cron116-stage14',
            'run_date',(now() at time zone 'Europe/Amsterdam')::date
          )
        );
      end if;
    exception when others then
      -- Only the original recoverable issue queue receives failures.
      -- An unsuccessful Gmail read is NOT an unsubscribe/positive reply.
      perform powerhouse_ops.enqueue(
        'commercial_email_reply_dispatch_review',
        'cron116:reply:'||v_slot,
        jsonb_build_object('reason','CANONICAL_EMAIL_REPLY_DISPATCH_EXCEPTION',
          'original_job_id',116,'sqlstate',sqlstate,
          'error',left(sqlerrm,400),'external_send_authorized',false)
      );
      raise warning 'ORIGINAL_EMAIL_REPLY_DISPATCH_FAILED: %',sqlstate;
    end;
  end if;
$stage14$;
begin
  -- Shared isolated previews often do not have the production cron catalog.
  -- Do not create a duplicate or copy production scheduling into previews.
  if to_regclass('cron.job') is null then
    raise notice 'CANONICAL_EMAIL_REPLY_REWIRE_PREVIEW_NO_CRON_NO_OP';
    return;
  end if;

  select jobid,jobname,schedule,active,command into v_job
  from cron.job where jobid=116 and jobname='powerhouse-commercial-learning-v1'
  limit 1;

  if not found then
    raise notice 'CANONICAL_EMAIL_REPLY_REWIRE_PREVIEW_NO_JOB_NO_OP';
    return;
  end if;

  if not v_job.active
     or v_job.schedule <> '0,5,7,10,12,15,20,22,25,27,30,35,37,40 * * * *' then
    raise exception 'CANONICAL_EMAIL_REPLY_REWIRE_SCHEDULE_DRIFT: job %',v_job.jobid;
  end if;

  -- Historical standalone reply cron was intentionally removed. Never add one
  -- or silently accept a second active actor for the same Gmail reply.
  if exists (
    select 1 from cron.job
    where jobname='powerhouse-email-reply-loop-hourly-v1'
      and active=true
  ) then
    raise exception 'DUPLICATE_EMAIL_REPLY_CRON_FORBIDDEN';
  end if;

  -- Repeat-safe, but only if the same exact original dispatch target exists.
  if position('original-commercial-learning-cron116-stage14' in v_job.command)>0 then
    raise notice 'CANONICAL_EMAIL_REPLY_ALREADY_REWIRED_JOB_116';
    return;
  end if;

  if position(v_old in v_job.command)=0
     or position('powerhouse_ops.enqueue(' in v_job.command)=0
     or position('do $commercial$' in v_job.command)=0 then
    raise exception 'CANONICAL_EMAIL_REPLY_REWIRE_COMMAND_MISMATCH_JOB_116';
  end if;

  v_new:=replace(v_job.command,v_old,v_old||E'\n'||v_extension);
  if v_new=v_job.command
     or position('original-commercial-learning-cron116-stage14' in v_new)=0 then
    raise exception 'CANONICAL_EMAIL_REPLY_REWIRE_NO_SOURCE_CHANGE';
  end if;

  -- Edit ONLY the command on the original job. Preserve job ID, cadence,
  -- existing fourteen stage calls, owner identity, and all existing guards.
  perform cron.alter_job(job_id=>v_job.jobid,command=>v_new);
end
$reconnect_original_reply$;
