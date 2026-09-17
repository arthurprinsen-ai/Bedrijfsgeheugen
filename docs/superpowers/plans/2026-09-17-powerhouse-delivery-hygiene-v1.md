# POWERHOUSE-DELIVERY-HYGIENE-v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add repository-wide delivery admission, one-candidate-per-obligation enforcement, WIP budgeting, promotion serialization, safe supersession, and evidence-first repository cleanup without creating a second delivery brain or relaxing existing gates.

**Architecture:** Extend `BRAIN-DELIVERY-v2` with a pure delivery-hygiene decision module, a small policy document, an early GitHub admission workflow, and a safe janitor workflow. `Required test` remains the only protected aggregator context; `Unified Brain Delivery` rechecks exact admitted candidate identity before expensive lane execution and before handoff.

**Tech Stack:** Node.js 22 ESM, `node:test`, GitHub Actions YAML, GitHub CLI in Actions, existing BRAIN delivery JSON/contracts.

**Spec:** `docs/superpowers/specs/2026-09-17-powerhouse-delivery-hygiene-v1-design.md`

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No new database, external queue, scheduler service, or separate learning store.
- Existing protected branch context remains `test`.
- Fail closed on ambiguous ownership, duplicate active candidates, unsafe supersession, stale candidate identity, or conflicting promotion state.
- Default executable WIP limit is 5; dependency maintenance and non-executable docs are counted separately.
- Automated cleanup may act only on deterministic lineage proof; title/path/age similarity is never sufficient.
- Production/readback gates, Supabase security gates, exact-SHA checks, and main protection must not be weakened.

---

### Task 1: Delivery hygiene pure policy and decision model

**Files:**
- Create: `config/powerhouse-delivery-hygiene-v1.json`
- Create: `tools/delivery/delivery-hygiene.mjs`
- Create: `tests/delivery-hygiene-policy.test.mjs`

**Interfaces:**
- Consumes: PR snapshots `{number,state,body,headSha,baseSha,labels,changedPaths,conflictContracts}` and policy JSON.
- Produces: `parseDeliveryMetadata(body)`, `classifyCandidate(pr, policy)`, `evaluateAdmission({candidate, openCandidates, policy, currentMainSha})`, `evaluateSupersession({successor, predecessor})`, `evaluatePromotionSerialization({candidate, openCandidates})`.

- [ ] **Step 1: Write failing policy/metadata tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseDeliveryMetadata, evaluateAdmission } from '../tools/delivery/delivery-hygiene.mjs';

test('parses canonical delivery metadata', () => {
  const metadata = parseDeliveryMetadata(`Obligation-ID: BG-1959\nDelivery-Lane: backend\nCandidate-Type: implementation\nBase-SHA: ${'a'.repeat(40)}\nSupersedes: none`);
  assert.equal(metadata.obligationId, 'BG-1959');
  assert.equal(metadata.deliveryLane, 'backend');
});

test('blocks a second active candidate for the same obligation', () => {
  const candidate = { number: 2, executable: true, metadata: { obligationId: 'BG-1', supersedes: null }, headSha: 'b'.repeat(40), baseSha: 'a'.repeat(40), conflictContracts: [] };
  const openCandidates = [{ number: 1, executable: true, metadata: { obligationId: 'BG-1' }, headSha: 'c'.repeat(40), conflictContracts: [] }];
  assert.equal(evaluateAdmission({ candidate, openCandidates, policy: { wip: { maxExecutable: 5 } }, currentMainSha: 'a'.repeat(40) }).state, 'BLOCKED_DUPLICATE_OBLIGATION');
});
```

- [ ] **Step 2: Run RED**

Run: `node --test tests/delivery-hygiene-policy.test.mjs`
Expected: FAIL because `tools/delivery/delivery-hygiene.mjs` does not exist.

- [ ] **Step 3: Add policy JSON**

```json
{
  "version": "POWERHOUSE-DELIVERY-HYGIENE-v1",
  "wip": { "maxExecutable": 5 },
  "priorityLanes": ["security", "incident"],
  "nonProductLanes": ["dependency", "docs"],
  "allowedLanes": ["backend", "portal", "website", "automation", "security", "incident", "dependency", "docs"],
  "allowedCandidateTypes": ["implementation", "recovery", "security", "dependency", "docs", "promotion"]
}
```

- [ ] **Step 4: Implement minimal pure decision module**

Implement validation and deterministic states only. Candidate metadata must be exact; malformed executable metadata returns `BLOCKED_METADATA_INVALID`. A same-obligation predecessor referenced by exact PR number is the only supersession route admitted in v1.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/delivery-hygiene-policy.test.mjs`
Expected: PASS.

- [ ] **Step 6: Expand regression coverage**

Add tests for WIP 4/5/6, docs/dependency exclusions, invalid cross-obligation supersession, valid successor, stale base identity policy, overlapping/non-overlapping promotion contracts.

