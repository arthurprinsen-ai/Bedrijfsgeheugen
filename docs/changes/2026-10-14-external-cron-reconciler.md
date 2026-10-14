# External cron reconciliation for POWERHOUSE

## Problem
PostgreSQL cron startup timeouts cause skipped internal commercial processing. In-database reconciliation cannot recover when it cannot establish a database connection.

## Change
Netlify runs a scheduled server-side reconciler every 15 minutes, calling a restricted Supabase RPC to record recently failed jobs 46, 116, 138 and 171. Enqueue deduplicates using the job ID and cron run ID. This worker registers faults for review, not outbound-message retries.

## Verification boundary
The Supabase gateway migration was accepted and read back. GitHub code is on PR #4370. Deployment and live scheduled executions remain to be proved after successful CI/merge and secure runtime configuration. The commercial snapshot optimization and scheduler 171 decomposition are separate open work.

## Failure and recovery
If database connectivity is unavailable, the Netlify invocation reports failure and aborts within 18 seconds. It does not claim that a run completed or silently generate successful commercial evidence. Historical failures can be backfilled within the RPC's bounded lookback once connectivity returns.
