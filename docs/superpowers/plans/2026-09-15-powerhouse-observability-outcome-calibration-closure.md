# Powerhouse Observability → Outcome → Calibration Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining Powerhouse evidence loop so real provider/runtime usage, observed costs, human feedback and commercial outcomes safely drive realized value, forecast calibration, Next Best Action and Portal V2.

**Architecture:** Extend existing metering, outcome and calibration paths additively. Supabase/Powerhouse stays canonical; NBA-v3 stays the decision authority; Portal V2 consumes canonical projections. Repair the existing approved-central blog visibility defect without an alternate source or publication route.

**Tech Stack:** Node.js/ESM, Netlify Functions, PostgreSQL/Supabase, GitHub Actions, Notion API, Python blog publisher, Portal V2 JavaScript.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-observability-outcome-calibration-closure-design.md`

## Global Constraints

- `EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP`.
- No Make dependency.
- No new CRM, resource ledger, outcome ledger, learning plane, queue, analytics store or ranking engine.
- Stable runtime contracts change additively only.
- Unknown cost/resource/environmental/business-value dimensions remain `NULL`/unknown, never synthetic zero.
- Explicit tenant/action/opportunity/outcome lineage is required for learned business value.
- Cross-tenant ambiguity fails closed.
- NBA-v3 remains ranking authority; economics/resource evidence is enrichment only.
- Calibration/NBA influence remains neutral until a versioned observed-evidence threshold is met.
- No generic token→CO₂/water/kWh factors.
- `LIVE & BEWEZEN` requires exact candidate/main/Netlify/readback identity plus canonical runtime/learning/documentation writeback.

---

### Task 1: AI usage attribution contract

**Files:**
- Modify: `netlify/functions/_ai-usage-store.mjs`
- Modify: `netlify/functions/_brain-ai.mjs`
- Modify/Test: `tests/ai-usage-store.test.mjs`
- Create/Test: `tests/brain-ai-attribution.test.mjs`

**Interfaces:**
- Consumes: `createAiUsageStore(...).record(record, context)`.
- Produces: allowlisted context `{tenantId, activityType, actionId, opportunityKey, campaignKey, outcomeKey}` mapped to canonical snake_case metadata without changing existing `tokenMetering`/`canonicalTokenMetering` meanings.

- [ ] **Step 1:** Add failing test in `tests/ai-usage-store.test.mjs` asserting canonical metadata contains only the six allowlisted business keys plus existing token counters.
- [ ] **Step 2:** Add failing `tests/brain-ai-attribution.test.mjs` proving website/portal calls pass verified business context while prompts/answers stay out of metering metadata.
- [ ] **Step 3:** Run `node --test tests/ai-usage-store.test.mjs tests/brain-ai-attribution.test.mjs` and require RED on missing caller propagation.
- [ ] **Step 4:** Implement minimal propagation in `_brain-ai.mjs`; retain `canonicalAttributionMetadata()` as the allowlist in `_ai-usage-store.mjs`.
- [ ] **Step 5:** Re-run narrow tests and `node --test tests/*.test.mjs`; require GREEN.

### Task 2: Evidence maturity and calibration eligibility SQL

**Files:**
- Create: `supabase/migrations/20260915203000_powerhouse_observability_outcome_calibration_closure_v1.sql`
- Create/Test: `tests/powerhouse-observability-outcome-sql-contract.test.mjs`

**Interfaces:**
- Consumes existing usage/resource/economics/action/outcome/forecast/NBA authorities.
- Produces read-only `powerhouse_action_evidence_maturity_v1` and `powerhouse_commercial_next_best_action_v5`; no new base ledger.

- [ ] Write RED SQL contract for both views, security-invoker, no browser-role grants, exact lineage and NULL semantics.
- [ ] Inspect live production schemas for exact columns/types before SQL.
- [ ] Add evidence statuses for resource/economics/outcome/forecast and combined maturity/calibration eligibility.
- [ ] Expose named/versioned `minimum_comparable_outcomes = 5`; below threshold calibration/efficiency remains neutral.
- [ ] Create NBA-v5 as v4 plus evidence fields without changing v3/v4 recommendation/rank.
- [ ] Preserve formulas: observed cost only from observed provider/external components; net value = realized revenue - observed cost; ROI only when observed cost > 0 and realized revenue observed.
- [ ] Run SQL-contract test GREEN.

### Task 3: Human feedback and observed outcomes

**Files:**
- Modify: `netlify/functions/_revenue-learning-store.mjs`
- Modify: `netlify/functions/_revenue-learning-model.mjs`
- Modify: `netlify/functions/revenue-learning-context.mjs`
- Modify: `netlify/functions/revenue-learning-evaluate.mjs`
- Create/Test: `tests/revenue-learning-observed-outcomes.test.mjs`

- [ ] RED: `skip/edit/override/rejection/manual_call` remain human feedback, never remapped to win/loss.
- [ ] RED: `no_reply` only after explicit observation deadline; provider silence before deadline remains unknown.
- [ ] RED: realized revenue only from explicitly observed revenue, never proposal/forecast value.
- [ ] Implement smallest normalization/validation through existing dedupe/idempotency and explicit action lineage.
- [ ] Run narrow/full backend tests GREEN.

### Task 4: Forecast error and evidence-gated calibration

**Files:**
- Modify: `_revenue-learning-model.mjs`, observed-outcomes tests and closure migration.

- [ ] RED: outcome without prior forecast → `forecast_error=null`, not eligible.
- [ ] RED: prior comparable forecast + observed outcome → deterministic error.
- [ ] RED: 1–4 comparable outcomes neutral; five eligible; environmental unknown remains neutral.
- [ ] Implement minimal model/v5 logic without changing NBA-v3 algorithm.
- [ ] Run revenue-learning and SQL-contract tests GREEN.

### Task 5: Portal V2 canonical business-value evidence

**Files:**
- Modify: `portal-v2/csrd-impact.js`
- Modify: `powerhouse/assurance/portal-v2-parity.json`
- Modify: `scripts/powerhouse-assurance-check.mjs`
- Modify/Test: `tests/portal-resource-footprint.test.mjs`
- Create/Test: `tests/portal-business-value-evidence.test.mjs`

- [ ] RED: unknown cost/impact/revenue never numeric zero.
- [ ] RED: ROI only with observed cost > 0 and observed realized revenue.
- [ ] RED parity: Portal V2 consumes canonical evidence/value fields; no local ROI/environmental recomputation.
- [ ] Implement minimal render-model/assurance extension.
- [ ] Run portal tests and assurance checker GREEN.

### Task 6: Approved-central blog row visibility

**Files:**
- Modify: `scripts/publish_approved_blog_v2.py`
- Modify workflow only if reproduction proves credential/environment wiring is root cause.
- Tests: approved-blog verifier/candidate + new row-visibility regression.

- [ ] Reproduce with read-only query using exact workflow API version, datasource ID and filter contract.
- [ ] Establish one observed root cause; no guessing.
- [ ] Add RED regression for that root cause.
- [ ] Implement smallest repair preserving six filters, candidate PR and pending-until-production-proof semantics.
- [ ] Run read-only/nonpublishing tests and require due-row visibility.

### Task 7: Production Supabase apply and rollback-safe end-to-end fixture

- [ ] Apply migration atomically.
- [ ] Read back views, `security_invoker=true`, columns, threshold 5 and grants; no public/anon/authenticated privileges.
- [ ] Transaction fixture: synthetic action + explicit tenant + attributed usage + economics + prior forecast + realized-revenue outcome.
- [ ] Assert usage=1, cost/revenue/net value/ROI, NULL environmental impact without factor, forecast-error behavior and threshold behavior.
- [ ] Roll back and prove zero fixture residue.
- [ ] Read real production coverage separately: maturity, economics, resource, outcome, forecast-comparable, eligible and NBA-v5 efficiency counts.

### Task 8: Exact-head PR and CI

- [ ] Re-read protected current main before PR.
- [ ] If main moved and branch cannot merge cleanly, consolidate only still-valid deltas onto successor and reuse branch-drift learning.
- [ ] Run full tests and assurance checker.
- [ ] Open one PR with exact Change-Scope and Scope-Budget.
- [ ] Require terminal green Required `test`, BRAIN, Supabase-security and selected portal/automation lanes on exact PR head.
- [ ] Debug real causes; never bypass protection or weaken gates.

### Task 9: Protected merge and production proof

- [ ] Re-read PR/current main; verify mergeable and unchanged expected head.
- [ ] Merge with `expected_head_sha` through protected main.
- [ ] Require main exact merge SHA.
- [ ] Netlify production `ready`, `branch=main`, exact commit ref, zero secret-scan matches.
- [ ] Production Release Readback success on same SHA.
- [ ] Affected Portal V2 browser/readback verifies unknown/ROI semantics.
- [ ] Blog route only through existing candidate-PR workflow; close visibility obligation only with expected-row and normal production-proof evidence.

### Task 10: Canonical Powerhouse and Notion writeback

**Systems:** Supabase `brain_records`; Human Handbook `3dcda36a-ac8a-81ac-aad1-c88751e9e814`; Master Register `3c3da36a-ac8a-81dd-a3fe-c4fc12bba5df`; System Map `3dcda36a-ac8a-8152-be3d-edbb32b06239`.

- [ ] Upsert verification record `powerhouse-observability-outcome-calibration-closure-v1-release-state` with exact evidence/source revision.
- [ ] Write one deduplicated new Learning only where not already covered.
- [ ] Update Handboek with evidence classes, threshold=5, formulas, provider coverage and real maturity counts.
- [ ] Update Master with exact release identity and remaining external-provider coverage obligations.
- [ ] Update System Map with NBA-v5 evidence relation and any confirmed blog route correction.
- [ ] Read back all Notion pages and Supabase records.
- [ ] End with exactly one hard status; `LIVE & BEWEZEN` only when every in-scope technical obligation is closed.