- [ ] **Step 7: Commit**

`git commit -m "feat: add delivery hygiene admission policy"`

---

### Task 2: Integrate canonical metadata with branch hygiene and BRAIN delivery

**Files:**
- Modify: `tools/delivery-branch-hygiene-guard.mjs`
- Modify: `tools/brain-delivery-system.mjs`
- Modify: `config/brain-delivery-system.json`
- Create: `tests/delivery-hygiene-brain-integration.test.mjs`

**Interfaces:**
- Consumes: existing `Change-Scope`, `Scope-Budget`, changed-path lane derivation, conflict contracts.
- Produces: one metadata parse path and conflict-contract evidence reused by admission and promotion.

- [ ] **Step 1: Write failing integration tests**

Test that `parseScopeMetadata()` preserves existing fields and also returns canonical delivery metadata without changing branch-hygiene semantics. Test that a control-plane change is classified as executable and carries `delivery-control-plane` conflict contract.

- [ ] **Step 2: Run RED**

Run: `node --test tests/delivery-branch-hygiene-guard.test.mjs tests/delivery-hygiene-brain-integration.test.mjs`
Expected: new tests FAIL, existing tests PASS.

- [ ] **Step 3: Implement minimal integration**

Reuse `parseDeliveryMetadata` rather than duplicate parsing. Extend BRAIN delivery policy shared/conflict paths for the new hygiene config/tool/workflows/tests so delivery-control-plane changes are classified consistently.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/delivery-branch-hygiene-guard.test.mjs tests/brain-delivery-system.test.mjs tests/delivery-hygiene-brain-integration.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: integrate hygiene with brain delivery"`

---

### Task 3: Add cheap admission gate before Required test fan-out

**Files:**
- Create: `.github/workflows/powerhouse-delivery-hygiene.yml`
- Modify: `.github/workflows/required-test.yml`
- Create: `tests/delivery-hygiene-required-wiring.test.mjs`

**Interfaces:**
- Produces workflow outputs `state`, `admitted`, `obligation_id`, `candidate_head_sha`, `conflict_contracts`.
- `required-test.yml` consumes `admitted == true` before current preflight and lane jobs.

- [ ] **Step 1: Write failing workflow-wiring tests**

Read YAML as text and assert that `Required test` invokes delivery hygiene before `preflight`, `preflight` needs hygiene, and final `test` aggregates hygiene result without changing the required job name `test`.

- [ ] **Step 2: Run RED**

Run: `node --test tests/delivery-hygiene-required-wiring.test.mjs`
Expected: FAIL because workflow/wiring is absent.

- [ ] **Step 3: Create reusable admission workflow**

Use `pull_request` and `workflow_call`. Checkout exact head with `fetch-depth: 0`, query open PRs with `gh api`, normalize them in Node, load both BRAIN and hygiene policies, calculate changed paths/conflict contracts, and call `evaluateAdmission`. Fail before `npm install` or broad suites when `admitted=false`. Upload structured `.artifacts/powerhouse-delivery-hygiene.json`.

- [ ] **Step 4: Wire Required test**

Add `hygiene` before `preflight`; make `preflight.needs: hygiene`; final `test` must require successful hygiene plus only selected lanes. Preserve `name: test` exactly.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/delivery-hygiene-required-wiring.test.mjs tests/delivery-required-branch-hygiene-wiring.test.mjs tests/delivery-test-coverage-guard.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat: gate required tests with delivery admission"`

---

### Task 4: Recheck admission in Unified Brain Delivery and serialize promotion

**Files:**
- Modify: `.github/workflows/unified-brain-delivery.yml`
- Create: `tests/delivery-hygiene-unified-brain.test.mjs`

**Interfaces:**
- Reuses exact PR/base/head identity already present in Unified Brain Delivery.
- Adds an admission recheck before `lanes` and before `handoff` using the same pure policy.

- [ ] **Step 1: Write failing tests**

Assert workflow has an admission recheck after candidate identity but before lane execution, and a second recheck before promotion handoff. Assert a superseded candidate cannot reach handoff.

- [ ] **Step 2: Run RED**

