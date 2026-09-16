# Powerhouse Completion Supervisor v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep every material Powerhouse obligation active until identity-bound production evidence and canonical learning readback prove `LIVE_VERIFIED`, while preserving hard boundaries as resumable waiting work.

**Architecture:** Add one pure supervisor policy above the existing Agent Fabric, Supabase Outcome Obligation stores and BRAIN delivery/readback authorities. Persist supervisor decisions and progress as idempotent evidence in the existing obligation lineage; do not create a second queue, store or release authority. Extend the existing obligation sweep for event-driven evaluation and bounded backfill.

**Tech Stack:** Node.js 22 ESM, `node:test`, GitHub Actions, Supabase REST/Postgres, existing Agent Fabric and BRAIN-DELIVERY-v2/BG169 contracts.

**Spec:** `docs/superpowers/specs/2026-09-16-powerhouse-completion-supervisor-v1-design.md`

## Global Constraints

- `LIVE_VERIFIED` is the only successful terminal state.
- `localGreen`, commit, merge, preview, deploy acknowledgement and AI/self-reported claims are never completion evidence.
- A proven hard boundary produces `WAIT_EXTERNAL`, `canWait: true`, `canComplete: false` and retains the same active work fingerprint.
- Completion evidence is accepted only when candidate, task/obligation, production and readback identities agree and the producer is trusted.
- Retry at most twice for the same hypothesis without new evidence.
- Reuse Agent Fabric, Supabase Outcome Obligations, BRAIN-DELIVERY-v2, BG169, BG167 and BG168/BG166; no parallel truth or delivery path.
- All writes are idempotent and fail closed on unknown evidence.

---

### Task 1: Pure completion policy

**Files:**
- Create: `platform/agents/completion-supervisor.mjs`
- Create: `tests/completion-supervisor.test.mjs`

**Interfaces:**
- Consumes: `evaluateCompletion({ obligationId, workId, claim, candidateIdentity, productionIdentity, evidence, materialObligations, hardBoundary, retry })`.
- Produces: immutable `{ success, normalized_state, next_action, open_obligations, required_evidence, recovery_packet, idempotency_key, resume_when, canWait }`.

- [ ] **Step 1: Write failing policy tests**

```js
test('localGreen cannot mint LIVE_VERIFIED', () => {
  const result = evaluateCompletion({ obligationId:'O1', workId:'W1', claim:'GREEN', localGreen:true });
  assert.equal(result.success, false);
  assert.equal(result.next_action, 'RECOVER');
});

test('identity-bound trusted evidence is required for LIVE_VERIFIED', () => {
  const result = evaluateCompletion(liveVerifiedFixture());
  assert.equal(result.normalized_state, 'LIVE_VERIFIED');
  assert.equal(result.success, true);
});
```

- [ ] **Step 2: Verify RED**

Run: `node --test tests/completion-supervisor.test.mjs`
Expected: FAIL because `platform/agents/completion-supervisor.mjs` does not exist.

- [ ] **Step 3: Implement the deterministic evaluator**

Implement canonical claim normalization, trusted evidence classes, exact identity comparison, hard-boundary packet validation, bounded retry decisions and stable SHA-256 idempotency keys. Unknown or malformed evidence remains open.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/completion-supervisor.test.mjs`
Expected: all completion policy cases pass with zero warnings.

- [ ] **Step 5: Commit**

```bash
git add platform/agents/completion-supervisor.mjs tests/completion-supervisor.test.mjs
git commit -m "feat: add fail-closed completion supervisor policy"
```

### Task 2: Agent Fabric wait/resume lifecycle

**Files:**
- Modify: `brain/policy/completion-readiness.mjs`
- Modify: `platform/agents/agent-fabric.mjs`
- Modify: `tests/delivery-preflight-completion.test.mjs`
- Modify: `tests/agent-fabric.test.mjs`

**Interfaces:**
- Consumes: supervisor decisions from Task 1.
- Produces: `canComplete` only for `LIVE_VERIFIED`; `canWait` for a valid hard boundary; same-fingerprint resume from `WaitingApproval`.

- [ ] **Step 1: Change tests first**

Replace the legacy hard-boundary-as-Resolved expectation with:

```js
assert.equal(provenBoundary.canComplete, false);
assert.equal(provenBoundary.canWait, true);
assert.equal(provenBoundary.state, 'WAIT_EXTERNAL');
```

Add tests proving `Verifying -> Resolved` rejects local green, `Verifying -> WaitingApproval` accepts only a complete recovery packet, duplicate intake returns the waiting item and boundary-clear resumes that same ID.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/delivery-preflight-completion.test.mjs tests/agent-fabric.test.mjs`
Expected: hard-boundary and local-green expectations fail against the legacy policy.

