# Development ledger — material writeback two-tree diff

- Date: 2026-10-06
- Obligation: `material-writeback-two-tree-diff-20261006-v1`
- Trigger: #3976 failed after complete closure evidence because the guard invoked a merge-base-dependent three-dot diff in shallow preflight.
- Main epoch: `13ce18bf4b8f4eb4deda7fc17d5e17dd48aba239`.
- Drift overlap with intended repair: zero files.
- Repair: exact two-tree diff in `scripts/brain/material-writeback-closure-guard.mjs`.
- Regression: `tests/brain-material-writeback-closure-guard.test.mjs` creates disconnected commit histories and verifies changed-path derivation succeeds.
- Performance invariant: retain shallow checkout; do not replace the defect with a full-history fetch.
