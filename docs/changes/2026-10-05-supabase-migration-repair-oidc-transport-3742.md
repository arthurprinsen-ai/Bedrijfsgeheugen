# Supabase migration repair OIDC transport — #3742

## Problem

PR #3768 protected-merged the supported migration repair workflow, but trusted-main run `37350898932` failed before any Supabase provider mutation because the configured GitHub production secrets were absent. The canonical recovery PR #3766 therefore remained unchanged.

## Structural correction

The repair workflow now requests GitHub OIDC only on trusted `main`. A dedicated Supabase Edge Function validates the exact repository, `refs/heads/main`, workflow identity and commit SHA before returning the platform-injected database connection URL. The runner masks that URL immediately.

The database mutation remains the official pinned Supabase CLI path:

- `supabase migration list --db-url` for pre-repair drift proof;
- `supabase migration repair ... --status applied --db-url` for migration-history tracking only;
- `supabase migration list --db-url` for post-repair zero-drift readback.

No migration SQL is re-executed. No direct write to `supabase_migrations.schema_migrations` is introduced.

## Closure contract

This transport change is only a prerequisite. #3742 remains fail-closed until the trusted-main repair succeeds, #3766 is advanced with force-with-lease, exact production-ledger parity and fresh replay are proven, all exact-HEAD gates are green, #3766 protected-merges, and post-merge production readback proves the live state.