- [ ] **Step 3: Implement minimal lifecycle changes**

Delegate readiness to the supervisor, keep waiting work in `activeByFingerprint`, reject incomplete boundary packets and add an idempotent `resume({ workId, evidence })` transition to the same item.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/completion-supervisor.test.mjs tests/delivery-preflight-completion.test.mjs tests/agent-fabric.test.mjs`
Expected: all policy and lifecycle tests pass.

- [ ] **Step 5: Commit**

```bash
git add brain/policy/completion-readiness.mjs platform/agents/agent-fabric.mjs tests/delivery-preflight-completion.test.mjs tests/agent-fabric.test.mjs
git commit -m "fix: keep hard-boundary AgentWork active and resumable"
```

### Task 3: Durable supervisor evidence and decisions

**Files:**
- Modify: `tools/outcome-obligation-supabase-store.mjs`
- Modify: `tools/outcome-obligation-runtime.mjs`
- Modify: `tests/brain-outcome-obligation-supabase-store.test.mjs`
- Modify: `tests/brain-outcome-obligation-runtime.test.mjs`
- Modify: `tests/brain-outcome-obligation-durable-runtime.test.mjs`

**Interfaces:**
- Consumes: existing `brain_outcome_obligation_dispatch` and `brain_outcome_obligation_evidence` tables.
- Produces: `evidenceStore.putIfAbsent(record)` and supervisor decision artifacts bound to one obligation idempotency key.

- [ ] **Step 1: Write failing durability tests**

Add tests that a partial claim appends exactly one progress-evidence row on replay, an identity mismatch cannot close work, a trusted complete evidence bundle returns `LIVE_VERIFIED`, and boundary-clear evidence changes the same obligation from `WAIT_EXTERNAL` to active recovery without creating another AgentWork.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/brain-outcome-obligation-supabase-store.test.mjs tests/brain-outcome-obligation-runtime.test.mjs tests/brain-outcome-obligation-durable-runtime.test.mjs`
Expected: FAIL because evidence writes and supervisor evaluation are absent.

- [ ] **Step 3: Implement store and runtime adapters**

Add an idempotent evidence insert using `(idempotency_key, evidence_ref)`, retain server-only credentials, evaluate the pure supervisor after loading durable state, and emit one owner/fix-agent dispatch identity per obligation/action/evidence fingerprint.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/completion-supervisor.test.mjs tests/brain-outcome-obligation-{supabase-store,runtime,durable-runtime}.test.mjs`
Expected: all durable-lineage tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/outcome-obligation-supabase-store.mjs tools/outcome-obligation-runtime.mjs tests/brain-outcome-obligation-supabase-store.test.mjs tests/brain-outcome-obligation-runtime.test.mjs tests/brain-outcome-obligation-durable-runtime.test.mjs
git commit -m "feat: persist idempotent completion supervisor evidence"
```

### Task 4: Event-driven evaluator and bounded backfill

**Files:**
- Create: `tools/completion-supervisor-backfill.mjs`
- Create: `tests/completion-supervisor-backfill.test.mjs`
- Modify: `.github/workflows/outcome-obligation-sweep.yml`
- Modify: `tests/brain-outcome-obligation-workflow.test.mjs`

**Interfaces:**
- Consumes: workflow-run, main push, repository-dispatch, schedule and manual events plus durable obligation state.
- Produces: dry-run/backfill artifact and one idempotent supervisor evaluation per selected obligation.

- [ ] **Step 1: Write failing backfill/workflow tests**

Cover `DEELS LIVE`, `NOT_CLAIMED`, failed/cancelled/skipped delivery and wrongly resolved hard-boundary records; assert valid `LIVE_VERIFIED` rows stay closed. Assert workflow events provide exact run/head identity and execute supervisor tests before evaluation.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/completion-supervisor-backfill.test.mjs tests/brain-outcome-obligation-workflow.test.mjs`
Expected: FAIL because backfill and event triggers are absent.

- [ ] **Step 3: Implement bounded reconciliation**

Add deterministic record classification, `--dry-run` default, explicit `--apply`, exact event fingerprints and artifact upload. Reuse the existing runtime; never call merge/deploy/provider APIs directly.

- [ ] **Step 4: Verify GREEN**

Run: `node --test tests/completion-supervisor-backfill.test.mjs tests/brain-outcome-obligation-workflow.test.mjs`
Expected: all backfill and workflow contract tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/completion-supervisor-backfill.mjs tests/completion-supervisor-backfill.test.mjs .github/workflows/outcome-obligation-sweep.yml tests/brain-outcome-obligation-workflow.test.mjs
git commit -m "feat: wake completion supervisor from delivery events"
```

