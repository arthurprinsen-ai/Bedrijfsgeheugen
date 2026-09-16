# Powerhouse Engineering Closed Loop v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add measurable continuous improvement to the existing Powerhouse Engineering OS without creating a parallel authority.

**Architecture:** One focused Brain module provides pure scorecard, flake, graph, recovery, scaffold and meta-learning functions plus CLI modes. Existing Engineering OS config indexes the capability; Required test executes its regression contract; a scheduled workflow emits evidence artifacts and never auto-weakens gates.

**Tech Stack:** Node.js 22 stdlib, GitHub Actions, existing Powerhouse JSON contracts, Supabase/Notion writeback after protected merge.

**Spec:** `docs/brain/powerhouse-engineering-closed-loop-v1.md`

## Global Constraints

- Existing-state-first and reuse-first.
- `BRAIN-DELIVERY-v2` remains delivery authority.
- Missing measurements remain `unknown`.
- Flake/quarantine diagnostics may not override required failures.
- Recovery proof requires fresh successful bounded evidence.
- Generated scaffolds stay inside registered delivery lanes.
- Meta-learning produces recommendations only; promotion uses normal protected delivery.

---

### Task 1: Contract and regression tests

**Files:**
- Modify: `config/powerhouse-engineering-os.json`
- Create: `tests/brain-powerhouse-engineering-closed-loop.test.mjs`
- Modify: `.github/workflows/required-test.yml`

**Interfaces:**
- Consumes: existing Engineering OS fingerprint and Required test.
- Produces: executable contract expectations for all six capabilities.

- [x] Write tests that import `computeEngineeringScorecard`, `detectFlakyTests`, `buildDependencyGraph`, `computeBlastRadius`, `evaluateRecoveryProof`, `createGoldenPathScaffold`, and `evaluateEngineeringMetaLearning` from `scripts/brain/powerhouse-engineering-closed-loop.mjs`.
- [x] Wire the test file into Required test before implementation and verify RED before production implementation.
- [x] Add the contract section to the existing Engineering OS config without creating a new authority.

### Task 2: Pure closed-loop engine

**Files:**
- Create: `scripts/brain/powerhouse-engineering-closed-loop.mjs`

**Interfaces:**
- Consumes: arrays/objects of evidence supplied by CI/runtime exporters.
- Produces: deterministic JSON with measured/partial/unknown states.

- [x] Implement DORA + Powerhouse scorecard with evidence completeness.
- [x] Implement flake classification on same-source-revision oscillation.
- [x] Implement dependency graph validation and reverse blast-radius traversal.
- [x] Implement 90-day recovery evidence validation.
- [x] Implement deterministic scaffold manifests for five supported kinds.
- [x] Implement conservative meta-learning recommendations with no direct mutation.
- [x] Add CLI modes `--scorecard`, `--flakes`, `--graph`, `--recovery`, `--scaffold`, `--learn`, and `--self-test`; JSON input comes from a file or stdin.

### Task 3: Scheduled evidence workflow

**Files:**
- Create: `.github/workflows/engineering-os-learning.yml`

**Interfaces:**
- Consumes: GitHub workflow/check metadata and repository contract.
- Produces: versioned JSON evidence artifact; no production mutation.

- [x] Run daily and on workflow dispatch.
- [x] Collect recent GitHub Actions runs using the repository token with read-only permissions.
- [x] Produce scorecard/meta-learning JSON through the Brain module.
- [x] Upload the evidence as an Actions artifact.
- [x] Fail if the Engineering OS self-test fails; do not fail because a metric is unknown.

### Task 4: Recovery and generator documentation

**Files:**
- Use: `docs/brain/powerhouse-engineering-closed-loop-v1.md`

**Interfaces:**
- Consumes: closed-loop contract.
- Produces: human instructions matching executable behavior.

- [x] Document metric semantics and unknown-data rule.
- [x] Document flake diagnostics and prohibition on rerun-until-green.
- [x] Document dependency/blast-radius behavior.
- [x] Document recovery proof and 90-day freshness.
- [x] Document generator supported kinds and hooks.
- [x] Document meta-learning promotion boundary.

### Task 5: Exact-head verification, merge and canonical writeback

**Files:** existing Powerhouse authorities only.

- [ ] Require exact-head Required test and BRAIN delivery success.
- [ ] Merge with expected-head guard.
- [ ] Read protected `main` back and record merge SHA.
- [ ] Write Supabase `brain_records` CurrentState + Learning using existing canonical store.
- [ ] Update existing Engineering Constitution, Human Handbook, Canonical System Map, Master Register, Latest Verified State and Agent Activity Log; create no parallel Notion page.
- [ ] Read all writebacks back and close only when open release obligation is null.
