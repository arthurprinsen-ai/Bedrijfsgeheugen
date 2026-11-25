# Development ledger — #3742 OIDC repair bootstrap

- blocker: canonical OIDC transport PR changed supabase/** and therefore required a hosted fresh replay before it could install the repair transport.
- deadlock: the fresh replay depends on the migration-history recovery that the transport exists to enable.
- runtime prerequisite: supabase-migration-repair-bridge is already ACTIVE and exact-SHA OIDC locked.
- bootstrap: GitHub-only workflow change consumes the bridge; no supabase/** source changes.
- mutation path: official Supabase CLI migration repair --status applied --db-url only.
- terminal state: #3742 remains OPEN until repair succeeds, #3766 fresh replay/gates/merge succeed, and post-merge production readback is exact.
