# Development ledger — original innovation metric source truth

- Date: 2026-11-15
- Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198
- Candidate: `2c1ecc77-58aa-4f25-ae68-e2337853fdc7`
- Original ONE BRAIN operation: `56e16919-6275-4c2e-9208-6ac0c8a29a29`
- Owner: `agent:agent-integration-engineer`
- Original autonomous authoring run: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/43754864334
- PR: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/5908
- Root cause: `Number(value)` treated whitespace strings, booleans and arrays as measurements, including actual observed zero, making missing source evidence look real
- Code correction: allow finite numeric scalar or nonblank numeric source string only; preserve real zero, signed amounts, privacy and source boundary
- Regression: `tests/brain-innovation-metric-source-truth-20261115.test.mjs` with invalid source values and real zeros; original learning historical replay and canary
- Mid-delivery P0 failure 1: GitHub Actions-created PR had `action_required`, requiring the existing protected Required workflow dispatch rather than bypass
- Mid-delivery P0 failure 2: first Required recovery found `LEARNING_EVALUATION_TESTS_REQUIRED:canary`; added actual source-truth regression to `evaluation.canary` in original learning record
- Mid-delivery P0 failure 3: next Required admission found `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE:activity_ledger,human_documentation`; added this append-only ledger and human change note to same PR and adjusted exact scope budget
- Prevention: source-bound code writer must carry original owner, immutable source identity, complete compiler/evaluation contract, changed source, regression, lesson, human documentation and ledger before protected admission
- Original operation status before protected merge: `PLANNED`; original candidate PR receipt externally read back through native versioned CAS; consumer ACK and independent effect are still NOT_PROVEN
- Rollback: existing protected PR revert of source helper only; never erase immutable original records
