do $$
begin
  if exists (select 1 from cron.job where jobname = 'bg-native-content-generate-daily') then
    perform cron.unschedule((select jobid from cron.job where jobname = 'bg-native-content-generate-daily' limit 1));
  end if;
end $$;

-- The daily content-learning runner moved to GitHub Actions so the mutating
-- Edge Functions are invoked only with the repository-held Supabase
-- service-role credential. Never schedule an anonymous HTTP request here.
