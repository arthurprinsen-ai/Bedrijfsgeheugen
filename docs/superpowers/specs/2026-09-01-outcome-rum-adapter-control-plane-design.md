# Outcome, RUM & Adapter Control Plane Design

## Purpose
Close three remaining generic platform gaps without introducing a second Brain: 30/90/180 realised-value evaluation, runtime/RUM ingest through SLO evidence, and estate-wide external-app adapter conformance.

## Architecture
The canonical Whole Brain remains the system of record. New code extends the existing operating-loop contracts and uses thin workers/adapters. All completion remains fail-closed and evidence-driven.

### 1. Generic 30/90/180 outcome loop
Every material verified Outcome can produce exactly three horizon obligations: 30, 90 and 180 days. Each obligation is deterministic and idempotent by `(tenantId,outcomeId,horizonDays)`. An evaluator may process only due/overdue obligations. Before due date the state is `PENDING` and can never be promoted to realised value.

A due evaluation requires current evidence. With sufficient evidence it records a verified Value result and exposes the next canonical learning handoff (`Value -> Learning -> Memory`). With insufficient evidence it remains `WAITING_FOR_EVIDENCE` with owner, retry policy and next evaluation time instead of manufacturing value.

### 2. Runtime/RUM ingest and SLO closure
The existing authenticated browser sender, runtime metric handler and `assessRuntimeSlo` remain authoritative. The missing generic capability is server-side processing after ingest: accepted metric -> persisted raw metric -> deterministic window aggregation -> p95 cached/interactive SLO -> CurrentState/evidence -> breach obligation/learning handoff.

No synthetic samples are allowed. Fewer than the minimum real sample count remains `NOT_PROVEN`. An SLO breach creates an owned runtime outcome obligation; it does not blindly retry or fabricate green evidence.

### 3. Estate-wide adapter conformance
`BRAIN-PLATFORM-ADAPTER-v1` remains the registry contract. A conformance engine evaluates every registered platform against the same evidence fields: compatibility mapping, regression contract, shared memory, health/freshness/error/owner/cost/revision telemetry, capacity, execution proof, exact revision evidence, rollback evidence and whole-brain lineage.

Unknown or future adapters inherit fail-closed registration automatically. Registry presence is not production readiness. Each adapter receives `READY`, `INCOMPLETE` or `BLOCKED` plus machine-readable missing controls.

## Components
- `brain/operating-loop/outcome-horizons.mjs`: pure deterministic scheduling/evaluation rules.
- `brain/operating-loop/runtime-slo-window.mjs`: pure runtime aggregation and SLO projection.
- `brain/operating-loop/adapter-conformance.mjs`: pure registry/evidence conformance evaluator.
- `brain/contracts/outcome-horizon-loop-v1.json`: generic horizon contract.
- `brain/contracts/runtime-rum-ingest-v2.json`: full ingest-to-SLO evidence contract.
- `brain/contracts/adapter-conformance-v1.json`: estate-wide conformance contract.
- Tests under `tests/brain-*` proving fail-closed behavior.

## Data flow
Outcome: `Verification -> Outcome -> Horizon Obligations -> Due Evaluation -> Value -> Learning -> Memory`.

Runtime: `Authenticated Browser Timing -> brain-runtime-metric -> Raw Metric -> Window Aggregate -> SLO -> Runtime Outcome/Obligation -> Learning`.

Adapter: `Registry -> Evidence Snapshot -> Conformance -> Production Readiness -> CurrentState/Cockpit`.

## Failure handling
- No early 30/90/180 verification.
- No synthetic RUM.
- No adapter readiness from registration alone.
- Missing/ambiguous runtime identity, capacity or execution proof fails closed.
- Retry is bounded and only after evidence state changes or the configured evaluation time arrives.

## Production completion
Implementation is not PROVEN by code or CI alone. Final evidence requires governed exact-head delivery, exact production identity/readback, real authenticated RUM samples for SLO proof, due-date arrival for realised 30/90/180 value, and current production evidence for each adapter promoted READY.
