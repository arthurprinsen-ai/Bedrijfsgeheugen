# Development ledger — terminal closure identity repair
- Date: 2026-10-08
- Obligation: github-delivery-continuity-v1
- Cause: Unquoted YAML `#` truncated `run-name` and hid the PR number on terminal closure Actions runs.
- Observed: Runs 37743054679 and 37743616664 were titled `Obligation Terminal Closure PR`, not the expected `Obligation Terminal Closure PR #<number>`.
- Corrective action: Quote the run-name of existing closure workflow; add regression against supervisor's exact title match.
- No extra scheduler, duplicate writer, altered branch protection, permissions, artificial status, or changes to terminal evidence acceptance.
- Next proof: Protected Required and CodeQL, then merged-main learning/terminal validation. Historical incomplete terminal runs are not green by assumption.

## Current-main successor and regression closure — 2026-10-08

- PR #4113 was retired unmerged after its stale branch lacked the newly required Portal-auth evidence freshness gate present in protected main.
- The same canonical terminal-closure run-name and real `.github/workflows/codeql.yml` lookup have been retained without weakening Required or CodeQL.
- Existing `tests/brain-fast-terminal-delivery-v2.test.mjs` now checks the real CodeQL workflow identity, and the dedicated Brain regression verifies the PR-specific run-name.
- Replay the entire protected delivery from current main; do not claim terminal success from a commit alone.
