# Single-Flight Release Kernel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace PR workflow fanout with one stale-head-cancelling, branch-protected releaseflight that runs only relevant contracts on one GitHub runner and preserves exact-SHA promotion/readback.

**Architecture:** `required-test.yml` becomes the only runner-consuming pull-request release gate. A Node kernel builds a lane-aware execution plan from existing delivery classification, executes commands sequentially in one job, and a repository contract prevents future PR fanout. Standalone PR workflows are converted to dispatch/post-merge/event-driven roles instead of competing for runner slots.

**Tech Stack:** GitHub Actions, Node.js 22+, existing Brain delivery modules, Node test runner, existing Python/Playwright checks where selected.

**Spec:** `docs/superpowers/specs/2026-09-08-single-flight-release-kernel-design.md`

## Global Constraints

- Branch-protected context remains exactly `test`.
- No branch-protection bypass and no security-control weakening.
- No paid runner-capacity increase.
- Different PRs remain parallel; only stale work inside the same PR is cancelled.
- Exact tested head identity must flow through merge/promotion/readback.
- Existing release-blocking quality contracts move into the kernel; they are not silently deleted.
- `queued`, `pending`, `in_progress`, merge wait, deploy pending and missing readback remain non-terminal.
- Durable learning fingerprint: `delivery|capacity|single-flight-pr-release-v1`.

---

### Task 1: Add machine-readable single-flight contract and red tests

**Files:**
- Create: `config/single-flight-release-kernel.json`
- Create: `tests/single-flight-release-kernel.test.mjs`
- Read/validate: `.github/workflows/required-test.yml`

**Interfaces:**
- Produces config fields `version`, `protectedContext`, `maxPullRequestRunnerWorkflows`, `requiredWorkflow`, `staleHeadPolicy`, `promotionIdentity`.
- Tests are consumed by Task 3 and Task 5.

- [ ] **Step 1: Write config**

```json
{
  "version": "single-flight-v1",
  "protectedContext": "test",
  "maxPullRequestRunnerWorkflows": 1,
  "requiredWorkflow": ".github/workflows/required-test.yml",
  "staleHeadPolicy": "cancel-in-progress",
  "promotionIdentity": "exact-tested-head"
}
```

- [ ] **Step 2: Write failing contract tests**

The test must assert all of the following against repository files:

```js
assert.equal(config.version, 'single-flight-v1');
assert.equal(config.protectedContext, 'test');
assert.equal(config.maxPullRequestRunnerWorkflows, 1);
assert.match(requiredWorkflow, /concurrency:/);
assert.match(requiredWorkflow, /required-test-pr-/);
assert.match(requiredWorkflow, /cancel-in-progress:\s*true/);
assert.match(requiredWorkflow, /jobs:\s*\n\s*test:/);
assert.doesNotMatch(requiredWorkflow, /\n\s+(preflight|backend|portal|automation|website):\s*\n/);
```

Also enumerate `.github/workflows/*.yml` and `.yaml`, parse text conservatively, and fail if more than one runner-consuming workflow has a top-level `pull_request` trigger. The only allowed runner-consuming PR workflow is `.github/workflows/required-test.yml`.

- [ ] **Step 3: Run test and confirm RED**

Run:

```bash
node --test tests/single-flight-release-kernel.test.mjs
```

Expected: FAIL because current `required-test.yml` has multiple jobs/reusable lanes, has no PR concurrency cancellation, and the repository still has multiple PR-triggered workflows.

- [ ] **Step 4: Commit red contract**

```bash
git add config/single-flight-release-kernel.json tests/single-flight-release-kernel.test.mjs
git commit -m "test: define single-flight release contract"
```

---

### Task 2: Build deterministic runner-local planner/executor

**Files:**
- Create: `tools/ci/single-flight-release-kernel.mjs`
- Create: `tests/single-flight-release-kernel-plan.test.mjs`
- Reuse: `tools/brain-delivery-system.mjs`
- Reuse: `tools/delivery-required-test-suites.mjs`
- Read: `.github/workflows/lane-backend.yml`
- Read: `.github/workflows/lane-portal.yml`
- Read: `.github/workflows/lane-website.yml`
- Read: `.github/workflows/lane-automation.yml`

