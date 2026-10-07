# Automatic Supabase migration provider readback

PR #4075 exposed a delivery-control ownership gap rather than a runtime failure. The migration was present on protected main and visible as APPLIED in Supabase, but the post-merge terminalizer required a machine-readable migration marker that no canonical component produced automatically. Its first attempt therefore failed with `SUPABASE_MIGRATION_PROVIDER_READBACK_MISSING`.

The structural correction keeps one owner: the existing post-merge obligation terminalizer. For a trusted merged PR that changes `supabase/migrations/<version>_<name>.sql`, the terminalizer now uses the production Supabase credential to query provider migration history with bounded retries. It requires an exact version and exact migration-name match, writes the canonical `Terminal-Supabase-Migration-Readback` marker to the merged PR, then consumes that exact marker in terminal evidence.

The Edge production authority stays unchanged and single-purpose. No second scheduler, migration runtime or competing readback authority is introduced.

The evidence contract remains fail-closed: repository presence is not production proof, preview success is not production proof, and a migration is terminal only after Supabase provider history proves the exact migration APPLIED.
