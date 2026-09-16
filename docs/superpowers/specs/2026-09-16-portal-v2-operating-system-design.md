# Portal V2 Operating System — design

Date: 2026-09-16
Status: design approved in chat; implementation pending plan
Scope: Portal V2 on top of existing Bedrijfsgeheugen Powerhouse

## 1. Purpose

Turn Portal V2 from a complete customer portal into a continuous business operating system that converts signals into decisions, governed execution and measured outcomes.

Canonical loop:

`SIGNAL -> UNDERSTAND -> PREDICT -> DECIDE -> ACT -> MEASURE -> LEARN`

The portal is a view and interaction layer on the existing Bedrijfsgeheugen Powerhouse. It must not introduce a parallel database, CRM, workflow engine, analytics store, AI brain, queue, calendar or learning system.

## 2. Architectural principles

1. EXISTING-STATE-FIRST: read and reuse current Portal V2 state, Powerhouse data, capability graph, action queues, outcomes and learning lineage.
2. REUSE-FIRST: extend existing domain-state, authenticated state client, company cockpit, capability catalog, router, page shell and canonical Supabase authorities.
3. CANONICAL-INTEGRATION: every new projection must derive from canonical Powerhouse data and preserve tenant isolation, provenance, freshness and confidence.
4. CLOSED-LOOP: recommendations do not end at insight; they must connect to decision, action, readback, outcome and learning.
5. FAIL-CLOSED: missing identity, tenant scope, provenance, confidence or action eligibility blocks execution rather than fabricating certainty.
6. AUTONOMOUS-WHERE-SAFE: low-risk internal actions may execute automatically; material financial, external, identity-sensitive or customer-facing actions require existing Powerhouse gates and/or explicit approval.
7. EVIDENCE-FIRST: a capability is complete only when code, tests, production readback and lineage prove it on the same release identity.

## 3. Reused existing components

The design intentionally builds on existing Portal V2 components:

- `portal-v2/domain-state.js`: authenticated, server-authoritative domain state.
- `portal-v2/modules/overview.js`: current overview/directievragen and authenticated company cockpit mount.
- `portal-v2/company-cockpit-*`: existing cockpit surface.
- `portal-v2/capability-catalog.js`: capability-to-process/data/system/AI/governance/KPI/project relationships.
- `portal-v2/router.js`, `page-shell.js`, `hubs.js`, `navigation-model.js`: one shared routing/navigation model.
- existing Powerhouse action queues, opportunities, outcomes, runtime events, relationship graph, intelligence, learning/calibration and release/readback machinery.

No duplicate authority is allowed.

## 4. Target user experience

### 4.1 Executive Cockpit

The default executive view answers, in order:

1. What changed?
2. What matters most?
3. What is likely to happen next?
4. What should we do now?
5. What value or risk is attached?
6. What is already in progress?
7. What evidence supports this?
8. What did we learn from previous actions?

Primary cards/sections:

- Company health score and trend
- Top risks
- Top opportunities
- Estimated value at stake
- Strategy progress
- KPI anomalies
- Forecast changes
- Open decisions
- Top 3-5 Next Best Actions
- Active initiatives and expected value
- Realized outcomes
- Data/evidence health

The cockpit is a projection, not a new data source.

### 4.2 Role-aware views

The same canonical truth can be projected differently for:

- Directie
- Finance
- Sales/Commercial
- Operations
- IT/Data
- Investor/M&A/Due Diligence

Role affects information hierarchy and action eligibility, not underlying truth.

## 5. Impact Engine

### 5.1 Goal

Every material finding, recommendation, scenario and action can carry a quantified business-impact envelope.

### 5.2 Impact dimensions

- revenue upside
- gross margin effect
- cost/capacity reduction
- FTE capacity released
- risk exposure reduced
- compliance impact
- cash-flow effect
- required investment
- recurring cost
- implementation effort
- time-to-value
- payback period
- confidence
- evidence quality

### 5.3 Calculation contract

Impact values must distinguish:

- observed actuals
- source-derived calculations
- assumptions
- model estimates
- forecast values
- realized outcomes

Every value must carry provenance, freshness, formula/model version and confidence where applicable.

No estimated value may be rendered as realized revenue or cash saving.

### 5.4 Ranking

Prioritization may use expected impact, urgency, strategic fit, confidence, effort, reversibility, dependency risk and time-to-value.

The ranking formula must be versioned and inspectable; no undocumented magic score.

## 6. Scenario Simulator

### 6.1 Goal

Allow users to change assumptions and see downstream effects across the same Powerhouse model.

Examples:

- revenue +15%
- loss of a key person
- 20% demand decrease
- automation of a manual process
- additional sales headcount
- system outage
- acquisition integration
- price increase
- working-capital improvement

