# CI Capacity Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make GitHub Actions capacity predictable by routing every PR through the existing `Required test` orchestrator, cancelling superseded same-PR work, removing duplicate PR-triggered runners, preserving the protected `test` context, isolating production readback, and detecting >5-minute current-head queue starvation without retry storms.

**Architecture:** Keep `.github/workflows/required-test.yml` as the canonical PR ingress. Reuse the existing website/portal/backend/automation `workflow_call` lanes, migrate substantive checks from standalone PR workflows into those lanes or the cheap shared preflight, remove their broad PR triggers only after coverage equivalence is tested, and enforce the resulting topology with repository tests. Production readback remains post-merge and in a distinct concurrency namespace.

**Tech Stack:** GitHub Actions YAML, Node.js 22 ESM, Node built-in test runner, Python 3.12/Playwright for page and SEO verification, Netlify deploy previews/production readback, GitHub Checks/Statuses APIs.

**Spec:** `docs/superpowers/specs/2026-09-08-ci-capacity-control-plane-design.md`

## Global Constraints

- Never bypass or weaken branch protection.
- `main` currently requires the exact GitHub Actions check context `test`; preserve that contract throughout migration.
- Keep `Required test` as the only broad runner-consuming `pull_request` orchestrator at end state.
- Different PRs must never share a repository-global validation concurrency lock.
- A newer SHA on the same PR must supersede older validation work automatically.
- Production promotion/readback must never share PR-validation concurrency.
- Remove a duplicate workflow trigger only after its substantive checks are demonstrably covered elsewhere.
- Diagnostics must not compete with the gate they diagnose.
- Queue starvation detection must not auto-rerun workflows.
- Queue SLO: current-head required preflight/classifier queued with no first runner step for 5 minutes is a CI-capacity incident; superseded runs are excluded.
- Implementation occurs on an isolated feature branch, not directly on `main`.
- Completion requires exact merged-SHA production readback and before/after workflow-count evidence.

---

## Task 1: Add CI workflow topology inventory and regression primitives

**Files:**
- Create: `tools/ci/workflow-topology.mjs`
- Create: `tests/ci-workflow-topology.test.mjs`
- Create: `config/ci-workflow-topology.json`
- Create: `docs/ci/workflow-trigger-inventory.md`

**Interfaces:**
- `inspectWorkflowTopology({ workflowDir, canonicalPrWorkflow }) -> Promise<{workflows,broadPullRequestWorkflows,reusableWorkflows,scheduledWorkflows,pushWorkflows}>`
- `evaluateTopology(topology, policy) -> {ok:boolean, violations:string[]}`

- [ ] **Step 1: Write parser/policy tests first**

Tests must prove classification of: broad `pull_request`, path-scoped `pull_request`, `workflow_call`, push-only, scheduled/manual, and mixed workflows.

Run:
```bash
node --test tests/ci-workflow-topology.test.mjs
```
Expected: FAIL because `tools/ci/workflow-topology.mjs` does not exist.

- [ ] **Step 2: Implement deterministic workflow inventory**

Scan `.github/workflows/*.yml` and `.yaml`, parse trigger blocks conservatively, and emit workflow filename/name/trigger categories. Do not treat `workflow_call` as an external PR trigger.

- [ ] **Step 3: Add migration policy config**

`config/ci-workflow-topology.json` must name `required-test.yml` as canonical and include a temporary, explicit list of current duplicate PR workflows discovered by the scanner. No wildcard allowlist is permitted.

- [ ] **Step 4: Generate the current inventory document**

Run:
```bash
node tools/ci/workflow-topology.mjs --write docs/ci/workflow-trigger-inventory.md
```
Expected: document lists every PR-triggered workflow, including the known duplicates such as page/SEO diagnostics, homepage pricing regression, canonical shell build/readback, learning-contract checks, V18 promotion and the required-status bridge.

- [ ] **Step 5: Re-run tests**

```bash
node --test tests/ci-workflow-topology.test.mjs
```
Expected: PASS with current migration allowlist explicitly reported.

- [ ] **Step 6: Commit**

```bash
git add tools/ci/workflow-topology.mjs tests/ci-workflow-topology.test.mjs config/ci-workflow-topology.json docs/ci/workflow-trigger-inventory.md
git commit -m "test: inventory CI workflow topology"
```

---

## Task 2: Add same-PR supersession to `Required test`

