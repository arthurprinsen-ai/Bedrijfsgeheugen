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
