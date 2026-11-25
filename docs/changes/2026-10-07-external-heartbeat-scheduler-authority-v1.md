# External heartbeat scheduler authority v1

After the external commercial heartbeat proved live, migration 20261007083900 retired the legacy pg_cron heartbeat owner. The commercial regression gate still counted only pg_cron, so the post-cutover Edge heartbeat became non-VERIFIED and the runner rolled back its transaction with HEARTBEAT_DURABLE_READBACK_MISSING.

Structural correction:

- the authenticated Netlify -> Supabase Edge runner sets a transaction-local marker immediately before the canonical heartbeat call;
- the regression gate counts legacy pg_cron ownership plus that external marker;
- exactly one authority is required;
- direct/manual database calls have no marker and therefore remain fail closed after cutover;
- if legacy pg_cron and the external runner overlap, the gate sees two owners and remains unhealthy;
- terminal outcome coverage, secondary scheduler ownership and v2 drift checks remain unchanged and fail closed.

Production evidence before this change:

- migration ledger 605 through 20261007083900;
- no legacy powerhouse-one-commercial-heartbeat-v1 cron job;
- seven internal research_enrichment terminal actions were closed through the canonical terminalizer, restoring terminal coverage to 100%;
- post-cutover runner invocations reached Supabase Edge but returned 503 with HEARTBEAT_DURABLE_READBACK_MISSING.

## Production identity reconciliation

- Production applied the scheduler-authority migration as `20261007090255_external_commercial_heartbeat_scheduler_authority_v1`.
- The earlier local filename `20261007084700_...` was a repository alias and caused the Supabase main integration to fail with “Remote migration versions not found in local migrations directory.”
- The alias is removed, the exact provider identity is canonical in Git, and migration-history.lock.json advances to the proven production ledger count 606.
- SQL bytes and runtime behavior are unchanged by this reconciliation.