### 6.2 Scenario model

A scenario is an immutable set of assumption overrides plus model/version metadata. It does not overwrite actual company state.

Inputs:

- baseline snapshot reference
- assumptions
- affected capabilities
- dependencies
- horizon
- model version

Outputs:

- KPI delta
- value delta
- capacity delta
- risk delta
- impacted capabilities/processes/systems/data
- required actions
- confidence and sensitivity

### 6.3 Comparison

Support baseline vs scenario and scenario vs scenario comparison. Users must always be able to distinguish actuals from simulated values.

## 7. Next Best Action and Execution

### 7.1 NBA object

A Next Best Action contains:

- trigger/signal
- explanation
- affected objective/capability
- proposed action
- owner/role
- deadline/window
- expected impact
- confidence
- prerequisites
- dependencies
- risk class
- approval requirement
- executor route
- success metric
- readback requirement
- outcome link

### 7.2 Action risk classes

**Class 0 — read/analyse only**
Automatic.

**Class 1 — internal reversible preparation**
Automatic when tenant/identity/provenance gates pass.

Examples: create draft, create internal task, refresh analysis, compute scenario.

**Class 2 — internal material mutation**
Requires policy/role gate; may require explicit approval depending on affected authority.

**Class 3 — external/customer-facing/financial/identity-sensitive**
Requires explicit approval and existing Powerhouse identity, pressure, permission, destination, dedupe and provider-readback gates.

### 7.3 Execution lifecycle

`PROPOSED -> ELIGIBLE -> APPROVAL_REQUIRED|AUTO_APPROVED -> QUEUED -> EXECUTING -> READBACK_PENDING -> VERIFIED -> OUTCOME_PENDING -> OUTCOME_RECORDED -> LEARNED`

Failure states remain first-class and feed learning/prevention.

## 8. Continuous Monitoring

### 8.1 Signal sources

Reuse existing internal and external data sources. Monitor for:

- KPI anomalies
- data freshness drift
- missing data
- changed documents
- strategy/KPI deviation
- action overdue status
- realized-vs-expected impact deviation
- forecast change
- risk threshold breach
- source/provider failures
- model confidence degradation

### 8.2 Change semantics

Every material signal should state:

- what changed
- since when
- source
- significance
- confidence
- affected capability/objective
- recommended next action

### 8.3 Noise control

Signals are deduped, correlated and suppressed when they are the same underlying event. Repeated non-material drift must not flood the cockpit.

## 9. Continuous Learning

### 9.1 Learning inputs

- recommendation accepted/rejected/deferred
- execution success/failure
- time-to-complete
- expected vs realized value
- forecast error
- user corrections
- confidence calibration
- false positive / false negative signals
- provider/runtime failures

### 9.2 Learning outputs

Learning may adjust:

- confidence calibration
- prioritization weights
- recommended action templates
- effort estimates
- time-to-value estimates
- scenario assumptions
- anomaly thresholds

It must not silently rewrite historical evidence or realized outcomes.

### 9.3 Explainability

Where learning materially changes a recommendation, the portal should be able to show why, e.g. the estimate changed because comparable past actions took longer than expected.

## 10. Evidence and data health

Every executive insight should expose a compact evidence envelope:

- source count
- provenance
- freshness
- confidence
- missing evidence
- conflicting evidence
- last successful sync
- model/formula version

A dedicated Data & Evidence Health view should show:

- connected sources
- stale sources
- failed connectors
- incomplete domains
- low-confidence areas
- unresolved data-quality issues

## 11. Capability and dependency graph

The existing capability catalog becomes the human-facing graph projection linking:

`strategy -> objective -> capability -> process -> system -> data -> AI -> governance -> KPI -> project/action -> outcome`

Graph interactions:

- select any node and show upstream/downstream dependencies
- show affected nodes for a signal/scenario/change
- show current maturity and target maturity
- show open actions and realized outcomes
- navigate directly to related portal pages

## 12. Decision log

Material recommendations support:

- accept
- reject
- defer
- delegate
- request evidence
- modify

Each decision records actor, timestamp, reason/context, evidence snapshot and follow-up obligation.

No recommendation disappears after rejection; it remains in decision lineage and may be reconsidered if material evidence changes.

## 13. Portal modules

Prefer extending existing modules rather than creating a new application shell.

New/extended logical modules:

1. Executive Cockpit
2. Impact
3. Scenarios
4. Decisions & Next Best Actions
5. Monitoring
6. Outcomes & Learning
7. Data & Evidence Health
8. Capability Graph

These must register in the existing router/hubs/navigation model.

## 14. Data contracts

