-- Consolidate the active content-control cron lanes into one canonical supervisor.
-- Source ingestion, analytics, observability and daily invariant assertions remain independent safeguards.

do $cron$
declare
  v_name text;
begin
  foreach v_name in array array[
    'powerhouse-content-orchestrator-daily',
    'powerhouse-social-publisher-daytime',
    'bg-buffer-sync-hourly-daytime',
    'powerhouse-linkedin-company-daily-guard-v1',
    'powerhouse-linkedin-personal-daily-guard-v1',
    'powerhouse-blog-daily-guard-v1',
    'powerhouse-instagram-daily-guard-v1'
  ] loop
    if exists(select 1 from cron.job where jobname=v_name) then
      perform cron.unschedule(v_name);
    end if;
  end loop;

  if exists(select 1 from cron.job where jobname='powerhouse-content-closed-loop-v1') then
    perform cron.unschedule('powerhouse-content-closed-loop-v1');
  end if;

  perform cron.schedule(
    'powerhouse-content-closed-loop-v1',
    '*/5 6-20 * * *',
    'select public.powerhouse_content_closed_loop_tick_v1(now());'
  );
end
$cron$;

-- Regression proof: one active content-control scheduler, no legacy parallel dispatch/guard lanes.
do $verify$
declare
  v_loop integer;
  v_legacy integer;
begin
  select count(*) into v_loop from cron.job where active and jobname='powerhouse-content-closed-loop-v1';
  select count(*) into v_legacy from cron.job
   where active and jobname in (
    'powerhouse-content-orchestrator-daily',
    'powerhouse-social-publisher-daytime',
    'bg-buffer-sync-hourly-daytime',
    'powerhouse-linkedin-company-daily-guard-v1',
    'powerhouse-linkedin-personal-daily-guard-v1',
    'powerhouse-blog-daily-guard-v1',
    'powerhouse-instagram-daily-guard-v1'
   );
  if v_loop <> 1 then raise exception 'CONTENT_CLOSED_LOOP_SCHEDULER_NOT_UNIQUE'; end if;
  if v_legacy <> 0 then raise exception 'LEGACY_CONTENT_CONTROL_SCHEDULER_STILL_ACTIVE'; end if;
end
$verify$;
