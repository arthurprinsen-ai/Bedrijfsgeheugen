# GA4 original source release incident — 2026-11-04
- Native source: GitHub Supabase Edge Production Authority run #41846442932/job 126631078700, commit fec85265e5b7b9289933a06f8e64074d50dd98cb, failed `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:bg-analytics-sync-composio`.
- Original owner: `bg-analytics-sync-composio` and Supabase release authority, original cron #42 unchanged.
- Root: existing GA4 function source updated but absent from `supabase/config.toml`; deployed v15 remained stale.
- Fix: add exact original provider `verify_jwt=false` configuration; enforce existing Vault `x-powerhouse-token` BEFORE provider/privileged work.
- Regression and Brain: existing GA4 test, learning `brain/learning/2026-11-04-ga4-edge-production-config-and-token-v1.json`, updated Growth skill.
- Release status: CANDIDATE pending native protected merge, production byte readback and natural original cron. Consent-limited GA4 remains unproven. No second writer/timer.
