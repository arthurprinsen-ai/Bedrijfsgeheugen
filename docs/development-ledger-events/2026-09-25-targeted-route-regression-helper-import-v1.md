# Development ledger — targeted-route regression helper import

Date: 2026-09-25
Obligation: `governance-production-trigger-ownership-v1`
Supersedes: PR #3098 post-merge closure defect

## Failure
Required run `36173570951`, job `website / baseline`, failed with `ReferenceError: isHardAssetFailure is not defined`.

## Root cause
The regression test referenced an exported helper without importing it.

## Repair
Added the missing named import only. No browser-runtime semantics changed.

## Prevention
Machine-readable learning `targeted-route-regression-helper-import-v1` requires explicit imports for test helper references.


## Post-merge Skill Projection recovery
The merged learning still referenced `tests/targeted-website-route-regression.test.mjs` as historical replay. Skill Projection rejected that non-Brain path. Recovery adds a Brain-prefixed replay wrapper, updates the learning reference and adds a durable preflight rule to the delivery self-optimization skill.
