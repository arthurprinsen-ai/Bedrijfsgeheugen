# Shared Team Memory & Opportunity Intelligence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one shared agent memory that powers self-healing, continuous optimization and evidence-led opportunity discovery across GitHub, Netlify, Make, Notion, SEO, website behavior and external market signals.

**Architecture:** Keep specialist agents separate but force them through one shared context/read path and one material outcome/write path. Add a deterministic Opportunity Scout that normalizes and scores external/internal signals, routes qualified opportunities to one owner agent, and only permits reversible preview experiments with baselines, success metrics and rollback.

**Tech Stack:** GitHub Actions/repo docs, Netlify previews, Make scenarios BG165–BG168, Notion/Powerhouse learning store, private Make Data Store, JavaScript/JSON contracts, existing repo validators/tests.

**Spec:** `docs/superpowers/specs/2026-08-28-shared-agent-memory-design.md`

## Global Constraints

- `main`/productie is never changed autonomously.
- Secrets, credentials, permissions and security controls are never autonomously weakened or changed.
- No destructive/onherroepelijke data mutation.
- No autonomous increase of paid external resources/subscriptions.
- Every safe repair follows detect → evidence → root cause → regression gate → minimal repair → verify → preview deploy → exact deploy verification → learn → prevention.
- Every opportunity follows observe → dedupe → qualify → baseline → hypothesis → minimal preview experiment → verify → compare → keep/rollback → learn → distribute.
- Max two identical retries without new information.
- One stable fingerprint per error/opportunity/experiment prevents duplicate or conflicting agent work.
- AI is not used when deterministic filtering/scoring can decide the route.

---

### Task 1: Extend the repo agent contract for one-team memory and opportunity execution

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/self-healing-agents.md`
- Modify: `docs/development-ledger.md`
- Test: existing documentation/contract validators, plus a new grep/assertion gate if none exists

**Interfaces:**
- Consumes: shared design contract from the spec.
- Produces: mandatory policy text used by all current and future repo agents.

- [ ] **Step 1: Add a failing contract check**

Create or extend the existing contract test so it asserts that `AGENTS.md` contains all of these exact concepts: `shared team context`, `material outcome writeback`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `owner agent`, `baseline`, `rollback`, `preview experiment`.

- [ ] **Step 2: Run the contract check and verify failure**

Expected: FAIL because the current contract describes self-healing but not the full opportunity loop.

- [ ] **Step 3: Update the three normative documents**

Add the one-team memory rule, opportunity qualification rules, execution boundaries, ledger fields, and requirement that strong safe opportunities are tested rather than left as advice.

- [ ] **Step 4: Re-run the contract check**

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `docs: require shared memory and opportunity execution`

---

### Task 2: Define the canonical learning/opportunity event schema

**Files:**
- Create: `config/team-learning-event.schema.json`
- Create: `tests/team-learning-event.test.mjs`

**Interfaces:**
- Consumes: events from GitHub, Netlify, Make, Notion, analytics, SEO and external source adapters.
- Produces: validated `learning_event` objects for BG168/BG166 and repo ledger writeback.

- [ ] **Step 1: Write failing schema tests**

Test valid `ERROR`, `RECOVERY`, `IMPROVEMENT`, `OPPORTUNITY`, `EXPERIMENT_RESULT`, `CONTRACT_CHANGE` events. Reject opportunities without `fingerprint`, `owner_agent`, `action`, `verification`, `rollback`; reject autonomous opportunity execution without evidence/business-impact fields.

- [ ] **Step 2: Run tests**

Expected: FAIL because the schema does not exist.

- [ ] **Step 3: Implement JSON Schema**

Require base fields and conditional fields for opportunity/experiment events. Scores are bounded: evidence/novelty/business impact `0..100`, confidence `0..1`.

- [ ] **Step 4: Run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: define shared team learning event schema`

---

### Task 3: Build deterministic fingerprinting and dedupe for errors, improvements and opportunities

**Files:**
- Create: `scripts/team-memory/fingerprint.mjs`
- Create: `tests/team-memory-fingerprint.test.mjs`

**Interfaces:**
- Consumes: normalized `learning_event`.
- Produces: `fingerprint`, `dedupe_key`, `state_hash`.

- [ ] **Step 1: Write failing tests**

Cover: identical SEO signal on same query/route dedupes; same error class/component dedupes; changed baseline/state produces a new experiment state; source URLs/timestamps alone do not create duplicates.

- [ ] **Step 2: Run tests**

Expected: FAIL.

- [ ] **Step 3: Implement stable canonicalization**

Hash semantic identifiers only: type, source category, component/entity/query/route, class, normalized problem/opportunity key. Keep commit/deploy/state hash separate.

