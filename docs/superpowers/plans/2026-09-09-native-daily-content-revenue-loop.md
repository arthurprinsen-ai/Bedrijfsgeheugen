# Native Daily Content Revenue Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish exactly one production-verified blog every Europe/Amsterdam calendar day without Make and use attributable blog/social outcomes through orders and revenue to improve future content decisions.

**Architecture:** Extend the existing SEO-to-order/growth-event and BRAIN v2 delivery contracts with a deterministic content-growth layer. GitHub Actions schedules selection, learning and live watchdog jobs; deterministic Node modules own date/idempotency/attribution/ranking; publishing still travels through candidate PR and production authority, never direct main writes.

**Tech Stack:** GitHub Actions, Node.js 24 ES modules, Node test runner, existing Netlify growth-event endpoint, existing BRAIN v2 writer candidate/release machinery, static JSON policy/state artifacts.

**Spec:** `docs/superpowers/specs/2026-09-09-native-daily-content-revenue-loop-design.md`

## Global Constraints

- No Make dependency in the production blog publication path.
- Exactly one canonical daily blog per `Europe/Amsterdam` calendar date.
- A day closes only after exact production HTTP/readback proof.
- Candidate-only BRAIN v2 delivery; no direct push/merge to `main` from publisher workflows.
- Re-runs resume the same `content_id`; they never select a second item for the same date.
- Commercial outcome precedence: realized revenue/order > qualified opportunity/lead > conversion/CTA > site visit/click > engagement > reach.
- Revenue/order totals must not be double-counted across first/last/assisted touch evidence.
- Learning horizons are T+1, T+3, T+7, T+30 plus later final commercial outcomes.
- Default policy uses 80% exploit / 20% explore and must be versioned/configurable.
- Missing evidence must never be fabricated; low-support data falls back to policy defaults.

---

### Task 1: Lock deterministic daily-publication state contracts

**Files:**
- Create: `tests/content-growth-daily-blog.test.mjs`
- Create: `tools/content-growth/daily-blog.mjs`
- Create: `config/content-growth-policy.json`
- Create: `data/content-publication-ledger.json`

**Interfaces:**
- Produces: `businessDate(now, timeZone) -> YYYY-MM-DD`, `resolveDailyPublication({date, ledger, candidates, learning, policy}) -> decision`, `transitionLedger(record,event) -> record`.
- Decision types: `NO_ACTION_LIVE`, `RESUME_EXISTING`, `SELECT_CANDIDATE`, `NO_ELIGIBLE_DAILY_BLOG`.

- [ ] **Step 1: Write failing tests** for Europe/Amsterdam midnight/DST boundaries, empty-ledger selection, live idempotency, incomplete resume, exact-one candidate, deterministic tie-breaking and no-eligible failure.
- [ ] **Step 2: Run** `node --test tests/content-growth-daily-blog.test.mjs` and verify RED.
- [ ] **Step 3: Implement minimal deterministic module** with no network calls and explicit schema validation.
- [ ] **Step 4: Add policy** with `timeZone: Europe/Amsterdam`, `explorationRatio: 0.20`, commercial weights and horizon days `[1,3,7,30]`; initialize ledger as `{ "version": 1, "days": {} }`.
- [ ] **Step 5: Run** `node --test tests/content-growth-daily-blog.test.mjs` and verify GREEN.
- [ ] **Step 6: Commit** `feat: add deterministic daily blog state contract`.

### Task 2: Add attribution and commercial scoring without double counting

**Files:**
- Create: `tests/content-growth-attribution.test.mjs`
- Create: `tools/content-growth/aggregate.mjs`
- Modify only as required: `netlify/functions/growth-event.mjs`
- Modify only as required: existing growth/SEO config files to accept `content_id`, `content_type`, channel and attribution metadata.

**Interfaces:**
- Consumes normalized growth events.
- Produces: `aggregateContentPerformance(events, policy) -> {content, commercialTotals, attribution}`.
- Canonical order/revenue total keyed by unique order/event id; first-touch/last-touch/assisted are evidence fields, not duplicate totals.

