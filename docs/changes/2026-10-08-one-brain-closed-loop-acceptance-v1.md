# One Brain closed-loop acceptance contract (2026-10-08)

Status: SPECIFIED — not production proven. Extend the existing canonical Powerhouse and Portal; do not introduce a second orchestrator or truth store.

## Required invariant
source -> change -> tenant-specific impact -> evidence-backed recommendation -> authorized action -> observed outcome -> learning -> reprioritization. Every transition carries correlation_id, tenant_id, source provenance, timestamp, policy decision, and evidence reference. Reject missing tenant scope or unauthorized transitions. No cross-tenant learning with identifiable customer data.

## Acceptance gates
1. Sources: registry with owner, license, jurisdiction, last_seen, freshness SLA, failure state and replayable ingest evidence.
2. Impact: deterministic tenant-scoped evaluation and explanation; dedupe signals; reject stale evidence.
3. Recommendations: strategy/goal link, estimated upside/downside, confidence, source citations, owner and next action.
4. Execution: explicit authorization and idempotency key; provider receipt and readback, or remain pending/blocked. Never mark attempted as completed.
5. Outcomes: baseline, measurement window, observed metric, attribution limits and forecast error; retain learning and replay/shadow/canary evaluation.
6. Content: verified actual development events only; channel-specific wording; duplicate prevention; provider proof required for PUBLISHED.
7. Portal: single navigation, identity, tenant context, evidence, security and data-sovereignty controls across modules.
8. Assurance: exact-main commit -> protected checks -> deployment SHA -> authenticated production readback -> evidence freshness. GREEN only when all applicable gates pass; otherwise evidence-partial/blocked.

## Implementation guardrails
Existing-state-first: map each gate to existing modules/jobs/tests before adding code. No duplicate heartbeat, no bypass of protected CI, no invented proof, no disabling executors for recoverable errors. Bounded polling, checkpoints with exact SHA, and resume from last evidence.

## Required next delivery
Create a machine-readable coverage matrix mapping each gate to concrete existing code paths, tests, runtime endpoints, proof IDs and missing links. Implement only verified gaps in bounded PRs, with regression tests and exact-production readback. This document alone is not implementation or closure.
