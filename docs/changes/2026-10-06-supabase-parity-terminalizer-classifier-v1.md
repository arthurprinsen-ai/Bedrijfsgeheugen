# Supabase parity terminalizer obligation-family fix

PR #3899 merged with exact-head gates green and production/repository migration parity at 591/591. Its post-merge terminalizer nevertheless failed because the readback classifier only recognized legacy `supabase-migration-history-*` obligation IDs.

This change extends that classifier to the explicit parity families used by the repository: legacy migration-history parity/canonical plus production-ledger parity and current-production-ledger parity.

The safety boundary is unchanged. The shortcut still requires `Candidate-Type: recovery`, accepts only the existing historical migration/lock/security-governance path allowlist, and does not accept `supabase/functions/**`. Runtime Edge changes therefore continue to require provider readback.
