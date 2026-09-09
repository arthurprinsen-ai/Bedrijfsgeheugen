# Fast Branching Learning — permanent team rule

## Incident fingerprint
`github|branch-rebuild|moving-main-drift`

## What happened
A green feature branch was repeatedly reconstructed because `main` had moved. That caused unnecessary branch churn, serial replay, repeated CI fan-out and scope risk. The invalid assumption was that a production-ready branch must remain `behind_by=0` before it can be released.

## Root cause
The delivery process confused **branch freshness** with **release correctness**. The correct executable identity is the current GitHub merge candidate against the latest target state, not a feature branch that is continuously rewritten to mimic `main`.

## Permanent prevention rule
1. Create the bounded change once from the then-current `main`.
2. Treat the feature/change head as the immutable identity of the intended diff.
3. Determine changed-path scope from the change head, not from unrelated later `main` commits.
4. Validate build/backend/portal/automation/static website contracts against GitHub's current synthetic merge candidate / merge-group SHA.
5. Keep exact deploy-preview/runtime checks tied to the real feature head that produced that preview.
6. If `main` moves, do **not** rebase, replay, rebuild, create a successor or grow scope merely to become `behind_by=0`.
7. Path or declared-contract overlap is evidence that the current merge candidate must be revalidated; it is **not** a branch rewrite instruction.
8. Only a real Git merge conflict requires resolving the feature branch itself.
9. BRAIN must report ordinary moving-main drift as `REVALIDATE_MERGE_CANDIDATE` with `branchRewriteRequired=false`, never routine `SYNC_REQUIRED`.
10. Required `test` remains authoritative; no drift, queue pressure or stale checker may justify bypassing protection.
11. Merge success is not completion. Production must deploy the exact merge SHA and pass Production Release Readback before `LIVE_VERIFIED`.
12. Prefer atomic Git tree commits over serial file API writes for bounded multi-file changes and dedupe against work already landed by other agents.

## Shared-memory contract
BG167 must expose this invariant in current team context. BG168 stores the incident and prevention rule as reusable learning. New agents, GitHub workflows and Make scenarios are not production-ready unless they inherit this rule.

The canonical repository policy is `docs/changes/driftless-release-policy.md`. The live implementation was introduced by PR #1231 and the policy was codified by PR #1247.

## Operational release path
`change head -> current merge candidate -> selected Required lanes -> protected test -> merge -> exact merge SHA -> production deploy -> production readback -> learning/regression`

There is no ordinary `sync branch with main` step in this path.

## Success metrics
- Rebuild/rebase/successor count caused solely by moving `main`: **0**.
- Scope growth caused by unrelated `main` changes: **0 files**.
- A GitHub `behind` indicator alone never blocks release.
- All causal conflicts are caught by the current merge candidate or a true Git merge conflict.
- No release is called live without exact-SHA production readback.
