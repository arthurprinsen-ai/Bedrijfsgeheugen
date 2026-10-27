# Powerhouse portal visual assurance — GitHub → Supabase sync v1

The daily Portal V2 visual-density workflow now closes its evidence loop automatically.

- GitHub remains the screenshot/test executor.
- Supabase Edge Function `powerhouse-visual-assurance-sync` reads the latest successful completed `main` run of `portal-visual-density.yml` and requires the `visual-density` job to be successful.
- The existing `powerhouse_daily_scheduler_token` protects invocation.
- Existing `powerhouse_loop_assurance_receipts_v1`, registry/state and `powerhouse_quality_events` remain the only machine authorities.
- Cron `powerhouse-portal-visual-assurance-sync-v1` runs hourly at minute 12 so a daily GitHub run is reflected promptly.
- No successful main run means no fabricated receipt refresh.
