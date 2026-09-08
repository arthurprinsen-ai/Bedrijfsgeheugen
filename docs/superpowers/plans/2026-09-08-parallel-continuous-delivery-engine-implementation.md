# Parallel Continuous Delivery Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Bedrijfsgeheugen releases parallel, merge-queue compatible, scope-safe, exact-SHA traceable, and faster without weakening required production gates.

**Architecture:** Extend the existing BRAIN-DELIVERY-v2 control plane instead of replacing it. Deliver the architecture as independently releasable control-plane increments: event normalization + merge-group support first, then scope ownership, explicit lane impact, immutable release evidence, production locks/recovery, and CI runtime acceleration.

**Tech Stack:** GitHub Actions, Node.js 22 ESM, JSON policy/contracts, Netlify production/readback, existing BRAIN-DELIVERY-v2 control plane.

**Spec:** `docs/superpowers/specs/2026-09-08-parallel-continuous-delivery-engine-design.md`

## Global Constraints

- `main` stays protected and the required status identity remains exactly `test`.
- No direct bypass of required checks or production readback.
- Non-overlapping `main` drift must not create a successor or force a rebuild.
- Synchronization is allowed only for merge conflict, changed-path overlap, declared-contract overlap, or declared-dependency conflict.
- PR CI may cancel stale runs for the same change; production promotion/readback may not be cancelled mid-flight.
- Every change is implemented test-first: RED -> GREEN -> regression verification.
- Each implementation increment uses a clean short-lived branch from the then-current `main`.
- Control-plane changes are high-risk and fail closed.

---

### Task 1: Merge-group compatible Required test

**Files:**
- Create: `tools/delivery/github-event-context.mjs`
- Create: `tests/delivery-github-event-context.test.mjs`
- Modify: `.github/workflows/required-test.yml`
- Modify: `tests/brain-change-scoped-release-lanes.test.mjs`

**Interfaces:**
- Produces: `normalizeGitHubDeliveryEvent({ eventName, event, githubSha, runId }) -> { changeId, baseSha, headSha, prNumber, mode }`
- `mode` is `pull_request`, `merge_group`, or `workflow_dispatch`.

- [ ] Write failing tests proving PR and merge-group events normalize without PR-only assumptions.
- [ ] Run `node --test tests/delivery-github-event-context.test.mjs` and verify RED because module is absent.
- [ ] Implement the minimal event adapter with strict SHA validation.
- [ ] Update `required-test.yml` to trigger on `merge_group: { types: [checks_requested] }` and use normalized base/head/change identity.
- [ ] Keep moving-main successor guard PR-only.
- [ ] Change Required concurrency key to use normalized change identity so stale runs cancel only the same PR/merge-group.
- [ ] Extend workflow contract tests to require `merge_group` and the adapter.
- [ ] Run `node --test tests/delivery-github-event-context.test.mjs tests/brain-change-scoped-release-lanes.test.mjs tests/brain-composable-release-control-plane.test.mjs`.
- [ ] Commit as an independently releasable PR.

### Task 2: Change-scope manifest and contamination guard

**Files:**
- Create: `config/change-scope.schema.json`
- Create: `tools/delivery/change-scope.mjs`
- Create: `tools/delivery/change-scope-guard.mjs`
- Create: `tests/delivery-change-scope.test.mjs`
- Modify: `.github/workflows/required-test.yml`

**Interfaces:**
- `createChangeScope({ changeId, baseSha, changedPaths, policy }) -> manifest`
- `evaluateChangeScope({ manifest, actualChangedPaths, commitMetadata, policy }) -> { ok, violations, diagnostics }`

- [ ] Write failing tests for undeclared files, allowed generated files, and bounded scope amendments.
- [ ] Verify RED.
- [ ] Implement deterministic manifest creation and guard evaluation.
- [ ] Add audit output to Required preflight first; enforce only when a manifest is present, while control-plane PRs use an explicit generated manifest.
- [ ] Add diagnostics for unexpected file count growth and ownership violations.
- [ ] Run focused tests plus Required control-plane contract tests.
- [ ] Commit as separate PR.

### Task 3: Explicit lane-impact graph instead of broad shared fan-out

**Files:**
- Modify: `config/brain-delivery-system.json`
- Modify: `tools/brain-delivery-system.mjs`
- Modify: `tools/delivery-required-test-suites.mjs`
- Modify: `tests/brain-delivery-system.test.mjs`
- Modify: `tests/brain-change-scoped-release-lanes.test.mjs`

**Interfaces:**
- Extend delivery plan with `nodes`, `edges`, `contracts`, `locks`, `productionSurfaces` while preserving `lanes` for compatibility.

