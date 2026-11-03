# Kansenradar — one secure scheduler and source-aligned Edge release (3 November 2026)

Original protected-main workflow https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41628384628 failed `SUPABASE_EDGE_FUNCTION_NOT_DECLARED_IN_CONFIG:bg-kansenradar`. Source inspection proved original production Edge v12 active with `verify_jwt=false` and server-side service-role access but no request authentication; live pg_cron job `bg-kansenradar-dagelijks` #18 sent only content-type. Do **not** repair manifest drift by making service-role side effects publicly callable.

## Exact original-owner remediation
1. `supabase/config.toml`: declare the already-deployed `bg-kansenradar` with exact `verify_jwt=false`, original index path, no extra function.
2. `supabase/functions/bg-kansenradar/index.ts`: reject requests lacking existing x-powerhouse-token matching `public.bg_geheim('powerhouse_daily_scheduler_token')` BEFORE evidence write, governance query, AI credits, Notion write, or any other privileged action. Provider JWT mode remains unchanged; token is not baked into sources.
3. `supabase/migrations/20261103124000_bg_kansenradar_original_cron_authorization.sql`: exact old-command compare, verify original job exists and install a runtime `WHERE length(coalesce(token,'')) >= 16` guard that sends **zero** HTTP requests on a preview without production Vault credentials (or any environment missing them), in-place `cron.alter_job`, fail on drift and read back; no `cron.schedule`, duplicate job or unsafe provider fallback. Production original cron was safely changed before Edge deploy and independently read back: id 18, active, schedule `0 6 * * *`, `x-powerhouse-token` from existing `bg_geheim`.
4. `tests/brain-bg-kansenradar-authenticated-release-20261103.test.mjs`: original manifest, one-token-before-work, strict cron migration and no embedded credentials.

## Release truth
Original cron patch is live. Edge source/manifest must pass exact head Required/BRAIN/CodeQL and protected merge; native Supabase original provider deploy and independently observed unauthorized 401 are needed to call Edge secured. This does **not** restore Anthropic provider credits; `brein-status|bg-kansenradar|VEROUDERD` remains unresolved until billing/source observations show real output. Owner-only charge or billing consent may not be bypassed.


## Supabase preview fail-closed correction
The independent external preview originally failed `BG_KANSENRADAR_ORIGINAL_CRON_TOKEN_UNAVAILABLE` because the preview correctly does not have the production scheduler secret. The source now makes zero provider calls without a valid Vault secret, while safely installing the guarded original job command by CAS; it still fails on any unforeseen job drift or duplicate scheduler. Current main production token exists. This change is **not** an authorization bypass or a placeholder secret and requires new exact-head preview and protected test proof.
