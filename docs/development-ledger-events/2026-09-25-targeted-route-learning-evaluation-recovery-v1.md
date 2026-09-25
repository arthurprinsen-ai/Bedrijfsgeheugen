# Development ledger — Brain evaluation contract recovery

Date: 2026-09-25
Obligation: `governance-production-trigger-ownership-v1`
Supersedes closure defect after PR #3104.

## Failure
Powerhouse Skill Projection rejected learning `targeted-route-regression-helper-import-v1` with:
`LEARNING_EVALUATION_TEST_PATH_INVALID:historical_replay:tests/targeted-website-route-regression.test.mjs`.

## Root cause
The learning evaluation referenced a normal website test instead of the required `tests/brain-*.test.mjs` namespace.

## Repair
Added `tests/brain-targeted-route-regression-helper-import-v1.test.mjs` and pointed historical replay and canary evidence to it.

## Prevention
All future machine-readable learning evaluations must use canonical Brain test paths accepted by the learning canonicalization gate.