- [ ] Write failing tests that canonical shell changes activate website only and policy changes activate Brain control-plane plus only explicitly impacted product lanes.
- [ ] Verify RED against current shared-path fan-out.
- [ ] Add explicit impact metadata and compatibility mapping.
- [ ] Keep unknown paths fail-closed.
- [ ] Run delivery-system regression suite.
- [ ] Commit as separate PR.

### Task 4: Immutable release manifest and exact candidate evidence

**Files:**
- Create: `config/release-manifest.schema.json`
- Create: `tools/delivery/release-manifest.mjs`
- Create: `tests/delivery-release-manifest.test.mjs`
- Modify: relevant promotion/readback workflow(s).

**Interfaces:**
- `createReleaseManifest({ changeId, candidateSha, mergeGroupSha, artifact, lanes, risk, productionSurfaces })`
- `verifyReleaseEvidence({ manifest, deployedSha, artifactChecksum })`

- [ ] Write failing tests rejecting SHA/artifact mismatch.
- [ ] Verify RED.
- [ ] Implement immutable manifest/evidence validation.
- [ ] Persist manifest as workflow artifact before promotion.
- [ ] Require production verification to bind to the same release identity.
- [ ] Run focused and production-release contract tests.
- [ ] Commit as separate PR.

### Task 5: Production-surface locks and non-cancellable readback

**Files:**
- Modify: `.github/workflows/production-release-readback.yml`
- Modify/create: promotion orchestration helpers/tests.
- Modify: `tests/brain-composable-release-control-plane.test.mjs`

**Interfaces:**
- Production lock key is derived from deployment surface, e.g. `netlify-site:bedrijfsgeheugen`, `database:supabase-schema`, `automation:<provider>`.

- [ ] Write failing workflow-contract test requiring `cancel-in-progress: false` for production readback/promotion.
- [ ] Verify RED against current `cancel-in-progress: true`.
- [ ] Change production workflow to fail-safe non-cancellable execution.
- [ ] Add keyed lock derivation without serializing unrelated CI.
- [ ] Verify regression tests.
- [ ] Commit as separate PR.

### Task 6: Deduplicated production recovery obligation

**Files:**
- Create/extend recovery helper in `tools/delivery/`.
- Create tests for deterministic fingerprint/dedupe.
- Modify production readback workflow failure path.

- [ ] Write failing test: identical failed release creates exactly one obligation fingerprint.
- [ ] Verify RED.
- [ ] Implement recovery state `PRODUCTION_READBACK_FAILED` with exact release evidence.
- [ ] Route rollback vs fix-forward decision by reversibility/blast radius; do not blind-retry.
- [ ] Verify tests and workflow contract.
- [ ] Commit separately.

### Task 7: CI runtime acceleration

**Files:**
- Modify: `.github/workflows/lane-website.yml`
- Modify: reusable lane workflows where dependency setup repeats.
- Create workflow contract tests for cache keys/runtime versions.

- [ ] Write failing tests requiring lockfile/runtime-keyed Node/Python caches and reusable Playwright browser cache strategy.
- [ ] Verify RED.
- [ ] Add `setup-node` / `setup-python` caching where supported.
- [ ] Cache Playwright browser binaries keyed by OS + Playwright version; keep system dependency installation deterministic.
- [ ] Avoid caching mutable test outputs or production artifacts.
- [ ] Run workflow contract tests.
- [ ] Commit separately.

### Task 8: Repository governance and controlled parallel-release proof

**Files:**
- Create: `tests/delivery-parallel-release-acceptance.test.mjs` or equivalent contract fixture.
- Modify repo-side governance docs/config only where needed.

- [ ] Prove website-only and portal/backend-only candidates classify independently.
- [ ] Prove non-overlapping moving-main drift stays `KEEP_TESTED_FEATURE`.
- [ ] Prove merge-group execution retains stable required status `test`.
- [ ] Prove exact-SHA production readback and recovery semantics.
- [ ] Inspect repository rules/settings capability; enable merge queue only through an authorized admin surface after merge-group workflow is live and green.
- [ ] Do not claim merge queue enabled unless repository settings evidence confirms it.
- [ ] Run complete control-plane regression suite and production readback after merge.

## Execution order

Tasks 1 and 5 are the highest-value immediate corrections and can be developed independently. Task 2 follows immediately to stop branch pollution. Tasks 3-7 then migrate the deeper control plane without blocking ordinary product releases. Task 8 is the final acceptance/gov step.

## Completion evidence

The engine is complete only when all implementation PRs are merged and the repository proves: merge-group Required checks, bounded scope, no unrelated lane fan-out, non-cancellable production readback, exact release identity, deduplicated recovery, accelerated dependency setup, and a real parallel-release exercise against a moving `main`.
