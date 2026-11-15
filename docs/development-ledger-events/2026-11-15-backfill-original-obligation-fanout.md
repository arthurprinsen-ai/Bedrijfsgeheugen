# Development ledger — 2026-11-15 canonical backfill fanout repair

- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Fingerprint: `powerhouse|one-brain|completion-backfill-duplicate-original-obligation-fanout|20261115-v1`
- Source observation: original production `brain_outcome_obligation_dispatch` AgentWork/PENDING grew during original completion-supervisor backfill, concentrated on a handful of canonical obligation IDs; original workflow was in progress. A new row is not a real processed work result.
- Root cause: `activeDispatches()` produced a distinct `coalesceKey` for every historical candidate, despite multiple candidates referring to the same immutable canonical registered obligation.
- Repair: group original active backfill triggers only by registered canonical obligation ID, stable never-per-day fingerprint; retain every candidate in original report and existing append-only source; include aggregated count+identity digest in dispatch artifact.
- Owner: existing Completion Supervisor + Reliability/Data Quality. No second scheduler, workflow, agent, sender or store.
- Skill: existing `.agents/skills/powerhouse-continuity/SKILL.md` updated. Code: `tools/outcome-obligation-completion-supervisor-backfill.mjs`.
- Regression: `tests/brain-completion-supervisor-backfill.test.mjs` replays 1201 histories for one obligation plus independent second obligation; stable idempotency, no lost candidates, no newly invented terminal output.
- Release status at authoring: CANDIDATE, **not** merged, not live and not historical consumer proof. Required/CodeQL/BRAIN, protected merge, exact production SHA and next original natural-run provider/consumer evidence still required.
- Prevention: never equate historical source candidates with separate external work commands; dedupe by original owned business obligation for *backfill only*, preserve source revision and individual original records for reconciliation.

## First protected learning admission — rejected and repaired in the SAME PR

- Exact candidate head `e9124f7dea92d31934e78fbdc1f225f5b632827f`, Required run `43699943611`, hygiene job `132768663946`.
- Native learning gate executed the actual `tests/brain-completion-supervisor-backfill.test.mjs` and rejected an outdated assertion: test previously expected `report.dispatches[0].identity === 'original-work'` while the intentional new canonical dispatch identity is `canonical-obligation:ob-1`.
- All other six historical test cases passed; the gate correctly failed closed with `LEARNING_EVALUATION_FAILED:historical_replay:exit_1` and blocked the release.
- Corrected that original test to assert the exact canonical id **and** `sourceCandidateCount === 1`, keeping historical candidate preservation checks. No test was skipped/removed; no bypass, second PR or altered runtime exception. Repeat exact-head Required/CodeQL before any protected merge; do not treat this ledger as release success.

## Second protected preflight — stale PR base scope, no bypass

- Exact candidate head `948de970ffe2e88f6c85910f3470ec73ddb38103`, Required run `43700330645`; admission and lease checks succeeded, but preflight `Classify independent delivery lanes` failed `SCOPE_BUDGET_EXCEEDED` reporting 11 paths while the actual protected latest-`main` compare showed exactly 7 owned paths.
- Concurrent protected Heartbeat PR #5827 changed `main` from `dc0236f46a0504545f9e4454083289cca97d9de7` to `16aae1e805e33f0d3494df9f7dc9d42c3d9f350b`. The same original candidate branch was safely synchronized onto that main with a two-parent native merge preserving all 7 owned source files plus independent current main. GitHub PR base metadata still read old `dc023`; two-dot event diff included unrelated concurrent main files, violating its scope calculation. No real scope increase occurred.
- Exact correction: refresh the existing PR #5835 base to `main` through its normal GitHub PR update; independent readback now showed the new real base SHA `16aae1e8`. No change to protected max-file scope, no second PR, no deletion, no force-push, no workflow bypass. Run latest-head Required/CodeQL and require exact 7-path classification before any merge.

## Protected PR-base race — retry without weakening scope

