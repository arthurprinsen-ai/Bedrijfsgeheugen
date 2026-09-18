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

Canonical implementation candidate: PR #1968. This paragraph described the pre-merge state and is retained as historical lineage context only. The terminal authority is the closure section below and the machine-readable Brain learning at `brain/learning/2026-09-17-powerhouse-one-loop-v1.json`.

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


## Terminal closure — 2026-09-18 readback

Status: **LIVE_PROVEN / LEARNED / FULFILLED**.

Canonical evidence already persisted in the Powerhouse Brain and verified on main:

- PR #1968 exact implementation head: `4a8c58548ffd4b5f1b9c9996bd682d81f42d6c86`.
- Required run `35271798560` and BRAIN delivery run `35271798909` were terminal green on that same exact head.
- PR #1968 was protected-merged to `6ae18de754cb33044108d85ba704c965a5287b88`.
- Production Release Readback run `35272421517` succeeded and exposed a post-merge squash-identity completion gap rather than a product/runtime regression.
- Recovery PR #1984 closed that downstream completion-identity/cleanup gap on exact head `97c01ebf4c4e0538fdf3d012e2c2838aad6d6d04`.
- PR #1984 was protected-merged to `4fda9309eefa259b2a7f492ca929b8d472055d5e`.
- Production Release Readback run `35274800041`, Outcome Obligation Sweep run `35274960927`, Configuratiewacht run `35274800039`, and Merged Branch Cleanup run `35274800189` all completed successfully.
- Machine-readable Powerhouse learning records lifecycle `LEARNED -> FULFILLED` and terminal state `LIVE_PROVEN`.
- Current main has subsequently advanced beyond the closure SHA; that normal forward movement does not invalidate the immutable historical evidence above.

### Permanent operating rules learned from this incident

1. **QUEUE_IS_NON_TERMINAL** — queued/pending/in-progress provider work is execution state, never completion and never by itself a reason for retry commits.
2. **ONE_OBLIGATION_ONE_EXECUTABLE_CANDIDATE** — one material obligation has one active executable candidate and one recovery owner.
3. **PR_SINGLE_FLIGHT** — concurrency is keyed by PR identity so newer heads supersede stale work; exact SHA remains verification and merge evidence.
4. **NO_BLIND_RERUNS** — reconcile current head/run state before any retry; stale or superseded failures are historical evidence only.
5. **FANOUT_REDUCTION_PRESERVES_COVERAGE** — workflow consolidation must re-home every regression contract in a canonical lane; never hide orphan tests as known-red.
6. **CLASSIFIER_COCHANGE_REQUIRED** — new governance/control-plane tests receive bounded delivery-lane classification in the same change.
7. **METADATA_IS_RELEASE_AUTHORITY** — delivery metadata must track legitimate candidate growth and lineage movement; do not weaken fail-closed validation.
8. **STALE_ASSERTIONS_FOLLOW_VERIFIED_ARCHITECTURE** — repair obsolete test/oracle assumptions after architecture consolidation instead of restoring redundant legacy paths.
9. **SQUASH_MERGE_IDENTITY_MUST_BE_EXPLICIT** — completion evidence cannot assume a two-parent merge; resolve identity from deterministic merged-PR evidence and fail closed on ambiguity.
10. **POST_MERGE_FAILURES_ARE_OPERATOR_VISIBLE** — cleanup/reconciliation failures must leave durable evidence plus a concrete surfaced error.
11. **NO_PARALLEL_BRAIN** — recovery, telemetry, learning and closure remain in the existing Powerhouse Brain/control-plane; never add a shadow queue, scheduler, database or learning store for this class.
12. **FULFILLED_REQUIRES_END_TO_END_PROOF** — exact-head verification, protected merge, production/main readback, outcome/reconciliation evidence and canonical learning writeback are all required.

### Reuse rule for all future chats and agents

Before diagnosing GitHub queue, interrupted execution or stuck delivery, retrieve this learning and the machine-readable Brain record first. Reuse these fingerprints and prevention rules before designing anything new. A future agent may extend this contract only when new evidence demonstrates an uncovered failure class.