- [ ] **Step 1: Write failing tests** for normalized content ids, revenue dedupe, first/last/assisted evidence, commercial weighting, low-value engagement not outranking attributed orders, and PII-independent opaque correlation ids.
- [ ] **Step 2: Run** `node --test tests/content-growth-attribution.test.mjs` and verify RED.
- [ ] **Step 3: Implement minimal aggregator** and only extend the existing endpoint/config where schema acceptance is missing.
- [ ] **Step 4: Run** attribution tests plus existing `tests/seo-growth-*.test.mjs tests/seo-order-*.test.mjs` and verify GREEN.
- [ ] **Step 5: Commit** `feat: connect content attribution to commercial outcomes`.

### Task 3: Materialize bounded multi-horizon learning context

**Files:**
- Create: `tests/content-growth-learning.test.mjs`
- Create: `tools/content-growth/learning.mjs`
- Create: `data/content-growth-learning.json`

**Interfaces:**
- Consumes: aggregate output from Task 2 and policy from Task 1.
- Produces: `buildLearningContext({performance, now, policy}) -> LearningContextV1` and `rankCandidates({candidates, learning, policy, date})`.
- LearningContextV1 fields include generated_at, source_window, horizons, top/bottom themes/hooks/ctas/formats/funnel_stages/segments, failure_diagnoses, exploit_candidates, exploration_hypotheses, confidence/support.

- [ ] **Step 1: Write failing tests** for T+1/T+3/T+7/T+30 inclusion, later order updates, failure diagnoses, sparse-data fallback, deterministic ranking and 80/20 exploration behavior over a stable sequence.
- [ ] **Step 2: Run** `node --test tests/content-growth-learning.test.mjs` and verify RED.
- [ ] **Step 3: Implement learning/ranking** with support/confidence guards and no invented revenue.
- [ ] **Step 4: Initialize generated artifact** as valid empty LearningContextV1.
- [ ] **Step 5: Run** all content-growth tests and verify GREEN.
- [ ] **Step 6: Commit** `feat: learn content decisions from revenue evidence`.

### Task 4: Build repo-native daily blog publisher workflow

**Files:**
- Create: `.github/workflows/daily-blog-publisher.yml`
- Create: `tests/content-growth-workflows.test.mjs`
- Reuse/call: `scripts/publish_approved_blog_v2.py`, `scripts/ci/repo-writer-candidate.mjs` and existing approved-central/BRAIN delivery conventions.

**Interfaces:**
- Schedule daily via UTC cron chosen to reliably map to a morning Europe/Amsterdam execution; business date is always resolved in code using `Europe/Amsterdam` rather than inferred from cron UTC date.
- Manual `workflow_dispatch` supports optional business date / slug for deterministic recovery.
- Produces one candidate branch/PR and ledger candidate evidence; never direct main push.

- [ ] **Step 1: Write workflow contract test** asserting daily schedule, manual dispatch, concurrency group, no Make calls, candidate-only delivery, call to deterministic selector, exact changed-file allowlist, no direct main push, and ledger update tied to same content_id/date.
- [ ] **Step 2: Run** workflow test and verify RED.
- [ ] **Step 3: Implement workflow** based on existing approved-central-blog candidate mechanics, replacing repeated orchestration with calls into Task 1/3 modules.
- [ ] **Step 4: Add verification mode** using local fixture only; it must never publish fixture content.
- [ ] **Step 5: Run** workflow/content-growth tests and verify GREEN.
- [ ] **Step 6: Commit** `feat: schedule one native daily blog candidate`.

### Task 5: Build scheduled learning workflow for blogs and social posts

**Files:**
- Create: `.github/workflows/content-growth-learning.yml`
- Extend: `tests/content-growth-workflows.test.mjs`

**Interfaces:**
- Scheduled daily plus manual dispatch.
- Reads bounded growth evidence already available to the repo/runtime, runs aggregate + learning modules, and updates only the generated learning artifact through candidate/review-safe repo writing where a repo write is required.
- Must recognize `blog`, `linkedin` and `social` content types using the same content_id model.

