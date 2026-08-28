# Bedrijfsgeheugen Brain — Internal Mission Dispatch Runtime

## Purpose
This document records the bounded runtime contract for internal Brain Mission dispatch. It does not create a new source of truth or production authority.

## Components
- `BG158` (`7132559`) — deterministic portfolio input / Mission proposal.
- `BG182` (`7142406`) — persists every Mission through BG168 and dispatches only eligible internal `CONTENT_DEMAND` work.
- `BG183` (`7142431`) — evidence-first creative handoff with atomic duplicate coalescing, bounded Context Compiler, PH03 evidence audit, and PH10 internal worker handoff.
- `BG168` (`7136176`) — outcome/learning routing.
- `BG166` (`7135971`) — immutable event/learning history used for deterministic evidence resolution.
- `BG167` (`7136045`) — compact current-state/team-context projection; not a complete evidence database.
- `BG169` (`7137190`) — production authority.

## Eligibility gate
BG182 may dispatch to BG183 only when all are true:
- lane is `CONTENT_DEMAND`;
- confidence >= `0.75`;
- evidence quality >= `0.75`;
- work remains `INTERNAL_SAFE` / shadow;
- `side_effects_authorized=false`.

Anything below the gate is persisted only. The dispatcher does not publish, send DMs, contact customers, mutate production, change credentials/permissions, weaken security or authorize new paid resources.

## Idempotency before paid work
BG183 must reserve the Mission before starting any paid specialist. Reservation identity is derived from `mission_id + trace_id` in a bounded time bucket. A duplicate returns `DUPLICATE_MISSION_COALESCED` and must report `paid_agents_dispatched=false`.

Regression reference: execution `a707e04d4885415ca4b808bb6877ff44` reached only the reservation/error-handler path and invoked zero paid specialists.

## Bounded Context Compiler
BG183 extracts the Mission's required `evidence_refs` and performs one bounded deterministic query against BG166 immutable learning/history before PH03 runs.

Rules:
1. Evidence existence is decided by deterministic BG166 lookup, not by whether the record appears in BG167's compact recent projection.
2. `required_count == resolved_count`, `missing=[]`, and `all_refs_resolved=true` are the green evidence-resolution state.
3. Any unresolved required reference keeps the Mission internal and fail-closed.
4. The model may reason about resolved evidence but may not promote inference into evidence.
5. Mission confidence/evidence scores supplied by the candidate remain claims unless independently corroborated.

Verified canary: BG183 execution `716cf706cf824ba58157a52a4af386f0` resolved 2/2 required fingerprints from BG166.

## Ordered specialist handoff
For eligible creative/content Missions the order is fixed:
1. reserve/dedupe Mission;
2. compile deterministic evidence packet;
3. PH03 Intelligence audits evidence vs inference;
4. native Make Sleep provides bounded completion buffer;
5. read exact PH03 execution result;
6. validate completion fail-closed;
7. PH10 Calendar/Content receives Mission + deterministic packet + PH03 audit;
8. specialist outcome returns through existing learning routes.

Use native Make timing primitives rather than JavaScript sleeps. A JavaScript 35s wait exceeded the Make Code runtime and failed; native Sleep succeeded.

## Acceptance evidence
- PH03 execution `dfecddf2a44545a8959fd9ce2dbab1d1`: both required BG166 refs resolved; `missing=[]`; internal handoff marked merge-ready.
- PH10 execution `318d9e6265b6470087ef8a3a83eb0c64`: `EVIDENCE_USABILITY: MERGE-READY`; no external side effects.
- BG183 execution `1685fc647adb49f09b67b1470e7a3401`: native wait path completed in correct PH03-before-PH10 order without code timeout.

## Classifier semantics
BG168 must classify semantic outcomes, not incidental words in prose:
- approved governance/architecture ruling -> contract change;
- explicit governance block -> error;
- evidence audit mentioning `PRODUCTION_PROMOTION` as missing/absent -> not a promotion;
- production promotion requires affirmative exact-production evidence.

BG167 may suppress known historical false classifications from Current State but must never rewrite BG166 immutable history.

## Hard boundaries
This internal runtime cannot autonomously:
- change secrets, credentials or permissions;
- weaken security controls;
- perform destructive/irreversible data mutation;
- increase paid external resources;
- make legal or financial commitments.

Production mutation remains governed by the existing exact-candidate, QA, security, cost/performance, preview/canary and BG169 production-authority gates.

## Rollback
If BG183 regresses:
- keep Mission persisted in BG168/BG166;
- stop internal specialist dispatch;
- restore BG182 to persisted-only behavior or direct bounded internal behavior as last-known-good;
- preserve production untouched;
- repair the candidate using the green-until-done loop.
