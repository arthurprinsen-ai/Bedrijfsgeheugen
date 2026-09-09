# Powerhouse Learning Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Make-independent closed-loop social/content learning engine that ingests immutable outcomes, evaluates posts at 24/48/72 hours, promotes evidence-bounded component learnings into BRAIN context, and verifies whether those learnings improve later posts.

**Architecture:** Reuse the existing BRAIN event ingress as audit/idempotency boundary. Add pure deterministic domain logic plus a Supabase-compatible persistence adapter and Netlify function entrypoints. Keep Make only as an optional compatibility source, never as scheduler, learner, projection authority, or reconciliation layer.

**Tech Stack:** Node.js ESM, `node:test`, Netlify Functions, existing BRAIN event store, REST/Supabase gateway pattern, JSON Schema/config, GitHub Actions/BRAIN delivery gates.

**Spec:** `docs/superpowers/specs/2026-09-09-powerhouse-learning-engine-design.md`

## Global Constraints
- `BRAIN-DELIVERY-v2`, shared-context read/writeback, outcome obligations and green-until-done remain binding.
- Production code is added only after a failing test for that behavior is observed in CI.
- Metric priority: revenue/orders > offers > qualified leads/meetings/DM > substantive interaction > CTR/engagement > reach/likes.
- Missing data is never converted to zero.
- Learning v1 promotion default: sample size >= 5, >= 2 publication dates, confidence >= 0.75, stable direction, no contradictory higher-priority outcome.
- Default exploration target is 20% over a rolling window; exploitation target is 80%.
- Make is not required for evaluation scheduling, learning derivation, lifecycle state, BRAIN projection, or application reconciliation.

---

### Task 1: Contracts and pure domain model

**Files:**
- Create: `config/social-learning-engine.json`
- Create: `brain/contracts/social-learning-event.schema.json`
- Create: `tests/social-learning-model.test.mjs`
- Create after RED: `netlify/functions/_social-learning-model.mjs`

**Interfaces:**
- Produces `normalizeMetricSnapshot(payload)`, `metricVector(snapshot)`, `selectEvaluationWindow({publishedAt, observedAt, windows})`, `buildCohort(posts, target)`, `evaluateLearningCandidate(input, config)`, `transitionLearningState(current, evidence, config)`, `chooseDecisionMode(history, config)`.

- [ ] Write tests for missing-vs-zero semantics, 24/48/72 window identity, normalized rates, metric-priority conflict handling, promotion thresholds, weakening/retirement, and 80/20 rolling decision mode.
- [ ] Commit tests only.
- [ ] Open PR and confirm the new tests fail because `_social-learning-model.mjs` does not exist.
- [ ] Implement the minimal pure domain functions.
- [ ] Re-run CI and confirm the focused tests pass.
- [ ] Commit production model/config/schema.

### Task 2: Persistence and immutable snapshots

**Files:**
- Create: `tests/social-learning-store.test.mjs`
- Create after RED: `netlify/functions/_social-learning-store.mjs`

**Interfaces:**
- Produces `createSocialLearningStore({fetchFn, baseUrl, serviceToken})` with `putPost`, `appendSnapshot`, `getPost`, `listDuePosts`, `putEvaluation`, `upsertLearning`, `listCurrentLearnings`, `recordApplication`, `reconcileApplication`, `getProjection`, `putProjection`.

- [ ] Write tests proving append-only snapshot behavior, deterministic idempotency keys, conflict rejection and last-known-good projection behavior using an injected fake fetch.
- [ ] Commit tests only and observe RED in CI.
- [ ] Implement the adapter using the existing Supabase gateway style and no embedded credentials.
- [ ] Confirm focused and regression tests green.
- [ ] Commit store implementation.

### Task 3: Outcome ingest

**Files:**
- Create: `tests/social-outcome-ingest.test.mjs`
- Create after RED: `netlify/functions/social-outcome-ingest.mjs`

