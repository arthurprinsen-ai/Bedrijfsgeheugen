# Supabase executable migration history parity v2

## Problem
Production currently reports 563 applied migration versions while `main` contains 657 executable SQL files. Remote-only is zero, but 94 repository-only versions remain in the executable lane.

## Structural fix
- Preserve every repository-only SQL file byte-for-byte under `supabase/migration-history/repository-only/`.
- Remove those 94 versions from `supabase/migrations/`, so the executable lane is production-backed.
- Refresh `supabase/migration-history.lock.json` from the live Supabase migration ledger.
- Tests that assert historical behavior resolve active migration first and immutable archive second.
- CI fails if an archived repository-only version re-enters the executable lane.

## Acceptance
This commit does not claim TERMINAL_GREEN by itself. The PR still requires exact-HEAD checks, hosted Supabase Preview/replay, merge, production migration readback, and post-merge parity.
