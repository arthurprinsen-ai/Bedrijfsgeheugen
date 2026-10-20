# Social publication deployment recovery — 15 October 2026

- Declared the already deployed `bg-pre-publish-review` Edge Function in `supabase/config.toml`. This removes a gap in the protected-main provider function manifest.
- Added an explicit non-retryable 401 exit to the read-only Supabase provider source-parity check. Invalid tokens are not transient faults; continuing for 24 attempts hid the actionable root cause.
- Preserved the Supabase GitHub integration as the only production Edge deployer. GitHub Actions remains attestation-only; publication identity and final-copy gates are unchanged.
- Added tests. No successful external publication, automatic email, DM or production deployment is claimed.

**Operator dependency:** Restore a valid scoped `SUPABASE_ACCESS_TOKEN` through GitHub repository/environment secrets and verify Supabase GitHub integration. Re-run protected-main provider attestation and independently compare live source versions after canonical deployment; restore stuck day claim only after reviewer is live and duplicate-safe.