**Interfaces:**
- POST normalized outcome event; validate identity/provenance; persist audit event first; append analytical snapshot second; return stable event/post identifiers.

- [ ] Test valid ingest, duplicate ingest, conflicting event identity, invalid/partial payload, and explicit zero metrics.
- [ ] Commit RED tests and observe CI failure.
- [ ] Implement handler with dependency injection for event/store adapters where testability requires it.
- [ ] Confirm green and commit.

### Task 4: 24/48/72 evaluator and learning lifecycle

**Files:**
- Create: `tests/social-learning-evaluate.test.mjs`
- Create after RED: `netlify/functions/social-learning-evaluate.mjs`

**Interfaces:**
- `runEvaluation({store, now, config})` lists due posts, evaluates each due window idempotently, creates/updates candidate learnings, reconciles applied learnings, and reports missed obligations without synthesizing zeroes.

- [ ] Test exact evaluation identities, rerun idempotency, relevant cohort selection, no-learning-on-missing-data, promotion and demotion, and reconciliation of `actual_effect`.
- [ ] Commit RED tests and observe CI failure.
- [ ] Implement deterministic evaluator.
- [ ] Confirm green and commit.

### Task 5: BRAIN projection and decision accountability

**Files:**
- Create: `tests/social-learning-context.test.mjs`
- Create after RED: `netlify/functions/social-learning-context.mjs`

**Interfaces:**
- GET returns bounded relevant current learning projection.
- POST decision record persists considered/applied learning IDs and exploration hypothesis.

- [ ] Test bounded projection, exclusion of retired/low-confidence claims, contextual relevance ordering, stable last-known-good fallback, and application recording.
- [ ] Commit RED tests and observe failure.
- [ ] Implement projection/decision endpoint.
- [ ] Confirm green and commit.

### Task 6: Native scheduler and BRAIN/production contracts

**Files:**
- Modify: `netlify.toml`
- Create: `tests/social-learning-schedule-contract.test.mjs`
- Modify/create only where existing BRAIN registration conventions require: delivery/component registry files discovered from the repo.

**Interfaces:**
- Schedule `social-learning-evaluate` natively; no Make dependency.

- [ ] Add a contract test that fails until a native scheduled function is configured and Make is absent from required runtime dependencies.
- [ ] Observe RED.
- [ ] Add Netlify schedule and BRAIN delivery registration following existing repository patterns.
- [ ] Confirm green and commit.

### Task 7: Compatibility/shadow migration

**Files:**
- Create: `tests/social-learning-compatibility.test.mjs`
- Modify minimal existing BRAIN projection/content-decision reader only if needed after discovery.

**Interfaces:**
- Existing Make-sourced events may enter through the same normalized contract; content decisioning consumes the native projection and records `learning_id` applications.

- [ ] Test that Make-style forwarded payloads normalize to the same canonical event and that pausing Make cannot block evaluator/projection code paths.
- [ ] Observe RED.
- [ ] Add smallest compatibility adapter and native projection read/application write hook.
- [ ] Confirm green and commit.

### Task 8: End-to-end canary and release evidence

**Files:**
- Create: `tests/social-learning-e2e.test.mjs`
- Modify relevant release-evidence/required-test manifest only according to existing repo conventions.

**Interfaces:**
- Canary proves `post -> outcome -> snapshot -> evaluation -> learning/projection -> application -> later outcome verification`.

- [ ] Write E2E test first and observe RED.
- [ ] Wire existing components minimally until E2E green.
- [ ] Run BRAIN chat-learning preflight and all required CI/release gates.
- [ ] Create/update PR, inspect failures, fix root causes, and rerun until green or a hard boundary is proven.
- [ ] Only after all required checks and exact-SHA evidence are green, merge through the existing production authority and verify production readback.
- [ ] Write material outcome/prevention learning back to shared BRAIN context.