**Interfaces:**
- `createSingleFlightPlan({ baseSha, headSha, prNumber, changedPaths, policy }) -> { version, baseSha, headSha, prNumber, lanes, commands }`
- CLI: `node tools/ci/single-flight-release-kernel.mjs plan --base <sha> --head <sha> --pr <number>`
- CLI: `node tools/ci/single-flight-release-kernel.mjs run --base <sha> --head <sha> --pr <number>`

- [ ] **Step 1: Write planner tests first**

Tests must prove:

```js
const plan = createSingleFlightPlan({
  baseSha: 'base123',
  headSha: 'head456',
  prNumber: 1161,
  changedPaths: ['docs/example.md'],
  policy,
});
assert.equal(plan.version, 'single-flight-v1');
assert.equal(plan.headSha, 'head456');
assert.equal(plan.prNumber, 1161);
assert.ok(Array.isArray(plan.commands));
assert.equal(new Set(plan.commands.map(c => c.id)).size, plan.commands.length);
```

Add lane fixtures covering backend-only, portal-only, website-only, automation-only, and mixed changes. Assert no non-selected lane commands are emitted.

- [ ] **Step 2: Run planner tests and confirm RED**

```bash
node --test tests/single-flight-release-kernel-plan.test.mjs
```

Expected: FAIL because module does not exist.

- [ ] **Step 3: Implement planner**

Use existing `createDeliveryPlan()` and `deriveRequiredTestSuites()` for lane selection. Define each command as:

```js
{
  id: 'control-plane',
  lane: 'shared',
  command: 'node',
  args: ['--test', 'tests/brain-change-scoped-release-lanes.test.mjs', 'tests/brain-moving-main-successor-guard.test.mjs', 'tests/brain-composable-release-control-plane.test.mjs']
}
```

Translate the current release-blocking steps from the four lane workflows into deterministic command arrays. Do not invoke reusable workflows from the kernel because they allocate additional runners.

- [ ] **Step 4: Implement executor**

Use `spawnSync(command, args, { stdio: 'inherit', env: process.env })`. Before each command print JSON evidence with `id`, `lane`, `headSha`; on non-zero exit throw with exact command id and exit status. Never substitute a different head SHA.

- [ ] **Step 5: Run planner tests GREEN**

```bash
node --test tests/single-flight-release-kernel-plan.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit kernel**

```bash
git add tools/ci/single-flight-release-kernel.mjs tests/single-flight-release-kernel-plan.test.mjs
git commit -m "feat: add runner-local release kernel"
```

---

### Task 3: Collapse Required test to one branch-protected job

**Files:**
- Modify: `.github/workflows/required-test.yml`
- Test: `tests/single-flight-release-kernel.test.mjs`
- Test: `tests/single-flight-release-kernel-plan.test.mjs`

**Interfaces:**
- Produces exactly one GitHub Actions job named `test`.
- The GitHub check produced by that job remains branch-protected context `test`.

- [ ] **Step 1: Replace multi-job topology with single job**

Target shape:

```yaml
name: Required test

on:
  pull_request:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: required-test-pr-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
  statuses: read

jobs:
  test:
    name: test
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v5
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v5
        with:
          node-version: '22'
      - uses: actions/setup-python@v6
        with:
          python-version: '3.12'
      - name: Install dependencies once
        run: npm install
      - name: Brain chat-learning preflight
        run: node scripts/brain/chat-learning-preflight.mjs
      - name: Block unjustified moving-main successor rebuilds
        if: github.event_name == 'pull_request'
        env:
          PR_TITLE: ${{ github.event.pull_request.title }}
          PR_BODY: ${{ github.event.pull_request.body }}
        run: node scripts/brain/moving-main-successor-guard.mjs
      - name: Execute single-flight release plan
        env:
          BASE_SHA: ${{ github.event.pull_request.base.sha }}
          HEAD_SHA: ${{ github.event.pull_request.head.sha }}
          PR_NUMBER: ${{ github.event.pull_request.number }}
        run: node tools/ci/single-flight-release-kernel.mjs run --base "$BASE_SHA" --head "$HEAD_SHA" --pr "$PR_NUMBER"
