# Estate-wide Closed-loop Learning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans task-by-task.

**Goal:** Enforce one shared closed-loop learning contract across all Powerhouse components.

**Architecture:** A machine-readable contract defines mandatory lifecycle stages, canonical routers and anti-patterns. A fail-closed Node validator and CI workflow prevent drift; Make runtime uses BG94 -> BG168 -> BG166 -> BG167 with BG159 as low-cost discovery.

**Tech Stack:** JSON, Node.js, GitHub Actions, Make/BG94/BG159/BG166/BG167/BG168/BG169.

**Spec:** `docs/superpowers/specs/2026-09-01-estate-wide-closed-loop-learning-design.md`

## Global Constraints
- No second persistent memory.
- No fleet-wide expensive polling.
- Dedupe before persistent write and shared-context refresh.
- Maximum two identical retries per hypothesis.
- Production completion requires external outcome evidence.

### Task 1: Machine contract
- [ ] Add `config/universal-closed-loop-learning.json` with required stages, fields, canonical routes, cost guards and forbidden patterns.
- [ ] Validate JSON parses.

### Task 2: Fail-closed validator
- [ ] Add `scripts/brain/validate-universal-closed-loop-learning.mjs`.
- [ ] Reject missing required lifecycle stages, canonical scenario IDs, stateful fields, cost guards and forbidden polling architecture.
- [ ] Return `UNIVERSAL_CLOSED_LOOP_READY` only on complete contract.

### Task 3: Regression test and CI
- [ ] Add `tests/universal-closed-loop-learning.test.mjs` that validates the canonical config and proves a broken config is rejected.
- [ ] Add `.github/workflows/universal-closed-loop-learning.yml` to run the regression test.

### Task 4: Runtime certification
- [ ] Confirm BG94 active and dispatches every error to BG168.
- [ ] Run one bounded synthetic canary through BG94 using a unique fingerprint.
- [ ] Confirm BG168 dispatch and BG166 writer success.
- [ ] Do not introduce polling/runtime duplicate owners.

### Task 5: Governed promotion
- [ ] Open PR from exact current main base.
- [ ] Require exact-head tests and preview evidence.
- [ ] Promote only through BG169.
- [ ] Verify exact Netlify production commit_ref, ready context and secret scan.
