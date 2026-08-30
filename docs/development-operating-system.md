# Development Operating System

## Purpose
This is the canonical execution flow for Bedrijfsgeheugen changes across development, preview and production. It complements `AGENTS.md`, `docs/self-healing-agents.md` and `docs/outcome-obligations.md`.

## Mandatory sequence
1. Read `AGENTS.md`, this file, `docs/development-ledger.md`, `docs/self-healing-agents.md`, `docs/outcome-obligations.md`, the shared-agent-memory design and current Powerhouse Team Memory.
2. Dedupe by fingerprint and reuse known fixes before exploring new hypotheses.
3. Materialize every expected result as an outcome obligation with owner, deadline, evidence policy, idempotency key and recovery policy.
4. Protect last-known-good production.
5. Reproduce with concrete build/runtime/deploy evidence.
6. Add or strengthen a regression gate before the repair where practical.
7. Apply the smallest reversible root-cause fix.
8. Verify candidate tests and exact preview artifact/SHA.
9. Red is non-terminal: iterate with new evidence; maximum two identical retries per hypothesis.
10. Promote a green candidate to production automatically.
11. Verify exact production SHA/deploy, smoke/regression and protected metrics.
12. Reconcile expected obligations against verified outcomes. Technical success, an empty result set or `zero candidates` is not green when an outcome is expected.
13. If production regresses, rollback immediately to last-known-good and continue repair on the safe route.
14. Write ERROR/RECOVERY/IMPROVEMENT/MISSED_OBLIGATION/AUTO_REPAIR/PRODUCTION_PROMOTION/PRODUCTION_ROLLBACK to the repo ledger and shared learning.

## Parallel delivery sequence
`BRAIN-DELIVERY-v1` is the mandatory release envelope for repository development. The planner discovers changed scope, automatically projects Brain membership, runs only affected backend/website/portal lanes concurrently, then verifies one integrated exact-SHA candidate. A lane cannot publish independently. BG169 owns promotion, BG168 owns material outcome routing and BG167 owns refreshed current-state visibility.

## Fast branch and concurrent-main rule
`main` is expected to move continuously because publishers, agents and workflows can commit independently. A moving `main` is therefore **not** by itself a reason to rebuild, replay or recreate a feature branch.

Mandatory rules for every agent, new project chat/work session, GitHub workflow and Make scenario that performs repository development:
- create a feature branch directly from the current `main`; branch creation is an O(1) Git ref operation and should take seconds, not minutes;
- prefer one atomic tree/commit for a bounded batch instead of serially rewriting many files through repeated API calls;
- after `main` moves, compare changed paths and mergeability;
- if feature paths and new-main paths do **not** overlap and GitHub reports the branch mergeable, continue using the already-tested feature SHA and merge it with the then-current `main`;
- do **not** recreate, replay or rebase a branch merely to make `behind_by=0` when drift is non-overlapping;
- synchronize/rebase only when there is an actual merge conflict or changed-path overlap that can affect the candidate;
- if another agent already implemented an equivalent fix on `main`, dedupe and reuse it instead of copying it again;
- exact production verification applies to the resulting merge commit, not to an artificial requirement that the feature head itself always contains every unrelated new `main` commit.

This rule exists because a previous portal migration repeatedly rebuilt a green branch while `main` was receiving unrelated commits; during the rebuild `main` moved again, creating avoidable minutes of delay and duplicate work. That failure mode is permanently prohibited by `config/brain-delivery-system.json`, `tests/brain-delivery-system.test.mjs` and shared team memory.

## Protected invariants
- `NO SILENT FAILURE`.
- `NO LOST OBLIGATION`.
- `GREEN MEANS OUTCOME VERIFIED`.
- `RED MEANS AGENTS KEEP WORKING`.
- No secret/credential/permission changes without explicit authorization.
- Never weaken security controls.
- No destructive or irreversible data mutations.
- No paid-resource increases or legally/financially binding actions.
- Production must remain on last-known-good when a candidate is red.
- Exact deploy/commit identity is part of acceptance.
- Documentation and learning writeback are release requirements, not optional follow-up.

## Release gate
A candidate is green only when relevant tests pass, required knowledge files exist, preview is verifiably healthy, rollback is known and all obligations created by the change have either verified outcome evidence or an explicit valid hard boundary. Production is green only after the exact promoted SHA is verified in production.
