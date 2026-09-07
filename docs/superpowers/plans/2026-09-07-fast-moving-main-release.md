# Fast Moving-Main Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce website release latency while making stale-main release evidence impossible to use for merge authorization.

**Architecture:** Split the protected `test` workflow into cheap classification/static work, browser-only work, and a final stable `test` aggregation/fresh-base gate. Keep the existing risk classifier as the browser scope authority, add an immutable base/head evidence contract, and verify the exact merged SHA on Netlify production.

**Tech Stack:** GitHub Actions, Node.js 22, Playwright 1.55, Netlify deploy previews, existing Bedrijfsgeheugen delivery-lane/risk tooling.

**Spec:** `docs/superpowers/specs/2026-09-07-fast-moving-main-release-design.md`

## Global Constraints
- Fast Fix p95 eligibility target: under 10 minutes when passing.
- Normal Change p95 eligibility target: under 20 minutes when passing.
- No direct writes to protected `main`.
- Existing `test` status context remains the branch-protection compatibility surface.
- Browser dependencies install only in browser jobs.
- Stale base evidence must fail closed.
- Production success requires Netlify `ready`, `production`, exact `main` commit SHA.

---

### Task 1: Stale-base contract
**Files:**
- Create: `tools/release-base-guard.mjs`
- Create: `tests/release-base-guard.test.mjs`

**Interfaces:**
- Produces: `evaluateReleaseBase({testedBaseSha,currentMainSha,headSha}) -> {ok,reason,testedBaseSha,currentMainSha,headSha}`

- [ ] Write tests for equal base, moved base, and missing evidence.
- [ ] Run the focused Node test and confirm RED.
- [ ] Implement deterministic fail-closed base evaluation.
- [ ] Run focused test and confirm GREEN.

### Task 2: Parallel protected test workflow
**Files:**
- Modify: `.github/workflows/required-test.yml`

**Interfaces:**
- `scope` job emits delivery lanes and browser risk.
- `static` job runs cheap relevant contracts.
- `browser` job runs only when browser risk requires it.
- final job is named exactly `test` and depends on required predecessors.

- [ ] Add workflow contract assertions for stable `test`, isolated browser install, and fresh-base check.
- [ ] Refactor workflow to jobs `scope`, `static`, `browser`, `test`.
- [ ] Use `actions/setup-node` npm cache where lockfile support exists; do not install Chromium outside `browser`.
- [ ] Final `test` fetches `origin/main`, compares it with PR base evidence via `release-base-guard.mjs`, and fails stale.

### Task 3: Faster browser selection
**Files:**
- Modify: `config/website-release-risk.json`
- Modify: `tools/website-release-risk.mjs`
- Modify: `tests/website-release-risk.test.mjs`

**Interfaces:**
- Existing `none/menu/full` remains backward compatible.
- Add `targeted` profile for ordinary page-local public-surface changes.
- `targeted` runs affected-route verification rather than all-page visual regression.

- [ ] Add RED tests for page-local CSS/HTML/JS paths classified as `targeted` and shared shell/build paths as `full`.
- [ ] Implement classification precedence `full > menu > targeted > none`.
- [ ] Keep unknown paths within shared website runtime fail-closed to `full`.

### Task 4: Canonical release gate and production readback
**Files:**
- Create/modify: `.github/workflows/release-gate.yml`
- Create/modify: `.github/workflows/production-release-readback.yml`
- Create/modify: `tools/verify-production-release.mjs`
- Create/modify: `tests/release-gate-contract.test.mjs`
- Create/modify: `tests/production-release-readback.test.mjs`

**Interfaces:**
- Release gate uses exact PR head and tested base evidence.
- Production readback accepts `EXPECTED_SHA` and validates Netlify metadata.

- [ ] Ensure one canonical browser eligibility path; no duplicate full-browser execution.
- [ ] Verify release gate has per-PR concurrency so independent PRs do not cancel/block each other.
- [ ] Verify production readback requires exact SHA/state/context.

### Task 5: End-to-end release
- [ ] Open PR from `release/fast-moving-main-v1` to current `main`.
- [ ] If `main` moved, rebuild branch from current `main` before relying on green evidence.
- [ ] Require final `test` and release gate green.
- [ ] Merge using exact expected head SHA.
- [ ] Fetch new `main` SHA.
- [ ] Verify Netlify current production deploy has the exact SHA, state `ready`, context `production`.
- [ ] Close superseded/stale release candidates.
