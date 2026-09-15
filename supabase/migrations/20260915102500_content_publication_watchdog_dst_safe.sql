-- Keep the daily publication watchdog aligned with Europe/Amsterdam across DST changes.
-- Run at both possible UTC equivalents of 20:30/20:35 local; the functions/guard remain idempotent.

do $$
begin
  if exists (select 1 from cron.job where jobname = 'bg-content-publication-daily-watchdog') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'bg-content-publication-daily-watchdog' limit 1));
  end if;
  if exists (select 1 from cron.job where jobname = 'bg-content-publication-daily-assert') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'bg-content-publication-daily-assert' limit 1));
  end if;
end $$;

select cron.schedule(
  'bg-content-publication-daily-watchdog',
  '30 18,19 * * *',
  $$select public.enforce_content_publication_daily_invariant((timezone('Europe/Amsterdam', now()))::date, time '20:30', now());$$
);

select cron.schedule(
  'bg-content-publication-daily-assert',
  '35 18,19 * * *',
  $$do $guard$ begin if (timezone('Europe/Amsterdam', now()))::time >= time '20:35' then perform public.assert_content_publication_daily_invariant((timezone('Europe/Amsterdam', now()))::date); end if; end $guard$;$$
);