**Files:**
- Modify: `.github/workflows/required-test.yml`
- Modify: `tests/brain-composable-release-control-plane.test.mjs`
- Modify: `tests/ci-workflow-topology.test.mjs`

- [ ] **Step 1: Write failing concurrency assertions**

Assert that the canonical workflow has PR-scoped concurrency containing `github.repository` and `github.event.pull_request.number`, uses `cancel-in-progress` for PR events, does not use a repository-global validation group, and does not reuse `production-release-readback`.

Run:
```bash
node --test tests/brain-composable-release-control-plane.test.mjs tests/ci-workflow-topology.test.mjs
```
Expected: FAIL because `required-test.yml` currently has no top-level concurrency.

- [ ] **Step 2: Add canonical PR concurrency**

Use a deterministic group equivalent to:
```yaml
concurrency:
  group: required-test-${{ github.repository }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}
```

The key must cancel only an older run of the same PR. Different PR numbers must remain independent.

- [ ] **Step 3: Verify tests**

Run the same test command; expected PASS.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/required-test.yml tests/brain-composable-release-control-plane.test.mjs tests/ci-workflow-topology.test.mjs
git commit -m "ci: supersede stale required-test runs per PR"
```

---

## Task 3: Consolidate cheap Brain/learning PR gates into the canonical path

**Files:**
- Modify: `.github/workflows/required-test.yml`
- Modify: `.github/workflows/lane-automation.yml`
- Modify: `.github/workflows/chat-learning-preflight-pr.yml`
- Modify: `.github/workflows/bg168-materiality-promotion-tests.yml`
- Modify: `.github/workflows/learning-contract-delivery-classifier-tests.yml`
- Create: `tests/ci-learning-gate-routing.test.mjs`

- [ ] **Step 1: Write routing-equivalence tests**

Assert that:
- `scripts/brain/chat-learning-preflight.mjs` is executed by canonical preflight;
- `tests/make-agent-learning-promotion-contract.test.mjs` and `tests/chat-learning-completeness-addendum.test.mjs` remain executed in the canonical routed path;
- `tests/brain-learning-contract-delivery-classification.test.mjs` remains executed in the canonical routed path;
- the three standalone files no longer own a broad `pull_request` trigger after migration.

Run:
```bash
node --test tests/ci-learning-gate-routing.test.mjs
```
Expected: FAIL on missing canonical ownership.

- [ ] **Step 2: Move the mandatory chat-learning preflight into `Required test` preflight**

Run it after checkout/setup and before lane dispatch so failure is cheap and early.

- [ ] **Step 3: Move learning contract tests into the automation/shared routed lane**

Extend `lane-automation.yml` with the three exact test files above. Keep existing delivery tests.

- [ ] **Step 4: Remove only the broad PR triggers from the standalone workflows**

Preserve their special automation-branch and `workflow_dispatch` triggers where present. `chat-learning-preflight-pr.yml` may be deleted once its sole behavior is proven covered by canonical preflight.

- [ ] **Step 5: Verify**

```bash
node --test tests/ci-learning-gate-routing.test.mjs tests/brain-change-scoped-release-lanes.test.mjs
```
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows tests/ci-learning-gate-routing.test.mjs
git commit -m "ci: route learning gates through required test"
```

---

## Task 4: Consolidate website PR gates and make expensive work cheap-first

**Files:**
- Modify: `.github/workflows/lane-website.yml`
- Modify: `.github/workflows/paginacontrole.yml`
- Modify: `.github/workflows/paginacontrole-debug.yml`
- Modify/Delete after equivalence: `.github/workflows/homepage-pricing-boundary-regression.yml`
- Modify: `.github/workflows/canonical-brand-shell-full-build.yml`
- Modify: `.github/workflows/canonical-brand-shell-live-readback.yml`
- Create: `tests/ci-website-gate-routing.test.mjs`

- [ ] **Step 1: Write website coverage-equivalence tests**

Require the canonical website lane to own:
- `tests/homepage-pricing-boundary-readback.test.mjs`;
- `.github/scripts/paginacontrole.py`;
- `.github/scripts/seocontrole.py`;
- canonical shell/build checks that remain substantive;
- PR-safe shell/SEO contract tests previously launched by `canonical-brand-shell-live-readback.yml`.

Also assert expensive shell/full-build/browser jobs depend on classifier/baseline or other cheap prerequisites.

