# Change-scoped Parallel Release Lanes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make parallel Bedrijfsgeheugen/Powerhouse changes independently releasable while preserving existing open PR work and exact-SHA production governance.

**Architecture:** Reuse `config/brain-delivery-system.json` as the single lane classifier. Add a deterministic required-test suite planner, make the stable `Required test` workflow execute only shared-baseline plus material lane suites, and add regression coverage proving unrelated lane failures cannot block each other. Existing open PR branches are not rewritten; they adopt the new base-controlled workflow on their next event/rerun.

**Tech Stack:** GitHub Actions YAML, Node.js 22, node:test, existing BRAIN-DELIVERY-v2 tooling, Playwright for website deploy-preview checks.

**Spec:** `docs/superpowers/specs/2026-09-07-change-scoped-release-lanes-design.md`

## Global Constraints

- Keep the required status identity `Required test` stable.
- Unknown active paths fail closed.
- Shared executable governance changes fan out across all lanes.
- No direct production bypass.
- No generic rebuild/rebase on non-overlapping `main` drift.
- Preserve all current open PR content and branch heads.
- Exact-SHA production authority remains BG169.

---

### Task 1: Add lane-aware required-test planner

**Files:**
- Modify: `tests/brain-delivery-system.test.mjs`
- Modify: `tools/brain-delivery-system.mjs`

**Interfaces:**
- Consumes: `createDeliveryPlan({ changedPaths, headSha, policy })` and `config/brain-delivery-system.json` lane IDs.
- Produces: `deriveRequiredTestSuites({ lanes }) -> { shared:boolean, backend:boolean, portal:boolean, website:boolean, automation:boolean }`.

- [ ] **Step 1: Write the failing tests**

Add tests asserting website-only enables only shared+website, backend-only enables only shared+backend, portal-only enables only shared+portal, and shared control-plane fanout enables all lanes.

- [ ] **Step 2: Run RED**

Run: `node --test tests/brain-delivery-system.test.mjs`

Expected: FAIL because `deriveRequiredTestSuites` is not exported/implemented.

- [ ] **Step 3: Implement minimal planner**

Implement and export a pure function that accepts lane IDs and returns the exact boolean suite map. Reject unknown lane IDs.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/brain-delivery-system.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

`git add tests/brain-delivery-system.test.mjs tools/brain-delivery-system.mjs && git commit -m "feat: classify required tests by delivery lane"`

### Task 2: Make Required test lane-aware without changing its status name

**Files:**
- Modify: `.github/workflows/required-test.yml`
- Modify: `tests/brain-delivery-system.test.mjs`

**Interfaces:**
- Consumes: changed paths between PR base/head; `createDeliveryPlan`; `deriveRequiredTestSuites`.
- Produces: job outputs `backend`, `portal`, `website`, `automation`; conditional test steps under the existing `test` job.

- [ ] **Step 1: Write failing workflow contract tests**

Assert the workflow still contains `name: Required test`, computes a delivery plan, publishes suite outputs, and guards backend/portal/website/automation steps with `if:` conditions.

- [ ] **Step 2: Run RED**

Run: `node --test tests/brain-delivery-system.test.mjs`

Expected: FAIL because current workflow is monolithic.

- [ ] **Step 3: Implement workflow planning step**

Checkout with `fetch-depth: 0`. Compute changed paths using PR base/head, create the delivery plan using the canonical policy, derive required suite booleans, write them to `$GITHUB_OUTPUT`, and fail closed on unclassified paths.

- [ ] **Step 4: Split monolithic required commands by material lane**

Keep a small shared baseline always blocking. Run Brain/event/Make-governance tests only for backend. Run portal tests only for portal. Run V18/site-shell/SEO/UI and Playwright deploy-preview checks only for website. Run delivery/automation tests only for automation.

- [ ] **Step 5: Run GREEN**

Run: `node --test tests/brain-delivery-system.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

`git add .github/workflows/required-test.yml tests/brain-delivery-system.test.mjs && git commit -m "ci: scope required test gates to changed lanes"`

### Task 3: Prove compatibility with existing open PR classes

**Files:**
- Modify: `tests/brain-delivery-system.test.mjs`
- Create: `docs/changes/2026-09-07-parallel-release-open-pr-migration.md`

**Interfaces:**
- Consumes: canonical policy path classification.
- Produces: durable compatibility evidence for website, portal, growth/multi-lane and shared-control-plane PR shapes.

- [ ] **Step 1: Add failing/coverage tests for representative current changes**

Use representative paths from current work: homepage/site-shell -> website; prices page -> website; standalone menu visibility -> website; portal-next -> portal; growth event + SEO tooling -> backend+website.

- [ ] **Step 2: Run targeted tests**

Run: `node --test tests/brain-delivery-system.test.mjs`

Expected: PASS after Tasks 1-2; any classification gap must fail closed and be corrected in policy rather than bypassed.

- [ ] **Step 3: Write migration note**

Document: no force-push/rebase/reset of existing PRs; next event/rerun adopts change-scoped gates; real overlaps still require sync; draft PRs stay non-promotable.

- [ ] **Step 4: Commit**

`git add tests/brain-delivery-system.test.mjs docs/changes/2026-09-07-parallel-release-open-pr-migration.md && git commit -m "test: prove open PR compatibility with parallel release lanes"`

### Task 4: End-to-end verification and PR

**Files:**
- Verify all modified files.

**Interfaces:**
- Consumes: Tasks 1-3.
- Produces: one governance PR mergeable independently from all product PRs.

- [ ] **Step 1: Run focused tests**

Run: `node --test tests/brain-delivery-system.test.mjs tests/delivery-learning.test.mjs tests/delivery-preflight.test.mjs`

Expected: PASS.

- [ ] **Step 2: Run required shared regressions**

Run the repository's existing Shared Agent Memory/BRAIN delivery regression commands applicable to control-plane changes.

Expected: PASS.

- [ ] **Step 3: Open PR from `arch/change-scoped-release-lanes-v1` to `main`**

Title: `Enable change-scoped parallel production releases`

Body must state that the PR changes governance only, preserves existing feature branches, and that current open PRs should rerun after merge rather than be mass-rebased.

- [ ] **Step 4: Verify exact-head GitHub Actions**

Required test, Unified Brain Delivery, Shared Agent Memory and relevant control-plane checks must be green on the exact head SHA before merge.

- [ ] **Step 5: Merge only after exact-head evidence**

Use BG169/existing production authority. Do not bypass failed shared control-plane checks.
