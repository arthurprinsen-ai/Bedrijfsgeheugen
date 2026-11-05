# Migration lock parity enforced before merge — 2026-11-05

## Problem
PR #5442 repaired a lock that lagged the provider by four migrations. The cause was structural: the migration-lock tests ran only after merge in the original BRAIN backend lane, and the lock rule was prose in AGENTS.md.

## Change
- `.github/workflows/required-test.yml`: new unconditional step "Enforce Supabase migration lock parity before merge" runs the five migration-lock test files plus a gate test in the required PR check.
- `tests/brain-migration-lock-pr-gate-20261105.test.mjs`: proves the step exists, names every lock test, is not conditional on the full shared suite, and that lock versions are unique.

## Not changed
No test weakened or skipped, no SQL, schema, RLS, provider write or new scheduler. The lock still mirrors provider history only via independent readback.

## Known limit
This catches a PR whose executable migrations and lock disagree. It cannot see a migration applied at the provider outside Git; that still needs the provider readback by the migration owner.

## Independent gates
Protected Required, CodeQL, original BRAIN and terminal closure. Proves no runtime, revenue or customer outcome.
