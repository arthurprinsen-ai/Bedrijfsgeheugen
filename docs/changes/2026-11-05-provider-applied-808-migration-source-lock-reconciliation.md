# Protected migration reconciliation: 808 provider-applied, 807 Git lock

2026-11-05 15:33 UTC. Original owner: protected Supabase migration and GitHub Required integration. Parent: #3742 and dependent original incident #4447.

## Independent evidence
- Original PR #5450 merged migration `20261105134200_original_data_spine_decision_receipt_same_tick_v1.sql` into protected main; no duplicate migration generated.
- Real Supabase production `supabase_migrations.schema_migrations` independently reads 808 applied identities (max exact version `20261105134200` with exact name `original_data_spine_decision_receipt_same_tick_v1`) at 2026-11-05T15:33:22.246269Z. GitHub main `supabase/migrations/` also has 808 full source files but its `supabase/migration-history.lock.json` still has 807 provider rows.
- Exact protected Required #42055033207 (dependent PR #5457) has failed the unchanged strict migration parity suite with 808 SQL files vs 807 source lock; do not waive this.

## Original source repair
Append **only** the independently provider-proven 808th version/name to the original source lock, retain every previous 807 identity byte-for-byte, set `captured_at` to real Supabase DB readback time. Never execute it again, never forge an applied row, never edit the applied SQL or provider migration table and never let PR-only SQL claim production application.

Regression test `tests/brain-supabase-provider-applied-808-lock-20261105.test.mjs` and ALL original strict source-to-provider suites. Source-only ONE BRAIN learning `brain/learning/2026-11-05-supabase-migration-lock-808-provider-readback.json`. Existing original Powerhouse continuity agent enforces recurrence.
Close only on protected Required/CodeQL success, approved merge, live GitHub main exact lock readback, and new dependent PR #5457 Required admission success. Next migration requires a new independently checked provider identity and exact source sync; new PR-only migration still demands hosted preview but cannot be placed in the applied lock early.