- Exact head `948de970ffe2e88f6c85910f3470ec73ddb38103`, Required run `43700330645`, preflight job `132770002242`: hygiene admission SUCCEEDED, lease PR replay SUCCEEDED, but preflight `Classify independent delivery lanes` rejected `SCOPE_BUDGET_EXCEEDED`.
- The observed event's `PR_BASE_SHA=dc0236f46a0504545f9e4454083289cca97d9de7` was stale from before original heartbeat repair #5827 landed on protected main `16aae1e805e33f0d3494df9f7dc9d42c3d9f350b`. An old two-dot range therefore counted the six unrelated Heartbeat source files plus seven scoped source files (11 excluding tests) even though actual current-main-to-head comparison had exactly the original seven scoped files and zero behind commits.
- Current native GitHub PR API readback shows base SHA `16aae1e805e33f0d3494df9f7dc9d42c3d9f350b`. Do NOT raise `Scope-Budget`, disable the guard, remove regression tests, force merge, or overwrite the original Heartbeat source. Keep the same seven scope files and update this ledger in the same branch to trigger exact refreshed event-based validation.
- Source handoff remains OPEN; repeat native Required/CodeQL at exact new head, protected merge and first true original completion-supervisor proof before claiming live repair.

## Provider 866 lock merged; second stale GitHub event-base

- Exact branch head `b44028f0f5ed76e53ca7f6b465841d8ef6cf19ed`, Required `43700984801`, preflight source classification: `SCOPE_BUDGET_EXCEEDED` with 10 counted delivery files because event payload still held `PR_BASE_SHA=16aae1e805e33f0d3494df9f7dc9d42c3d9f350b`.
- Protected owner #5836 subsequently merged the genuinely applied 866th Supabase migration lock at `8b0642129879f3a0ee794c56eb8bd8490df731d7`. The stale event compared against the preceding main and counted migration lock files owned by #5836 alongside our backfill patch, despite exact *current* main-to-head diff showing only the seven scoped files and zero behind commits.
- Native PR readback now has base `8b0642129879f3a0ee794c56eb8bd8490df731d7`. We preserve the original source budget of 7, all candidate source files, complete 1201-historical-source test and protected gate. Update only this append-only ledger to induce a fresh event with authoritative new PR base; do not override source-lock changes, adjust branch security, or conflate provider-applied migration with Heartbeat PROCESSED.
- A green admission is not merge/deployment/consumer proof. Exact new run, CodeQL, protected merge, and natural existing backfill must still be read back.

## LinkedIn owner release — stale event-base during protected Required

- A separate original LinkedIn source repair was protected merged on main `5cc1a86f44e93e733d8027f01da278fc23c862b3`; this original backfill repair was subsequently CAS-synchronized retaining exactly its seven own changes, including both agent-task owners.
- New exact-head Required run `43701363875` sampled event `PR_BASE_SHA=8b0642129879f3a0ee794c56eb8bd8490df731d7`, from before the LinkedIn release, and correctly rejected apparent 13-file delivery scope. The CURRENT native GitHub PR base is now `5cc1a86f44e93e733d8027f01da278fc23c862b3`, and actual comparison to feature head has seven scoped files, no missing or extra paths.
- Do not increase the source budget, skip CI, rewrite concurrent LinkedIn tasks or fake live proof. This append-only operational observation produces a fresh exact PR event on the already-correct current base. Only true exact-head protected Required/CodeQL, merge and original backfill natural-run readback count as accepted.

## Third protected preflight — event captured prior base after concurrent LinkedIn release

- Exact head `f52bfa244d3f6fe755a557c1ddec84434f12acb8`, Required run `43701363875` had admission/lease success but failed protected `Classify independent delivery lanes` with `SCOPE_BUDGET_EXCEEDED` counting 13 paths rather than exactly 7 owned changed paths. The workflow event itself explicitly carried `PR_BASE_SHA=8b0642129879f3a0ee794c56eb8bd8490df731d7`, though the current main was independently `5cc1a86f44e93e733d8027f01da278fc23c862b3` after protected LinkedIn PR #5832.
- The same PR branch was reconciled by native two-parent CAS onto `5cc1a86f44e93e733d8027f01da278fc23c862b3`, retaining all current-main editorial changes and merging agent-team tasks in the original protected roster without overwriting either side. The original PR base was then updated to `5cc1a86f44e93e733d8027f01da278fc23c862b3` and independently read back. Subsequent exact-head CI must capture the correct event base and verify exactly seven scoped files. No increase to Scope-Budget, no gate bypass, no second scheduler or PR, no source deletion.
- The previously runaway original backfill run `43697572565` was independently confirmed `completed/cancelled` at `2026-11-15T09:45:19Z` without disabling the normal workflow. Native Supabase confirmed zero new `AgentWork` or `RecoveryWork` after cancellation time; historic `AgentWork/PENDING=4466`, `RecoveryWork/RECOVERING=1055` remains OPEN, not fictitiously closed.
