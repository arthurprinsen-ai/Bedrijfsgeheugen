# BRAIN Outcome Obligation Executor — Design

Date: 2026-08-30
Status: Proposed design for implementation planning
Scope: Generic execution of BRAIN outcome obligations

## 1. Purpose

BRAIN already has declarative outcome obligations in `config/outcome-obligations.json`, owner agents, evidence contracts, self-heal/recovery rules, and exact production verification. What is still missing is one current, generic runtime that actually evaluates obligations over time and turns due or missed obligations into governed work.

This design adds that missing execution layer without introducing a second source of truth or a Supabase-specific scheduler.

The executor must answer four questions deterministically:

1. Which obligations are due now?
2. Which owner agent is responsible?
3. Has independently acceptable evidence already satisfied the obligation?
4. If the obligation is missed or blocked, which governed recovery state is required?

The executor itself is orchestration only. It never declares production success and never performs arbitrary business mutations directly.

## 2. Architectural decision

Use a hybrid trigger model around one platform-independent executor.

- A periodic GitHub Actions sweep wakes the executor for time-based obligations.
- Event-driven callers may wake the same executor after relevant changes, for example a Supabase schema/performance change.
- Both routes invoke the same obligation engine and therefore share deduplication, state transitions, evidence requirements, recovery and logging.
- Triggers are thin. They do not contain domain decision logic.

This preserves the current architecture:

`obligation -> executor -> owner agent -> governed work -> independent evidence -> production verification -> BRAIN learning`

GitHub remains the executable source of truth for contracts and code. BRAIN remains the validated memory/decision layer. Notion remains a projection of validated state rather than an execution authority.

## 3. Source contracts

### 3.1 Obligation source

`config/outcome-obligations.json` remains the canonical declarative obligation registry.

Each executable obligation must resolve at minimum to:

- `obligationId`
- `ownerAgent`
- cadence or trigger semantics
- evidence requirement
- outcome/recovery policy
- hard-boundary behavior

Existing obligations are not rewritten merely to suit the executor. The executor adapts to the current contract where possible; contract extensions must be explicit and backwards compatible.

### 3.2 Agent source

The existing BRAIN agent registry remains authoritative for owner identity and capability. The executor must fail closed when an obligation refers to an unknown or disabled agent.

### 3.3 Evidence source

Completion requires independent evidence accepted by the obligation/evidence contract. Self-reported owner-agent success is insufficient.

Where production outcome evidence is required, the executor must wait for exact production verification before allowing `COMPLETED`.

## 4. Core components

### 4.1 OutcomeObligationExecutor

A deterministic, side-effect-minimal engine that receives:

- current time
- obligation snapshot
- trigger context
- prior execution/evidence state
- agent registry state

It returns an execution decision and next state.

The engine must be testable without network access or wall-clock dependence.

### 4.2 Trigger adapters

Two trigger families are supported initially:

1. `scheduled-sweep`
   - periodic wake-up
   - evaluates time-based obligations
   - low-cost default cadence

2. `event-trigger`
   - wakes the executor after a relevant governed event
   - includes a stable event fingerprint
   - does not bypass cadence/evidence/recovery logic

The Supabase performance obligation uses both daily evaluation and relevant-Supabase-change events through this same interface.

### 4.3 AgentWork dispatch record

The executor does not execute owner-agent business logic itself. It creates or reuses one idempotent work identity for the obligation/window/event.

Minimum dispatch identity:

- `traceId`
- `obligationId`
- `ownerAgent`
- `executionWindow`
- `triggerFingerprint`
- `idempotencyKey`
- `requestedOutcome`

A repeated scheduled or event trigger with the same effective work identity must not create duplicate work.

### 4.4 Evidence reconciler

The executor asks whether sufficient independent evidence exists for the current work identity.

Evidence reconciliation is separate from owner-agent dispatch. This prevents an agent from marking its own work complete without independent verification.

### 4.5 Recovery router

When an obligation misses its deadline or its expected evidence does not arrive, the executor emits a governed recovery decision. It reuses existing BRAIN self-heal/recovery concepts rather than creating a parallel incident framework.

## 5. State model

The executor uses the following externally meaningful states:

### `NOT_DUE`
The obligation exists but neither its schedule nor a relevant event requires action now.

### `PENDING`
The obligation is due and has been accepted for evaluation, but no owner work has yet been dispatched for this execution identity.

### `AWAITING_OUTCOME`
Owner work has been dispatched or completed locally, but independent required evidence is not yet sufficient.

### `MISSED_OBLIGATION`
The obligation's deadline/evidence window has passed without accepted evidence.

### `RECOVERING`
A governed recovery/self-heal action has been assigned for a missed obligation.

