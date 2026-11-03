# 2026-11-03 — recover original BRAIN terminal without duplicate verification

Incident: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5338. Parent singleflight prevention: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5332.

## Exact observed failures
Protected PR #5336 and PR #5334 were successfully merged after Required and CodeQL, but their original terminal workflow runs [41593213494](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41593213494) and [41593829735](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/41593829735) failed at the read-only BRAIN flight lookup with `BRAIN_FLIGHT_HISTORY_BOUNDED_UNPROVEN`. Only 100 of 343+ native `workflow_dispatch` runs had been inspected. The fail-closed guard prevented an unsafe duplicate but also starved valid new terminal verification. The merged source was NOT rolled back; missing terminal proof remains missing.

## Minimal original-owner repair
The same original terminal workflow uses `gh api --paginate --slurp` to fetch the native run-list pages for `branch=main&event=workflow_dispatch`. The pure helper `tools/delivery/brain-verification-flight-index.mjs` validates complete native `total_count`, positive distinct run IDs, event, main source and exact PR/head display title. Incomplete/malformed output fails closed. Every permitted dispatch is preceded by two complete reads; any exact existing flight is observed, never duplicated. Existing `verification_only=true` cancellation protection is retained; no additional workflow, scheduler or writer.

## Replay and terminal criteria
The original test file `tests/brain-terminal-canonical-verify-only-dispatch-20261102.test.mjs` replays 343 records with match outside the first 100, truncated native pages, duplicate run IDs, conflicting totals, fully absent history and source/mode checks. Required/CodeQL/full BRAIN on exact head, protected merge, original terminal reruns and independent provider readback for both PR #5334/#5336 must succeed before incident closure. Archive tag 403, four provider queue ghosts, and residual supervisor drift remain separate debts.
