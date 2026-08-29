# No Silent Failure / No Lost Obligation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every production-critical Bedrijfsgeheugen action an outcome-verified obligation that cannot silently disappear or finish as success without the intended result.

**Architecture:** Use low-cost deterministic obligation sensors first, deterministic idempotent repair when proven safe, and BG156 governed GREEN-UNTIL-DONE recovery only for unresolved RED obligations. Domain adapters own actual outcome evidence; BG168/BG166/BG167 remain shared learning, BG169 remains production authority, and BG165 remains runtime continuity recovery.

**Tech Stack:** Make.com scenarios, Notion central state, LinkedIn/Instagram native Make connectors, Node.js `node:test`, GitHub Actions, GitHub, Netlify.

**Spec:** `docs/superpowers/specs/2026-08-29-no-silent-failure-obligation-guardian-design.md`

## Global Constraints

- No secret, credential or permission changes.
- Never weaken security controls.
- No destructive/irreversible data mutations.
- No increase in paid external resources.
- No legally/financially binding actions.
- Max two identical retries per hypothesis; then change hypothesis/fix/fallback.
- `COMPLETED` requires independent outcome evidence.
- Exact tested SHA/deploy remains mandatory for production promotion.
- Healthy-path monitoring must be deterministic and bounded; invoke paid AI only for RED obligations that cannot be safely repaired deterministically.

---

### Task 1: Repository obligation contract

**Files:**
- Create: `docs/outcome-obligations.md`
- Modify: `docs/development-operating-system.md`
- Modify: `docs/self-healing-agents.md`
- Test: `tests/outcome-obligation-contract.test.mjs`

**Interfaces:**
- Consumes: existing `AGENTS.md` GREEN-UNTIL-DONE and shared-memory contracts.
- Produces: canonical obligation fields, state semantics and machine-enforced invariant tokens used by all later adapters.

- [ ] **Step 1: Write the failing contract test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const REQUIRED = [
  'NO SILENT FAILURE',
  'NO LOST OBLIGATION',
  'GREEN MEANS OUTCOME VERIFIED',
  'EXPECTED', 'ATTEMPTED', 'VERIFIED', 'COMPLETED',
  'idempotency_key', 'verification_rule', 'next_safe_action',
  'BG184', 'BG156', 'BG165', 'BG168', 'BG166', 'BG167', 'BG169'
];

test('whole-brain obligation contract is machine enforced', async () => {
  const contract = await readFile('docs/outcome-obligations.md', 'utf8');
  for (const token of REQUIRED) assert.ok(contract.includes(token), `missing ${token}`);
  assert.match(contract, /zero[- ](?:candidate|work|output).*RED/is);
  assert.match(contract, /COMPLETED[\s\S]*verification/i);
});

