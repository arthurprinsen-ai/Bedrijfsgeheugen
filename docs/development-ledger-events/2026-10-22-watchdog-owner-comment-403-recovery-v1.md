# Development ledger — 2026-10-22 watchdog HTTP 403 on first merged execution

- Event: `WATCHDOG_OWNER_HANDOFF_COMMENT_403_OBSERVED`
- Fingerprint: `github|watchdog|owner-comment-403-recovery|20261022-v1`
- Original merged main: `01af9f2a05794a170cd3fd63013db75a33e76268`
- Immutable proof: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39811993147/job/119940435969
- Scope: existing watchdog script and workflow permission, one isolated test, one canonical learning record, one change note, this append-only ledger
- Observed failure: GitHub API 403 POST /issues/4656/comments, unhandled and aborted later PRs
- Candidate repair: narrow PR comment authorization, bounded per-gate handling, independent later-dispatch continuation, explicit nonzero partial failure
- Evidence needed: exact-head Required + CodeQL; protected merge; existing scheduled watchdog GitHub provider readback including new exact-comment receipt, with 0 unauthorized handoffs
- Acceptance: not live, not full BRAIN zero-fail, no success inferred merely from this record

## Current-main reconciliation (same PR)
- The independent protected PR #4670 merged the missing PR-write permission first at ca5f6faed52875b630f0c8a8495bf6f7e568275b.
- Keep this existing #4667 PR as additive fail-closed recovery only: preserve exact current-main workflow permission and previous tests, combine only six original candidate files, do not create a duplicate PR/issue/scheduler.
- The full exact-head Required/CodeQL on the new two-parent reconciliation must pass; earlier CI evidence is not transferable.