### `COMPLETED`
The required independent evidence exists and, where required, exact production outcome verification is green.

### `BLOCKED_HARD_BOUNDARY`
Execution requires an action the system is not authorized to take automatically, such as missing credentials, unavailable connector rights, paid-resource approval or a destructive/manual authorization boundary.

State transitions must be deterministic. A trigger cannot directly jump an obligation to `COMPLETED`.

## 6. Execution flow

For every wake-up:

1. Load canonical obligation and agent snapshots.
2. Normalize current time and trigger context.
3. Compute obligation execution window.
4. Compute stable idempotency key.
5. Reconcile prior work/evidence for that key.
6. If not due, return `NOT_DUE` without dispatch.
7. If a hard boundary prevents execution, return `BLOCKED_HARD_BOUNDARY` and record evidence.
8. If accepted evidence already satisfies the obligation, return `COMPLETED` idempotently.
9. If due and no work exists, create one governed `AgentWork` for the owner and return `AWAITING_OUTCOME`.
10. If work exists but evidence is still within the allowed outcome window, remain `AWAITING_OUTCOME`.
11. If the evidence window expires, transition to `MISSED_OBLIGATION` and assign governed recovery.
12. While recovery is active, return `RECOVERING` until independent evidence proves the required outcome.
13. Only after accepted evidence, and exact production verification where applicable, transition to `COMPLETED`.
14. Append state-transition/evidence metadata to BRAIN learning/audit storage.

## 7. Idempotency and duplicate prevention

A core requirement is that scheduled and event triggers cannot create duplicate work.

The idempotency key must be derived from stable fields, conceptually:

`obligationId | executionWindow | effectiveTriggerIdentity`

Rules:

- Replaying the same event fingerprint reuses the same work identity.
- Multiple scheduler wake-ups in the same execution window reuse the same work identity.
- A scheduled trigger and an event trigger that resolve to the same required outcome must coalesce where the obligation contract says they represent the same work.
- A genuinely new event after a completed prior window may create a new work identity.

Deduplication occurs before owner-agent dispatch.

## 8. Evidence and completion rules

The executor follows evidence-first semantics:

- Owner-agent assertions are activity evidence, not outcome evidence.
- CI green is not automatically production outcome evidence.
- Candidate creation or merge is not completion.
- Where the obligation is production-facing, exact deployed SHA/outcome must be independently verified.
- Evidence must reference the exact execution identity.
- Stale evidence from an earlier obligation window cannot satisfy a later one unless the obligation contract explicitly allows durable evidence reuse.

The executor stores only necessary metadata, references and hashes; it should not duplicate raw business payloads into governance logs.

## 9. Hard boundaries

The executor must fail closed for operations that require authorization outside its current scope.

Examples:

- missing or revoked credentials
- connector cannot perform the required write
- paid-resource creation requiring approval
- destructive actions outside established rollback-safe policies
- unresolved target/environment identity
- insufficient proof that the requested action applies to the current production state

A hard boundary produces `BLOCKED_HARD_BOUNDARY`, not fake success and not an uncontrolled workaround.

## 10. Recovery semantics

A missed obligation is a first-class BRAIN signal.

`MISSED_OBLIGATION` must include:

- exact obligation/work identity
- expected evidence deadline
- last accepted evidence state
- detected reason if known
- recovery owner
- trace/idempotency identity

Recovery uses the established safe loop:

`detect -> root cause -> regression test -> minimal fix -> retest -> production verification -> learning -> prevention`

The executor's role is to route and track this loop, not to bypass existing delivery authority.

## 11. Supabase performance obligation example

The existing Supabase performance obligation owned by `agent-performance` becomes the first end-to-end reference implementation.

Daily path:

1. Scheduled sweep evaluates the obligation.
2. Executor creates/reuses one daily work identity.
3. `agent-performance` collects performance evidence.
4. Trend governor evaluates observations.
5. If the result is `OBSERVE`, evidence is stored and the daily obligation completes.
6. If a safe candidate is justified, normal candidate PR/BRAIN delivery begins.
7. The obligation remains `AWAITING_OUTCOME` where an exact production remeasurement is required.
8. Post-production remeasurement records positive or negative learning before final completion.

Event path:

1. Relevant Supabase change emits an event fingerprint.
2. Same executor is invoked.
3. It coalesces duplicate/redundant triggers.
4. Only a genuinely new required measurement creates new owner work.

No linter finding directly causes DDL in production.

## 12. Scheduling

Initial periodic cadence should be low-cost and generic rather than one scheduler per obligation.

A single scheduled workflow wakes the executor and lets the obligation registry decide what is due.

The design must support more frequent future obligations without requiring a new scheduler architecture, subject to GitHub Actions/platform scheduling constraints and cost controls.