```

If selected commands need Playwright, install browser dependencies once in this same job before execution; do not create another job.

- [ ] **Step 2: Run local contract tests**

```bash
node --test tests/single-flight-release-kernel.test.mjs tests/single-flight-release-kernel-plan.test.mjs tests/brain-change-scoped-release-lanes.test.mjs tests/brain-moving-main-successor-guard.test.mjs tests/brain-composable-release-control-plane.test.mjs
```

Expected: kernel structure tests pass except fanout inventory still red until Task 4.

- [ ] **Step 3: Commit workflow collapse**

```bash
git add .github/workflows/required-test.yml
git commit -m "ci: collapse required test to one runner"
```

---

### Task 4: Remove automatic PR runner fanout from observed duplicate workflows

**Files:**
- Modify: `.github/workflows/component-foundation-tdd.yml`
- Modify: `.github/workflows/chat-learning-preflight-pr.yml`
- Modify: `.github/workflows/canonical-brand-shell-live-readback.yml`
- Modify: `.github/workflows/bg168-materiality-promotion-tests.yml`
- Modify: `.github/workflows/v18-production-promotion.yml`
- Modify: `.github/workflows/homepage-pricing-boundary-regression.yml`
- Modify: `.github/workflows/learning-contract-delivery-classifier-tests.yml`
- Modify: `.github/workflows/canonical-brand-shell-test.yml`
- Modify: `.github/workflows/unified-brain-delivery.yml`
- Modify: `.github/workflows/shared-agent-memory-tests.yml`
- Modify: `.github/workflows/paginacontrole-debug.yml`
- Modify: `.github/workflows/canonical-brand-shell-full-build.yml`
- Modify: `.github/workflows/required-test-status-bridge.yml`
- Test: `tests/single-flight-release-kernel.test.mjs`

**Interfaces:**
- These workflows keep manual, push-main, workflow-run or schedule responsibilities as appropriate.
- None remains an independently runner-consuming generic `pull_request` workflow.

- [ ] **Step 1: Classify each workflow before editing**

Use this fixed mapping:

```text
component-foundation-tdd.yml                -> workflow_dispatch; release-blocking tests move into kernel
chat-learning-preflight-pr.yml              -> workflow_dispatch or remove PR trigger; preflight moves into Required test
canonical-brand-shell-live-readback.yml     -> workflow_dispatch/workflow_run; relevant readback moves into website kernel lane
bg168-materiality-promotion-tests.yml       -> workflow_dispatch/push main; relevant contract test moves into kernel/shared commands
v18-production-promotion.yml                -> push main/workflow_dispatch only; never PR promotion
homepage-pricing-boundary-regression.yml    -> workflow_dispatch; test command moves into website kernel lane
learning-contract-delivery-classifier-tests.yml -> workflow_dispatch/push main; contract test moves into shared kernel commands
canonical-brand-shell-test.yml              -> workflow_dispatch; contract test moves into website kernel lane
unified-brain-delivery.yml                  -> push main/workflow_dispatch; no independent PR runner
shared-agent-memory-tests.yml               -> workflow_dispatch/push main; release-blocking tests move into shared kernel commands
paginacontrole-debug.yml                     -> workflow_dispatch only; diagnostic artifact remains available on demand
canonical-brand-shell-full-build.yml        -> workflow_dispatch only or post-merge; release-blocking build commands move into website kernel lane
required-test-status-bridge.yml              -> workflow_dispatch only or delete after proof; direct `test` job now supplies branch-protected context
```

Do not delete a test command unless its exact release-blocking equivalent is present in the kernel command plan.

- [ ] **Step 2: Edit triggers**

For diagnostic/manual workflows use:

```yaml
on:
  workflow_dispatch:
```

For production-authority workflows preserve existing `push: branches: [main]` / schedule triggers and remove only `pull_request`.

- [ ] **Step 3: Run fanout contract**

```bash
node --test tests/single-flight-release-kernel.test.mjs
```

Expected: PASS with exactly one runner-consuming PR workflow: `.github/workflows/required-test.yml`.

If the test reports any additional PR-triggered workflow not listed above, add that exact reported path to this migration task, classify it by the same rules, remove its generic PR runner trigger, and rerun until count is exactly 1. This is evidence-driven inventory completion, not an allowlist bypass.

- [ ] **Step 4: Commit trigger contraction**

```bash
git add .github/workflows tests/single-flight-release-kernel.test.mjs
git commit -m "ci: contract pull request workflow fanout"
```

---

### Task 5: Add stale-head and exact-identity regression contracts

**Files:**
- Create: `tests/single-flight-stale-head-contract.test.mjs`
- Modify: `tools/ci/single-flight-release-kernel.mjs`
- Modify: `AGENTS.md`

**Interfaces:**
- `assertCurrentHead({ plannedHeadSha, observedHeadSha })` throws on mismatch.
- Current agent contract states only newest PR head may own releaseflight evidence.

- [ ] **Step 1: Write failing stale-head tests**

```js
assert.doesNotThrow(() => assertCurrentHead({ plannedHeadSha: 'abc', observedHeadSha: 'abc' }));
assert.throws(
  () => assertCurrentHead({ plannedHeadSha: 'abc', observedHeadSha: 'def' }),
  /STALE_HEAD_SUPERSEDED/
);
```

Also assert Required test concurrency group contains PR number and `cancel-in-progress: true`.

- [ ] **Step 2: Run RED**

```bash
node --test tests/single-flight-stale-head-contract.test.mjs
```

- [ ] **Step 3: Implement identity guard and AGENTS rule**

The kernel must compare planned head identity with `HEAD_SHA`/Git checkout before executing side effects or release evidence. Add the invariant to `AGENTS.md`: stale PR heads are cancelled/superseded and cannot own success, failure, merge or production evidence.

- [ ] **Step 4: Run GREEN**

```bash
node --test tests/single-flight-stale-head-contract.test.mjs tests/single-flight-release-kernel.test.mjs tests/single-flight-release-kernel-plan.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add tests/single-flight-stale-head-contract.test.mjs tools/ci/single-flight-release-kernel.mjs AGENTS.md
git commit -m "test: reject stale release heads"
```

---

### Task 6: Integration proof, PR, merge and production readback

**Files:**
- Validate: all files above
- Update if needed: `docs/development-ledger.md`
- Update if needed: `docs/brain/delivery-failure-lessons.json`

**Interfaces:**
- Produces final evidence `single-flight-v1` + exact head/merge/main SHA + branch-protected `test` result.

- [ ] **Step 1: Run focused integration suite**

```bash
node --test \
  tests/single-flight-release-kernel.test.mjs \
  tests/single-flight-release-kernel-plan.test.mjs \
  tests/single-flight-stale-head-contract.test.mjs \
  tests/brain-change-scoped-release-lanes.test.mjs \
  tests/brain-moving-main-successor-guard.test.mjs \
  tests/brain-composable-release-control-plane.test.mjs \
  tests/agents-delivery-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Open PR from `feat/single-flight-release-kernel` to `main`**

PR body must state old fanout count observed from a representative PR, new expected count = 1 releaseflight, stale-head cancellation policy, and preserved exact-SHA production semantics.

- [ ] **Step 3: Verify actual GitHub behavior on the feature PR**

Required evidence:

```text
Required test: one job named test
Current head: exact branch head SHA
No new generic PR runs from migrated workflows
Latest head supersedes any older Required test run
```

If any migrated workflow still starts automatically, treat it as a contract failure and repair before merge.

- [ ] **Step 4: Merge only after branch-protected test is green**

Use exact expected head SHA. Do not bypass branch protection.

- [ ] **Step 5: Verify main and production authority**

Read new main SHA and confirm the single-flight config, kernel, test workflow and fanout contract exist on main. For code that affects deployable production assets, require existing BG169/Netlify exact-SHA production readback before `PRODUCTION_GREEN`; for CI-only control-plane changes, require repository/main readback plus one real follow-up PR proving the new kernel executes as the sole releaseflight.

- [ ] **Step 6: Record durable learning**

Write fingerprint:

```text
delivery|capacity|single-flight-pr-release-v1
```

with root cause = independent PR workflow fanout + stale heads consuming runner capacity; fix = one current-head releaseflight with runner-local lane execution and PR concurrency cancellation; prevention = repository contract max PR runner workflows = 1.

- [ ] **Step 7: Close only on verified outcome**

Terminal state is `PRODUCTION_GREEN/LIVE_VERIFIED` for deploy-affecting changes or `CONTROL_PLANE_GREEN` plus successful real follow-up PR evidence for CI-only architecture. `queued`, `waiting`, `PR open` or `mergeable` are not completion.