### Task 5: Engineering OS, Required gate and canonical learning

**Files:**
- Modify: `config/powerhouse-engineering-os.json`
- Modify: `scripts/brain/powerhouse-engineering-os.mjs`
- Modify: `tests/brain-powerhouse-engineering-os-contract.test.mjs`
- Modify: `.github/workflows/required-test.yml`
- Modify: `config/brain-chat-learning-contract.json`
- Create: `brain/learning/completion-supervisor-v1-2026-09-16.json`
- Modify: `docs/development-operating-system.md`
- Modify: `docs/development-ledger.md`
- Modify: `docs/outcome-obligations.md`

**Interfaces:**
- Consumes: implementation and test paths from Tasks 1-4.
- Produces: active supervisor contract, mandatory CI membership and reusable prevention learning.

- [ ] **Step 1: Write failing contract tests**

Require the supervisor fingerprint, policy/runtime/workflow/backfill paths, `LIVE_VERIFIED` terminal-success rule, `WAIT_EXTERNAL` non-success rule and Required test command membership.

- [ ] **Step 2: Verify RED**

Run: `node --test tests/brain-powerhouse-engineering-os-contract.test.mjs`
Expected: FAIL until config, validator and Required are wired.

- [ ] **Step 3: Register and document the existing authority extension**

Add the supervisor section, prevention learning, human operating explanation and append-only ledger entry. Do not claim production evidence in the source commit.

- [ ] **Step 4: Verify GREEN and full focused suite**

Run: `node scripts/brain/powerhouse-engineering-os.mjs --check`

Run: `node --test tests/completion-supervisor*.test.mjs tests/agent-fabric.test.mjs tests/delivery-preflight-completion.test.mjs tests/brain-outcome-obligation-*.test.mjs tests/brain-powerhouse-engineering-os-contract.test.mjs tests/brain-chat-learning-complete.test.mjs tests/brain-chat-learning-completeness.test.mjs`

Expected: zero failures and zero warnings.

- [ ] **Step 5: Commit**

```bash
git add config/powerhouse-engineering-os.json scripts/brain/powerhouse-engineering-os.mjs tests/brain-powerhouse-engineering-os-contract.test.mjs .github/workflows/required-test.yml config/brain-chat-learning-contract.json brain/learning/completion-supervisor-v1-2026-09-16.json docs/development-operating-system.md docs/development-ledger.md docs/outcome-obligations.md
git commit -m "chore: govern completion supervisor in Engineering OS"
```

### Task 6: Candidate, production and canary proof

**Files:**
- Modify after observed evidence only: `brain/learning/completion-supervisor-v1-2026-09-16.json`
- Modify after observed evidence only: `docs/development-ledger.md`

**Interfaces:**
- Consumes: exact GitHub candidate SHA, required checks, protected merge, production/readback and shared-learning evidence.
- Produces: one real obligation whose current shared state is `LIVE_VERIFIED` with zero open obligations.

- [ ] **Step 1: Run fresh local verification**

Run the focused suite, full relevant Brain/backend suite, security contract suite, Engineering OS validator and `git diff --check`.

- [ ] **Step 2: Push candidate and open PR**

Push `feat/completion-supervisor-v1`; create a PR to `main`; record exact head SHA.

- [ ] **Step 3: Verify exact-head gates**

Require Required, BRAIN delivery, Shared Agent Memory, security and applicable Supabase checks on the same head. Repair only root causes; do not weaken gates.

- [ ] **Step 4: Merge through protected authority and verify current production identity**

Merge only the exact green head. Read back resulting main SHA, production/deploy identity and function/provider behavior.

- [ ] **Step 5: Execute one bounded partial-obligation canary**

Use the same durable obligation identity through progress -> dispatch -> production/readback -> learning. Verify no duplicate AgentWork/evidence side effect, `LIVE_VERIFIED`, and zero open obligations.

- [ ] **Step 6: Persist evidence and refresh shared context**

Append observed PR/run/SHA/readback identifiers to the learning and ledger via a new candidate; run the same gates and production readback again.

- [ ] **Step 7: Final verification**

Read current main, production identity, canary obligation, learning writeback and shared context. Claim completion only when all agree.
