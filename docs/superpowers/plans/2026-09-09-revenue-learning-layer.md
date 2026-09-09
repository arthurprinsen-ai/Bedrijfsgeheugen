# Revenue Learning Layer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one production revenue-learning loop across social, blogs, website behavior and commercial outcomes.

**Architecture:** Keep existing social and growth tables authoritative. Add a unified Supabase projection/store plus native Netlify evaluator/context functions that normalize evidence, apply commercial-priority scoring, persist lifecycle learnings and record learning applications.

**Tech Stack:** Node.js 22+/Netlify Functions, Supabase Postgres/Edge Functions, native node:test, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-09-revenue-learning-layer-design.md`

## Global Constraints
- Commercial priority: revenue, orders, proposals/offers, qualified leads, meetings, leads, clicks, substantive interactions, engagement fallback.
- Missing evidence is unknown, never zero.
- Prefer exact `attribution_root_key`; canonical URL fallback must be marked inferred.
- Lifecycle: CANDIDATE -> TESTING -> PROVEN -> WEAKENING -> RETIRED.
- Promotion: sample >=5, >=2 publication dates, confidence >=0.75, positive primary commercial effect, no higher-priority contradiction.
- Existing social/growth ingestion remains backward compatible.
- All writes/read context require existing service-token authorization; no new secret contract.

---

### Task 1: Unified model contract
**Files:**
- Create: `netlify/functions/_revenue-learning-model.mjs`
- Test: `tests/revenue-learning-model.test.mjs`

**Interfaces:**
- Produces `normalizeRevenueEvidence(input)`, `revenueMetricVector(input)`, `selectRevenueMetric(target, cohort, priority)`, `evaluateRevenueLearning(input, config)`.

- [ ] Write failing tests for null-vs-zero normalization, commercial priority, canonical-rate calculations and contradiction handling.
- [ ] Run `node --test tests/revenue-learning-model.test.mjs` and prove RED.
- [ ] Implement minimal model functions.
- [ ] Re-run and prove GREEN.
- [ ] Commit.

### Task 2: Supabase unified schema/store
**Files:**
- Create: `supabase/migrations/20260909112000_revenue_learning_layer.sql`
- Create: `supabase/functions/revenue-learning-store/index.ts`
- Create: `netlify/functions/_revenue-learning-store.mjs`
- Test: `tests/revenue-learning-store.test.mjs`

**Interfaces:**
- Tables: `revenue_learning_evidence`, `revenue_learnings`, `revenue_learning_applications`, `revenue_learning_projections`, `revenue_learning_obligations`.
- Store actions: upsert evidence/learning/application/projection/obligation; list due content; list cohort; list current learnings.

- [ ] Write failing adapter contract tests for stable idempotency keys, auth headers and last-known-good projection.
- [ ] Prove RED.
- [ ] Add migration with RLS enabled and no public policies; implement Edge store using existing `x-bg-service-token` hash contract.
- [ ] Implement Netlify REST adapter.
- [ ] Prove GREEN and apply migration/deploy Edge Function.
- [ ] Commit.

### Task 3: Cross-channel evidence projection
**Files:**
- Create: `netlify/functions/revenue-learning-project.mjs`
- Test: `tests/revenue-learning-project.test.mjs`

**Interfaces:**
- Reads existing social/growth tables through store actions and emits canonical evidence rows for `linkedin_*`, `instagram`, `blog`, `website`.

- [ ] Write failing tests proving exact attribution-root preference, inferred canonical fallback, social commercial enrichment and blog daily-window projection.
- [ ] Prove RED.
- [ ] Implement projection and hourly native schedule.
- [ ] Prove GREEN.
- [ ] Commit.

### Task 4: Unified evaluator and lifecycle
**Files:**
- Create: `netlify/functions/revenue-learning-evaluate.mjs`
- Test: `tests/revenue-learning-evaluate.test.mjs`

**Interfaces:**
- Consumes unified evidence, builds cohorts, chooses highest-priority comparable metric, writes learning lifecycle and reconciles applications.

- [ ] Write failing tests for revenue superseding engagement, missing evidence obligation, promotion thresholds and weakening/retirement.
- [ ] Prove RED.
- [ ] Implement hourly evaluator using stable evaluation fingerprints.
- [ ] Prove GREEN.
- [ ] Commit.

### Task 5: BRAIN context and application tracking
**Files:**
- Create: `netlify/functions/revenue-learning-context.mjs`
- Test: `tests/revenue-learning-context.test.mjs`

**Interfaces:**
- GET returns max 8 PROVEN learnings ordered by expected commercial value * confidence.
- POST records content decision and applied learning IDs for social/blog content IDs.

- [ ] Write failing auth, bounded-projection, stale-fallback and application-recording tests.
- [ ] Prove RED.
- [ ] Implement endpoint with existing service token.
- [ ] Prove GREEN.
- [ ] Commit.

### Task 6: CI/release integration
**Files:**
- Create: `.github/workflows/revenue-learning.yml`
- Modify: `config/brain-delivery-system.json` only if classification requires it.
- Test: `tests/brain-revenue-learning-delivery-classifier.test.mjs`

- [ ] Add dedicated test workflow running all `tests/revenue-learning-*.test.mjs` after `npm ci`.
- [ ] Add classifier regression only if the new paths are not already classified.
- [ ] Run PR gates and fix root causes, never bypassing Required/BRAIN.
- [ ] Commit.

### Task 7: Production canary/readback
**Files:**
- No new product files unless a discovered production defect requires a fix.

- [ ] Verify exact PR head: dedicated Revenue Learning, Required, BRAIN delivery and promotion gates success.
- [ ] Squash merge exact tested head.
- [ ] Verify Netlify production commit contains projector/evaluator/context functions and schedules.
- [ ] Verify Supabase tables/RLS and Edge store active.
- [ ] Run real-data readback: project at least one production social or blog/web asset into unified evidence; confirm projection/context is valid.
- [ ] Close any resolved obligations; leave genuinely missing data as explicit OPEN obligations.
