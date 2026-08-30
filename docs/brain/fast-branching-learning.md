# Fast Branching Learning — permanent team rule

## Incident fingerprint
`github|branch-rebuild|non-overlapping-main-drift`

## What happened
A green feature branch was repeatedly reconstructed because `main` had moved. The new `main` commits were unrelated, and while the branch was being replayed `main` moved again. Branch creation itself took under one second; the delay came from unnecessary serial file replay and an invalid `behind_by=0` acceptance assumption.

## Root cause
The delivery process treated any `main` drift as branch staleness instead of distinguishing **conflicting drift** from **non-overlapping concurrent work**.

## Permanent prevention rule
1. Create from current `main` once.
2. Build and test the bounded feature SHA.
3. If `main` moves, compare changed paths and mergeability.
4. Non-overlapping + mergeable => keep the tested feature; merge with current `main`.
5. Overlap/conflict => synchronize only the affected branch.
6. Never rebuild/replay solely to reach `behind_by=0`.
7. Prefer atomic Git tree commits over serial file API writes for bounded multi-file changes.
8. Dedupe against changes already landed by other agents.

## Shared-memory contract
BG167 must include this rule in current team context. BG168 stores this incident as reusable learning. New agents, GitHub workflows and Make scenarios are not production-ready unless they consume shared context and therefore inherit this rule.

## Success metric
Feature branch setup + bounded multi-file write should normally be seconds, excluding CI/build time. Rebuild count caused solely by non-overlapping `main` drift must remain zero.
