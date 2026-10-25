-- Canonical provider telemetry only. Read-only social network access, no dispatch.
-- Existing data in public.social_posts/social_metric_snapshots remains authoritative.
-- This Edge function authenticates the scheduler token internally (verify_jwt=false).
select cron.schedule(
  'bg-social-metrics-source-6h-v1',
  '18 */6 * * *',
  $cron$
    select net.http_post(
      url := 'https://adhjwmvyoixzjtmiroln.supabase.co/functions/v1/bg-social-metrics-sync',
      headers := jsonb_build_object(
        'content-type','application/json',
        'x-powerhouse-token',(
           select decrypted_secret from vault.decrypted_secrets
           where name='powerhouse_daily_scheduler_token'
           order by created_at desc limit 1
        )
      ),
      body := jsonb_build_object(
        'source','canonical-supabase-cron',
        'requested_at',now()
      ),
      timeout_milliseconds := 120000
    );
  $cron$
);