- [ ] **Step 4: Run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: add stable team memory fingerprints`

---

### Task 4: Build the Opportunity Scout normalizer and scorer

**Files:**
- Create: `scripts/opportunity/opportunity-scout.mjs`
- Create: `config/opportunity-sources.json`
- Create: `tests/opportunity-scout.test.mjs`

**Interfaces:**
- Consumes: compact source records from SEO/search, website analytics, CRM/outcomes, market/competitor/news signals, cost/performance/security telemetry.
- Produces: `OPPORTUNITY` events with evidence, novelty, business impact, confidence, effort/risk, owner and execution class.

- [ ] **Step 1: Write failing qualification tests**

Cases: strong SEO query gap qualifies; single unverified competitor claim does not; recurring customer objection plus search demand qualifies; critical security signal preempts commercial opportunity; duplicate known experiment is rejected.

- [ ] **Step 2: Run tests**

Expected: FAIL.

- [ ] **Step 3: Implement deterministic first-pass scoring**

Use source quality, corroboration count, freshness, existing-memory match, potential impact and effort class. Do not call AI in this module.

- [ ] **Step 4: Implement owner routing**

SEO/content → Agent10/15 as appropriate; frontend behavior → Agent01/02; intelligence/data → Agent03/07; cost → Agent14; performance → Agent16; security/self-heal → Agent09/appropriate security guardian; architecture/cross-scope → Agent13; QA gate → Agent11; governance → Agent12.

- [ ] **Step 5: Run tests**

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: add deterministic opportunity scout`

---

### Task 5: Add safe experiment gating and KEEP/ROLLBACK decisions

**Files:**
- Create: `scripts/opportunity/experiment-gate.mjs`
- Create: `tests/opportunity-experiment-gate.test.mjs`

**Interfaces:**
- Consumes: qualified opportunity + baseline + preview result.
- Produces: `EXECUTE_PREVIEW`, `GOVERNED_REVIEW`, `BLOCKED_BOUNDARY`, `KEEP`, or `ROLLBACK`.

- [ ] **Step 1: Write failing tests**

Test: reversible CTA/layout/SEO metadata/performance changes may execute on preview; main/secrets/paid resources/destructive operations block; regression over protected metrics returns rollback; security critical finding blocks lower-priority commercial experiment.

- [ ] **Step 2: Run tests**

Expected: FAIL.

- [ ] **Step 3: Implement gate**

Autonomous execution requires preview-only, explicit rollback, defined metric, bounded blast radius and no forbidden boundary.

- [ ] **Step 4: Implement result comparison**

Compare post-result to baseline plus protected metrics. Improvement must not create material regression in security, correctness, performance or continuity.

- [ ] **Step 5: Run tests**

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: gate and evaluate opportunity experiments`

---

### Task 6: Extend development ledger tooling for errors and opportunities

**Files:**
- Create or modify: existing ledger writer under `scripts/` if present; otherwise create `scripts/team-memory/write-ledger.mjs`
- Modify: `docs/development-ledger.md`
- Test: `tests/team-memory-ledger.test.mjs`

**Interfaces:**
- Consumes: validated learning events.
- Produces: append-only compact ledger entries without secrets/PII.

- [ ] **Step 1: Write failing tests**

Assert dedupe, required fields, no secret-bearing keys, correct formatting for ERROR/IMPROVEMENT/OPPORTUNITY/EXPERIMENT_RESULT.

- [ ] **Step 2: Run tests**

Expected: FAIL.

- [ ] **Step 3: Implement writer**

Write date, type, fingerprint, evidence/rationale, owner, action, verification, rollback, result metric, commit/deploy and reusable lesson.

- [ ] **Step 4: Run tests**

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: persist shared errors improvements and opportunities`

---

### Task 7: Build the GitHub/Netlify → BG168 bridge payload

**Files:**
- Create: `scripts/team-memory/publish-learning-event.mjs`
- Create: `tests/team-memory-publish.test.mjs`
- Modify: existing self-heal preview workflow/watch configuration on `automation/shared-agent-memory` only

**Interfaces:**
- Consumes: validated/deduped learning event.
- Produces: compact request to the existing Powerhouse learning intake; if remote intake unavailable, local ledger remains source and event stays retryable without duplicate creation.

- [ ] **Step 1: Write failing serialization/redaction tests**

Ensure no authorization/token/secret/cookie/password values leave the repo runtime. Bound payload length.

- [ ] **Step 2: Run tests**

Expected: FAIL.

- [ ] **Step 3: Implement compact publisher with fail-safe queue state**

No blind retries; max two identical retries without new information. Local ledger write succeeds independently of bridge availability.

- [ ] **Step 4: Wire self-heal material outcomes into publisher**

Healthy/no-action checks do not publish learning.

