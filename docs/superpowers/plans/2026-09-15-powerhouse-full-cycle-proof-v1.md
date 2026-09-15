# Powerhouse Full-Cycle Proof v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the remaining valid Powerhouse deltas into one production-proven daily signal → decision → action → outcome → revenue → calibration loop with canonical learning/writeback.

**Architecture:** Extend only existing Powerhouse/Supabase/GitHub-native execution paths. First reconcile open PR deltas against current `main`; then add the smallest missing orchestration/health/revenue-learning controls, verify with fail-closed regression tests, merge through protected `main`, execute one real cycle, and write exact production evidence back into the existing Powerhouse lineage.

**Tech Stack:** GitHub Actions, SQL/PostgreSQL/Supabase, existing Edge Functions/runtime jobs, JavaScript/Node regression tests, Netlify, existing provider routes, Notion operational readback.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-full-cycle-proof-v1-design.md`

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No Make.
- No parallel CRM, brain, queue, calendar, analytics store, scheduler family, or learning system.
- Realized revenue is the primary reward; leading indicators remain distinct.
- Missing freshness, truth, identity, eligibility, dedupe/contact-pressure, or provider readback must fail closed.
- No `LIVE_PROVEN`/equivalent claim without exact production/provider readback.

---

### Task 1: Reconcile current main and open commercial-loop PRs

**Files:**
- Read/compare only first; modify the final canonical files selected by current-main structure.
- Relevant PRs: #1503, #1506, #1543, #1554, #1580.

**Interfaces:**
- Consumes: current `main` and exact diffs/heads of the five PRs.
- Produces: a delta matrix separating already-merged, still-valid, conflicting, and superseded changes.

- [ ] Fetch current `main` SHA and relevant canonical Powerhouse files.
- [ ] Fetch the five PR heads/diffs and classify each change against current main.
- [ ] Keep only missing valid deltas; reject duplicate/parallel storage or schedulers.
- [ ] Record consolidation evidence in the PR body/spec lineage.

### Task 2: Add failing full-cycle contract tests

**Files:**
- Test: use the repository's existing Powerhouse contract/regression test location discovered in Task 1.

**Interfaces:**
- Consumes: existing table/function/workflow names discovered in Task 1.
- Produces: fail-closed tests for full-cycle lineage, freshness, realized-revenue distinction, calibration, and cycle health.

- [ ] Add tests asserting one business-date cycle can link signal/evidence → forecast → action → outcome → calibration.
- [ ] Add tests asserting realized revenue is never synthesized from pipeline/engagement.
- [ ] Add tests asserting stale critical sources prevent green cycle health.
- [ ] Add tests asserting executed actions need provider/public readback before proven status.
- [ ] Add tests asserting reruns are idempotent and do not duplicate commercial actions.
- [ ] Run the narrow suite and confirm RED for the exact missing production behavior.

### Task 3: Implement the minimal canonical orchestration delta

**Files:**
- Modify only existing Powerhouse SQL/functions/workflows identified in Task 1.

**Interfaces:**
- Consumes: existing forecasts, sales actions, sales outcomes, calibration, runtime events, relationship/intelligence, publication obligations and failure-learning lineage.
- Produces: one idempotent business-date full-cycle run and machine-readable final health status.

- [ ] Extend the existing orchestrator/job rather than creating a scheduler family.
- [ ] Gate execution on canonical freshness/completeness.
- [ ] Preserve exact evidence lineage into forecasts and next-best-actions.
- [ ] Enforce identity/truth/contact-pressure/dedupe/provider-readback gates.
- [ ] Attribute outcomes/revenue only when observed.
- [ ] Invoke existing calibration path for due predictions.
- [ ] Emit final cycle-health runtime evidence.
- [ ] Run narrow tests and confirm GREEN.

### Task 4: Consolidate sales intelligence and relationship/offer learning

**Files:**
- Modify existing intelligence/NBA/relationship/experiment components discovered in Task 1.

**Interfaces:**
- Consumes: canonical relationship graph, company/person context, observed interactions, existing offers/experiments.
- Produces: evidence-backed buying-window score, next-best-action rationale, offer/experiment decision tied to the same cycle lineage.

- [ ] Reuse valid #1554 deltas that are not already on main.
- [ ] Ensure direct outreach remains fail-closed when expected value or destination evidence is insufficient.
- [ ] Feed non-response/hold/success back as outcomes rather than silently dropping them.
- [ ] Add/extend tests for buying-window/NBA evidence and offer-learning lineage.
- [ ] Run the relevant suite and confirm GREEN.

### Task 5: Normalize freshness and calibration cadence

**Files:**
- Modify only the existing source-health/calibration job and tests corresponding to #1580.

**Interfaces:**
- Consumes: existing source-health statuses and forecast-calibration obligations.
- Produces: canonical status normalization and same-day calibration without parallel scheduling.

- [ ] Reuse #1580 only where its delta is absent from current main.
- [ ] Normalize canonical imported analytics evidence without weakening freshness requirements.
- [ ] Reuse the existing forecast-calibrator schedule; do not create another scheduler.
- [ ] Add/retain regression tests for overdue same-day calibration and source-health casing.
- [ ] Run the relevant suite and confirm GREEN.

### Task 6: Executive full-cycle health/readback

**Files:**
- Modify existing health/cockpit view/function rather than creating a second cockpit.

**Interfaces:**
- Consumes: cycle runtime evidence, freshness, actions, provider proofs, outcomes, revenue, experiments, calibration and incidents.
- Produces: one daily fail-closed Powerhouse cycle status.

- [ ] Add/extend the existing health projection with freshness, decisions, actions, proofs, outcomes/revenue, experiment state, calibration and incidents.
- [ ] Ensure queued/intended actions cannot yield a green final state.
- [ ] Add regression tests for green/degraded/blocked outcomes.
- [ ] Run the relevant suite and confirm GREEN.

### Task 7: Protected delivery and exact production proof

**Files:**
- No new architecture; use existing GitHub/Netlify/Supabase delivery routes.

**Interfaces:**
- Consumes: candidate SHA with all tests green.
- Produces: protected-main merge plus exact production evidence.

- [ ] Push all implementation changes to `feat/powerhouse-full-cycle-proof-v1`.
- [ ] Open/update one consolidation PR to `main`.
- [ ] Wait for protected Required `test` and relevant BRAIN/delivery lanes on the exact head SHA.
- [ ] Merge only when gates are green.
- [ ] Read back current `main` and exact production deployment/runtime identity.

### Task 8: Execute one real full-cycle run and write learning back

**Files:**
- Runtime data only in existing canonical Powerhouse stores.

**Interfaces:**
- Consumes: deployed orchestrator and current live data.
- Produces: one real business-date cycle with action/outcome/calibration/health evidence and permanent learning.

- [ ] Trigger/use the existing production cycle route.
- [ ] Read back freshness and cycle start evidence.
- [ ] Read back generated forecast/decision/action lineage.
- [ ] Read back provider/public execution evidence for any executed action.
- [ ] Read back observed outcomes and realized-revenue fields without inventing missing revenue.
- [ ] Read back calibration and next-decision evidence.
- [ ] Write success/failure/hold evidence to existing runtime/failure-learning lineage.
- [ ] Mark final hard status only from observed production evidence.

### Task 9: Close superseded PRs and remove ambiguity

**Files:**
- GitHub metadata only.

**Interfaces:**
- Consumes: merged consolidation PR and delta matrix.
- Produces: one canonical current-main truth with no misleading open implementation branches.

- [ ] Close only PRs whose valid deltas are now proven present or explicitly superseded.
- [ ] Comment each closure with the consolidation PR/current-main evidence.
- [ ] Leave unrelated active work open.
- [ ] Final readback: current main, production, Powerhouse cycle evidence, and open PR set.