- [ ] **Step 1: Add failing workflow assertions** for schedule, three content types, aggregate->learning invocation, bounded artifact output and no publish permissions.
- [ ] **Step 2: Run** workflow test and verify RED.
- [ ] **Step 3: Implement workflow** with least privilege and deterministic artifact generation.
- [ ] **Step 4: Run** all content-growth tests plus existing SEO growth/order tests and verify GREEN.
- [ ] **Step 5: Commit** `feat: schedule cross-channel revenue learning`.

### Task 6: Add exact production live readback and daily watchdog

**Files:**
- Create: `tests/content-growth-live-readback.test.mjs`
- Create: `tools/content-growth/live-readback.mjs`
- Create: `.github/workflows/daily-blog-live-watchdog.yml`
- Extend: `tests/content-growth-workflows.test.mjs`

**Interfaces:**
- `verifyLivePublication({html,status,url,contentId,slug}) -> proof` validates HTTP 200, exact canonical, content_id marker and article metadata.
- Watchdog resolves today's Europe/Amsterdam ledger record, requires `state=live`, and may reconcile a matching deployed candidate; it never selects a second candidate.

- [ ] **Step 1: Write failing readback/workflow tests** for 200/canonical/content marker, stale/wrong content, missing live state and no duplicate selection.
- [ ] **Step 2: Run** targeted tests and verify RED.
- [ ] **Step 3: Implement readback module and watchdog** with cache-busting and bounded retries.
- [ ] **Step 4: Wire production-proof handoff** so only successful exact readback transitions ledger state to `live`.
- [ ] **Step 5: Run** all content-growth tests and verify GREEN.
- [ ] **Step 6: Commit** `feat: prove daily blog publication in production`.

### Task 7: Integrate content_id instrumentation with generated blogs/social contracts

**Files:**
- Modify only the canonical blog renderer/template path discovered in repo so each new article emits a stable content_id marker and growth metadata.
- Modify the native social/LinkedIn publisher contract if it lacks content_id propagation.
- Create/extend: `tests/content-growth-instrumentation.test.mjs`.

**Interfaces:**
- Stable content id format: `blog:<slug>` for canonical blog articles unless an existing stronger repository identity contract is already present; social uses its existing persistent record id mapped to content_id.

- [ ] **Step 1: Locate canonical render/instrumentation points** and write failing tests against those exact files/functions.
- [ ] **Step 2: Run** instrumentation tests and verify RED.
- [ ] **Step 3: Add minimal markers/metadata** without changing visual content or existing canonicals.
- [ ] **Step 4: Run** instrumentation + SEO/order/growth + blog technical tests and verify GREEN.
- [ ] **Step 5: Commit** `feat: correlate blogs and posts with growth outcomes`.

### Task 8: Full regression, candidate PR, merge and production proof

**Files:** none expected beyond fixes required by failing gates.

**Interfaces:** exact branch HEAD -> PR HEAD -> merge SHA -> deployed SHA -> live canonical URL evidence.

- [ ] **Step 1: Run targeted suite**: `node --test tests/content-growth-*.test.mjs tests/seo-growth-*.test.mjs tests/seo-order-*.test.mjs` plus repository blog/SEO technical checks.
- [ ] **Step 2: Run repository Required/full relevant regression** exactly as existing release contracts prescribe; fix root causes on branch if red.
- [ ] **Step 3: Open PR** from `feat/native-daily-content-revenue-loop-20260909` to `main` with exact scope/evidence.
- [ ] **Step 4: Wait only through active tool polling in this turn, inspect every required check, and merge only when green and branch identity is exact.
- [ ] **Step 5: Verify main/merge SHA** and production deployment/readback; do not claim live until the deployed production SHA and daily publisher workflows/contracts are present.
- [ ] **Step 6: Trigger/reconcile today's native daily publication** if no live blog exists for the current Europe/Amsterdam business date; otherwise record/prove today's existing qualifying publication and leave tomorrow's schedule armed.
- [ ] **Step 7: Verify exact live blog URL** returns 200 with expected canonical/content_id, and verify watchdog contract sees the date as live.
- [ ] **Step 8: Record final evidence** in the PR/repo operational evidence path already used by BRAIN; final report includes merge SHA, deploy/readback proof, today's content_id/slug and next scheduled native run.
