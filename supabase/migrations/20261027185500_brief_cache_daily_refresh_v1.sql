-- The predictive commercial brief cache (materialized view) had no scheduled refresh and was 22 days
-- stale. Refresh it daily before the 06:21 UTC outreach preparation.
do $$
begin
  if exists (select 1 from cron.job where jobname='powerhouse-brief-cache-refresh-daily-v1') then
    perform cron.unschedule('powerhouse-brief-cache-refresh-daily-v1');
  end if;
  perform cron.schedule('powerhouse-brief-cache-refresh-daily-v1','50 5 * * *',$job$
    do $b$
    begin
      if not pg_try_advisory_xact_lock(hashtextextended('powerhouse-brief-cache-refresh',0)) then return; end if;
      perform set_config('statement_timeout','110000',true);
      perform public.powerhouse_refresh_predictive_commercial_brief_cache_v1();
    end $b$;
  $job$);
end $$;
