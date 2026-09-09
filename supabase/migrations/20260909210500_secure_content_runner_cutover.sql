do $$
begin
  if exists (select 1 from cron.job where jobname = 'bg-native-content-generate-daily') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'bg-native-content-generate-daily' limit 1));
  end if;
end $$;

-- Forward-only production cut-over: the daily content-learning runner now lives
-- in GitHub Actions and authenticates both mutating Edge Functions with the
-- Supabase service-role credential. Never recreate the anonymous database cron.
