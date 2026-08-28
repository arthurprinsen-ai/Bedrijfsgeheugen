# Production Promotion Controller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, low-cost controller that keeps repairable candidates moving until green, promotes only exact verified SHAs, verifies production, rolls back on regression, and shares every material result with the Powerhouse Team Memory.

**Architecture:** Pure deterministic state evaluation lives in `scripts/production/promotion-controller.mjs` and is regression-tested in GitHub Actions. Make BG169 exposes the same state contract as a cheap on-demand control-plane service. Actual repair remains with specialist agents; actual GitHub/Netlify mutation occurs only after BG169 returns the exact action and all gates are verified.

**Tech Stack:** Node.js 22, node:test, GitHub Actions, Make control plane, BG168/BG166/BG167 shared learning.

**Spec:** `docs/superpowers/specs/2026-08-28-production-promotion-controller-design.md`

## Global Constraints
- FAILED/TEST_FAILED/BUILD_FAILED/DEPLOY_FAILED are intermediate while a safe repair path exists.
- Max two identical retries per hypothesis, then change hypothesis/fix/fallback.
- No force push for normal promotion.
- Promote only exact tested SHA.
- Last-known-good and rollback must exist before production mutation.
- Production regression triggers rollback then OPEN_REPAIR.
- No autonomous secrets/credentials/permissions changes, weakened security controls, destructive irreversible data, increased paid external resources, or legally/financially binding actions.
- Healthy transitions use deterministic logic; BG156 is not used.

---

### Task 1: Deterministic state machine
**Files:**
- Create: `tests/production-promotion-controller.test.mjs`
- Create: `scripts/production/promotion-controller.mjs`
- Modify: `.github/workflows/shared-agent-memory-tests.yml`

- [x] Write RED tests for exact SHA, red repair, retry threshold, drift, production rollback, production green, hard boundary.
- [x] Verify RED in GitHub Actions.
- [x] Implement minimal deterministic evaluator.
- [x] Verify full suite GREEN.

### Task 2: Make BG169 runtime evaluator
**Interfaces:**
- Consumes: `state_json` text using the same field contract as `evaluatePromotion(state)`.
- Produces: `result` JSON with `state`, `action`, exact SHA/rollback SHA where relevant.

- [ ] Create BG169 as on-demand Start → Code → ReturnData.
- [ ] Test PROMOTE_EXACT_SHA route.
- [ ] Test REPAIR and CHANGE_HYPOTHESIS routes.
- [ ] Test ROLLBACK_LAST_KNOWN_GOOD route.
- [ ] Verify no AI modules and bounded credit use.

### Task 3: Shared-memory integration
- [ ] Route material production actions/outcomes through BG168/BG166/BG167.
- [ ] Ensure PRODUCTION_PROMOTION and PRODUCTION_ROLLBACK remain first-class signal types.
- [ ] Persist last-known-good production evidence in shared state/learning.

### Task 4: Production deployment of controller code
- [ ] Confirm candidate branch CI GREEN on exact head SHA.
- [ ] Confirm candidate is mergeable against current main.
- [ ] Promote via exact-head guarded PR.
- [ ] Verify Netlify production exact commit_ref and ready state.
- [ ] Write real PRODUCTION_PROMOTION outcome to shared memory.

### Task 5: Control-plane protection
- [ ] Add BG169 to core continuity monitoring.
- [ ] Add BG169 to protected scenario IDs for deterministic repair safeguards.
- [ ] Verify healthy-state behavior does not trigger expensive recovery chains.