Run:
```bash
node --test tests/ci-website-gate-routing.test.mjs
```
Expected: FAIL until missing coverage is routed.

- [ ] **Step 2: Add the homepage pricing-boundary test to the website baseline**

Keep it in the cheap Node test step because it is a deterministic invariant and does not require a browser.

- [ ] **Step 3: Route unique shell/full-build contracts to a high-risk website job**

Create a high-risk-only `shell-build` job inside `lane-website.yml` (or an equivalent reusable workflow called only from that lane). It must depend on cheap classification/baseline and execute the substantive commands currently unique to `canonical-brand-shell-full-build.yml`.

- [ ] **Step 4: Preserve page/SEO coverage only once on PRs**

`lane-website.yml` already runs page and SEO verification. Remove `pull_request` from `paginacontrole.yml` while preserving push-main, schedule, manual writer/candidate behavior. Change `paginacontrole-debug.yml` to manual-only so diagnostics never compete with the gate.

- [ ] **Step 5: Remove duplicate website PR entry points only after tests prove equivalence**

Remove the PR trigger (or delete a workflow whose only purpose is now duplicated) from:
- `homepage-pricing-boundary-regression.yml`;
- `canonical-brand-shell-full-build.yml`;
- `canonical-brand-shell-live-readback.yml`.

Keep push-main/manual production readback behavior where it is not yet replaced by `production-release-readback.yml`.

- [ ] **Step 6: Verify website routing**

