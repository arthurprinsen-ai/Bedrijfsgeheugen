# Brain-Wide Make Cost Control and Internal Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every existing and future Make scenario and agent an automatically discovered, budget-governed member of the Bedrijfsgeheugen Brain, continuously reduce normalized cost and latency, and expose the shared state through an invite-only internal dashboard.

**Architecture:** BG159 owns one canonical Make inventory and cost ledger; a deterministic policy computes the 10,000-credit monthly envelope; every agent/scenario receives the same budget decision through BG167 and reports material results through BG168/BG166. New components are auto-discovered, immediately visible, and fail closed for optional work until classified. A bounded daily optimizer selects at most one safe improvement candidate per day, verifies comparable before/after outcomes, and keeps or rolls back the change. The dashboard is a read-only projection of that same shared state.

**Tech Stack:** Node.js ESM, Node test runner, Make ChatGPT App scenario API, Netlify Functions, Netlify Blobs, `@netlify/identity@2.0.0`, static HTML/CSS/JavaScript, GitHub Actions/Netlify production gates.

**Spec:** `docs/superpowers/specs/2026-08-30-make-cost-control-dashboard-design.md`

## Global Constraints

- Hard monthly Make budget: exactly `10_000` credits.
- Dynamic allowance: `remaining_monthly_credits / remaining_calendar_days`.
- New Make scenarios and agents must be discovered automatically; no manually maintained complete inventory.
- Unknown components appear as `UNCLASSIFIED` and may not run optional work until production-ready metadata is present.
- Security, production, data integrity and due outcome obligations take precedence over budget scoring.
- No automatic changes to sales/marketing rules, persuasion, exact LinkedIn targeting, DM completeness, human-send safety or Interaction Datahub contracts.
- No secrets, credentials, permissions, paid resources, destructive data or security weakening.
- No raw prompts, DM/CRM content, personal identifiers or credentials in the cost ledger or browser.
- Cost improvement is measured as credits and latency per verified outcome, not raw daily credits alone.
- A daily workload increase may raise absolute credits; the optimizer must still lower normalized waste or record `NO_SAFE_CANDIDATE` without fabricating savings.
- Maximum one production cost experiment per day and two identical retries per hypothesis.
- Every material decision and result is routed through BG168 and visible in BG167 before the dashboard labels it current.
- Exact preview and production SHA plus protected-metric smoke are required.

## File structure

- `config/brain-cost-policy.json` — machine-readable budget, allocations, protected classes and onboarding rules.
- `platform/cost/budget-policy.mjs` — pure deterministic budget calculations and run decisions.
- `platform/cost/component-catalog.mjs` — merges Make inventory and agent registry into one canonical catalog.
- `platform/cost/cost-ledger.mjs` — validates snapshots, computes deltas and produces normalized per-outcome metrics.
- `platform/cost/daily-optimizer.mjs` — deterministically selects one safe daily candidate and evaluates KEEP/ROLLBACK.
- `platform/cost/brain-cost-events.mjs` — maps decisions/outcomes to sanitized Brain events.
- `platform/cost/dashboard-projection.mjs` — produces the browser-safe read model.
- `platform/api/cost-dashboard-handler.mjs` — authenticated, role-authorized, GET-only API.
- `netlify/functions/_cost-projection-store.mjs` — strongly consistent Blob storage adapter.
- `netlify/functions/powerhouse-costs.mjs` — Netlify function entrypoint.
- `intern/powerhouse-kosten/index.html` — internal dashboard shell.
- `assets/js/powerhouse-kosten.mjs` — safe DOM rendering and authenticated fetch.
- `assets/css/powerhouse-kosten.css` — dashboard presentation.
- `tools/verify-brain-cost-membership.mjs` — production-readiness and auto-onboarding gate.
- `tests/cost-budget-policy.test.mjs` — budget state and protected interrupt tests.
- `tests/cost-component-catalog.test.mjs` — automatic discovery and fail-closed classification.
- `tests/cost-ledger.test.mjs` — delta, dedupe and normalized metric tests.
- `tests/daily-cost-optimizer.test.mjs` — one-candidate, evidence and rollback tests.
- `tests/brain-cost-events.test.mjs` — shared-memory schema and data-minimization tests.
- `tests/cost-dashboard-api.test.mjs` — 401/403/200, method and sanitization tests.
- `tests/cost-dashboard-security.test.mjs` — headers, CSP, noindex, no secret and XSS tests.
- `tests/brain-cost-membership.test.mjs` — future component onboarding gate.
- `docs/runbooks/make-cost-control.md` — operations, thresholds, rollback and hard boundaries.
- `docs/development-ledger.md` — append-only implementation and production outcomes.

---

### Task 1: Deterministic 10,000-credit budget policy

**Files:**
- Create: `config/brain-cost-policy.json`
- Create: `platform/cost/budget-policy.mjs`
- Create: `tests/cost-budget-policy.test.mjs`

**Interfaces:**
- Consumes: `{ monthlyLimit, usedCredits, now, protectedInterrupt, workClass }`
- Produces: `evaluateBudget(input) -> { state, remainingCredits, dailyAllowance, paceRatio, decision, reason }`

