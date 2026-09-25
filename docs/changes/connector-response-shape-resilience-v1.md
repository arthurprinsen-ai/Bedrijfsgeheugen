# Connector response-shape resilience

## Incident

On 2026-09-25 a bundled GitHub write stopped before writing to the branch. The create-tree response did not expose the tree SHA in the field the caller expected.

That is a connector schema/envelope compatibility defect, not a repository-content defect.

## Permanent operating rule

All chained connector mutations must separate **semantic identity** from **transport shape**.

The caller first normalizes the response into canonical values such as `sha`, `commit_sha`, `id`, `ref`, `url`, and `status`. Only after the required identifier has been proven may the next mutating step execute.

Missing required identity means fail-before-mutation.

## GitHub write fallback

The preferred fast path may use Git data/tree APIs when the connector contract is proven. If the returned tree SHA cannot be normalized safely, the agent must stay on the same branch and obligation and use branch-safe Contents API writes (`create_file` / `update_file`) instead.

This fallback is deliberately slower but removes dependence on an ambiguous intermediate tree payload. It must not create a second recovery PR and must not replay already-proven writes.

## Terminal continuation

Fallback is recovery, not completion. After the safer write succeeds, the same delivery lineage remains active through:

- exact-head required checks;
- any same-PR metadata/canonicalization repair;
- protected merge;
- protected-`main` containment/readback;
- production/provider readback when a runtime surface changed;
- Brain/skill/ledger closure evidence.

For governance, documentation and skill-only changes, no website deployment is manufactured. The applicable terminal proof is protected-`main` containment plus the relevant governance/readback checks.

A queued or running healthy gate is not a user-owned next step. The agent remains responsible for the same lineage while it can still proceed autonomously.

## Required evidence

For every connector mutation chain:
- preflight the current tool contract when exposed;
- validate returned semantic identifiers;
- preserve raw response-shape evidence without secrets on mismatch;
- read back branch/commit/provider state after mutation;
- write the incident fingerprint into Brain learning and the development ledger;
- project durable prevention into the relevant agent skill;
- prove terminal containment instead of stopping at PR or merge eligibility.

Canonical fingerprint: `connector|response-shape|normalize-before-use|v1`.

Canonical regression: `tests/brain-connector-response-shape-normalization-v1.test.mjs`.

## Proven closure

PR #3100 was protected-merged on 2026-09-25. Protected `main` was read back at commit `bc47d636675f9fea41044667797dade0962b03ef`, with the canonical skill, Brain learning, human documentation, development ledger and regression test present on `main`.

The original candidate head had successful Required test and Powerhouse Skill Projection. This change class did not require a Netlify website deployment because it changed governance/skills/documentation rather than the deployable website runtime.