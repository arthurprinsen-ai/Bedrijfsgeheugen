# Composable Fast Release Control Plane Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make parallel agent development and fast risk-based production releases independent from unrelated moving-main drift.

**Architecture:** Keep the protected `test` context as a thin aggregator. Move website, portal, backend and automation validation into reusable workflows; website uses deterministic risk classification and parallel browser validation. Production readback is latest-main serialized without serializing development or PR CI.

**Tech Stack:** GitHub Actions reusable workflows, Node.js 22, node:test, Playwright, Netlify deploy previews.

**Spec:** `docs/superpowers/specs/2026-09-07-composable-fast-release-control-plane-design.md`

## Global Constraints
- Preserve the moving-main successor guard.
- Preserve mandatory all-public-page visibility for every website PR.
- Preserve the required status name `test`.
- Never require a rebuild only because `main` advanced without feature overlap.
- Fast fixes run only baseline + exact preview + targeted browser + public visibility.
- High-risk shared changes run full regression.

---

### Task 1: Lock the composable control-plane contract
**Files:** Create `tests/composable-release-control-plane.test.mjs`.
- [ ] Write tests requiring four reusable lane workflows and a thin aggregator.
- [ ] Run through CI and confirm RED before implementation.
- [ ] Commit.

### Task 2: Restore deterministic website risk classification
**Files:** Create `config/website-release-risk.json`, `tools/website-release-risk.mjs`, `tests/website-release-risk.test.mjs`.
- [ ] Add fast-fix/normal/high-risk tests.
- [ ] Implement deterministic classifier.
- [ ] Verify GREEN.

### Task 3: Create reusable lane workflows
**Files:** Create `.github/workflows/lane-website.yml`, `lane-portal.yml`, `lane-backend.yml`, `lane-automation.yml`.
- [ ] Website lane runs risk classification, exact preview, targeted verification and mandatory public visibility; broad suites only for high-risk.
- [ ] Portal/backend/automation run only their domain contracts.
- [ ] Verify reusable-workflow syntax through GitHub CI.

### Task 4: Make Required test a stable aggregator
**Files:** Modify `.github/workflows/required-test.yml`.
- [ ] Keep successor guard and lane classification.
- [ ] Call only relevant reusable lane workflows.
- [ ] Final job is named `test` and fails only when a selected lane fails.
- [ ] Verify no lane-specific test commands remain in the aggregator.

### Task 5: Make production verification latest-main and non-blocking to development
**Files:** Create `.github/workflows/production-release-readback.yml` and `tools/verify-targeted-website-routes.mjs`.
- [ ] Use one production readback concurrency group with `cancel-in-progress: true`.
- [ ] Verify exact live SHA and affected routes.
- [ ] Do not serialize PR validation or deploy previews.

### Task 6: Verify, merge and live readback
- [ ] Exact-head protected `test` GREEN.
- [ ] BRAIN delivery GREEN or non-blocking only where unrelated.
- [ ] Merge with exact head SHA.
- [ ] Netlify production must read back the merge SHA as `ready`.
