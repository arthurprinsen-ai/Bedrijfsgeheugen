# Portal V2 Operating System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn Portal V2 into a closed-loop business operating system covering executive cockpit, quantified impact, scenarios, governed Next Best Actions, monitoring/learning and capability dependencies.

**Architecture:** Extend the existing authenticated Portal V2 domain state and canonical Powerhouse server authorities. Browser code only renders projections and submits governed decisions; business truth, executable obligations, outcomes and learning remain server-authoritative. All material entities use one evidence envelope and the lifecycle `SIGNAL -> UNDERSTAND -> PREDICT -> DECIDE -> ACT -> MEASURE -> LEARN`.

**Tech Stack:** Vanilla ES modules in `portal-v2`, existing Supabase/Powerhouse backend surfaces, Node test runner used by repository tests, existing router/page-shell/hubs/navigation and production readback gates.

**Spec:** `docs/superpowers/specs/2026-09-16-portal-v2-operating-system-design.md`

## Global Constraints

- No parallel database, CRM, workflow engine, analytics store, AI brain, queue, calendar or learning store.
- Reuse existing authenticated Portal V2 domain state and canonical Powerhouse authorities.
- Tenant scope, provenance, freshness and confidence are mandatory for material projections.
- Scenario state is immutable and must never overwrite actual company state.
- Estimated/forecast value must never be presented as realized revenue or cash saving.
- Risk class 3 always requires explicit approval plus existing outbound/executor gates.
- Fail closed on missing identity, tenant, provenance, permission or exact destination.
- Production completion requires exact-SHA readback, not only passing unit tests.

---

### Task 1: Shared operating-system contracts

**Files:**
- Create: `portal-v2/operating-system/contracts.js`
- Test: `tests/portal-v2-operating-system-contracts.test.mjs`

**Interfaces:**
- Produces `normalizeEvidenceEnvelope(entity, tenantId)`, `assertTenantScoped(entity, tenantId)`, `valueKind(value)`, `ACTION_RISK_CLASS`, `ACTION_STATES`, `canAutoExecute(action)`.
- Later tasks consume these exact exports.

- [ ] Write failing tests proving required evidence fields, tenant mismatch failure, estimated/realized distinction and class-3 approval requirement.
- [ ] Run the focused test and confirm RED.
- [ ] Implement the smallest contract module that makes the tests pass.
- [ ] Run focused tests and repository portal contract lane.
- [ ] Commit as `feat(portal-v2): add operating system contracts`.

### Task 2: Executive Cockpit + evidence health

**Files:**
- Create: `portal-v2/operating-system/executive-projection.js`
- Create: `portal-v2/operating-system/executive-cockpit.js`
- Modify: `portal-v2/modules/overview.js`
- Test: `tests/portal-v2-executive-cockpit.test.mjs`

**Interfaces:**
- Consumes shared evidence contracts.
- Produces `buildExecutiveProjection(state,{role,tenantId,now})` and `mountExecutiveCockpit(root,state,options)`.

- [ ] Write RED tests for role-aware ordering, top-5 NBA limit, stale/low-confidence evidence health and zero fabricated live claims when evidence is missing.
- [ ] Implement deterministic projection from existing Powerhouse/portal fields with conservative empty states.
- [ ] Mount the cockpit from the existing overview render path; do not introduce a second state client.
- [ ] Verify mobile-safe semantic markup and keyboard-focusable actions.
- [ ] Run focused + existing overview tests.
- [ ] Commit as `feat(portal-v2): add executive cockpit projection`.

### Task 3: Versioned Impact Engine

**Files:**
- Create: `portal-v2/operating-system/impact-engine.js`
- Test: `tests/portal-v2-impact-engine.test.mjs`

**Interfaces:**
- Produces `IMPACT_FORMULA_VERSION`, `normalizeImpact(input)`, `calculatePaybackMonths(input)`, `rankImpact(input)`.
- Ranking returns `{score,version,components}` so no magic score is hidden.

- [ ] Write RED tests for observed/estimated/forecast/realized separation, payback, confidence clamping and explainable ranking components.
- [ ] Implement formula version `impact-v1` with explicit weighted components and no silent coercion of estimated values to realized.
- [ ] Run focused tests and portal test lane.
- [ ] Commit as `feat(portal-v2): add versioned impact engine`.

### Task 4: Immutable Scenario Simulator

**Files:**
- Create: `portal-v2/operating-system/scenario-engine.js`
- Create: `portal-v2/operating-system/scenario-ui.js`
- Test: `tests/portal-v2-scenario-engine.test.mjs`

**Interfaces:**
- Produces `createScenario({baselineRef,assumptions,horizon,modelVersion})`, `simulateScenario(baseline,scenario)`, `compareScenarios(a,b)`.
- Scenario results are new frozen objects; baseline input is never mutated.

- [ ] Write RED mutation-protection and delta tests.
- [ ] Implement immutable assumption overlays and typed KPI/value/capacity/risk deltas.
- [ ] Add accessible baseline-vs-scenario UI with explicit `Simulatie` labeling.
- [ ] Run tests proving baseline object is byte-equivalent before/after simulation.
- [ ] Commit as `feat(portal-v2): add immutable scenario simulator`.

