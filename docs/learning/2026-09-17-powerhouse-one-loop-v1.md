# POWERHOUSE-ONE-LOOP-v1 learning

## Incident class

`stranded-delivery-or-interrupted-execution-v1`

## Problem

Powerhouse already had strong protected-main, delivery hygiene, ingress, exact-head and learning primitives, yet material work could still accumulate as commits, open or superseded PRs, queued CI, stopped chats, timeouts, lost workers and partially completed recovery paths.

## Root cause

The existing controls were strong per surface but the global invariant was implicit rather than executable: incomplete execution had not been made universally non-terminal across agent/chat, GitHub delivery and runtime completion. That left room for parallel candidates, start-more-than-finish behavior and repeated recovery analysis.

## Structural prevention

POWERHOUSE-ONE-LOOP-v1 makes the lifecycle explicit and executable:

- one obligation owns at most one active executable candidate;
- committed/open-PR/queued-CI/interruption/timeout/lost-worker/expired-lease states require recovery rather than completion;
- material runs carry durable heartbeat/lease/checkpoint identity and recover idempotently after readback;
- finishing admitted work receives capacity before lower-priority new starts;
- GitHub delivery telemetry is normalized into repeatable learning evidence and failure fingerprints;
- reusable learning is promoted into tests, gates, guardrails, skills/instructions or recovery policy;
- completion still requires protected merge, runtime/readback evidence and canonical learning closure.

## Non-regression rule

Never solve this class by adding another queue, scheduler, brain, database or learning store. Extend the existing Brain/control-plane and delivery hygiene; keep GitHub and external providers as execution/telemetry surfaces.

## Release lineage

Canonical implementation candidate: PR #1968. Final exact-head, protected-merge and main/readback evidence must be appended after protected delivery completes; until then this learning remains implementation evidence, not a LIVE_PROVEN claim.

## Recovery checkpoint — 2026-09-17

- Exact-head evidence is authoritative only while it matches the live PR head. A deterministic `Verify consolidated Shared Agent Memory contracts` failure observed in Required automation job `105362635664` belonged to superseded head `12ce90394d40e6ae64cf6efb0be54d0e4ca9bd49`; after the PR moved, that job became historical diagnostic evidence and must not authorize a repair or promotion.
- The next observed authoritative head was `7991126e846e59f94ef21ff322dc8c5743c5600d`. Required run `35270822607` admitted the canonical candidate successfully in job `105369402433`.
- The following preflight job `105369489405` was observed queued at readback. This is a recoverable/non-terminal provider-capacity state, not a failure, and must not trigger a blind rerun, no-op commit, gate bypass or terminal blocker classification.
- A moved head supersedes every older current-state conclusion immediately. Historical failures remain useful for learning, but root-cause repair must always be based on the first deterministic assertion from the latest exact head.

### Checkpoint prevention rule

`SUPERSEDED_FAILURE_IS_HISTORY_NOT_REPAIR_AUTHORITY`: when the live candidate head changes, any failure from the previous head may be retained as lineage evidence but cannot justify code mutation, rerun policy, merge authority or release evidence for the new head. Re-read admission/workflow state on the new head and wait through valid queued/in-progress states until a current deterministic failure or terminal success exists.

## Consolidated-contract recovery checkpoint — 2026-09-17

The live candidate subsequently advanced to exact head `ff9f61dd625260f61fa6df4f1dde3cfa1f3e8ded`. PR readback records that the prior exact-head automation lane eventually reached terminal test failures after runner capacity recovered, and that root-cause inspection identified stale contract assertions against already verified consolidated architecture rather than a need to restore obsolete fan-out behavior.

Verified architecture used for the repair:

- shared-memory PR verification belongs to the consolidated Required/automation lane;
- menu-writer PR identity is derived from canonical action outputs;
- the GitHub Actions PR-creation hard boundary is `RESOLVED_VERIFIED`;
- writer operational-verification SLA is enforced by the consolidated dispatch job.

The assertions were reconciled on the same One Loop candidate lineage; release/security gates were not weakened and no parallel verification system was introduced.