- [ ] **Step 5: Run tests**

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: bridge repo self healing into shared team memory`

---

### Task 8: Extend BG168/BG166/BG167 for opportunity events

**Systems:**
- Make BG168 — outcome classifier/router
- Make BG166 — durable learning writer
- Make BG167 — shared context builder/cache

**Interfaces:**
- Consumes: `OPPORTUNITY` and `EXPERIMENT_RESULT` learning events.
- Produces: persisted opportunity learning and bounded current opportunities in `team-context:latest`.

- [ ] **Step 1: Add classifier regression cases**

Verify improvement/opportunity/recovery/error are not cross-classified; healthy/weak signals are NO_MATERIAL_LEARNING.

- [ ] **Step 2: Extend BG168 deterministically**

Route opportunity types without invoking full multi-agent orchestration.

- [ ] **Step 3: Extend BG166 compact persistence fields**

Store scores, owner, experiment state and metric evidence without secrets/PII.

- [ ] **Step 4: Extend BG167 bounded context**

Expose only highest-priority/current opportunities plus recent lessons, with strict size cap and no live full scenario inventory read.

- [ ] **Step 5: Run cheap canaries**

Expected: OPPORTUNITY_DISPATCHED, EXPERIMENT_RESULT_LOGGED and refreshed context; no BG156 call for deterministic cases.

- [ ] **Step 6: Record before/after Make credits and data transfer**

Keep the context/learning path within the existing low-cost design; regressions require rollback.

---

### Task 9: Add daily continuous-improvement portfolio ranking

**Systems/Files:**
- Extend existing BG159/BG162 cost/performance portfolio path rather than creating another broad poller.
- Add compact opportunity portfolio representation to shared context.

**Interfaces:**
- Consumes: current known opportunities and daily cost/performance/security/SEO/site signals already available to the system.
- Produces: ranked daily candidates with one highest-value safe action per domain when evidence exists.

- [ ] **Step 1: Add ranking tests**

Security/continuity critical first; then high evidence × impact × confidence / effort. Duplicate/active experiment excluded.

- [ ] **Step 2: Reuse existing daily inventory/snapshot triggers**

Do not add another high-frequency polling scenario.

- [ ] **Step 3: Route each candidate to its specialist owner**

Only the minimal specialist path; full BG156 only for genuinely cross-domain/high-risk ambiguity.

- [ ] **Step 4: Persist result and refresh team context**

Every executed or rejected candidate becomes reusable learning.

- [ ] **Step 5: Measure cost/performance**

Target: lower or equal daily control-plane cost than a separate opportunity poller.

---

### Task 10: SEO and website-behavior opportunity adapters

**Files:**
- Create: `scripts/opportunity/adapters/seo.mjs`
- Create: `scripts/opportunity/adapters/web-behavior.mjs`
- Test: `tests/opportunity-seo.test.mjs`, `tests/opportunity-web-behavior.test.mjs`

**Interfaces:**
- Consumes: source-specific compact records supplied by connected analytics/search systems.
- Produces: normalized source records only; no business decision inside adapters.

- [ ] **Step 1: Write failing normalization tests**

SEO: query, URL, impressions, clicks/CTR, position, trend, crawl/index issue. Web: route, device, funnel step, CTA interaction, exit/error/performance indicators.

- [ ] **Step 2: Implement bounded adapters**

No raw session bodies or PII; aggregate metrics only.

- [ ] **Step 3: Run tests**

Expected: PASS.

- [ ] **Step 4: Commit**

Commit message: `feat: normalize seo and website opportunity signals`

---

### Task 11: External market/competitor/news opportunity adapter

**Files:**
- Create: `scripts/opportunity/adapters/external-market.mjs`
- Create: `tests/opportunity-external-market.test.mjs`

**Interfaces:**
- Consumes: compact public-source observations with source URL/type/date and extracted claim.
- Produces: normalized evidence items for Opportunity Scout.

- [ ] **Step 1: Write failing evidence tests**

One low-authority claim cannot auto-qualify; corroborated/fresh primary-source evidence scores higher; old/stale sources decay.

- [ ] **Step 2: Implement normalization and source-quality weighting**

Do not copy long copyrighted content; retain claim summary, source metadata and evidence hash.

- [ ] **Step 3: Run tests**

Expected: PASS.

- [ ] **Step 4: Commit**

Commit message: `feat: normalize external market opportunity evidence`

---

### Task 12: End-to-end preview opportunity canary

**Files/Systems:**
- Use `automation/shared-agent-memory` or a descendant preview branch.
- Netlify preview only.
- Development ledger + BG168/BG166/BG167.

**Interfaces:**
- Consumes: one genuine, low-risk qualified opportunity.
- Produces: measured experiment + shared learning visible to a subsequent agent.

- [ ] **Step 1: Select one genuine opportunity with bounded blast radius**

Prefer SEO metadata/internal linking, performance/caching, or non-destructive UI/CTA behavior that has a measurable baseline.

- [ ] **Step 2: Record baseline and fingerprint**

- [ ] **Step 3: Build the smallest preview-only experiment**

- [ ] **Step 4: Run regression/build/security checks**

- [ ] **Step 5: Deploy preview and verify exact commit**

- [ ] **Step 6: Measure result**

Return KEEP only if target metric improves without protected-metric regression; otherwise rollback.

- [ ] **Step 7: Verify cross-system learning**

Repo ledger contains the event/result; BG166 contains material learning; BG167 serves it in next shared context; a subsequent specialist agent can cite/reuse it.

- [ ] **Step 8: Commit evidence/doc updates**

Commit message: `test: prove shared opportunity learning loop`
