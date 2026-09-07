# Interaction Quality Gate — controller review

## Scope reviewed

- contract registry and fail-closed validator;
- final-build wiring checker;
- browser readability/overlap/state assertions;
- Playwright coverage for homepage scroll story and Platform/Expertise toggle;
- PR preview workflow;
- production readback workflow;
- integration into existing required `test` workflow;
- preservation of the existing `tests/v18-vergelijker.test.mjs` protected regression.

## Findings and rulings

1. Branch protection API returned 403 (`Resource not accessible by integration`). Ruling: do not claim the new standalone workflow is configured as a new required check.
2. The existing required workflow exposes job name `test`. Ruling: add the interaction static and browser gate to that existing job so interaction failures block the already-protected release path without requiring branch-protection mutation.
3. Current `main` added `tests/v18-vergelijker.test.mjs` after this branch started. Ruling: preserve that test explicitly in the required workflow; never trade one UI regression gate for another.
4. Production readback uses the exact same Playwright spec as deploy preview. Production failures are reported as `preview-production-drift` with the original interaction failure class retained.

## Review result

Implementation is ready for GitHub PR/CI validation. No merge or production-success claim is permitted until GitHub reports the branch mergeable and the required checks, including `test`, are green.
