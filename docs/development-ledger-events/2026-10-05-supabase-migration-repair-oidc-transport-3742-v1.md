# Development ledger — Supabase migration repair OIDC transport #3742 v1

- Date: 2026-10-05
- Obligation: `supabase-migration-repair-oidc-transport-3742-v1`
- Parent obligation: #3742
- Canonical recovery: #3766
- Failed prerequisite run: `37350898932`
- Failure point: trusted-main repair exited before provider mutation because `SUPABASE_ACCESS_TOKEN` was absent.
- Production migration history changed by failed run: **no**.
- Recovery action: replace missing GitHub-secret dependency with exact-workflow GitHub OIDC transport to a dedicated Supabase bridge.
- Safety: bridge validates repository/ref/workflow/SHA; database URL is masked; official Supabase CLI repair semantics retained; direct migration-table writes forbidden.
- Terminal condition: not satisfied by this change. Requires successful trusted repair, #3766 lease-bound update, parity/replay proof, exact-HEAD green, protected merge, and production readback.
