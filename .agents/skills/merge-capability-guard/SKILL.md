---
name: merge-capability-guard
description: Mandatory when an agent changes GitHub rulesets, branch protection, merging, release orchestration or investigates 422 Invalid rule merge_queue errors.
---
# Merge capability guard
Read `docs/agent-skills/repository-merge-capability-guard.md`.
Before any merge queue/ruleset write, obtain live repository owner metadata. Call `determineMergeCapability` and `filterUnsupportedMergeQueueRules` from `tools/delivery/merge-capability-guard.mjs` in the ruleset writer. A personal User-owned repository always uses protected PR; an Organization owner alone does not prove queue entitlement. 422 Invalid rule merge_queue must not be retried unchanged. Do not transfer ownership autonomously. Integrate this helper at the existing writer entrypoint; this skill file on its own does not enforce external API mutations.
Never claim production green until exact-head Required/BRAIN/CodeQL, latest base, protected merge, provider deploy and independent production readback are proven.
Regression: `node --test tests/merge-capability-guard.test.mjs`.
