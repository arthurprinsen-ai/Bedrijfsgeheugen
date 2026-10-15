# POWERHOUSE recovery delivery ledger — 2026-10-14

- Obligation: `powerhouse-external-cron-recovery-20261014`
- Source: PostgreSQL cron jobs 46, 116, 138, 171 repeatedly failed to start; database connections timed out during initial reconciliation attempts.
- Implementation: `netlify/functions/powerhouse-external-cron-reconciler.mjs`, restricted Supabase RPC in `supabase/migrations/20261014143000_external_cron_reconcile_gateway.sql`.
- Verification: RPC migration accepted and presence read back; CI canonical admission passed after required PR metadata was added.
- Open acceptance: Netlify runtime secret, protected PR merge, scheduled execution, queue record readback, stability and commercial progression. These remain unverified.
- Safety: no automatically repeated outbound sends; provider-specific replay approval required.
