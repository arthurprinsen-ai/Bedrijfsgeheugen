# Website cross-browser repair — 2026-10-03

Obligation: `website-cross-browser-cls-header-stability-20261003-v1`

Baseline production evidence:
- workflow run: `37133905331`
- 247 public routes
- 592 render checks
- 24 interaction checks
- 73 failures
- 42 CLS failures

Repair lineage:
- stabilize desktop language selector before first paint;
- stabilize mobile menu geometry before runtime enhancement;
- use canonical `/product` in visual matrix;
- test real menu/language controls;
- preserve exact candidate preview authority on PRs;
- capture CLS source selectors/rectangles for remaining shifts.