At readback for `ff9f61dd625260f61fa6df4f1dde3cfa1f3e8ded`, `Required test`, CodeQL/Powerhouse CodeQL and Engineering Supply Chain Trust were still non-terminal (`in_progress`), while BRAIN delivery was `pending`; Fresh Device Autonomy Canary and Unified Content Operations were green. These states remain execution evidence only and do not constitute completion.

### Additional prevention rule

`STALE_ASSERTION_MUST_FOLLOW_VERIFIED_ARCHITECTURE`: when workflow consolidation or a verified architecture change intentionally moves a contract boundary, a failing assertion that still encodes the superseded boundary must be repaired at the test/oracle layer after verifying the new architecture. Never reintroduce redundant fan-out, weaken a gate, or classify the stale assertion as a product regression merely to make CI green.


## Delivery-classifier contract gap and terminal closure — 2026-09-18

### Incident fingerprint

`delivery-classifier-repository-writer-contract-gap-v1`

### Concrete failure

On the then-current exact head `ff9f61dd625260f61fa6df4f1dde3cfa1f3e8ded`, the Required preflight failed before Shared Agent Memory verification. The first deterministic failure was the fail-closed delivery classifier rejecting these three existing regression tests as unclassified paths:

- `tests/menu-balk-writer-noop-proof.test.mjs`
- `tests/repository-writer-permission-boundary.test.mjs`
- `tests/repository-writer-slow-canary-sla.test.mjs`

This was a delivery-classification contract gap, not a product defect and not a reason to weaken the classifier. The tests belonged to the existing writer/backend control-plane family; their filenames simply did not match the already admitted prefixes closely enough.

### Root-cause rule

`CLASSIFIER_COCHANGE_REQUIRED`: whenever a material governance or regression test is added, renamed, moved or introduced on a delivery lineage, its canonical delivery-lane classification must be changed in the same bounded candidate. A test that is semantically part of an existing control-plane family may not rely on a near-match naming convention that the classifier does not actually recognize.

### Recovery behavior

- Always re-read the current PR head before acting.
- A failure from a superseded head remains historical evidence only.
- Repair authority comes from the first deterministic failure on the current exact head.
- If classification is the first failure, repair only the classifier contract needed for the legitimate existing path; do not edit test semantics and do not broaden unrelated lane patterns.
- Re-run the same lineage after the bounded repair; only then may deeper failures such as Shared Agent Memory become actionable.
- Queued, pending and in-progress checks remain non-terminal WAIT/EXECUTING states and never justify no-op commits or blind retries.

### Terminal evidence

The original implementation PR #1968 ultimately reached terminal green on exact head `4a8c58548ffd4b5f1b9c9996bd682d81f42d6c86` and was protected squash-merged as `6ae18de754cb33044108d85ba704c965a5287b88`.

A downstream squash-merge completion-identity issue was then recovered on the same canonical obligation through recovery PR #1984. Recovery exact head `97c01ebf4c4e0538fdf3d012e2c2838aad6d6d04` passed Required, BRAIN delivery and Powerhouse CodeQL, and protected merge produced main SHA `4fda9309eefa259b2a7f492ca929b8d472055d5e`.

Production Release Readback, Outcome Obligation Sweep, Configuratiewacht and merged-branch cleanup all completed successfully on that recovery main lineage. The machine-readable Powerhouse source of truth therefore records:

- state: `LIVE_PROVEN`;
- lifecycle: `LEARNED -> FULFILLED`;
- obligation: `powerhouse-one-loop-v1`;
- prevention: classifier co-change, exact-head-only repair authority, stale-run supersession, squash-safe completion identity and operator-visible post-merge failures.

### Permanent non-regression contract

Future agents/chats must reuse this learning before diagnosing equivalent delivery failures. They must not start from zero, create a parallel recovery branch, restore obsolete fan-out, bypass fail-closed classification, or mutate code from a superseded CI result. The canonical sequence remains:

`current state -> exact-head evidence -> first concrete failure -> bounded root-cause repair -> exact-head gates -> protected merge -> production/main readback -> outcome -> learning/writeback -> prevention -> fulfilled`.
