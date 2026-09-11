# Company Decision Engine v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one closed, auditable company operating system in which Portal V2, Brain, Powerhouse, Supabase, GitHub and Notion share the same decision truth, update each other, and expose who did what, when, under which approval, at what cost, with what expected and realized value.

**Architecture:** Extend the existing Brain decision primitives rather than create a second brain. Normalize evidence and intervention candidates into one canonical Decision object, persist decision/audit/value state in Supabase, project it through `/api/brain-operating-loop`, render the same projection in Portal V2 and Notion, and close every action with outcome, realized value, learning and reprioritization. Deterministic calculations remain authoritative for hard figures; AI is used for synthesis, explanation and hypotheses only under the existing governance rules.

**Tech Stack:** Node.js ES modules, existing Brain/Powerhouse modules, Netlify Functions, Supabase/Postgres, Portal V2 vanilla JS modules, Notion API integration, GitHub Actions/CI.

**Spec:** `docs/superpowers/specs/2026-09-11-company-decision-engine-v1-design.md`

## Global Constraints

- Supabase/Brain remains the canonical runtime truth.
- Reuse `brain/decision/score.mjs`, `policy.mjs` and calibration; do not introduce a competing score engine.
- No Make dependency in the critical decision path.
- No LLM-generated hard financial figures without deterministic provenance.
- Portal V2 and Notion are projections of the same canonical Decision objects.
- Missing data stays missing; never fall back to demo data.
- Every mutation records actor, timestamp, source, approval state, evidence, cost and value metadata.
- Tenant identity for writes is server-derived.
- `done`, `live`, `fixed` and `verified` require production/readback evidence.

---

### Task 1: Canonical decision contracts and dependency-aware portfolio

**Files:**
- Create: `brain/decision/contracts.mjs`
- Create: `brain/decision/company-engine.mjs`
- Modify: `brain/decision/portfolio.mjs`
- Test: `brain/decision/company-engine.test.mjs`

**Interfaces:**
- Consumes: `decide(candidate)` from `brain/decision/policy.mjs`; `scoreCandidate(candidate)` transitively through `decide()`.
- Produces: `normalizeEvidence(input)`, `normalizeCandidate(input)`, `buildDecision(candidate, context)`, `rankCompanyPortfolio(candidates, context)`.

- [ ] **Step 1: Write the failing tests** for evidence normalization, stale/unverified evidence, dependency ordering, cycle blocking, portfolio buckets (`NOW`, `NEXT`, `LATER`, `DO_NOT_DO`), human-readable reasons and stable dedupe keys.
- [ ] **Step 2: Run `node --test brain/decision/company-engine.test.mjs` and verify RED** because the new module does not exist.
- [ ] **Step 3: Implement contracts and the minimal engine**. Dependency ordering must be deterministic; cycles produce `blocked_by: DEPENDENCY_CYCLE` instead of silently reordering.
- [ ] **Step 4: Run the test and verify GREEN** plus existing decision tests.
- [ ] **Step 5: Commit** `feat(brain): add canonical company decision engine`.

### Task 2: Unified action/audit/value ledger model

**Files:**
- Create: `platform/contracts/company-decision-ledger.mjs`
- Create: `platform/read-models/company-decision-read-model.mjs`
- Create: `platform/migrations/20260911_company_decision_ledger.sql`
- Test: `platform/read-models/company-decision-read-model.test.mjs`

**Interfaces:**
- Consumes: canonical Decision objects from Task 1.
- Produces: rows/read model for decisions, approvals, actions, costs, expected value, realized value and actor history.

- [ ] **Step 1: Write failing tests** asserting every event exposes `actor`, `actor_type`, `occurred_at`, `source_system`, `approval_state`, `approved_by`, `approved_at`, `cost_amount`, `expected_value`, `realized_value`, `currency`, `evidence_refs`, `correlation_id`, `dedupe_key`.
- [ ] **Step 2: Verify RED** with `node --test platform/read-models/company-decision-read-model.test.mjs`.
- [ ] **Step 3: Add migration** with tenant-scoped tables for decisions, decision_events, approvals and value measurements, unique dedupe constraints and append-only event history.
- [ ] **Step 4: Implement read model** returning timeline, approvals, economics and latest state without hiding history.
- [ ] **Step 5: Verify GREEN** and commit `feat(platform): add decision audit and value ledger`.

### Task 3: Brain operating-loop integration

**Files:**
- Modify: function/module serving `/api/brain-operating-loop`
- Create: `platform/brain/company-decision-projection.mjs`
- Test: `platform/brain/company-decision-projection.test.mjs`

**Interfaces:**
- Consumes: decision ledger read model and existing whole-brain projection.
- Produces: `executiveCockpit.companyDecisions`, `priorityPortfolio`, `decisionEconomics`, `approvalQueue`, `auditTimeline`.

