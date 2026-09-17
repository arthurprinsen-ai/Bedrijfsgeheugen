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