Portal projections should consume canonical server-side DTOs/view-models rather than infer truth from arbitrary browser state.

Minimum common envelope:

```text
id
tenant_id
entity_type
source_refs[]
provenance
freshness_at
confidence
model_or_formula_version
observed_at
updated_at
```

Material calculated entities also carry assumption/evidence references.

## 15. Security and authorization

- tenant scope mandatory for every read/write
- browser has no privileged service authority
- role/permission gate for decisions and execution
- explicit destination identity for outbound actions
- fail closed on missing permission, tenant, provenance or exact target
- no secrets in Portal V2 frontend
- audit lineage for material writes and execution

## 16. Error handling

The UI distinguishes:

- unavailable source
- stale source
- low-confidence result
- conflicting evidence
- permission denied
- approval required
- executor unavailable
- readback failed
- outcome not yet observed

The UI must never convert these into a generic successful state.

## 17. Performance

- executive projection returned as an aggregated server-side view/model where possible
- lazy-load graph/scenario details
- cache only with explicit freshness semantics
- avoid N+1 browser requests
- preserve fast first meaningful cockpit render

## 18. Testing strategy

### Unit

- impact formulas
- ranking/prioritization
- risk classification
- scenario deltas
- confidence/freshness rendering
- lifecycle transitions

### Contract

- canonical DTO/envelope schemas
- tenant-scoped server access
- action eligibility
- executor/readback contracts
- outcome and learning writeback

### Integration

- signal -> NBA
- NBA -> approval/auto-route
- execution -> provider/readback
- outcome -> learning
- scenario -> impacted capability graph

### Browser/E2E

- role-aware cockpit
- mobile/desktop parity
- decisions
- scenario interaction
- graph navigation
- action approval
- error states

### Visual/accessibility

- alignment/spacing regression
- responsive layouts
- keyboard/screen-reader flows
- contrast and focus states
- cross-browser/device baselines

### Production proof

The release is not complete until exact-SHA production readback proves:

- correct build identity
- authenticated tenant-scoped data
- cockpit renders live projections
- scenario remains non-destructive
- one safe auto-action reaches verified readback
- one approval-gated action remains blocked until approval
- outcome lineage writes back
- learning/calibration records the result

## 19. Delivery slices

To reduce release risk, implementation is split into coherent slices that all use the same architecture:

### Slice A — canonical executive projection
Executive Cockpit + evidence health + role-aware projection.

### Slice B — Impact Engine
Versioned impact contracts, formulas, value-at-stake and realized-vs-estimated separation.

### Slice C — Scenario Simulator
Immutable assumption overlays, comparison and dependency impacts.

### Slice D — NBA/Decision/Execution
Risk classes, decision log, approval, executor routes and readback.

### Slice E — Monitoring/Learning
Signals, anomaly/change feeds, outcome calibration and visible learning.

### Slice F — Capability Graph
Interactive dependencies across strategy/capabilities/process/data/system/KPI/action/outcome.

Each slice must be production-verifiable before the next becomes release-critical; all slices share the same DTOs, lineage and authority.

## 20. Definition of Done

Portal V2 Operating System is complete only when:

1. Executive Cockpit is populated from authenticated canonical Powerhouse data.
2. Material insights show evidence, freshness and confidence.
3. Impact values distinguish observed, estimated and realized value.
4. Scenario changes never overwrite actuals and show downstream effects.
5. Next Best Actions have risk class, owner, impact, success metric and lineage.
6. Low-risk actions can execute automatically when eligible.
7. Material/external actions are blocked until required approval/gates pass.
8. Provider/runtime readback verifies executed actions.
9. Outcomes are linked to originating signal/decision/action.
10. Learning/calibration consumes expected-vs-realized results.
11. Role-aware views use one canonical truth.
12. Capability graph connects strategy through outcome.
13. Data/evidence health exposes gaps and stale sources.
14. Mobile, desktop, accessibility and visual regression gates pass.
15. Required/BRAIN/security/browser/production-readback gates are green on exact release SHA.
16. Production serves that exact SHA.
17. Documentation/system map/decision lineage and reusable learning are updated.

## 21. Non-goals

- no new CRM
- no new portal-only database
- no Make dependency
- no duplicate scheduler
- no standalone AI brain
- no ungoverned autonomous outbound
- no fabricated business impact
- no separate learning store

## 22. Implementation direction

Recommended implementation order: A -> B -> C -> D -> E -> F, while establishing shared contracts in A/B so later slices extend rather than duplicate.

The existing Portal V2 authenticated domain state remains the browser interaction state. Canonical business truth, executable obligations, outcomes and learning stay server-side in Powerhouse/Supabase authorities.
