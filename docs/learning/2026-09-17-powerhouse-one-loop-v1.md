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


## Consolidated terminal closure — 2026-09-18

Status: **LIVE_PROVEN / LEARNED / FULFILLED** for the original One Loop obligation.

Consolidated evidence recovered from superseded documentation candidates #1994, #1995 and #1997:

- implementation PR #1968 reached exact head `4a8c58548ffd4b5f1b9c9996bd682d81f42d6c86` with Required run `35271798560` and BRAIN delivery run `35271798909` terminal green, then protected squash-merged as `6ae18de754cb33044108d85ba704c965a5287b88`;
- post-merge readback exposed a squash-merge identity gap rather than a product regression: a squash commit has one parent and therefore completion logic may not assume a second parent;
- canonical recovery PR #1984 exact head `97c01ebf4c4e0538fdf3d012e2c2838aad6d6d04` passed Required `35274102801`, BRAIN `35274102768` and Powerhouse CodeQL `35274102310`, then protected-merged as `4fda9309eefa259b2a7f492ca929b8d472055d5e`;
- production readback `35274800041`, Outcome Obligation Sweep `35274960927`, configuration watch `35274800039` and merged-branch cleanup `35274800189` all succeeded on the recovered lineage;
- the earlier exact head `ff9f61dd625260f61fa6df4f1dde3cfa1f3e8ded` exposed a delivery-classifier gap for `tests/menu-balk-writer-noop-proof.test.mjs`, `tests/repository-writer-permission-boundary.test.mjs` and `tests/repository-writer-slow-canary-sla.test.mjs`; these were stale classifier/oracle assumptions, not a product defect.

Permanent non-regression rules consolidated here:

1. **ONE_OBLIGATION_ONE_EXECUTABLE_CANDIDATE** — one material obligation has one active executable candidate and one recovery owner.
2. **PR_SINGLE_FLIGHT** — newer heads supersede stale work; exact SHA remains verification and merge evidence.
3. **NO_BLIND_RERUNS** — only the first deterministic failure on the current exact head authorizes repair.
4. **CLASSIFIER_COCHANGE_REQUIRED** — new governance/control-plane tests receive bounded delivery-lane classification in the same change.
5. **STALE_ASSERTIONS_FOLLOW_VERIFIED_ARCHITECTURE** — repair obsolete assertions after verified architecture change; do not restore redundant fan-out merely to make CI green.
6. **SQUASH_MERGE_IDENTITY_MUST_BE_EXPLICIT** — when the production commit has no second parent, resolve identity only from an unambiguous merged PR whose merge commit equals production; otherwise fail closed.
7. **POST_MERGE_FAILURES_ARE_OPERATOR_VISIBLE** — cleanup or reconciliation failures persist durable evidence and surface a concrete operator-visible error.
8. **FULFILLED_REQUIRES_END_TO_END_PROOF** — exact-head gates, protected merge, production/main readback, outcome reconciliation and canonical learning writeback are all mandatory.

Future chats and agents must retrieve and reuse this consolidated learning before creating a new recovery lineage for equivalent delivery failures.
