# Development ledger — #3742 OIDC repair bootstrap

- blocker: canonical OIDC transport PR changed supabase/** and therefore required a hosted fresh replay before it could install the repair transport.
- deadlock: the fresh replay depends on the migration-history recovery that the transport exists to enable.
- runtime prerequisite: supabase-migration-repair-bridge is already ACTIVE and exact-SHA OIDC locked.
- bootstrap: GitHub-only workflow change consumes the bridge; no supabase/** source changes.
- mutation path: official Supabase CLI migration repair --status applied --db-url only.
- terminal state: #3742 remains OPEN until repair succeeds, #3766 fresh replay/gates/merge succeed, and post-merge production readback is exact.

- trusted repair run 37354534547: OIDC acquisition succeeded; direct IPv6 transport was replaced by Supavisor session-pooler transport.
- parser defect: real Supabase CLI list output wraps 14-digit versions in backticks; the workflow filtered rows before presentation normalization and produced false `drift=[]`.
- correction: normalize backticks before version validation in pre- and post-repair list parsing; exact allowlist and zero-drift postcondition remain fail-closed.
