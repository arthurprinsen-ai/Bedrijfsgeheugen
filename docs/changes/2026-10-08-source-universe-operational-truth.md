# Source Universe: observed truth, not catalog optimism

This read-only assurance probe measures the existing production Source Universe without creating a second crawler, scheduler, source store, tenant view or action writer.

Run `tools/assurance/source-universe-operational-truth.sql` through the authorized server-side Supabase SQL execution path. The result distinguishes catalog registration, activation requirements, historical observations, 24-hour freshness, company impacts and monetary evidence. A public source with `availability_state=AVAILABLE` is **not** proof that it has been fetched. A company impact row is **not** an observed business outcome.

## Required completion gates

1. Public source adapters have real per-source observation receipts and retry/dead-letter visibility; do not update `last_observed_at` without a real observation.
2. Connector-required sources remain unavailable until tenant authorization and readback are proven; never imply 83 integrations are connected.
3. Ingested evidence maps through the existing signal authority to tenant-specific impact. Never create tenant impacts synthetically.
4. Materialize actions only through the existing canonical obligation gate, after READY + SCORED evidence.
5. Actions, verified outcomes and learning each require separate independent receipts; NOOP is not success.
6. Reuse the one Portal Omgevingsradar with the authenticated tenant-scoped API. Enforce existing RLS, no browser service credentials.
7. Required/CodeQL, migration reconciliation, exact-main deploy and authenticated production readback must complete before LIVE_PROVEN.

The SQL is diagnostic and deliberately does not itself activate connectors, ingest providers or alter tenant data.
