# Production Promotion Controller Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a deterministic, low-cost controller that keeps repairable candidates moving until green, promotes only exact verified SHAs, verifies production, rolls back on regression, and shares every material result with Powerhouse Team Memory.

**Architecture:** Pure deterministic state evaluation lives in `scripts/production/promotion-controller.mjs` and is regression-tested in GitHub Actions. Make BG169 exposes the same state contract as a cheap on-demand control-plane service. Actual repair remains with specialist agents.

**Spec:** `docs/superpowers/specs/2026-08-28-production-promotion-controller-design.md`

## Global Constraints
- FAILED/TEST_FAILED/BUILD_FAILED/DEPLOY_FAILED are intermediate while a safe repair path exists.
- Max two identical retries per hypothesis, then change hypothesis/fix/fallback.
- No force push for normal promotion.
- Promote only exact tested SHA.
- Last-known-good and rollback must exist before production mutation.
- Production regression triggers rollback then OPEN_REPAIR.
- Healthy transitions use deterministic logic; BG156 is not used.

### Task 1: Deterministic state machine
- [x] RED tests written and observed failing on prior isolated branch.
- [x] Minimal evaluator implemented and suite observed green.
- [ ] Re-run same suite on clean branch from current production main.

### Task 2: Make BG169 runtime evaluator
- [x] BG169 created: `7137190`.
- [x] PROMOTE_EXACT_SHA verified.
- [x] REPAIR verified.
- [x] CHANGE_HYPOTHESIS verified.
- [x] ROLLBACK_LAST_KNOWN_GOOD verified.
- [x] Cost verified at 1 operation / 2 credits / 640 bytes for rollback canary.

### Task 3: Shared-memory integration
- [x] BG169 added to TEAM-CONTRACT-v1.3-PROD-CONTROLLER.
- [x] BG169 added to continuity/protected scenario sets.
- [ ] Persist final controller production promotion outcome.

### Task 4: Production deployment
- [ ] Confirm clean candidate CI GREEN.
- [ ] Confirm mergeable against current main.
- [ ] Merge exact head SHA.
- [ ] Verify Netlify production exact commit_ref and ready state.
- [ ] Write real PRODUCTION_PROMOTION outcome to shared memory.
