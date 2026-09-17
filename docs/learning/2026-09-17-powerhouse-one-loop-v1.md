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