```bash
node --test tests/ci-website-gate-routing.test.mjs tests/brain-composable-release-control-plane.test.mjs
```
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add .github/workflows tests/ci-website-gate-routing.test.mjs
git commit -m "ci: consolidate website PR gates"
```

---

## Task 5: Remove V18/portal duplicate PR execution while preserving unique tests

**Files:**
- Modify: `.github/workflows/lane-website.yml`
- Modify: `.github/workflows/lane-portal.yml`
- Modify: `.github/workflows/v18-production-promotion.yml`
- Create: `tests/ci-v18-promotion-routing.test.mjs`

- [ ] **Step 1: Write coverage-equivalence assertions**

Require `tests/v18-production-promotion.test.mjs` and `tests/v18-seo-layer.test.mjs` in the website routed lane and verify all unique portal production-contract tests from V18 promotion are already covered by `lane-portal.yml` or explicitly added there.

- [ ] **Step 2: Run RED**

```bash
node --test tests/ci-v18-promotion-routing.test.mjs
```
Expected: FAIL for any unique V18 tests not yet lane-owned.

- [ ] **Step 3: Add missing tests to their lanes**

Do not duplicate a test already matched by `tests/portal-*.test.mjs`; add only genuinely missing unique coverage.

- [ ] **Step 4: Remove `pull_request` from `v18-production-promotion.yml`**

Preserve the dedicated automation branch trigger if it remains operationally useful.

- [ ] **Step 5: Verify and commit**

```bash
node --test tests/ci-v18-promotion-routing.test.mjs tests/brain-change-scoped-release-lanes.test.mjs
git add .github/workflows tests/ci-v18-promotion-routing.test.mjs
git commit -m "ci: route V18 promotion checks through release lanes"
```

---

## Task 6: Preserve protected `test` context without a polling runner

**Files:**
- Modify: `.github/workflows/required-test.yml`
- Delete only after live compatibility proof: `.github/workflows/required-test-status-bridge.yml`
- Create: `tests/ci-required-status-contract.test.mjs`

**Current protection evidence:** `main` is protected and requires check context `test` from GitHub Actions app id `15368`.

- [ ] **Step 1: Write the status-contract test**

Assert canonical final aggregator job remains `name: test`; assert no final design uses a workflow that polls `actions/workflows/required-test.yml/runs` or loops `sleep 10` merely to mirror the result.

- [ ] **Step 2: Run RED against current bridge topology**

```bash
node --test tests/ci-required-status-contract.test.mjs
```
Expected: FAIL because the polling bridge still exists.

- [ ] **Step 3: Prove canonical check identity on a test PR before deleting the bridge**

On the implementation PR head, query GitHub check runs and verify a GitHub Actions check run named exactly `test` exists and reaches the canonical aggregator conclusion for that head SHA. If GitHub exposes it only as a workflow-qualified context that does not satisfy branch protection, adjust the branch protection required check through repository administration to that canonical GitHub Actions check before removing the bridge. Never delete the bridge while `main` still requires an unsatisfied legacy context.

- [ ] **Step 4: Remove the polling bridge once protection compatibility is proven**

Delete `.github/workflows/required-test-status-bridge.yml` or otherwise remove its PR-triggered runner. Do not replace it with another polling workflow.

- [ ] **Step 5: Verify**

```bash
node --test tests/ci-required-status-contract.test.mjs tests/brain-composable-release-control-plane.test.mjs
```
Expected: PASS and branch protection still reports required context satisfied on the PR head.

- [ ] **Step 6: Commit**

```bash
git add -A .github/workflows/required-test-status-bridge.yml .github/workflows/required-test.yml tests/ci-required-status-contract.test.mjs
git commit -m "ci: remove runner-based required status bridge"
```

---

## Task 7: Add a non-retrying 5-minute queue-health watchdog

**Files:**
- Create: `tools/ci/queue-health.mjs`
- Create: `tests/ci-queue-health.test.mjs`
- Create: `.github/workflows/ci-queue-watchdog.yml`

**Interface:**
- `classifyQueueHealth({ now, currentHeadByPr, runs, thresholdMs = 300000 }) -> {incidents:[], ignoredSuperseded:[]}`
- Incident fingerprint: `ci-capacity:<pr-number>:<head-sha>:<workflow>:<job-family>`.

- [ ] **Step 1: Write pure failing tests**

Cases:
- current-head queued 299999 ms: no incident;
- current-head queued 300000 ms with no first executed step: incident;
- superseded SHA queued >5 min: ignored;
- started/completed current-head run: no queue incident;
- duplicate observations yield one incident fingerprint;
- watchdog never returns a rerun/retry action.

Run:
```bash
node --test tests/ci-queue-health.test.mjs
```
Expected: FAIL because module does not exist.

- [ ] **Step 2: Implement pure classifier and dedupe**

Keep GitHub API I/O outside the pure function. Staleness is determined by head SHA supersession, not elapsed time alone.

- [ ] **Step 3: Add scheduled/manual watchdog workflow**

Trigger only with `schedule` (5-minute cadence) and `workflow_dispatch`; never `pull_request`. Permissions: `actions: read`, `pull-requests: read`, `issues: write`, `contents: read`.

The workflow must:
1. read open PR heads;
2. inspect relevant Required-test/current-head jobs;
3. classify queue health;
4. create/update one deduplicated CI-capacity issue per fingerprint;
5. not rerun or cancel current-head work;
6. close/resolve the incident when the same current head starts or is superseded.

- [ ] **Step 4: Verify**

```bash
node --test tests/ci-queue-health.test.mjs
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/ci/queue-health.mjs tests/ci-queue-health.test.mjs .github/workflows/ci-queue-watchdog.yml
git commit -m "ci: detect required queue starvation"
```

---

## Task 8: Enforce the final single-ingress topology

**Files:**
- Modify: `config/ci-workflow-topology.json`
- Modify: `tests/ci-workflow-topology.test.mjs`
- Modify: `.github/workflows/required-test.yml`
- Regenerate: `docs/ci/workflow-trigger-inventory.md`

- [ ] **Step 1: Remove the migration allowlist**

Final policy must allow exactly one broad runner-consuming PR orchestrator: `.github/workflows/required-test.yml`. Reusable `workflow_call`, push, schedule and manual workflows remain allowed according to their explicit categories.

- [ ] **Step 2: Strengthen the topology test**

Fail when:
- another broad PR runner workflow is introduced;
- a diagnostic has a broad PR trigger;
- a status bridge polls another workflow;
- PR validation uses a repository-global concurrency key;
- production readback shares the Required-test group;
- an expensive website job lacks intended cheap prerequisites.

- [ ] **Step 3: Add topology/queue tests to canonical preflight**

Extend `Verify composable release control plane` to include the new CI control-plane test files.

- [ ] **Step 4: Regenerate inventory and verify all control-plane tests**

```bash
node tools/ci/workflow-topology.mjs --write docs/ci/workflow-trigger-inventory.md
node --test \
  tests/ci-workflow-topology.test.mjs \
  tests/ci-learning-gate-routing.test.mjs \
  tests/ci-website-gate-routing.test.mjs \
  tests/ci-v18-promotion-routing.test.mjs \
  tests/ci-required-status-contract.test.mjs \
  tests/ci-queue-health.test.mjs \
  tests/brain-change-scoped-release-lanes.test.mjs \
  tests/brain-composable-release-control-plane.test.mjs
