# Supported Supabase migration-history repair for #3742

The canonical recovery for #3742 has four replay-compatibility migrations whose production effects are already verified but whose versions are absent from the Supabase remote migration ledger.

This control plane runs only from trusted `main` workflow code. It resolves the immutable #3766 recovery head, validates its writer lease and the exact four repair obligations, and then compares `supabase migration list --linked` against that candidate.

The only production mutation is the supported Supabase CLI command `supabase migration repair ... --status applied` for versions `20260920101150`, `20260920102450`, `20260925080500`, and `20261005133951`. It never executes the migration SQL and never writes directly to `supabase_migrations`.

The workflow fails closed unless the pre-repair drift consists of exactly those four local-only versions. After repair it requires zero local/remote migration-list drift, updates the candidate lock to `REPAIRED_APPLIED_VERIFIED`, adds the four repaired identities to the authoritative applied ledger, and advances #3766 only with a force-with-lease against its exact prior head.

This closes only the migration-history repair obligation. Fresh replay, exact-HEAD checks, protected merge, and post-merge production readback remain mandatory before #3742 can become TERMINAL_GREEN / LIVE_PROVEN.
