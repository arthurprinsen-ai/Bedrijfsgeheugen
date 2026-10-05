# Supabase migration-history canonical recovery v6

Issue: #3742

The recovery separates three authorities that had been conflated: the live production migration ledger, the executable fresh-replay lane, and immutable repository-only historical SQL.

Current verified state on the canonical recovery:
- live production ledger before tracking repair: 564 applied version/name identities;
- production remote-only identities: 0;
- production version/name mismatches: 0;
- repository-only historical aliases moved outside `supabase/migrations`;
- four replay-only baselines remain explicitly tracked;
- fresh disposable Supabase reconstruction succeeds with 568 migrations, including the four baselines;
- no replay baseline SQL is to be re-executed in production.

The remaining production mutation is tracking-only and must use supported Supabase CLI `migration repair --status applied` semantics for the four allowlisted versions. Direct writes to `supabase_migrations` remain forbidden.

TERMINAL_GREEN still requires supported tracking repair, production ledger readback, exact-head gates, protected merge, and post-merge production readback.