- [ ] **Step 1: Write failing projection tests** for NOW/NEXT/LATER/DO_NOT_DO, approvals, cost/profit and actor timeline.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement projection adapter**; do not recompute scores in the UI layer.
- [ ] **Step 4: Add projection to `/api/brain-operating-loop`** while preserving existing response fields.
- [ ] **Step 5: Verify GREEN** and commit `feat(brain): project company decisions through operating loop`.

### Task 4: Portal V2 runtime state and source provenance

**Files:**
- Modify: `portal-v2/runtime-evidence.js`
- Create: `portal-v2/company-decisions.js`
- Test: `portal-v2/tests/company-decisions.test.mjs`

**Interfaces:**
- Consumes: fields added by Task 3.
- Produces: `portal.runtime.decisions`, `portal.runtime.approvals`, `portal.runtime.economics`, `portal.runtime.timeline`, `portal.runtime.provenance`.

- [ ] **Step 1: Write failing tests** proving mapping is lossless for score, rank, bucket, reasons, approval, actor, costs, expected/realized value and evidence refs.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Extend runtime mapper**; absent backend data remains empty.
- [ ] **Step 4: Add selectors** for top priorities, approval-needed, blocked dependencies and value leakage.
- [ ] **Step 5: Verify GREEN** and commit `feat(portal): connect decision runtime state`.

### Task 5: Simple executive cockpit and interactive priority workflow

**Files:**
- Modify: existing Portal V2 page registry/page metrics/page visuals modules
- Create: `portal-v2/company-cockpit.js`
- Test: `portal-v2/tests/company-cockpit.test.mjs`

**Interfaces:**
- Consumes: Task 4 selectors.
- Produces: directie-overview cards and interactive decision detail model.

- [ ] **Step 1: Write failing tests** for sections `Bedrijf nu`, `Wat moet eerst`, `Goedkeuring nodig`, `Kosten en opbrengst`, `Geblokkeerd`, `Wie deed wat`.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Build one clear cockpit model**: NOW/NEXT/LATER/DO_NOT_DO, each item showing why, evidence/confidence, owner, dependency, investment, time, expected value, realized value and next action.
- [ ] **Step 4: Wire interactions** for filtering, expanding evidence/reason chain and viewing actor history without creating alternate state.
- [ ] **Step 5: Verify GREEN** and commit `feat(portal): add company decision cockpit`.

### Task 6: Approval workflow and mutation API

**Files:**
- Create: `netlify/functions/company-decision.mjs`
- Create/modify: server-side Supabase store module for decision mutations
- Test: `netlify/functions/company-decision.test.mjs`

**Interfaces:**
- Consumes: server-derived tenant/session identity and ledger tables.
- Produces: approve/reject/assign/start/complete/record-outcome mutations with append-only audit events.

- [ ] **Step 1: Write failing API tests** for unauthorized, wrong tenant, approve, reject, assign owner, record actual cost, complete and outcome writeback.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement fail-closed mutation API** with idempotency key and optimistic version check.
- [ ] **Step 4: Ensure every mutation emits decision_event and Brain evidence/writeback**.
- [ ] **Step 5: Verify GREEN** and commit `feat(api): add auditable company decision mutations`.

### Task 7: Economics and realized-value reconciliation

**Files:**
- Create: `brain/economics/company-value.mjs`
- Test: `brain/economics/company-value.test.mjs`
- Modify: Task 1 engine and Task 3 projection as needed.

**Interfaces:**
- Consumes: deterministic baseline, investment, actual cost, duration, realized outcome.
- Produces: `expected_value`, `net_expected_value`, `payback_months`, `realized_value`, `realized_profit`, `variance`, `confidence_adjusted_value`.

- [ ] **Step 1: Write failing economics tests** including zero/missing data, negative value and partial outcome.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement pure deterministic functions**; no AI calls.
- [ ] **Step 4: Feed economics into portfolio and projection**.
- [ ] **Step 5: Verify GREEN** and commit `feat(brain): reconcile expected and realized company value`.

### Task 8: Learning and reprioritization loop

**Files:**
- Create: `brain/learning/company-decision-learning.mjs`
- Test: `brain/learning/company-decision-learning.test.mjs`
- Modify: existing calibration integration as required.

**Interfaces:**
- Consumes: prediction + actual outcome + evidence quality.
- Produces: calibration event, learning record, adjusted confidence/priors and reprioritization signal.

- [ ] **Step 1: Write failing tests** proving an overestimated intervention lowers future calibrated confidence and a verified positive outcome can raise it within existing calibration bounds.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement adapter around existing calibration**; do not create a separate learning formula.
- [ ] **Step 4: Emit next-decision signal and update portfolio projection**.
- [ ] **Step 5: Verify GREEN** and commit `feat(brain): close outcome learning and reprioritization loop`.

### Task 9: Portal interaction telemetry into Brain

