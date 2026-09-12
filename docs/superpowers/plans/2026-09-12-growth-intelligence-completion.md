# Growth Intelligence Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Growth Revenue OS so company/market intelligence, latent demand, offer learning, calibrated predictions, attribution, concept drift and counterfactual learning execute as one canonical daily loop.

**Architecture:** Reuse Supabase/Powerhouse canonical tables; do not create a parallel CRM or learning store. A pure engine calculates convergence, demand, portfolio allocation, attribution, counterfactuals and lifecycle state. A scheduled Netlify function reads existing sources and writes only to existing opportunity, revenue-learning and Brain tables.

**Tech Stack:** Node ESM, Netlify Functions, Supabase PostgREST, node:test.

**Spec:** `docs/growth-revenue-os-architecture.md`

## Global Constraints
- North star EUR 1,000,000 attributable revenue by 2027-09-12.
- Prediction must be recorded before outcome.
- Missing baseline must remain insufficient evidence.
- Attribution classes are DIRECT, ASSISTED, INFLUENCED, UNKNOWN.
- No fabricated identity, urgency, revenue or causality.
- Existing canonical tables only.

### Task 1: Intelligence engine
**Files:** Create `platform/growth-intelligence-engine.mjs`; test `tests/growth-intelligence-engine.test.mjs`.
- [x] Write RED tests for convergence, latent demand, exploration, counterfactual, attribution, lifecycle, offers, predictions and scorecard.
- [x] Run RED; counterfactual null-baseline test failed as expected.
- [x] Implement minimal engine and fix null baseline fail-closed behavior.
- [x] Run tests: 9/9 PASS.

### Task 2: Daily canonical orchestration
**Files:** Create `netlify/functions/growth-intelligence-daily.mjs`; test `tests/growth-intelligence-daily.test.mjs`.
- [x] Read only existing market/search/engagement/connection/opportunity/learning/offer/application tables.
- [x] Upsert inferred latent-demand signals only for companies with observed engagement identity.
- [x] Record prior predictions and 24h/72h/168h calibration obligations.
- [x] Convert observed offer submissions into revenue-learning evidence without inventing revenue.
- [x] Review expired/contradicted learnings through lifecycle transitions.
- [x] Persist daily Brain Intelligence Scorecard.
- [x] Run full tests: 10/10 PASS and syntax check PASS.

### Task 3: Production delivery
**Files:** This plan plus the four executable/test files above on `docs/growth-revenue-os-architecture-v1`.
- [x] Commit atomically to protected-branch feature branch.
- [ ] Required GitHub checks must pass on exact head SHA.
- [ ] Merge only after checks are green.
- [ ] Verify main SHA contains the files.
- [ ] Verify production deploy/readback before claiming repository runtime live.

### Task 4: Runtime governance
- [ ] Persist Brain governance record covering the eight completed capabilities.
- [ ] Run a non-revenue canary using current canonical data.
- [ ] Read back canary records, obligations and scorecard.
- [ ] Keep any unavailable evidence as OPEN rather than fabricating success.
