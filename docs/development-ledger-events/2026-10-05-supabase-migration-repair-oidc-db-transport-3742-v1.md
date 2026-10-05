# Development ledger — #3742 OIDC database transport

- obligation: supabase-migration-history parity #3742
- failure: trusted main repair run had no SUPABASE_ACCESS_TOKEN or database password; no repair executed
- provider evidence: Supabase documentation confirms hosted Edge Functions receive SUPABASE_DB_URL by default
- runtime change: deployed `supabase-migration-repair-credential-bridge` version 1 with custom GitHub OIDC verification
- repository change: canonical bridge source/config plus trusted workflow OIDC acquisition and masked `--db-url` CLI transport
- prohibited fallback retained: no direct `supabase_migrations` SQL write and no hand-built pg_catalog baseline
- terminal state: still fail-closed until supported repair succeeds, #3766 fresh replay/exact-head gates merge, and post-merge production readback is proven