- [ ] **Step 1: Write the failing policy tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateBudget } from '../platform/cost/budget-policy.mjs';

test('uses remaining credits over remaining Amsterdam calendar days', () => {
  const result = evaluateBudget({
    monthlyLimit:10_000, usedCredits:6_000,
    now:'2026-08-20T08:00:00+02:00', daysInMonth:31, dayOfMonth:20,
    workClass:'research', protectedInterrupt:false,
  });
  assert.equal(result.remainingCredits,4_000);
  assert.equal(result.dailyAllowance,4_000 / 12);
});

test('exhausted budget defers optional work', () => {
  assert.equal(evaluateBudget({
    monthlyLimit:10_000, usedCredits:10_001, now:'2026-08-30T08:00:00+02:00',
    daysInMonth:31, dayOfMonth:30, workClass:'creative', protectedInterrupt:false,
  }).decision,'BUDGET_DEFERRED');
});

test('protected security interrupt remains runnable', () => {
  assert.equal(evaluateBudget({
    monthlyLimit:10_000, usedCredits:10_001, now:'2026-08-30T08:00:00+02:00',
    daysInMonth:31, dayOfMonth:30, workClass:'security', protectedInterrupt:true,
  }).decision,'PROTECTED_INTERRUPT');
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/cost-budget-policy.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Add the exact machine policy**

```json
{
  "schemaVersion": 1,
  "monthlyLimitCredits": 10000,
  "timezone": "Europe/Amsterdam",
  "allocations": {
    "production_core": 4500,
    "publishing_sync": 2000,
    "commercial": 1500,
    "shared_memory_control": 800,
    "research_creative": 700,
    "emergency_reserve": 500
  },
  "states": {
    "greenBelow": 0.70,
    "orangeBelow": 0.90,
    "redBelow": 1.00
  },
  "unknownComponentDecision": "BUDGET_DEFERRED",
  "maxProductionExperimentsPerDay": 1,
  "maxIdenticalRetriesPerHypothesis": 2
}
```

- [ ] **Step 4: Implement the pure evaluator**

```js
const OPTIONAL = new Set(['research','creative','experiment','optimization']);
export function evaluateBudget(input) {
  const remainingCredits = Math.max(0, input.monthlyLimit - input.usedCredits);
  const remainingDays = Math.max(1, input.daysInMonth - input.dayOfMonth + 1);
  const dailyAllowance = remainingCredits / remainingDays;
  const paceRatio = input.dailyBurn > 0 && dailyAllowance > 0
    ? input.dailyBurn / dailyAllowance
    : input.usedCredits / input.monthlyLimit;
  const state = paceRatio < .70 ? 'GREEN' : paceRatio < .90 ? 'ORANGE'
    : paceRatio < 1 ? 'RED' : 'EXHAUSTED';
  if (input.protectedInterrupt === true) {
    return { state, remainingCredits, dailyAllowance, paceRatio,
      decision:'PROTECTED_INTERRUPT', reason:'PROTECTED_OUTCOME' };
  }
  const decision = state === 'EXHAUSTED' && OPTIONAL.has(input.workClass)
    ? 'BUDGET_DEFERRED'
    : state === 'RED' && OPTIONAL.has(input.workClass)
      ? 'BUDGET_DEFERRED'
      : state === 'ORANGE' ? 'CHEAP_PATH' : 'RUN';
  return { state, remainingCredits, dailyAllowance, paceRatio, decision,
    reason:decision === 'BUDGET_DEFERRED' ? 'MONTHLY_BUDGET_GUARD' : 'WITHIN_POLICY' };
}
```

- [ ] **Step 5: Run tests and commit**

Run: `node --test tests/cost-budget-policy.test.mjs`

Expected: 3 tests pass, 0 fail.

Commit:
```bash
git add config/brain-cost-policy.json platform/cost/budget-policy.mjs tests/cost-budget-policy.test.mjs
git commit -m "feat: add deterministic Brain cost policy"
```

---

### Task 2: Automatic catalog for every current and future scenario and agent

**Files:**
- Create: `platform/cost/component-catalog.mjs`
- Create: `tests/cost-component-catalog.test.mjs`
- Modify: `platform/agents/agent-registry.mjs`
- Modify: `platform/agents/agent-team.mjs`

**Interfaces:**
- Consumes: `buildComponentCatalog({ makeScenarios, agents, overrides })`
- Produces: frozen entries keyed by `make:<scenarioId>` and `agent:<agentId>`
- Every entry includes `kind`, `componentId`, `name`, `costClass`, `ownerAgentId`, `protectedMetrics`, `classificationState`, `discoveredAt`.

- [ ] **Step 1: Write auto-discovery tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildComponentCatalog } from '../platform/cost/component-catalog.mjs';

test('new Make scenario appears without a static allowlist', () => {
  const catalog = buildComponentCatalog({
    makeScenarios:[{id:999,name:'BG999 New Worker',isActive:true,trigger:'scheduled'}],
    agents:[], overrides:{}, now:()=>'2026-08-30T09:00:00Z',
  });
  assert.equal(catalog.get('make:999').name,'BG999 New Worker');
  assert.equal(catalog.get('make:999').classificationState,'UNCLASSIFIED');
  assert.equal(catalog.get('make:999').runDecision,'BUDGET_DEFERRED');
});

test('new registered agent appears automatically', () => {
  const catalog = buildComponentCatalog({
    makeScenarios:[],
    agents:[{id:'agent-new',domains:['Cost'],capabilities:['measure']}],
    overrides:{}, now:()=>'2026-08-30T09:00:00Z',
  });
  assert.equal(catalog.get('agent:agent-new').kind,'AGENT');
});

test('known domains classify deterministically', () => {
  const catalog = buildComponentCatalog({
    makeScenarios:[],
    agents:[{id:'agent-sec',domains:['Security'],capabilities:['verify']}],
    overrides:{}, now:()=>'2026-08-30T09:00:00Z',
  });
  assert.equal(catalog.get('agent:agent-sec').costClass,'production_core');
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/cost-component-catalog.test.mjs`

Expected: FAIL with missing module.

- [ ] **Step 3: Implement deterministic classification**

```js
const protectedDomains = new Set(['Security','Reliability','Data Quality','Production']);
function classify(component, override) {
  if (override) return { ...override, classificationState:'CLASSIFIED' };
  const domains = component.domains ?? [];
  if (domains.some(domain => protectedDomains.has(domain))) {
    return {
      costClass:'production_core',
      ownerAgentId:'agent-reliability',
      protectedMetrics:['security','production','data_integrity'],
      classificationState:'CLASSIFIED',
      runDecision:'RUN',
    };
  }
  return {
    costClass:'unclassified',
    ownerAgentId:'agent-cost',
    protectedMetrics:[],
    classificationState:'UNCLASSIFIED',
    runDecision:'BUDGET_DEFERRED',
  };
}
export function buildComponentCatalog({ makeScenarios=[], agents=[], overrides={}, now=()=>new Date().toISOString() }) {
  const entries = [];
  for (const scenario of makeScenarios) {
    const key = `make:${scenario.id}`;
    entries.push([key,Object.freeze({
      kind:'MAKE_SCENARIO', componentId:String(scenario.id), name:scenario.name,
      discoveredAt:now(), ...classify(scenario,overrides[key]),
    })]);
  }
  for (const agent of agents) {
    const key = `agent:${agent.id}`;
    entries.push([key,Object.freeze({
      kind:'AGENT', componentId:agent.id, name:agent.id,
      domains:Object.freeze([...(agent.domains ?? [])]), discoveredAt:now(),
      ...classify(agent,overrides[key]),
    })]);
  }
  return new Map(entries);
}
```

- [ ] **Step 4: Expose cost metadata without duplicating agent truth**

Extend registry entries to preserve optional `costProfile` while retaining the current deterministic routing fields:

```js
costProfile: definition.costProfile ? Object.freeze({ ...definition.costProfile }) : null
```

Do not add a second hardcoded agent list. `DEFAULT_AGENT_TEAM` remains the source and the catalog consumes `createDefaultAgentRegistry().all()`.

- [ ] **Step 5: Run focused and existing agent tests**

Run:
```bash
node --test tests/cost-component-catalog.test.mjs
node --test tests/agent-fabric.test.mjs tests/agent-fabric-team-memory.test.mjs
```

Expected: all tests pass.

Commit:
```bash
git add platform/cost/component-catalog.mjs platform/agents/agent-registry.mjs platform/agents/agent-team.mjs tests/cost-component-catalog.test.mjs
git commit -m "feat: auto-register scenarios and agents in Brain cost catalog"
```

---

### Task 3: Daily ledger, deltas and normalized efficiency

**Files:**
- Create: `platform/cost/cost-ledger.mjs`
- Create: `tests/cost-ledger.test.mjs`

**Interfaces:**
- Consumes: `createCostSnapshot({ sampledAt, components, previous })`
- Produces: `{ totals, components, fingerprint, changedComponentIds }`
- Normalized metrics: `creditsPerVerifiedOutcome`, `latencyMsPerVerifiedOutcome`.

- [ ] **Step 1: Write failing delta and dedupe tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCostSnapshot } from '../platform/cost/cost-ledger.mjs';

const row={componentKey:'make:159',creditsTotal:135,operationsTotal:20,dataTransferTotal:1000,verifiedOutcomes:3,latencyMs:9000};
test('computes deltas and normalized cost',()=>{
  const snap=createCostSnapshot({
    sampledAt:'2026-08-30T08:00:00Z',
    components:[row],
    previous:{components:[{...row,creditsTotal:100,operationsTotal:10,dataTransferTotal:500}]},
  });
  assert.equal(snap.components[0].creditsDelta,35);
  assert.equal(snap.components[0].creditsPerVerifiedOutcome,35/3);
});
test('identical values do not create changed components',()=>{
  const snap=createCostSnapshot({sampledAt:'2026-08-30T09:00:00Z',components:[row],previous:{components:[row]}});
  assert.deepEqual(snap.changedComponentIds,[]);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/cost-ledger.test.mjs`

Expected: missing module.

- [ ] **Step 3: Implement validation, stable fingerprint and deltas**

Use `node:crypto` SHA-256 over sorted sanitized rows. Reject negative totals, duplicate component keys and missing timestamps. Set normalized values to `null` when no verified outcome exists; never divide by a technical execution count.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/cost-ledger.test.mjs`

Expected: all tests pass.

Commit:
```bash
git add platform/cost/cost-ledger.mjs tests/cost-ledger.test.mjs
git commit -m "feat: add deduplicated normalized cost ledger"
```

---

### Task 4: Production-readiness gate for future components

**Files:**
- Create: `tools/verify-brain-cost-membership.mjs`
- Create: `tests/brain-cost-membership.test.mjs`
- Modify: `.github/workflows/shared-memory-tests.yml`

**Interfaces:**
- Consumes: Make inventory fixture or runtime snapshot plus `createDefaultAgentRegistry().all()`.
- Produces: exit 0 only when every active component is present; unclassified components remain visible but optional execution is blocked.

- [ ] **Step 1: Write the failing membership test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyCostMembership } from '../tools/verify-brain-cost-membership.mjs';

test('fails production readiness when a future active component has no cost class',()=>{
  const result=verifyCostMembership([{componentKey:'make:999',active:true,classificationState:'UNCLASSIFIED'}]);
  assert.equal(result.ok,false);
  assert.deepEqual(result.blocked,['make:999']);
});
test('inactive unclassified component remains visible without blocking production',()=>{
  assert.equal(verifyCostMembership([{componentKey:'make:999',active:false,classificationState:'UNCLASSIFIED'}]).ok,true);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/brain-cost-membership.test.mjs`

Expected: missing module.

- [ ] **Step 3: Implement the gate**

```js
export function verifyCostMembership(entries=[]) {
  const blocked=entries
    .filter(entry=>entry.active===true && entry.classificationState!=='CLASSIFIED')
    .map(entry=>entry.componentKey)
    .sort();
  return {ok:blocked.length===0,blocked};
}
```

The CLI prints one JSON line and exits 1 when `ok=false`. It must never omit the blocked entries.

- [ ] **Step 4: Add CI command**

Add to Shared Agent Memory Tests after existing document and Brain gates:

```yaml
- name: Verify Brain cost membership
  run: node --test tests/brain-cost-membership.test.mjs tests/cost-component-catalog.test.mjs
```

- [ ] **Step 5: Run and commit**

Run:
```bash
node --test tests/brain-cost-membership.test.mjs tests/cost-component-catalog.test.mjs
```

Expected: all pass.

Commit:
```bash
git add tools/verify-brain-cost-membership.mjs tests/brain-cost-membership.test.mjs .github/workflows/shared-memory-tests.yml
git commit -m "test: require Brain cost membership for future components"
```

---

### Task 5: One bounded daily self-optimization experiment

**Files:**
- Create: `platform/cost/daily-optimizer.mjs`
- Create: `tests/daily-cost-optimizer.test.mjs`

**Interfaces:**
- Consumes: ranked candidates with evidence, cost, risk, reversibility and protected metrics.
- Produces: `selectDailyCandidate(input)` and `evaluateExperiment(input)`.

- [ ] **Step 1: Write failing tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { selectDailyCandidate,evaluateExperiment } from '../platform/cost/daily-optimizer.mjs';

test('selects at most one safe reversible candidate',()=>{
 const result=selectDailyCandidate({
   alreadyStartedToday:0,
   candidates:[
     {id:'A',expectedSavings:20,confidence:.9,risk:1,reversible:true,evidence:['delta']},
     {id:'B',expectedSavings:50,confidence:.9,risk:5,reversible:false,evidence:['delta']},
   ],
 });
 assert.equal(result.id,'A');
});
test('keeps only lower normalized cost with protected metrics green',()=>{
 assert.equal(evaluateExperiment({
   before:{creditsPerVerifiedOutcome:20,latencyMsPerVerifiedOutcome:1000},
   after:{creditsPerVerifiedOutcome:14,latencyMsPerVerifiedOutcome:900},
   regressionPassed:true,protectedMetricsGreen:true,
 }).decision,'KEEP');
});
test('rolls back a cheaper but regressed candidate',()=>{
 assert.equal(evaluateExperiment({
   before:{creditsPerVerifiedOutcome:20},after:{creditsPerVerifiedOutcome:10},
   regressionPassed:false,protectedMetricsGreen:false,
 }).decision,'ROLLBACK');
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/daily-cost-optimizer.test.mjs`

Expected: missing module.

- [ ] **Step 3: Implement deterministic selection**

Filter out candidates without evidence, with `reversible!==true`, `risk>2`, or non-positive expected savings. Score remaining candidates as:

`expectedSavings * confidence * reusability / max(1, implementationCost)`

Sort descending, then by id. Return `{ decision:'NO_SAFE_CANDIDATE' }` when none qualify or an experiment already started today.

- [ ] **Step 4: Implement KEEP/ROLLBACK**

KEEP requires:

- regression passed;
- protected metrics green;
- lower credits per verified outcome;
- latency no worse than 10%, unless the exact protected outcome requires it.

Otherwise return ROLLBACK with the failed condition list.

- [ ] **Step 5: Run and commit**

Run: `node --test tests/daily-cost-optimizer.test.mjs`

Expected: 3 tests pass.

Commit:
```bash
git add platform/cost/daily-optimizer.mjs tests/daily-cost-optimizer.test.mjs
git commit -m "feat: add bounded daily cost improvement loop"
```

---

### Task 6: Shared Brain events and current-state projection

**Files:**
- Create: `platform/cost/brain-cost-events.mjs`
- Create: `tests/brain-cost-events.test.mjs`
- Modify: `platform/agents/team-memory-bridge.mjs`
- Modify: `scripts/team-memory/validate-event.mjs`

**Interfaces:**
- Consumes: catalog, budget decision, experiment outcome and sanitized evidence refs.
- Produces: `toBrainCostEvent(input)` with `schema_version:'brain.v1'`, trace/correlation/fingerprint and protected metrics.

- [ ] **Step 1: Write failing minimization and lineage tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { toBrainCostEvent } from '../platform/cost/brain-cost-events.mjs';

test('cost event carries lineage but strips raw context',()=>{
 const event=toBrainCostEvent({
   type:'OUTCOME',componentKey:'make:159',traceId:'T1',correlationId:'C1',
   fingerprint:'cost|159|2026-08-30',before:{credits:135},after:{credits:60},
   protectedMetrics:{production:true},evidence:['MAKE-METER:159'],rawPrompt:'SECRET',
 });
 assert.equal(event.schema_version,'brain.v1');
 assert.equal(event.trace_id,'T1');
 assert.equal(JSON.stringify(event).includes('SECRET'),false);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/brain-cost-events.test.mjs`

Expected: missing module.

- [ ] **Step 3: Implement event mapping**

Allow only `SIGNAL`, `OPPORTUNITY`, `DECISION`, `MISSION`, `OUTCOME`, `PATTERN`. Copy only named aggregate fields. Never spread the input object.

- [ ] **Step 4: Extend validator and bridge**

Add the Brain cost event types and required lineage fields without weakening existing material-event validation. Preserve the existing BG168/BG166 schema adapter.

- [ ] **Step 5: Run shared-memory regression suite**

Run:
```bash
node --test tests/brain-cost-events.test.mjs tests/agent-fabric-team-memory.test.mjs tests/brain-acceptance.test.mjs
```

Expected: all pass.

Commit:
```bash
git add platform/cost/brain-cost-events.mjs platform/agents/team-memory-bridge.mjs scripts/team-memory/validate-event.mjs tests/brain-cost-events.test.mjs
git commit -m "feat: route cost decisions through shared Brain memory"
```

---

### Task 7: Make BG159 canonical inventory and budget sensor

**Files:**
- Modify in Make: scenario named `BG159 Powerhouse Cost Snapshot Collector`
- Record evidence: `docs/development-ledger.md`
- Document runbook: `docs/runbooks/make-cost-control.md`

**Interfaces:**
- Consumes: one Make team scenario inventory response plus previous canonical snapshot.
- Produces: one sanitized snapshot, changed-component list, budget state and candidate list.

- [ ] **Step 1: Capture exact pre-change blueprint and baseline**

Use `scenario_list(search:"BG159", teamId:2138086)`, then `scenario_get` for the exact returned id. Record `lastEdit`, current schedule, modules and the latest successful representative run: credits, operations, transfer, duration and output fingerprint.

- [ ] **Step 2: Write the runtime regression contract before patching**

The canary input must prove:

- every scenario returned by the team inventory appears exactly once;
- new scenario id `999999999` in the fixture appears as `UNCLASSIFIED`;
- unchanged totals produce an empty `changedComponentIds`;
- budget math matches Task 1;
- no scenario blueprint or prompt body appears in output.

- [ ] **Step 3: Patch BG159 once with concurrency guard**

Call `scenario_patch` with the exact `expectedLastEdit` from Step 1. Compose one atomic change that:

- keeps the existing team inventory read;
- removes unconditional per-scenario execution/blueprint enrichment;
- enriches only changed/error/threshold-crossing components;
- computes catalog, deltas and budget deterministically in one code step;
- dispatches BG158 only when candidate signals are non-empty;
- writes a snapshot only when its fingerprint changed;
- emits future components as `UNCLASSIFIED`.

Do not split this into multiple saves.

- [ ] **Step 4: Run bounded canaries**

Run one unchanged-state canary and one fixture with a synthetic new component. Expected:

- unchanged canary uses no AI/model module;
- synthetic component appears in the snapshot and dashboard projection;
- totals reconcile with Make metering;
- no duplicate write on replay.

- [ ] **Step 5: Measure comparable before/after**

Use equal input shape and one-run windows. Record credits, operations, transfer, latency and output fingerprint. KEEP only if protected output is equivalent and BG159's normalized cost improves; otherwise restore the captured blueprint.

- [ ] **Step 6: Commit ledger/runbook evidence**

```bash
git add docs/runbooks/make-cost-control.md docs/development-ledger.md
git commit -m "docs: record BG159 canonical cost sensor outcome"
```

---

### Task 8: Make duplicate-storm and shared-memory cost reductions

**Files:**
- Modify in Make: `BG162`, `BG166`, `BG167`, `BG185`, `BG156`
- Record each isolated outcome: `docs/development-ledger.md`

**Interfaces:**
- Consumes: BG159 budget/current-state projection and existing fingerprints.
- Produces: materially fewer redundant executions with identical verified outcomes.

- [ ] **Step 1: BG162 atomic dedupe**

Fetch exact scenario and `lastEdit`. Add a first-write-wins idempotency check on `fingerprint + trace_id + time_window` before downstream dispatch. Replay the same event twice; expected one downstream outcome. Compare before/after and KEEP or restore.

- [ ] **Step 2: BG166 append-only event coalescing**

Add no-op behavior for an already persisted fingerprint/status pair. Never delete or rewrite append-only history. Replay identical event; expected zero duplicate material events.

- [ ] **Step 3: BG167 material-only refresh**

Refresh Current State only when the accepted event watermark or projection hash changes. Twenty same-window identical triggers must produce one refresh and nineteen cache hits/deferred no-ops.

- [ ] **Step 4: BG185 blueprint-hash cache**

Audit only a scenario whose `lastEdit` or blueprint hash changed. A repeated same-second audit for an unchanged hash returns `CACHE_HIT` without Notion or model work. Keep the weekly full reconciliation as an independent obligation.

- [ ] **Step 5: BG156 cheapest eligible route**

Read budget state before orchestration. Route deterministic/known-pattern work directly to one specialist. Full multi-agent orchestration is allowed only for P0 or genuine ambiguity, with at most one large opportunity experiment active per domain and three globally.

- [ ] **Step 6: Verify each scenario independently**

For every scenario above:

1. capture LKG blueprint;
2. patch once with `expectedLastEdit`;
3. run exact regression and replay test;
4. compare normalized cost and latency;
5. KEEP only with protected metrics green;
6. otherwise restore LKG;
7. write one material BG168 outcome and verify BG167 visibility.

- [ ] **Step 7: Commit cumulative evidence**

```bash
git add docs/development-ledger.md
git commit -m "docs: record shared-memory and orchestrator cost reductions"
```

---

### Task 9: Budget envelope becomes mandatory for all Make scenarios and agents

**Files:**
- Modify: `platform/agents/agent-fabric.mjs`
- Modify: `platform/brain/runtime.mjs`
- Create: `tests/brain-budget-envelope.test.mjs`
- Modify in Make: active scenarios discovered by BG159, in bounded batches.

**Interfaces:**
- Consumes: `budgetEnvelope={state,decision,remainingCredits,dailyAllowance,snapshotFingerprint}`.
- Produces: explicit execution decision and evidence; never silent skipping.

- [ ] **Step 1: Write failing Agent Fabric tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createAgentFabric } from '../platform/agents/agent-fabric.mjs';

test('optional AgentWork requires a current budget envelope',()=>{
 const fabric=createAgentFabric({registry:{route:()=>({primaryAgentId:'agent-cost',supportAgentIds:[]})}});
 assert.throws(()=>fabric.intake({
   tenantId:'T1',problemClass:'optional-optimization',domains:['Cost'],
   capabilities:['optimize'],affectedObjectIds:['make-all'],problem:'reduce cost',
   optional:true,
 }),/budget envelope/i);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/brain-budget-envelope.test.mjs`

Expected: test fails because intake currently accepts optional work without the envelope.

- [ ] **Step 3: Enforce the envelope in Brain runtime**

Optional work without a fresh matching BG167 snapshot fingerprint returns `BUDGET_DEFERRED`. Protected work requires `protectedInterrupt:true` and evidence of the due security/production/data-integrity obligation.

- [ ] **Step 4: Roll through Make inventory safely**

BG159 supplies the current active inventory. For each scenario, in batches of at most three:

- inspect structure;
- classify trigger and outcome obligations;
- insert or reuse the central budget decision before optional AI/research/creative branches;
- leave protected paths unchanged;
- run one representative canary and one no-work replay;
- measure before/after;
- stop the batch on any protected regression.

A newly discovered active scenario is visible immediately, receives `UNCLASSIFIED`, and optional execution remains deferred until its metadata passes Task 4.

- [ ] **Step 5: Run Brain regression tests**

Run:
```bash
node --test tests/brain-budget-envelope.test.mjs tests/agent-fabric.test.mjs tests/brain-acceptance.test.mjs
```

Expected: all pass.

Commit:
```bash
git add platform/agents/agent-fabric.mjs platform/brain/runtime.mjs tests/brain-budget-envelope.test.mjs
git commit -m "feat: require Brain budget envelope for optional work"
```

---

### Task 10: Sanitized dashboard projection and authenticated API

**Files:**
- Create: `platform/cost/dashboard-projection.mjs`
- Create: `platform/api/cost-dashboard-handler.mjs`
- Create: `netlify/functions/_cost-projection-store.mjs`
- Create: `netlify/functions/powerhouse-costs.mjs`
- Create: `tests/cost-dashboard-api.test.mjs`

**Interfaces:**
- API route: `GET /api/powerhouse-costs`
- Role: `powerhouse-cost-admin`
- Store key: `POWERHOUSE/cost-dashboard/current`
- Response: aggregate budget/catalog/ledger/freshness only.

- [ ] **Step 1: Write 401/403/200 tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createCostDashboardHandler } from '../platform/api/cost-dashboard-handler.mjs';

const request=()=>new Request('https://example.test/api/powerhouse-costs');
test('anonymous is unauthorized',async()=>{
 const handler=createCostDashboardHandler({getUser:async()=>null,store:{get:async()=>null}});
 assert.equal((await handler(request())).status,401);
});
test('wrong role is forbidden',async()=>{
 const handler=createCostDashboardHandler({
   getUser:async()=>({id:'U1',app_metadata:{roles:['viewer']}}),
   store:{get:async()=>({})},
 });
 assert.equal((await handler(request())).status,403);
});
test('correct role receives sanitized projection',async()=>{
 const handler=createCostDashboardHandler({
   getUser:async()=>({id:'U1',app_metadata:{roles:['powerhouse-cost-admin']}}),
   store:{get:async()=>({budget:{monthlyLimit:10000},components:[],rawPrompt:'SECRET'})},
 });
 const response=await handler(request());
 assert.equal(response.status,200);
 assert.equal((await response.text()).includes('SECRET'),false);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/cost-dashboard-api.test.mjs`

Expected: missing handler module.

- [ ] **Step 3: Implement sanitized projection**

Use explicit property selection. Reject stale/contradictory records from `current:true`; expose `freshness:'STALE'` or `quality:'QUARANTINED'`.

- [ ] **Step 4: Implement GET-only role handler**

Use `getUser` from `@netlify/identity`. Read roles only from `app_metadata.roles`. Return 405 for non-GET. Set `Cache-Control: private, no-store`, `Vary: authorization, cookie`, CSP, DENY, noindex and no-referrer headers on every response including errors.

- [ ] **Step 5: Implement strong Blob adapter and entrypoint**

Use `@netlify/blobs` store `brain-read-models` with strong consistency. The browser never writes. The function entrypoint follows the existing `portal-state.mjs` pattern.

- [ ] **Step 6: Run tests and commit**

Run: `node --test tests/cost-dashboard-api.test.mjs`

Expected: 3 tests pass.

Commit:
```bash
git add platform/cost/dashboard-projection.mjs platform/api/cost-dashboard-handler.mjs netlify/functions/_cost-projection-store.mjs netlify/functions/powerhouse-costs.mjs tests/cost-dashboard-api.test.mjs
git commit -m "feat: add authenticated Brain cost dashboard API"
```

---

### Task 11: Invite-only internal HTML dashboard

**Files:**
- Create: `intern/powerhouse-kosten/index.html`
- Create: `assets/js/powerhouse-kosten.mjs`
- Create: `assets/css/powerhouse-kosten.css`
- Modify: `netlify.toml`
- Modify: `tools/bouw-sitemap.mjs`
- Create: `tests/cost-dashboard-security.test.mjs`

**Interfaces:**
- Internal route: `/intern/powerhouse-kosten/`
- Data source: same-origin `/api/powerhouse-costs`
- Existing `/intern/*` Basic Auth remains until Identity authorization is independently green.

- [ ] **Step 1: Write security contract tests**

Tests assert:

- internal HTML contains `robots=noindex,nofollow,noarchive`;
- no inline operational JSON, Make token, Notion token, prompt or CRM field;
- JavaScript uses `textContent`, not `innerHTML`, for scenario-controlled strings;
- Netlify headers set CSP with `default-src 'self'` and `frame-ancestors 'none'`;
- dashboard and API use `private, no-store`;
- sitemap builder excludes the entire `intern` directory;
- unauthenticated API response is 401.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/cost-dashboard-security.test.mjs`

Expected: missing dashboard assets or header rules.

- [ ] **Step 3: Build a data-free HTML shell**

The shell contains only headings, empty table bodies and status placeholders for:

- budget now;
- all scenarios/agents;
- top consumers;
- waste signals;
- verified savings;
- deferred work;
- freshness/contract state.

No operational value is embedded at build time.

- [ ] **Step 4: Implement safe rendering**

Fetch `/api/powerhouse-costs` with `credentials:'same-origin'`. Create every cell with `document.createElement` and assign `textContent`. Do not use third-party scripts, remote fonts, inline event handlers or `innerHTML`.

- [ ] **Step 5: Harden Netlify route**

Keep the existing fail-closed Basic Auth edge function. Add route-specific headers in `netlify.toml`:

```toml
[[headers]]
  for = "/intern/powerhouse-kosten/*"
  [headers.values]
    Cache-Control = "private, no-store"
    X-Robots-Tag = "noindex, nofollow, noarchive"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "no-referrer"
    Permissions-Policy = "camera=(), microphone=(), geolocation=(), payment=(), usb=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"
```

Identity registration must be invite-only and the authorized user must have server-controlled role `powerhouse-cost-admin`. Changing that permission is a hard boundary; code remains fail-closed until authorized configuration exists.

- [ ] **Step 6: Exclude internal directory structurally**

In `bouw-sitemap.mjs`, add `naam === 'intern'` to directory exclusions so future internal pages can never enter the sitemap accidentally.

- [ ] **Step 7: Run security and build tests**

Run:
```bash
node --test tests/cost-dashboard-security.test.mjs tests/cost-dashboard-api.test.mjs
node tools/bouw-sitemap.mjs
node tools/bouw-kennisindex.mjs
node tools/bouw-v18-production.mjs
```

Expected: tests and build exit 0; internal dashboard absent from `sitemap.xml`.

Commit:
```bash
git add intern/powerhouse-kosten/index.html assets/js/powerhouse-kosten.mjs assets/css/powerhouse-kosten.css netlify.toml tools/bouw-sitemap.mjs tests/cost-dashboard-security.test.mjs
git commit -m "feat: add locked internal Powerhouse cost dashboard"
```

---

### Task 12: End-to-end preview, Brain writeback and production promotion

**Files:**
- Modify: `docs/development-ledger.md`
- Modify: `docs/runbooks/make-cost-control.md`
- Modify: `config/outcome-obligations.json`
- Test: all cost/Brain/security and accepted-site suites.

**Interfaces:**
- Obligations: `cost-policy-10000-monthly`, `cost-ledger-all-scenarios-daily`, `brain-budget-writeback`, `internal-dashboard-authz`, `internal-dashboard-freshness`, `production-promotion-dashboard`.

- [ ] **Step 1: Register exact outcome obligations**

Add the six obligation ids with owner, due time, evidence policy, idempotency key and recovery policy. Owners are `agent-cost`, `agent-integration-make`, `agent-security` and the existing Production Promotion Guardian according to domain.

- [ ] **Step 2: Run the complete local regression gate**

Run:
```bash
node --test tests/cost-*.test.mjs tests/daily-cost-optimizer.test.mjs tests/brain-cost-membership.test.mjs tests/brain-budget-envelope.test.mjs tests/agent-fabric*.test.mjs tests/brain-acceptance.test.mjs tests/whole-brain-obligation-contract.test.mjs tests/site-baseline-guardian.test.mjs
node tools/bouw-v18-production.mjs
```

Expected: 0 failed tests and build exit 0.

- [ ] **Step 3: Create preview and verify exact commit**

Deploy the exact candidate SHA. Verify:

- anonymous dashboard request denied;
- authenticated wrong-role request denied;
- invited correct-role user receives the data-free shell and sanitized API projection;
- CSP, no-store, noindex and DENY headers;
- every Make scenario and default agent appears exactly once;
- newest BG168 cost event is visible in BG167;
- dashboard freshness matches the accepted BG167 watermark.

- [ ] **Step 4: Run the first daily cost experiment in shadow**

Select at most one safe reversible candidate. Capture comparable before/after execution counts and verified outcomes. Record KEEP or ROLLBACK; do not infer savings from a different workload.

- [ ] **Step 5: Pass BG169 production authority**

Provide exact candidate SHA, preview proof, regression results, protected metrics, rollback SHA and access-control evidence. Promote only when BG169 returns the valid production-green decision.

- [ ] **Step 6: Verify exact production**

Verify Netlify production `commit_ref` equals the accepted SHA. Repeat unauthorized denial, authorized read, dashboard freshness, site baseline and protected Make outcome checks.

- [ ] **Step 7: Write final shared learning and ledger**

Route implementation and first verified saving via BG168; confirm BG167 visibility; append root cause, before/after, tests, production SHA/deploy, rollback and reusable lesson to the ledger.

Commit:
```bash
git add config/outcome-obligations.json docs/runbooks/make-cost-control.md docs/development-ledger.md
git commit -m "docs: close Brain cost control production obligations"
```

## Self-review

- Spec coverage: automatic onboarding, all-scenario accounting, 10,000-credit policy, daily bounded improvement, BG159/BG158/BG156/BG166/BG167/BG168/BG169 integration, dashboard, security, rollback and protected metrics are each assigned to tasks.
- Placeholder scan: the plan contains no deferred implementation marker; hard-boundary Identity configuration is explicitly fail-closed.
- Type consistency: component keys are `make:<id>` and `agent:<id>`; dashboard role is always `powerhouse-cost-admin`; budget decisions use the same six-value envelope across tasks.
- Operational honesty: the target is decreasing normalized credits/latency per verified outcome. Absolute day totals are not falsely required to decrease when real workload rises.
