# Automatic Supabase migration provider readback

PR #4075 exposed a delivery-control race rather than a runtime failure. The migration was present on protected main and later visible as APPLIED in Supabase, but the post-merge terminalizer inspected the merged PR before its machine-readable migration provider marker existed. The first terminalizer attempt therefore failed with `SUPABASE_MIGRATION_PROVIDER_READBACK_MISSING`.

The structural correction reuses the existing Supabase production-authority workflow. Protected-main changes under `supabase/migrations/**` are now resolved to exact timestamped migration identities. The authority queries Supabase Management API migration history, requires an exact version and migration-name match, and writes the canonical `Terminal-Supabase-Migration-Readback` marker to the merged PR. The terminalizer now waits for that marker in a bounded 24 × 5 second convergence window before failing closed.

This keeps the existing evidence contract intact: repository presence is not production proof, preview success is not production proof, and a migration is terminal only after provider history proves the exact migration APPLIED. No second runtime, scheduler or migration authority is introduced.