**Files:**
- Modify: `assets/meting.js` or create Portal-safe equivalent
- Create: `portal-v2/telemetry.js`
- Modify: ingestion endpoint to accept portal events without sensitive form values
- Test: `portal-v2/tests/telemetry.test.mjs`

**Interfaces:**
- Consumes: route, interaction type, decision id, action id, anonymous/session-safe identifiers.
- Produces: privacy-low events connected to decision/evidence graph.

- [ ] **Step 1: Write failing tests** proving no field values/PII payloads are sent and events can carry decision/action correlation IDs.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement Portal V2 page/expand/filter/approve/start/complete interaction telemetry**.
- [ ] **Step 4: Connect events to Brain outcome/usage evidence without changing decision truth directly**.
- [ ] **Step 5: Verify GREEN** and commit `feat(portal): feed interaction evidence into brain`.

### Task 10: Notion projection and readback contract

**Files:**
- Modify: native Notion sync Edge Function/source in repo
- Create: `platform/integrations/notion/company-decision-projection.mjs`
- Test: `platform/integrations/notion/company-decision-projection.test.mjs`

**Interfaces:**
- Consumes: canonical company decision projection.
- Produces: idempotent Notion executive projection with fingerprint and readback status.

- [ ] **Step 1: Write failing tests** for stable page keys, idempotency, status, rank, owner, approval, costs/value, actor timeline summary and `last_synced_at`.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement projection**; Notion never recomputes score/value.
- [ ] **Step 4: Implement write then fetch/readback evidence**; 404/auth becomes explicit open obligation.
- [ ] **Step 5: Verify GREEN** and commit `feat(notion): project and verify company decisions`.

### Task 11: GitHub/release evidence into the same audit timeline

**Files:**
- Create: `platform/integrations/github/release-evidence.mjs`
- Modify: existing production/readback workflow or evidence writer
- Test: `platform/integrations/github/release-evidence.test.mjs`

**Interfaces:**
- Consumes: PR, commit SHA, workflow result, deploy/readback evidence.
- Produces: canonical action/event records linked to decisions/changes.

- [ ] **Step 1: Write failing tests** for PR author, approver, merge SHA, required checks, deploy ID, production readback, timestamps and linked decision id.
- [ ] **Step 2: Verify RED**.
- [ ] **Step 3: Implement normalized GitHub release evidence adapter**.
- [ ] **Step 4: Feed evidence to decision audit timeline** without treating merge as live proof.
- [ ] **Step 5: Verify GREEN** and commit `feat(github): connect release evidence to company audit trail`.

### Task 12: Cross-system integration and regression gate

**Files:**
- Create: `tests/company-operating-system-e2e.test.mjs`
- Modify: CI workflow required test matrix if needed.

**Interfaces:**
- Consumes: Tasks 1–11.
- Produces: one executable proof of the closed loop.

- [ ] **Step 1: Write the full end-to-end test**: company input changes → deterministic metric changes → finding/candidate changes → portfolio rank changes → approval is recorded → action completion records actual cost/outcome → realized value changes → learning/calibration event appears → reprioritized next decision appears → Portal and Notion projection read the same IDs/values → audit timeline identifies actor/time/source.
- [ ] **Step 2: Add negative E2E cases** for missing data, stale external evidence, dependency cycle, unauthorized tenant and Notion auth/readback failure.
- [ ] **Step 3: Run all focused suites and the existing Portal/Brain regression suites**.
- [ ] **Step 4: Add/strengthen required CI gate** so the integrated E2E test cannot be skipped.
- [ ] **Step 5: Commit** `test: gate the complete company operating system loop`.

### Task 13: Production promotion and exact readback

**Files:**
- No feature code unless a production-only defect is found.
- Update canonical Brain/Notion release evidence after successful production proof.

**Interfaces:**
- Consumes: exact PR head SHA and CI evidence.
- Produces: exact merge SHA, Netlify deploy identity, Portal V2 production readback, API readback and Notion sync/readback evidence.

- [ ] **Step 1: Confirm all required checks green on one exact SHA**.
- [ ] **Step 2: Merge through protected main**.
- [ ] **Step 3: Confirm Netlify production serves exact merge SHA**.
- [ ] **Step 4: Execute Portal V2 production checks on desktop/mobile plus API/readback and representative interactive actions**.
- [ ] **Step 5: Execute Notion write/readback if credentials/access are valid; otherwise record one deduplicated external blocker and do not claim that lane LIVE**.
- [ ] **Step 6: Write production evidence and learning back to canonical Brain/Powerhouse/Notion registers**.

## Self-review

- Spec coverage: evidence, graph/dependencies, scoring/policy, portfolio, approvals, action history, costs/value, Portal, Notion, GitHub, telemetry, learning and production proof are each mapped to a task.
- No second Brain or UI-owned score path is introduced.
- All hard financial values remain deterministic and provenance-backed.
- Cross-system IDs and correlation/dedupe keys are carried through all projections.
- Missing or stale evidence fails closed to empty/research/watch rather than fabricated certainty.