```
Expected: PASS; inventory shows one canonical broad PR ingress.

- [ ] **Step 5: Commit**

```bash
git add config/ci-workflow-topology.json tests .github/workflows/required-test.yml docs/ci/workflow-trigger-inventory.md
git commit -m "test: lock CI capacity control plane topology"
```

---

## Task 9: End-to-end PR capacity verification

**Files:**
- Create: `docs/ci/evidence/2026-09-08-ci-capacity-control-plane.md`

- [ ] **Step 1: Run the full local relevant suite**

```bash
node --test tests/brain-change-scoped-release-lanes.test.mjs tests/brain-composable-release-control-plane.test.mjs tests/ci-*.test.mjs
```
Expected: PASS.

- [ ] **Step 2: Push implementation branch and open PR**

Use a dedicated implementation branch such as `fix/ci-capacity-control-plane`, based on current `main`, carrying the approved spec/plan and implementation commits.

- [ ] **Step 3: Record workflow fan-out on exact PR head**

Fetch all workflow runs/check runs for the implementation PR head SHA. Record runner-consuming PR workflow count, selected lanes, queue start times and required `test` result. Compare with PR #1159 baseline (17 workflow runs on one focused head, with many simultaneous queued jobs).

Acceptance: focused PR work shows a material reduction in independent PR workflow runs and no duplicate page/SEO/learning/status-bridge runner chain.

- [ ] **Step 4: Prove same-PR supersession live**

Push one harmless documentation-only follow-up commit to the implementation PR while an older Required-test run is still queued/running. Verify the older same-PR Required-test run becomes cancelled and the newer SHA becomes authoritative. Do not generate repeated commits solely to stress capacity.

- [ ] **Step 5: Prove parallelism**

Verify an unrelated open PR can retain/rerun its own Required-test group without sharing the implementation PR concurrency key. Structural evidence plus live run IDs/PR numbers must be recorded.

- [ ] **Step 6: Verify branch protection**

Confirm `main` remains protected and the required GitHub Actions `test` context is satisfied by the canonical current-head flow.

- [ ] **Step 7: Commit evidence**

```bash
git add docs/ci/evidence/2026-09-08-ci-capacity-control-plane.md
git commit -m "docs: record CI capacity control plane evidence"
```

---

## Task 10: Merge, production readback, and operational learning

**Files:**
- Modify/Create the repository governance/learning record used for release-system learnings, based on the existing canonical pattern.

- [ ] **Step 1: Merge only after all required current-head checks are green**

No direct merge bypass and no branch-protection override.

- [ ] **Step 2: Verify exact merged SHA in production release readback**

`production-release-readback.yml` must remain in its own `production-release-readback` concurrency group. Confirm it evaluates the exact merge SHA and its production truth checks complete successfully.

- [ ] **Step 3: Verify the next representative focused PR**

Use the next normal website/portal/backend change as a readback of the new control plane: only relevant lanes should run, current head should acquire capacity without legacy fan-out, and a >5-minute no-step queue case should create one deduplicated incident rather than retries.

- [ ] **Step 4: Write the learning**

Persist at least:
- root cause: uncontrolled legacy PR fan-out competing with the existing lane orchestrator;
- prevention: single canonical PR ingress + materiality routing + same-PR supersession + topology regression guard + queue SLO;
- evidence: before/after workflow counts, run IDs, exact SHAs and production readback;
- rollback: restore prior trigger only if coverage equivalence fails.

Attempt external BG168→BG166/Powerhouse writeback only when the Make path is executable and execution evidence is returned. If Make capacity is blocked, retain the normalized payload as an open deduplicated writeback obligation and do not claim success.

- [ ] **Step 5: Final completion criteria**

Mark complete only when:
1. exactly one broad PR orchestrator remains;
2. all substantive migrated checks still execute through selected lanes/preflight;
3. stale same-PR runs cancel automatically;
4. independent PRs remain parallel;
5. protected `test` stays valid;
6. production readback remains isolated and exact-SHA;
7. topology regression tests are green;
8. queue watchdog detects the 5-minute condition without retry storms;
9. live workflow fan-out is materially below PR #1159 baseline;
10. learning/evidence is persisted.