Event triggers remain optional accelerators; periodic reconciliation is the safety net that prevents lost events from permanently hiding due obligations.

## 13. Observability

Every meaningful transition must be observable with compact metadata:

- obligation id
- state
- owner agent
- trace id
- idempotency key
- trigger type/fingerprint
- execution window
- due/evidence deadline
- evidence refs
- recovery refs where applicable
- timestamps

Dashboards/Notion may project this validated state, but they do not become the canonical execution source.

## 14. Failure handling

### Configuration failure
Unknown obligation schema or owner agent -> fail closed and surface a governance/configuration failure.

### Dispatch failure
Do not create repeated work blindly. Preserve idempotency identity and enter recoverable pending/missed state based on deadline.

### Evidence source unavailable
Do not mark completed. Remain awaiting or become missed based on the evidence deadline.

### Scheduler/event failure
Periodic reconciliation eventually re-evaluates obligations. Lost event delivery therefore degrades latency, not correctness.

### Concurrent executors
The idempotency contract must make concurrent wake-ups safe. At most one effective owner-work identity may exist per obligation execution identity.

## 15. Security and privacy

- No secrets in obligation/evidence records.
- No raw customer/business payload duplication into executor logs.
- Owner agents receive only the context required for their governed task.
- All external writes remain subject to existing connector and delivery authorization.
- Destructive/unbounded operations remain fail closed.

## 16. Cost controls

The executor must minimize repeated work:

- one generic scheduled sweep
- cheap due-state evaluation before expensive connectors or agents
- idempotent trigger coalescing
- evidence reuse only when explicitly contract-valid
- no repeated polling when an existing pending state already has a defined evidence deadline
- no index/schema/product change based solely on linter INFO

## 17. TDD acceptance criteria

Implementation begins RED-first. Minimum failing tests before production code:

1. Future obligation -> `NOT_DUE`, no work dispatch.
2. Due obligation -> exactly one owner-agent work identity.
3. Repeated scheduled wake-up -> no duplicate work.
4. Replayed event fingerprint -> no duplicate work.
5. Scheduled + equivalent event trigger -> coalesced according to obligation contract.
6. Unknown/disabled owner agent -> fail closed.
7. Hard authorization boundary -> `BLOCKED_HARD_BOUNDARY`.
8. Owner self-report without independent evidence -> not `COMPLETED`.
9. Valid independent evidence -> `COMPLETED` when no production proof is required.
10. Production-facing obligation without exact production proof -> `AWAITING_OUTCOME`.
11. Exact accepted production evidence -> `COMPLETED`.
12. Evidence deadline exceeded -> `MISSED_OBLIGATION`.
13. Missed obligation -> one governed recovery identity, not repeated retries.
14. Recovery with accepted outcome evidence -> `COMPLETED` plus learning reference.
15. Supabase daily performance obligation routes to `agent-performance`.
16. Relevant Supabase event triggers the same executor.
17. Two equivalent Supabase triggers do not create duplicate measurements.
18. No direct production mutation is emitted by the executor.

## 18. Delivery and verification

Implementation follows existing BRAIN Continuous CI/CD:

`RED test -> minimal GREEN implementation -> relevant lane tests -> shared-governance tests -> moving-main file/contract check -> candidate PR -> exact-head merge -> production promotion -> exact-SHA production verification -> append-only BRAIN evidence`

No direct-to-main implementation and no self-declared production completion.

## 19. Initial implementation boundary

The first implementation deliberately includes only:

- deterministic executor core
- obligation state model
- idempotency/work identity generation
- owner-agent routing contract
- evidence/recovery reconciliation interface
- one generic scheduled trigger adapter
- one generic event-trigger adapter interface
- Supabase performance obligation integration as reference path
- tests and governance classification required to make those pieces part of BRAIN

It deliberately excludes:

- a new task queue product
- arbitrary background workers outside existing infrastructure
- Notion as an execution source
- direct production mutations
- migration of every historical obligation in the same PR
- automatic destructive remediation

Additional obligations migrate incrementally after the reference path is independently production-proven.

## 20. Success definition

This subsystem is only considered complete when all of the following are independently demonstrated:

- a due obligation is discovered by the generic scheduler
- the correct existing owner agent receives exactly one work identity
- duplicate scheduler/event wake-ups coalesce
- insufficient evidence cannot complete the obligation
- a missed deadline enters governed recovery
- the Supabase performance obligation executes end-to-end through this runtime
- production outcome evidence is exact and independently verified
- state/evidence is append-only recorded in BRAIN
- current GitHub `main` and deployed production SHA are equal after promotion

Until those proofs exist, the executor is implemented or deployed, but not certified autonomous.