# Powerhouse Make Cost Architecture Design

## Goal
Reduce Make credits, API calls, AI-token usage, data transfer, browser load, and runtime across the complete Powerhouse scenario estate while preserving production semantics, commercial responsiveness, publishing guarantees, approvals, security, self-healing, observability, and learning.

## Scope
This applies to all current and future Make scenarios in the Powerhouse/Bedrijfsgeheugen landscape, including frontend/API read paths, Notion/Datahub synchronization, publishing chains, DM/commercial flows, agents, cost/runtime guardians, SEO/research, metrics collection, production promotion, and successor scenarios.

## Protected contracts
The optimizer must never reduce cost by breaking or weakening:

- approval, brand, narrative, or publication gates;
- idempotency, deduplication, attribution, or auditability;
- commercial P0/P1 action freshness and unanswered inbound handling;
- source-of-truth integrity in Datahub/Notion/backend projections;
- production promotion, rollback, security, QA, self-healing, and observability;
- required SLA/freshness for customer-facing or time-sensitive paths;
- outcome logging and learning required by the Powerhouse brain.

A change with more than 10% regression in a protected metric is rejected unless explicitly justified by stronger evidence and accepted as a deliberate trade-off.

## Target architecture
All eligible scenario paths converge on this execution order:

`event/change -> one authoritative source -> bounded delta -> cached/precomputed projection -> deterministic processing -> AI only on material uncertainty/change -> one deduplicated write -> learning/telemetry`

This replaces recurring patterns such as full scans, repeated Notion fan-out, broad payload retrieval, polling where change events exist, duplicate reads/writes, unnecessary nested scenario calls, and AI calls on empty or deterministic paths.

## Cost optimization ladder
For every scenario, evaluate opportunities in this fixed order:

1. Remove duplicate, dead, failed, or superseded work.
2. Reuse a cached/precomputed current-state projection before live source reads.
3. Replace full scans with change-only/delta windows.
4. Bound page size, execution sample size, webhook history, and collection size.
5. Retrieve only fields consumed by downstream modules.
6. Batch and deduplicate writes; write once when a single state update is sufficient.
7. Skip downstream branches when input is empty, unchanged, stale, already processed, or deduped.
8. Use deterministic code/filters instead of AI for classification, validation, routing, fingerprints, and known policies.
9. Use the cheapest adequate model only when AI is still required.
10. Reduce polling frequency only when the verified SLA allows it; prefer event/webhook/change triggers.
11. Retire or consolidate overlapping scenarios only after compatibility mapping and regression evidence prove the successor fully covers the contract.

## Scenario classes
### A. Read-heavy cockpit/API paths
Normal UI opens must be cache-first. A cache hit must not fan out to Notion/Datahub/source systems. Cache misses use write-through caching so one rebuild serves subsequent reads. Default current-state TTL is 3600 seconds unless evidence requires greater freshness. Frontend refreshes should use version/ETag/fingerprint checks and delta updates rather than full reloads.

### B. Notion/Datahub synchronization
Queries must use the narrowest source and bounded candidate set. Filters should represent the actual semantic intersection, not accidentally widen candidate selection. Completed or already attributed objects should not re-enter expensive normalization paths. Writes must be idempotent by stable key.

### C. Publishing
Do not reduce publish reliability or bypass approval. Production and verification remain event-driven or due-time driven. Expensive media generation happens only for approved items that still require it. Retries remain bounded and idempotent. Successful publication should not trigger unnecessary follow-up AI.

### D. Agents
Agent runners receive compact task context, not large shared-context dumps. Shared learning is fetched only when needed and by exact key or bounded query. Deterministic health checks return deterministic results without an AI call when practical. Agent-to-agent sharing must not create recursive or unconditional extra runs.

### E. Guardians and monitoring
Prefer one guardian to enforce a class of invariants rather than adding new polling scenarios. Deep diagnostics inspect one candidate/hypothesis per pass by default. Error samples and execution history are bounded to the smallest evidence window needed to diagnose the incident.

### F. Research, SEO, and external data
Research runs only for approved/needed topics and reuses prior evidence until freshness expires. Search and analytics ingestion use deltas and fingerprints. Large payloads are summarized once and persisted for reuse.

## Optimization governance
Each material optimization follows the same transaction:

1. Capture baseline scenario id/name, schedule/trigger, recent operations, credits, transfer, duration, error rate, and protected metrics.
2. State one root-cause hypothesis.
3. Apply one bounded reversible change.
4. Run or observe an equivalent execution.
5. Compare post-change operations, credits, transfer, duration, correctness, and protected metrics.
6. Keep only if verification is green; otherwise rollback.
7. Record the optimization, evidence, savings, regression result, and learning so future agents reuse it.

No blind mass mutation is allowed. The estate is optimized in waves, highest-cost first.

## Priority waves
### Wave 1 — top consumers and broken cost machinery
Focus first on scenarios with extreme cumulative transfer/credits or guaranteed waste. Current observed high-priority examples include Mission Control/API read paths, DM identity/learning synchronization, content/SEO loops with broad Notion chains, and cost/agent infrastructure itself.

### Wave 2 — medium-cost recurring jobs
Optimize scheduled ingestion, metrics, narrative/calibration, SEO learning, and cross-channel production by reducing query breadth, branch execution, AI calls, and write amplification.

### Wave 3 — long tail
Review low-volume scenarios for duplicated functionality, superseded versions, stale monitors, unnecessary schedules, and opportunities to consolidate under existing guardians.

## Existing changes that become regression contracts
The following patterns are already established and must not be reintroduced:

- Mission Control must remain cache-first and must not cause live Notion fan-out on normal reads.
- DM learning must remain bounded, idempotent, attribution-preserving, and focused on recent/change candidates.
- The Cost Optimizer must not depend on a broken full-context datastore call or unconditional extra team-learning dispatch.
- Cost/runtime guardians must not increase polling frequency as a substitute for event-driven integrity.

## New-scenario admission rule
A new scenario cannot be considered production-ready unless it documents:

- authoritative source and stable dedupe/idempotency key;
- trigger choice and why polling is necessary if used;
- maximum candidate/batch size;
- cache/delta strategy for read-heavy paths;
- AI justification and deterministic alternative considered;
- expected operations/credits/transfer per normal run;
- protected metrics and rollback path;
- compatibility mapping to existing scenarios so duplicate ownership is avoided.

## Success measures
The optimization program is successful when:

- Make credits per useful business outcome trend downward week over week;
- data transfer per cockpit/API request and per scheduled sync materially declines;
- AI-token consumption decreases without loss of commercial/content quality;
- duplicate scenario ownership and redundant writes decline;
- error rate, publishing reliability, action freshness, security, and data integrity do not regress;
- new scenarios automatically conform to the same cost architecture.

## Rollback and safety
Every mutation must be reversible. Scenario deactivation or retirement requires proof of successor coverage and compatibility. Schedule reductions require verified SLA evidence. Publishing and commercial automation may not be made cheaper by silently dropping required checks or delaying time-sensitive work beyond its contract.

## Implementation boundary
This design authorizes systematic cost optimization but not indiscriminate rewrites. Execution should be split into reviewable waves with regression evidence after each scenario or tightly coupled scenario group. The highest-cost safe wins are implemented first; architectural consolidation follows only when operational evidence proves equivalence.