### Task 5: Next Best Action, decision and governed execution model

**Files:**
- Create: `portal-v2/operating-system/action-policy.js`
- Create: `portal-v2/operating-system/decision-model.js`
- Create: `portal-v2/operating-system/action-ui.js`
- Test: `tests/portal-v2-action-policy.test.mjs`

**Interfaces:**
- Produces `classifyActionRisk(action)`, `evaluateActionEligibility(action,context)`, `recordDecision(decision,input)`, `transitionAction(action,nextState,context)`.
- Class 0/1 may auto-approve only after tenant/identity/provenance checks; class 3 cannot reach QUEUED without explicit approval and destination/readback requirements.

- [ ] Write RED lifecycle tests including forbidden transitions and class-3 fail-closed behavior.
- [ ] Implement deterministic risk classification and lifecycle state machine.
- [ ] Add decision records for accept/reject/defer/delegate/request-evidence/modify; preserve rejected lineage.
- [ ] Wire UI buttons to existing domain-state write path only; no privileged browser execution.
- [ ] Run focused tests and security/portal lanes.
- [ ] Commit as `feat(portal-v2): add governed next best actions`.

### Task 6: Monitoring and learning projections

**Files:**
- Create: `portal-v2/operating-system/monitoring.js`
- Create: `portal-v2/operating-system/learning.js`
- Test: `tests/portal-v2-monitoring-learning.test.mjs`

**Interfaces:**
- Produces `dedupeSignals(signals)`, `materialSignals(signals,policy)`, `calibrateOutcome(expected,realized,history)`, `learningExplanation(change)`.

- [ ] Write RED tests for signal dedupe/correlation, non-material suppression, expected-vs-realized calibration and immutable historical evidence.
- [ ] Implement deterministic signal fingerprinting and conservative materiality thresholds supplied by policy/config.
- [ ] Implement visible learning explanations without rewriting historical outcomes.
- [ ] Run focused tests.
- [ ] Commit as `feat(portal-v2): add monitoring and learning projections`.

### Task 7: Capability dependency graph

**Files:**
- Create: `portal-v2/operating-system/capability-graph.js`
- Create: `portal-v2/operating-system/capability-graph-ui.js`
- Test: `tests/portal-v2-capability-graph.test.mjs`

**Interfaces:**
- Consumes existing `CAPABILITIES` and canonical action/outcome projections.
- Produces `buildCapabilityGraph({capabilities,strategy,objectives,actions,outcomes})` and `neighbors(graph,nodeId)`.

- [ ] Write RED tests for strategy -> objective -> capability -> process/system/data/AI/governance/KPI -> action -> outcome edges and deduplication.
- [ ] Implement graph builder by extending existing capability catalog, not copying its content.
- [ ] Add keyboard-navigable lazy-rendered graph/details UI.
- [ ] Run focused tests.
- [ ] Commit as `feat(portal-v2): add capability dependency graph`.

### Task 8: Navigation, integrated shell and closed-loop integration

**Files:**
- Modify: `portal-v2/hubs.js`
- Modify: `portal-v2/navigation-model.js`
- Modify: `portal-v2/page-shell.js`
- Modify: `portal-v2/app.js`
- Create: `portal-v2/operating-system/index.js`
- Test: `tests/portal-v2-operating-system-integration.test.mjs`

**Interfaces:**
- `mountOperatingSystem({root,domainState,openPage})` mounts all projections and subscribes once to existing domain state.

- [ ] Write RED integration test for signal -> NBA -> decision -> eligibility -> outcome -> learning projection and scenario -> capability graph impact.
- [ ] Register logical modules in existing router/hubs without a new shell.
- [ ] Integrate one subscription path and prevent duplicate mounts/listeners.
- [ ] Run portal unit/contract/integration/browser lanes.
- [ ] Commit as `feat(portal-v2): integrate business operating system`.

### Task 9: Visual, accessibility, security and production release proof

**Files:**
- Modify existing portal visual/browser contract tests as required by repository conventions.
- Update human-readable Powerhouse documentation/System Map and release evidence using existing authorities only.

**Interfaces:**
- No new product interface; this task proves all earlier interfaces in production.

- [ ] Run responsive/visual regression at supported breakpoints and fix alignment/spacing overflow defects.
- [ ] Run keyboard, focus, accessible-name and contrast checks.
- [ ] Run security/tenant/action-policy gates and prove class-3 remains blocked without approval.
- [ ] Merge only through protected branch governance after Required/BRAIN/security/browser checks are green on exact candidate SHA.
- [ ] Verify production serves exact merge SHA.
- [ ] Production-readback an authenticated executive projection, immutable scenario, safe auto-action, blocked approval-gated action, outcome writeback and learning/calibration record.
- [ ] Update canonical documentation/learning lineage with exact evidence refs.
- [ ] Final status may be `LIVE & BEWEZEN` only when every proof above exists.
