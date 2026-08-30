# BRAIN Outcome Obligation Executor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one generic, evidence-first BRAIN outcome-obligation executor that discovers due obligations, deduplicates scheduled/event triggers, dispatches exactly one existing owner-agent work identity, routes missed obligations into governed recovery, and certifies the Supabase performance obligation end-to-end.

**Architecture:** Keep `config/outcome-obligations.json` as the declarative source and `platform/agents/agent-team.mjs` as the owner-agent source. Add a deterministic Node.js executor core with injected time/state/evidence, thin scheduled/event adapters, and one GitHub Actions daily sweep; no domain mutation logic enters the executor. Completion remains evidence-first and production-facing obligations require exact production proof through the existing BRAIN delivery authority.

**Tech Stack:** Node.js 22 ESM, `node:test`, GitHub Actions, existing BRAIN Delivery v2, existing agent registry, existing Supabase performance evidence/governor modules.

**Spec:** `docs/superpowers/specs/2026-08-30-outcome-obligation-executor-design.md`

## Global Constraints

- GitHub remains executable source of truth; Notion is projection only.
- `config/outcome-obligations.json` remains the canonical obligation registry.
- The executor is orchestration only; it never directly mutates production.
- Owner-agent self-report is not sufficient completion evidence.
- Production-facing completion requires exact production outcome evidence where the obligation contract requires it.
- Daily identities use the Europe/Amsterdam local business date, not a fixed UTC date.
- Duplicate scheduled/event wake-ups must coalesce before dispatch.
- Hard authorization boundaries fail closed as `BLOCKED_HARD_BOUNDARY`.
- Changes follow RED -> GREEN -> BRAIN gates -> moving-main check -> exact-head merge -> exact-SHA production verification -> append-only evidence.

---

## File map

- Create `tools/outcome-obligation-executor.mjs` — pure obligation evaluation, window/idempotency calculation, dispatch/recovery decisions.
- Create `tools/outcome-obligation-runtime.mjs` — loads canonical config/agent registry and adapts executor decisions to durable work/evidence interfaces; no external mutation beyond injected adapters.
- Create `tests/brain-outcome-obligation-executor.test.mjs` — unit/state/idempotency/evidence/hard-boundary tests.
- Create `tests/brain-outcome-obligation-runtime.test.mjs` — canonical config, owner-agent routing, Supabase reference integration, no-direct-mutation tests.
- Create `.github/workflows/outcome-obligation-sweep.yml` — one low-cost daily scheduled sweep plus `workflow_dispatch`; emits immutable artifacts and never bypasses BRAIN production authority.
- Modify `config/brain-delivery-system.json` — classify `tools/outcome-obligation-*` and tests into backend; workflow remains shared control-plane by existing `.github/workflows/` rule.
- Modify `tests/brain-delivery-system.test.mjs` — regression proving future obligation executor/runtime files are backend governed.
- Modify `scripts/brain/test-all.mjs` only if needed after verification; prefer no change because `tests/brain-*.test.mjs` already run in Unified Brain Delivery backend lane.

---

### Task 1: RED — deterministic executor state model and idempotency

**Files:**
- Create: `tests/brain-outcome-obligation-executor.test.mjs`
- Create later in Task 2: `tools/outcome-obligation-executor.mjs`

**Interfaces:**
- Consumes: obligation objects shaped like the entries in `config/outcome-obligations.json`; agent lookup callback; prior work/evidence arrays.
- Produces later: `evaluateOutcomeObligation(input)` and `computeExecutionIdentity(input)`.

- [ ] **Step 1: Write the failing tests**

Create `tests/brain-outcome-obligation-executor.test.mjs` with `node:test` and `assert/strict`. Import:

```js
import {
  computeExecutionIdentity,
  evaluateOutcomeObligation,
} from '../tools/outcome-obligation-executor.mjs';
```

Cover these exact behaviors:

```js
const daily = {
  id:'supabase-performance-evidence-daily',
  domain:'performance',
  dueAt:'daily_and_after_relevant_supabase_change',
  ownerAgent:'agent-performance',
  expected:'performance evidence',
  evidencePolicy:'independent evidence',
  idempotencyKey:'supabase-performance|finding-key|measurement-date|source-fingerprint',
  recoveryPolicy:'recover safely',
};
```

Tests must assert:

1. a non-due obligation returns `NOT_DUE` and `dispatch === null`;
2. due daily obligation returns `PENDING` before durable work exists;
3. after durable work exists it returns `AWAITING_OUTCOME`;
4. two scheduled wake-ups on the same Europe/Amsterdam business date produce the same idempotency key;
5. replaying the same event fingerprint produces the same idempotency key;
6. equivalent scheduled + event trigger can coalesce to the same effective work key when `coalesceKey` is supplied;
7. unknown/disabled owner agent returns `BLOCKED_HARD_BOUNDARY` with reason `unknown_or_disabled_owner_agent`;
8. explicit hard boundary returns `BLOCKED_HARD_BOUNDARY`;
9. owner activity evidence alone does not produce `COMPLETED`;
10. independent non-production evidence produces `COMPLETED`;
11. production-facing evidence without exact production proof remains `AWAITING_OUTCOME`;
12. exact accepted production evidence produces `COMPLETED`;
13. expired evidence deadline produces `MISSED_OBLIGATION`;
14. an existing recovery identity produces `RECOVERING` and does not create a second recovery identity;
15. executor result contains no `sql`, `ddl`, `httpMutation`, `deploy`, or equivalent direct-production command field.

For DST use two instants around the Europe/Amsterdam switch that resolve to the same local business date and assert one daily identity.

- [ ] **Step 2: Run the RED test**

Run:

```bash
node --test tests/brain-outcome-obligation-executor.test.mjs
```

Expected: FAIL because `tools/outcome-obligation-executor.mjs` does not exist.

- [ ] **Step 3: Preserve RED evidence**

Record the failing test command and failure in the PR description or BRAIN failure artifact. Do not add production code before this failure is observed.

- [ ] **Step 4: Commit RED only**

```bash
git add tests/brain-outcome-obligation-executor.test.mjs
git commit -m "test: define outcome obligation executor contract"
```

---

### Task 2: GREEN — pure executor core

**Files:**
- Create: `tools/outcome-obligation-executor.mjs`
- Test: `tests/brain-outcome-obligation-executor.test.mjs`

**Interfaces:**
- Produces:

```js
computeExecutionIdentity({ obligation, now, trigger, coalesceKey, timeZone = 'Europe/Amsterdam' })
evaluateOutcomeObligation({ obligation, now, trigger, agent, priorWork, evidence, hardBoundary, evidenceDeadline, productionProofRequired, coalesceKey, timeZone })
```

`evaluateOutcomeObligation` returns a frozen object containing at minimum:

```js
{
  obligationId,
  status,
  ownerAgent,
  traceId,
  executionWindow,
  triggerFingerprint,
  idempotencyKey,
  dispatch,
  recovery,
  acceptedEvidenceRefs,
}
```

- [ ] **Step 1: Implement business-date normalization**

Use `Intl.DateTimeFormat` with `timeZone:'Europe/Amsterdam'` and `year/month/day` parts to derive `YYYY-MM-DD`. Do not add a date library.

- [ ] **Step 2: Implement deterministic trigger normalization**

Normalize trigger to:

```js
{ type:'scheduled-sweep'|'event-trigger', fingerprint:string }
```

Reject unknown trigger types with `TypeError`. For a scheduled daily obligation, key by local business date. For event trigger, include stable fingerprint unless an explicit coalescing key maps it onto the scheduled measurement identity.

- [ ] **Step 3: Implement state precedence**

Use this order:

```text
validate config/owner -> determine due -> hard boundary -> reconcile accepted evidence -> durable work -> missed deadline -> recovery -> dispatch decision
```

A trigger never directly returns `COMPLETED`; completion comes only from accepted evidence reconciliation.

- [ ] **Step 4: Implement immutable dispatch/recovery descriptors**

A dispatch descriptor is metadata only:

```js
{
  type:'AgentWork',
  ownerAgent: obligation.ownerAgent,
  obligationId: obligation.id,
  idempotencyKey,
  requestedOutcome: obligation.expected,
}
```

Recovery descriptor:

```js
{
  type:'RecoveryWork',
  ownerAgent: obligation.ownerAgent,
  obligationId: obligation.id,
  idempotencyKey:`recovery|${idempotencyKey}`,
  policy:obligation.recoveryPolicy,
}
```

- [ ] **Step 5: Run executor tests**

```bash
node --test tests/brain-outcome-obligation-executor.test.mjs
```

Expected: PASS, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add tools/outcome-obligation-executor.mjs tests/brain-outcome-obligation-executor.test.mjs
git commit -m "feat: add deterministic outcome obligation executor"
```

---

### Task 3: RED/GREEN — canonical runtime adapter and owner-agent routing

**Files:**
- Create: `tests/brain-outcome-obligation-runtime.test.mjs`
- Create: `tools/outcome-obligation-runtime.mjs`
- Read: `config/outcome-obligations.json`
- Read: `platform/agents/agent-team.mjs`
- Read: `tools/supabase-performance-evidence.mjs`
- Read: `tools/supabase-performance-governor.mjs`

**Interfaces:**
- Consumes: `createDefaultAgentRegistry()` from `platform/agents/agent-team.mjs` and executor functions from Task 2.
- Produces:

```js
loadCanonicalObligations({ path = 'config/outcome-obligations.json' })
createOutcomeObligationRuntime({ registry, workStore, evidenceStore, recoveryStore, clock })
runtime.evaluateSweep({ trigger, obligationIds })
```

Stores are injected interfaces:

```js
workStore.get(idempotencyKey)
workStore.putIfAbsent(record)
evidenceStore.list(idempotencyKey)
recoveryStore.get(idempotencyKey)
recoveryStore.putIfAbsent(record)
```

- [ ] **Step 1: Write RED runtime tests**

Tests must prove:

- canonical obligation `supabase-performance-evidence-daily` exists;
- its owner resolves to the existing `agent-performance` from `createDefaultAgentRegistry()`;
- owner exists and declares `measure-runtime-performance`, `detect-performance-regression`, and `verify-latency-and-memory`;
- a due sweep creates exactly one `AgentWork` in an in-memory `putIfAbsent` store;
- repeating the sweep creates zero additional work records;
- a relevant Supabase event routes through the same runtime;
- duplicate event fingerprint creates zero additional work records;
- activity evidence remains `AWAITING_OUTCOME`;
- accepted independent evidence can complete a non-production observation;
- exact-production remeasurement requirement prevents premature completion when a candidate change is involved;
- runtime never calls the Supabase governor to execute DDL; it may only produce a governed decision descriptor.

- [ ] **Step 2: Run RED**

```bash
node --test tests/brain-outcome-obligation-runtime.test.mjs
```

Expected: FAIL because runtime module does not exist.

- [ ] **Step 3: Implement loader and in-memory-safe runtime orchestration**

Read JSON with `fs/promises`. Validate `registeredObligations` is an array and IDs are unique. Resolve owner by `registry.get(obligation.ownerAgent)`; unknown owners fail closed.

`evaluateSweep` must call `putIfAbsent` only after the pure executor returns a dispatch descriptor.

- [ ] **Step 4: Integrate the Supabase reference path without mutation**

For `supabase-performance-evidence-daily`, expose metadata telling `agent-performance` to execute its existing measurement task. Do not import a database client or execute SQL from the executor/runtime.

- [ ] **Step 5: Run runtime + executor tests**

```bash
node --test tests/brain-outcome-obligation-executor.test.mjs tests/brain-outcome-obligation-runtime.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add tools/outcome-obligation-runtime.mjs tests/brain-outcome-obligation-runtime.test.mjs
git commit -m "feat: route obligations to existing Brain agents"
```

---

### Task 4: BRAIN governance classification

**Files:**
- Modify: `config/brain-delivery-system.json`
- Modify: `tests/brain-delivery-system.test.mjs`

**Interfaces:**
- Consumes: existing `createDeliveryPlan` and backend lane contract.
- Produces: automatic backend classification for future executor/runtime code and tests.

- [ ] **Step 1: Add the RED classifier regression**

Add a test to `tests/brain-delivery-system.test.mjs`:

```js
test('future outcome obligation runtime files are automatically backend governed', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  for (const path of [
    'tools/outcome-obligation-executor.mjs',
    'tools/outcome-obligation-future-adapter.mjs',
    'tests/brain-outcome-obligation-runtime.test.mjs',
  ]) {
    const plan = createDeliveryPlan({ changedPaths:[path], headSha:'abc123def4567890', policy });
    assert.ok(plan.lanes.some(lane => lane.id === 'backend'), `${path} must be backend delivery work`);
  }
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/brain-delivery-system.test.mjs
```

Expected: FAIL for unclassified `tools/outcome-obligation-*` before policy change.

- [ ] **Step 3: Add generic backend path rule**

In backend lane `paths`, add:

```json
"tools/outcome-obligation-"
```

`tests/brain-` is already covered; do not add a redundant one-off filename.

- [ ] **Step 4: Run classifier test**

```bash
node --test tests/brain-delivery-system.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add config/brain-delivery-system.json tests/brain-delivery-system.test.mjs
git commit -m "brain: govern outcome obligation runtime as backend"
```

---

### Task 5: Scheduled and event trigger adapters

**Files:**
- Create: `.github/workflows/outcome-obligation-sweep.yml`
- Modify: `tests/brain-outcome-obligation-runtime.test.mjs` or create `tests/brain-outcome-obligation-workflow.test.mjs` if workflow assertions become large.

**Interfaces:**
- Scheduled adapter calls the same runtime with `type:'scheduled-sweep'`.
- Manual/event adapter accepts `trigger_type`, `trigger_fingerprint`, and optional `obligation_id`; it does not execute domain mutations.

- [ ] **Step 1: Write workflow contract RED test**

Assert workflow contains:

```text
schedule:
workflow_dispatch:
actions/checkout@v5
actions/setup-node@v5
node-version: 22
outcome-obligation-runtime
```

Also assert it has read-only default permissions and uploads an immutable decision artifact. It must not contain `psql`, `supabase db`, `netlify deploy`, `curl -X POST`, or direct production mutation commands.

- [ ] **Step 2: Run RED workflow test**

```bash
node --test tests/brain-outcome-obligation-workflow.test.mjs
```

Expected: FAIL because workflow does not exist.

- [ ] **Step 3: Create one daily workflow**

Use one schedule, for example:

```yaml
on:
  workflow_dispatch:
    inputs:
      obligation_id:
        required: false
        type: string
      trigger_type:
        required: false
        default: scheduled-sweep
        type: string
      trigger_fingerprint:
        required: false
        type: string
  schedule:
    - cron: '23 4 * * *'
```

The cron is only a wake-up; Europe/Amsterdam business-date logic stays in the executor.

The job must:

1. checkout exact `main` for scheduled runs;
2. setup Node 22;
3. run executor/runtime tests before evaluation;
4. call a CLI entry in `tools/outcome-obligation-runtime.mjs` that writes `.artifacts/outcome-obligation-decisions.json`;
5. upload the artifact with retention;
6. never mark obligations completed merely because the workflow succeeded.

- [ ] **Step 4: Add CLI mode to runtime**

Support:

```bash
node tools/outcome-obligation-runtime.mjs sweep --now "$NOW" --trigger-type scheduled-sweep
node tools/outcome-obligation-runtime.mjs event --obligation supabase-performance-evidence-daily --fingerprint "$FINGERPRINT"
```

CLI output is decision/evidence metadata only. If a durable external work store is not configured, fail closed rather than pretend dispatch occurred.

- [ ] **Step 5: Run tests**

```bash
node --test tests/brain-outcome-obligation-executor.test.mjs tests/brain-outcome-obligation-runtime.test.mjs tests/brain-outcome-obligation-workflow.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/outcome-obligation-sweep.yml tools/outcome-obligation-runtime.mjs tests/brain-outcome-obligation-workflow.test.mjs tests/brain-outcome-obligation-runtime.test.mjs
git commit -m "feat: add generic obligation sweep and event adapters"
```

---

### Task 6: Durable AgentWork/evidence/recovery adapter using existing BRAIN stores

**Files:**
- Inspect first: existing `brain/`, `platform/`, `netlify/functions/_brain-event-store*`, and BG166/BG168 adapters on current main.
- Modify/create only the smallest adapter file required; prefer `platform/agents/outcome-obligation-store.mjs` if no canonical adapter exists.
- Test: `tests/brain-outcome-obligation-runtime.test.mjs`

**Interfaces:**
- Must implement the injected store contracts from Task 3 using the already canonical BRAIN event/evidence path.
- Must not create a competing database/source of truth.

- [ ] **Step 1: Identify canonical append-only store**

Before writing code, inspect current main for BG166/BG168/event-store APIs. Select the existing append-only transport. If it cannot support compare-and-set/idempotent creation, add only an adapter-level idempotency check using the existing canonical evidence identity; do not introduce a new task-queue product.

- [ ] **Step 2: RED test duplicate concurrency**

Simulate two concurrent `putIfAbsent` attempts for the same idempotency key and assert exactly one effective `AgentWork` identity.

- [ ] **Step 3: Implement adapter**

Persist compact records only:

```js
{
  kind:'outcome-obligation-work',
  obligationId,
  ownerAgent,
  idempotencyKey,
  traceId,
  state,
  evidenceRefs,
  observedAt,
}
```

No raw customer/business payloads or secrets.

- [ ] **Step 4: Run tests**

```bash
node --test tests/brain-outcome-obligation-*.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

Commit only the chosen canonical adapter and tests.

---

### Task 7: End-to-end Supabase reference certification

**Files:**
- No new domain mutator.
- Use: `tools/supabase-performance-evidence.mjs`
- Use: `tools/supabase-performance-governor.mjs`
- Use: `config/outcome-obligations.json`
- Test: `tests/brain-outcome-obligation-runtime.test.mjs`

**Interfaces:**
- Input: daily scheduled trigger and a relevant Supabase event fingerprint.
- Output: one coalesced `AgentWork` owned by `agent-performance`, evidence snapshot/trend decision, and final state based on independent evidence.

- [ ] **Step 1: Add an end-to-end fixture**

Use fixed timestamps and in-memory stores. Drive:

```text
due daily -> PENDING -> durable work -> AWAITING_OUTCOME -> performance OBSERVE evidence -> COMPLETED
```

For a candidate-index fixture, drive:

```text
due -> AgentWork -> CANDIDATE_INDEX descriptor -> AWAITING_OUTCOME -> exact-production remeasurement -> COMPLETED
```

- [ ] **Step 2: Verify event coalescing**

Replay the same relevant Supabase event plus the daily sweep and assert one effective measurement work identity when the same outcome window applies.

- [ ] **Step 3: Verify negative learning**

Feed a post-production measurement with `<10%` p95 improvement via `evaluatePerformanceOutcome`; obligation evidence may complete only after recording `NO_MEASURABLE_BENEFIT`, not by pretending improvement.

- [ ] **Step 4: Run the focused suite**

```bash
node --test tests/brain-outcome-obligation-*.test.mjs tests/supabase-*.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Run full BRAIN test suite locally/CI**

```bash
node scripts/brain/test-all.mjs
node --test tests/brain-*.test.mjs tests/supabase-*.test.mjs tests/delivery-*.test.mjs
```

Expected: 0 failures.

- [ ] **Step 6: Commit**

```bash
git add tests/brain-outcome-obligation-runtime.test.mjs
git commit -m "test: certify Supabase obligation reference path"
```

---

### Task 8: Candidate PR and full BRAIN verification

**Files:** all implementation files from Tasks 1–7.

- [ ] **Step 1: Rebase/rebuild only if policy requires it**

Fetch current `main`. Use the existing BRAIN moving-main contract: non-overlapping drift keeps the tested candidate; actual file/contract overlap or merge conflict requires rebuilding from current main.

- [ ] **Step 2: Open one candidate PR**

PR body must include:

- RED run IDs/evidence;
- focused GREEN commands;
- changed-file scope;
- statement that executor performs no direct production mutation;
- Supabase reference-path test evidence;
- exact candidate head SHA.

- [ ] **Step 3: Require all existing gates**

At minimum verify success for:

- Unified Brain Delivery;
- backend lane;
- Shared Agent Memory;
- V18 Production Promotion;
- Component Foundation/Fresh Device where triggered by shared workflow/config changes;
- Live Preview Smoke where triggered.

- [ ] **Step 4: Inspect handoff**

Confirm `Enforce current-main file and contract conflict index` is success against the then-current main.

- [ ] **Step 5: Merge only with expected head SHA**

If head changes after verification, rerun the relevant gates. Never merge a stale head.

---

### Task 9: Production verification and autonomy proof

**Files:** no ungoverned edits.

- [ ] **Step 1: Verify current GitHub main SHA**

Capture exact merge/main SHA.

- [ ] **Step 2: Verify Netlify production parity**

Use Netlify deployment metadata. Require:

```text
state = ready
branch = main
context = production
commit_ref = exact GitHub main SHA
error_message = null
```

Do not claim direct `release.json` verification unless its body was actually fetched.

- [ ] **Step 3: Run a safe scheduled-sweep canary**

Trigger the new workflow manually in read/evidence mode against `supabase-performance-evidence-daily`. Require one durable work identity or an idempotent reuse of an existing current-window identity.

- [ ] **Step 4: Run duplicate canary**

Repeat the exact trigger and verify no duplicate effective `AgentWork` appears.

- [ ] **Step 5: Run relevant-event canary**

Use a non-destructive synthetic/replay-safe Supabase-change fingerprint. Verify it routes to the same executor and coalesces when contract-equivalent.

- [ ] **Step 6: Prove evidence-first completion**

Show that workflow success without independent evidence remains `AWAITING_OUTCOME`; then add/observe the valid evidence reference and verify transition according to contract.

- [ ] **Step 7: Append GREEN evidence**

Write one canonical append-only BRAIN evidence record containing:

- merge SHA;
- workflow run IDs;
- exact production deploy ID/SHA;
- obligation ID;
- owner agent;
- idempotency/work identity;
- duplicate-canary result;
- evidence-first state transitions;
- no-direct-production-mutation assertion;
- recovery/hard-boundary result if encountered.

- [ ] **Step 8: Certify autonomy only when all proofs exist**

Only claim the executor autonomous when the safe canary proves: due discovery, exactly-one dispatch, duplicate coalescing, evidence gating, and current main == production SHA. If durable dispatch cannot execute because an external connector/credential is missing, record `BLOCKED_HARD_BOUNDARY` and do not claim autonomy.