test('operating contracts reference the obligation contract', async () => {
  for (const path of ['docs/development-operating-system.md','docs/self-healing-agents.md']) {
    const text = await readFile(path, 'utf8');
    assert.ok(text.includes('docs/outcome-obligations.md'), `${path} missing obligation contract`);
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/outcome-obligation-contract.test.mjs`
Expected: FAIL because `docs/outcome-obligations.md` does not yet exist and operating contracts do not reference it.

- [ ] **Step 3: Add the canonical contract and references**

Create `docs/outcome-obligations.md` with the approved invariant and exact field/state definitions. Add `docs/outcome-obligations.md` to the mandatory operating read sequence in both operating/self-healing documents. Explicitly state that overdue zero-candidate/zero-output success is RED.

- [ ] **Step 4: Re-run the test**

Run: `node --test tests/outcome-obligation-contract.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/outcome-obligations.md docs/development-operating-system.md docs/self-healing-agents.md tests/outcome-obligation-contract.test.mjs
git commit -m "feat: enforce outcome obligation contract"
```

### Task 2: Social obligation reference adapter

**Files:**
- Create: `docs/make/bg184-social-outcome-obligation-guardian.md`
- Test: `tests/social-obligation-adapter-contract.test.mjs`

**Interfaces:**
- Consumes: central media calendar `626e4c3c-cfee-4390-b519-6a910538607d`, BG171, BG179, BG156, BG168.
- Produces: documented and tested contract for Make scenario `7147086` / BG184.

- [ ] **Step 1: Write failing adapter contract**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('BG184 declares due detection, verification, idempotency and escalation', async () => {
  const text = await readFile('docs/make/bg184-social-outcome-obligation-guardian.md', 'utf8');
  for (const token of [
    '7147086', '3600', '10 minute',
    'Post ID LinkedIn', 'Bedrijfspaginapost', 'Post ID Instagram',
    '7140072', '7140394', '7132258', '7136176',
    'type', 'source', 'idempotent'
  ]) assert.ok(text.includes(token), `missing ${token}`);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/social-obligation-adapter-contract.test.mjs`
Expected: FAIL because the BG184 contract document does not exist.

- [ ] **Step 3: Document exact BG184 runtime contract**

Document hourly interval `3600`, 10-minute grace, safe deterministic QA requirements, native executor IDs, external ID evidence, the corrected BG156 envelope (`type` + `source`) and the external Make-resource-limit status if still present.

- [ ] **Step 4: Re-run test**

Run: `node --test tests/social-obligation-adapter-contract.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/make/bg184-social-outcome-obligation-guardian.md tests/social-obligation-adapter-contract.test.mjs
git commit -m "test: contract social outcome guardian"
```

### Task 3: Global Make execution sentinel design contract

**Files:**
- Create: `docs/make/global-execution-obligation-sentinel.md`
- Test: `tests/global-execution-obligation-sentinel-contract.test.mjs`

**Interfaces:**
- Consumes: Make production-critical scenario inventory, BG165 runtime recovery, BG156 governed recovery, BG168 shared learning.
- Produces: deterministic health-sensor contract for future/global execution monitoring without paid healthy-path AI calls.

- [ ] **Step 1: Write failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('global sentinel is deterministic, bounded and outcome-aware', async () => {
  const text = await readFile('docs/make/global-execution-obligation-sentinel.md', 'utf8');
  for (const token of ['BG165','BG156','BG168','schedule','last execution','required output','deterministic','bounded','domain adapter']) {
    assert.ok(text.includes(token), `missing ${token}`);
  }
  assert.match(text, /healthy[\s\S]*no paid AI/i);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/global-execution-obligation-sentinel-contract.test.mjs`
Expected: FAIL before the contract exists.

- [ ] **Step 3: Add bounded sentinel contract**

Specify active/invalid/inactive detection, expected schedule versus execution recency, declared required output checks, BG165 routing for continuity and BG156 only for unresolved RED business outcomes. Explicitly state the sentinel cannot substitute for domain verifiers.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/global-execution-obligation-sentinel-contract.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add docs/make/global-execution-obligation-sentinel.md tests/global-execution-obligation-sentinel-contract.test.mjs
git commit -m "docs: define global execution obligation sentinel"
```

### Task 4: Incident and shared-learning ledger

**Files:**
- Modify: `docs/development-ledger.md`

**Interfaces:**
- Consumes: verified 2026-08-29 executions and platform IDs plus BG184/BG156 evidence.
- Produces: append-only ERROR/RECOVERY/IMPROVEMENT/CONTRACT_CHANGE record for future agents.

- [ ] **Step 1: Append ERROR for silent social success**

Record fingerprint `content|social-publication|expected-today-zero-eligible-candidates`, the 08:40/10:25 successful runs with zero candidates, and the release-state mismatch root cause.

- [ ] **Step 2: Append RECOVERY with external evidence**

Record BG171 execution `2c11c1721cda4869a0143763b7421ed2`, BG179 execution `b766d98ce0fa43d384c7f3885be833c1`, LinkedIn personal/company IDs and Instagram ID.

- [ ] **Step 3: Append ERROR/RECOVERY for BG156 envelope contract**

Record `INVALID_EVENT_ENVELOPE` from execution `88d100e8e44d40b4804a0290698fcb43` and the corrected `type` + `source` BG184 envelope. If Make remains paused, record verification as blocked by paid-resource boundary rather than falsely green.

- [ ] **Step 4: Append CONTRACT_CHANGE**

Record the universal obligation invariant and reference implementation BG184.

- [ ] **Step 5: Run documentation tests and commit**

Run: `node --test tests/development-doc-contract.test.mjs tests/outcome-obligation-contract.test.mjs tests/social-obligation-adapter-contract.test.mjs tests/global-execution-obligation-sentinel-contract.test.mjs`
Expected: PASS.

### Task 5: Candidate release and production authority

**Files:** no new implementation files unless CI exposes a regression.

**Interfaces:**
- Consumes: exact branch head after Tasks 1–4.
- Produces: exact green production SHA/deploy or a documented hard boundary while last-known-good remains protected.

- [ ] **Step 1: Open PR from `automation/no-silent-failure-obligations` to `main`**

Use exact branch head and no unrelated changes.

- [ ] **Step 2: Verify CI and preview exact SHA**

Require shared-memory/document contract gates and any relevant Netlify preview to be green. A red gate triggers root-cause repair, not merge.

- [ ] **Step 3: Merge guarded by expected head SHA**

Merge only the exact tested candidate.

- [ ] **Step 4: Verify exact Netlify production SHA/deploy and protected metrics**

Require state `ready`, exact `commit_ref`, normal smoke, redirect/header/function counts without regression and zero secret-scan findings.

- [ ] **Step 5: Update BG169 and shared learning**

Write `PRODUCTION_PROMOTION` only after exact production evidence. If production regresses, rollback to last-known-good and continue recovery.

### Task 6: Resume Make runtime verification after resource boundary clears

**Files:** no repository files unless new runtime evidence requires a contract change.

**Interfaces:**
- Consumes: BG184 `7147086` with corrected BG156 envelope.
- Produces: verified hourly autonomous recovery path.

- [ ] **Step 1: Run BG184 once**

Expected healthy behavior: published obligations are absent from the search; overdue incomplete obligations are RED and route to BG156; safe release-state gaps deterministically recover.

- [ ] **Step 2: Verify BG156 accepts the corrected envelope**

Expected: no `INVALID_EVENT_ENVELOPE`; the incident enters governed recovery or is deduplicated/coalesced.

- [ ] **Step 3: Verify scheduled state**

BG184 remains active with `interval=3600` and no incomplete executions.

- [ ] **Step 4: Write RECOVERY/IMPROVEMENT through BG168**

Only after actual runtime proof.

## Self-review

- Spec coverage: invariant, state model, deterministic detection, self-repair, governed escalation, idempotency, shared memory, domain adapters, cost controls, hard boundaries and production gate all map to tasks above.
- Placeholder scan: no TBD/TODO/implement-later instructions are present.
- Type/name consistency: Make IDs and canonical field names match the current verified system state.
- Scope: the plan implements the universal contract plus the social reference adapter and the execution-sentinel contract; future domain-specific adapters inherit the same contract rather than expanding this plan indefinitely.