Run: `node --test tests/delivery-hygiene-unified-brain.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement rechecks**

Add cheap GitHub-state reads and call `evaluateAdmission`/`evaluatePromotionSerialization`. Preserve existing branch-drift, exact-SHA, main-protection and production-authority steps unchanged after the new gate.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/delivery-hygiene-unified-brain.test.mjs tests/unified-brain-production-handoff.test.mjs tests/brain-moving-main-successor-guard.test.mjs tests/delivery-driftless-merge-candidate.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

`git commit -m "feat: serialize canonical brain promotion"`

---

### Task 5: Add evidence-first Repository Janitor

**Files:**
- Create: `tools/delivery/repository-janitor.mjs`
- Create: `.github/workflows/powerhouse-repository-janitor.yml`
- Create: `tests/delivery-hygiene-janitor.test.mjs`

**Interfaces:**
- Consumes normalized open PR snapshots and canonical hygiene decisions.
- Produces `{actions, reviewRequired, duplicateGroups, wipCount, evidence}` where actions are only `MARK_SUPERSEDED`/`CLOSE_PR` with deterministic reason codes.

- [ ] **Step 1: Write failing janitor tests**

Cover dry-run no mutation, explicit same-obligation successor, exact duplicate linked predecessor, similar title/path without lineage, fulfilled obligation with unique commits, and ambiguous legacy PR.

- [ ] **Step 2: Run RED**

Run: `node --test tests/delivery-hygiene-janitor.test.mjs`
Expected: FAIL because janitor module does not exist.

- [ ] **Step 3: Implement pure janitor planner**

No GitHub mutation code in the pure module. It returns safe planned actions and review-required rows only.

- [ ] **Step 4: Create janitor workflow**

`workflow_dispatch` input `mode` supports `dry-run` and `apply-safe`; schedule defaults to dry-run semantics unless explicitly configured to apply deterministic safe actions. Query PRs, generate artifact, and in `apply-safe` close only exact planned actions through `gh api`/`gh pr close`. Never delete branches in v1.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/delivery-hygiene-janitor.test.mjs tests/delivery-hygiene-policy.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

`git commit -m "feat: add safe repository janitor"`

---

### Task 6: Full regression, live backlog dry-run, PR and production closure

**Files:**
- Modify only if a failing regression exposes a real implementation defect.
- Evidence artifact comes from GitHub Actions; no new persistent store.

**Interfaces:**
- GitHub PR becomes the canonical implementation candidate for this obligation.
- Existing Powerhouse evidence/learning paths remain the writeback authority.

- [ ] **Step 1: Run focused suite**

Run: `node --test tests/delivery-hygiene-*.test.mjs tests/delivery-branch-hygiene-guard.test.mjs tests/brain-delivery-system.test.mjs tests/brain-moving-main-successor-guard.test.mjs tests/delivery-driftless-merge-candidate.test.mjs tests/unified-brain-production-handoff.test.mjs`
Expected: PASS.

- [ ] **Step 2: Run Required-test equivalent local suites**

Run the exact preflight/security/portal/unwired/control-plane commands currently encoded in `.github/workflows/required-test.yml`.
Expected: PASS.

- [ ] **Step 3: Open one implementation PR with canonical metadata**

Body must include:

```text
Obligation-ID: powerhouse-delivery-hygiene-v1
Delivery-Lane: automation
Candidate-Type: implementation
Base-SHA: <exact current implementation base>
Supersedes: none
Change-Scope: config/powerhouse-delivery-hygiene-v1.json, tools/delivery/**, tools/delivery-branch-hygiene-guard.mjs, tools/brain-delivery-system.mjs, config/brain-delivery-system.json, .github/workflows/powerhouse-delivery-hygiene.yml, .github/workflows/powerhouse-repository-janitor.yml, .github/workflows/required-test.yml, .github/workflows/unified-brain-delivery.yml
Scope-Budget: 10
```

- [ ] **Step 4: Verify exact-head CI**

All selected required gates must be terminal green on the exact PR head SHA. Diagnose test-harness failures separately from product failures; do not weaken gates.

- [ ] **Step 5: Run live repository janitor dry-run**

Dispatch `powerhouse-repository-janitor.yml` in `dry-run`; read back its artifact and confirm no mutations occurred. Validate WIP, duplicate groups, safe supersession candidates, and review-required candidates.

- [ ] **Step 6: Apply deterministic safe cleanup only**

Run `apply-safe` only for rows proven safe by the janitor contract; read back each PR state. Leave ambiguous/unique PRs open.

- [ ] **Step 7: Merge through protected main**

Before merge re-read PR head/base and current main. Merge only exact expected head after required `test` is green and GitHub reports mergeability.

- [ ] **Step 8: Production/readback verification**

Read current `main`, verify the merged commit contains the hygiene config/module/workflows, verify main remains protected with required context `test`, and verify post-merge Actions do not expose a new control-plane regression.

- [ ] **Step 9: Canonical learning/evidence writeback**

Record the root cause (`repo-wide-admission-control-missing-v1`), implementation, exact PR/merge SHA, tests/gates, janitor dry-run/apply evidence, remaining ambiguous obligations, and prevention contract `POWERHOUSE-DELIVERY-HYGIENE-v1` through existing Powerhouse learning/evidence mechanisms.

- [ ] **Step 10: Final verification**

Do not claim `LIVE & BEWEZEN` unless: code is on `main`, protected `test` remains active, exact-head CI passed, janitor dry-run is evidenced, deterministic safe cleanup is read back, and no known technically-solvable duplicate-candidate blocker remains.
