# Pre-merge migration lock gate — development ledger

- 2026-11-05, owner: existing required-test PR check / Supabase migration source lock.
- Fingerprint: `supabase|migration-history|pre-merge-lock-gate|20261105-v1`.
- Source: incident closed by PR #5442 (lock 801 to 805); prose rule from 4 November did not prevent recurrence.
- Repair: five migration-lock tests plus a gate test now run in the required PR check, unconditionally; no weakened tests, no SQL replay, no parallel runner.
- Known limit: provider-only migrations outside Git still need provider readback.
- Status: CODE_CANDIDATE, not verified until protected Required, CodeQL, original BRAIN and terminal closure agree.
