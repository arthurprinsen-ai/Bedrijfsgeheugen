---
name: merge-capability-guard
description: Mandatory when an agent changes GitHub rulesets, branch protection, merging, release orchestration or investigates 422 Invalid rule merge_queue errors.
---
# Merge capability guard
Read `docs/agent-skills/repository-merge-capability-guard.md`.
Before any merge queue/ruleset write, obtain live repository owner metadata. Call `determineMergeCapability` and `filterUnsupportedMergeQueueRules` from `tools/delivery/merge-capability-guard.mjs` in the ruleset writer. A personal User-owned repository always uses protected PR; an Organization owner alone does not prove queue entitlement. 422 Invalid rule merge_queue must not be retried unchanged. Do not transfer ownership autonomously. Integrate this helper at the existing writer entrypoint; this skill file on its own does not enforce external API mutations.
Never claim production green until exact-head Required/BRAIN/CodeQL, latest base, protected merge, provider deploy and independent production readback are proven.
Regression: `node --test tests/merge-capability-guard.test.mjs`.

## Required failure recovery: generated Portal System Map
If `Required` emits `SYSTEM_MAP_WRITEBACK_INCOMPLETE`, treat it as a reproducible source-inventory mismatch, not as a transient provider failure. Only the authorized canonical integration writer may update `platform/system-map/canonical-system-map.mjs` in the same release lineage. On a full checkout of the final integrated tree, run:
```sh
node scripts/brain/portal-explanation-inventory.mjs --write
node scripts/brain/portal-explanation-inventory.mjs --check
node --test tests/brain-portal-explanation-autosync-v1.test.mjs tests/brain-powerhouse-live-system-map-v1.test.mjs tests/brain-powerhouse-system-map-governance-v1.test.mjs
```
Inspect the complete generated diff (inventories, counts, provenance hash); never patch only the content hash or claim success from the previously calculated SHA. Commit the deterministic output with the intended source modifications, rerun Required and CodeQL on the exact resulting head, and repeat if new changes to main alter the integrated tree. Keep one writer; do not create a separate competing map PR or loop endlessly creating a replacement release branch. When a full repository checkout/generator execution is not available, record `GENERATOR_EXECUTION_UNAVAILABLE`, leave the release red, and route to the existing authorized integration owner.
