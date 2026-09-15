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

- [ ] **Step 1: Add failing test in `tests/ai-usage-store.test.mjs`** asserting canonical metadata contains only `tenant_id`, `activity_type`, `action_id`, `opportunity_key`, `campaign_key`, `outcome_key` plus existing token counters.
- [ ] **Step 2: Add failing test in `tests/brain-ai-attribution.test.mjs`** asserting website/portal AI calls can pass verified action/opportunity context to `usageStore.record(record, context)` while prompts/answers are absent from metering metadata.
- [ ] **Step 3: Run** `node --test tests/ai-usage-store.test.mjs tests/brain-ai-attribution.test.mjs` and require RED on the missing caller propagation only.
- [ ] **Step 4: Implement minimal propagation** in `_brain-ai.mjs`; retain `canonicalAttributionMetadata()` as the only allowlist in `_ai-usage-store.mjs`.
- [ ] **Step 5: Re-run narrow tests and `node --test tests/*.test.mjs`**; require GREEN.
- [ ] **Step 6: Commit** `feat: propagate canonical AI business attribution`.

### Task 2: Evidence maturity and calibration eligibility SQL

**Files:**
- Create: `supabase/migrations/20260915203000_powerhouse_observability_outcome_calibration_closure_v1.sql`
- Create/Test: `tests/powerhouse-observability-outcome-sql-contract.test.mjs`

**Interfaces:**
- Consumes: `brain_budget_usage`, `powerhouse_resource_impact_v1`, `powerhouse_action_economics`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_action_business_value_v1`, `powerhouse_forecasts`, `powerhouse_forecast_calibration`, `powerhouse_commercial_next_best_action_v3/v4`.
- Produces: read-only `powerhouse_action_evidence_maturity_v1` and `powerhouse_commercial_next_best_action_v5`; no new base ledger.

- [ ] **Step 1: Write RED SQL-contract test** requiring both views, `security_invoker=true`, no `public/anon/authenticated` grants, exact `action_id` lineage and NULL-preserving unknown semantics.
- [ ] **Step 2: Run** `node --test tests/powerhouse-observability-outcome-sql-contract.test.mjs`; require RED because the migration is absent.
- [ ] **Step 3: Inspect production schemas** for exact columns/types before writing SQL.
- [ ] **Step 4: Create `powerhouse_action_evidence_maturity_v1`** with dimension states `resource_evidence_status`, `economics_evidence_status`, `outcome_evidence_status`, `forecast_evidence_status`, combined `evidence_maturity`, `calibration_eligible`, `calibration_block_reason`.
- [ ] **Step 5: Set versioned threshold constant** in the view/migration: `minimum_comparable_outcomes = 5`; below five comparable observed outcomes, calibration and cost-efficiency contribution remain neutral. Store/expose this threshold value in the projection.
- [ ] **Step 6: Create `powerhouse_commercial_next_best_action_v5`** as `v4` plus maturity/eligibility fields. Do not alter v3/v4 recommendation/rank; expose economics/resource contribution only when `calibration_eligible=true`, otherwise neutral/NULL.
- [ ] **Step 7: Explicit formulas:** `observed_cost_eur = provider_cost_eur + external_cost_eur` only when at least one observed component exists; `net_realized_value_eur = realized_revenue_eur - observed_cost_eur`; `roi_ratio = net_realized_value_eur / observed_cost_eur` only when observed cost > 0 and realized revenue is observed.
- [ ] **Step 8: Re-run SQL-contract test** and require GREEN.
- [ ] **Step 9: Commit** `feat: add evidence maturity and calibration eligibility`.

### Task 3: Human feedback and observed outcomes

**Files:**
- Modify: `netlify/functions/_revenue-learning-store.mjs`
- Modify: `netlify/functions/_revenue-learning-model.mjs`
- Modify: `netlify/functions/revenue-learning-context.mjs`
- Modify: `netlify/functions/revenue-learning-evaluate.mjs`
- Create/Test: `tests/revenue-learning-observed-outcomes.test.mjs`

**Interfaces:**
- Consumes: canonical `action_id`, provider/human evidence and timestamps.
- Produces: deduplicated evidence classes `reply`, `no_reply`, `meeting_booked`, `meeting_held`, `proposal_created`, `proposal_sent`, `won`, `lost`, `realized_revenue`, `skip`, `hold`, `edit`, `override`, `rejection`, `manual_call`.

- [ ] **Step 1: Add RED tests** proving `skip/edit/override/rejection/manual_call` are stored as human feedback and never remapped to `won/lost`.
- [ ] **Step 2: Add RED test** requiring `no_reply` only after an explicit observation deadline; missing provider readback before deadline remains unknown.
- [ ] **Step 3: Add RED test** requiring realized revenue to come only from an observed revenue field; proposal amount and forecast value cannot populate realized revenue.
- [ ] **Step 4: Run** `node --test tests/revenue-learning-observed-outcomes.test.mjs`; require RED.
- [ ] **Step 5: Implement normalization and validation** in existing revenue-learning modules using current idempotency/dedupe keys and explicit `action_id` lineage.
- [ ] **Step 6: Re-run narrow test plus `node --test tests/*.test.mjs`**; require GREEN.
- [ ] **Step 7: Commit** `feat: capture observed human and commercial evidence`.

### Task 4: Forecast error and evidence-gated calibration

**Files:**
- Modify: `netlify/functions/_revenue-learning-model.mjs`
- Modify/Test: `tests/revenue-learning-observed-outcomes.test.mjs`
- Modify: `supabase/migrations/20260915203000_powerhouse_observability_outcome_calibration_closure_v1.sql`

**Interfaces:**
- Consumes: forecast persisted before execution plus comparable observed outcome.
- Produces: `forecast_error`, comparison count and calibration eligibility; no backfilled forecasts.

- [ ] **Step 1: Add RED test**: outcome without prior forecast returns `forecast_error=null` and `calibration_eligible=false`.
- [ ] **Step 2: Add RED test**: prior forecast + comparable observed outcome yields deterministic forecast error.
- [ ] **Step 3: Add RED test**: 1–4 comparable outcomes keep efficiency/calibration neutral; five comparable outcomes make the evidence threshold eligible while leaving environmental unknowns neutral.
- [ ] **Step 4: Run narrow tests** and require RED.
- [ ] **Step 5: Implement minimum logic** in model + v5 projection; do not modify the v3 recommendation algorithm.
- [ ] **Step 6: Run revenue-learning and SQL-contract tests**; require GREEN.
- [ ] **Step 7: Commit** `feat: gate calibration on comparable observed outcomes`.

### Task 5: Portal V2 canonical business-value evidence

**Files:**
- Modify: `portal-v2/csrd-impact.js`
- Modify: `powerhouse/assurance/portal-v2-parity.json`
- Modify: `scripts/powerhouse-assurance-check.mjs`
- Modify/Test: `tests/portal-resource-footprint.test.mjs`
- Create/Test: `tests/portal-business-value-evidence.test.mjs`

**Interfaces:**
- Consumes: `powerhouse_portal_resource_summary_v2` plus `powerhouse_action_evidence_maturity_v1` through the existing shared portal read model.
- Produces: dimension-level `{value, evidenceClass, coverage, freshness, confidence}` and realized cost/revenue/net-value/ROI only when supported.

- [ ] **Step 1: Add RED tests** proving unknown cost/impact/revenue never renders as numeric zero.
- [ ] **Step 2: Add RED tests** proving ROI renders only with observed cost > 0 and observed realized revenue.
- [ ] **Step 3: Add RED parity assertion** that Portal V2 consumes canonical evidence/value fields and does not locally recompute ROI or environmental impact.
- [ ] **Step 4: Run** `node --test tests/portal-resource-footprint.test.mjs tests/portal-business-value-evidence.test.mjs`; require RED.
- [ ] **Step 5: Implement minimal Portal V2 render-model extension** in `csrd-impact.js` and register the evidence contract in the existing assurance inventory/checker.
- [ ] **Step 6: Run portal tests and** `node scripts/powerhouse-assurance-check.mjs`; require GREEN.
- [ ] **Step 7: Commit** `feat: expose canonical business value evidence in Portal V2`.

### Task 6: Approved-central blog row visibility

**Files:**
- Modify: `scripts/publish_approved_blog_v2.py`
- Modify only when reproduction proves workflow wiring is the cause: `.github/workflows/approved-central-blog.yml`
- Modify/Test: `tests/approved-blog-verifier-contract.test.mjs`
- Modify/Test: `tests/approved-central-blog-candidate-mode.test.mjs`
- Create/Test: `tests/approved-central-blog-row-visibility.test.mjs`

**Interfaces:**
- Consumes: current approved-central Notion data source, the existing six eligibility filters and `NOTION_TOKEN`.
- Produces: deterministic due-slug selection or explicit visibility/authority failure; candidate-PR delivery unchanged.

- [ ] **Step 1: Reproduce with read-only query** using the same API version, datasource ID and filter contract as `publish_approved_blog_v2.py`; do not render/publish.
- [ ] **Step 2: Record one root cause from observed evidence:** datasource endpoint mismatch, API-version mismatch, integration page access, or filter/property mismatch.
- [ ] **Step 3: Add RED regression test** in `tests/approved-central-blog-row-visibility.test.mjs` encoding that exact root cause.
- [ ] **Step 4: Implement the smallest repair** in Python. Edit workflow YAML only if the reproduced root cause is credential/environment wiring; otherwise leave workflow unchanged.
- [ ] **Step 5: Run** `node --test tests/approved-blog-verifier-contract.test.mjs tests/approved-central-blog-candidate-mode.test.mjs tests/approved-central-blog-row-visibility.test.mjs` plus the Python selector in non-publishing/read-only mode.
- [ ] **Step 6: Require due-row visibility while preserving candidate-PR, six filters and `pending_until_production_proof` semantics.
- [ ] **Step 7: Commit** `fix: restore approved-central blog row visibility`.

### Task 7: Production Supabase apply and rollback-safe end-to-end fixture

**Files:**
- Apply: `supabase/migrations/20260915203000_powerhouse_observability_outcome_calibration_closure_v1.sql`

**Interfaces:**
- Produces: catalog/security proof plus rollback-safe usage→cost→action→outcome→value→calibration proof.

- [ ] **Step 1: Apply migration atomically** to Supabase production.
- [ ] **Step 2: Read back** exact view definitions, `security_invoker=true`, columns, threshold value 5, and grants; `public/anon/authenticated` must have no privileges on new projections.
- [ ] **Step 3: Start one SQL transaction fixture** with a synthetic action ID and explicit tenant; insert/reuse attributed usage, observed economics, pre-action forecast and observed realized-revenue outcome.
- [ ] **Step 4: Assert in-transaction** attributed usage count=1; deterministic observed cost; deterministic realized revenue/net value/ROI; environmental dimensions NULL with no valid factor; forecast error present only from prior forecast; threshold behavior correct.
- [ ] **Step 5: Roll back transaction**.
- [ ] **Step 6: Query all touched base stores** and prove zero fixture rows remain.
- [ ] **Step 7: Query real production coverage**: action count by evidence maturity; economics-observed count; resource-attributed count; outcome-observed count; forecast-comparable count; calibration-eligible count; NBA-v5 count with active efficiency evidence.

### Task 8: Exact-head PR and CI

**Files:** all changes above plus approved spec/plan.

- [ ] **Step 1: Read current protected `main`** immediately before PR creation.
- [ ] **Step 2: Compare branch to main**. If main moved and branch is not cleanly mergeable, create a successor branch from current main and copy only the still-valid changed files; reuse the existing canonical branch-drift learning.
- [ ] **Step 3: Run** `node --test tests/*.test.mjs` and `node scripts/powerhouse-assurance-check.mjs` on the release branch.
- [ ] **Step 4: Open one PR** with exact `Change-Scope` paths and `Scope-Budget` equal to the actual changed-file count.
- [ ] **Step 5: Require terminal green** on Required `test`, BRAIN delivery, Supabase security and all selected portal/automation lanes on the exact PR head.
- [ ] **Step 6: For any red/cancelled job, invoke systematic-debugging, fix the real cause, create a new head and rerun gates. Never bypass protection or weaken a gate.

### Task 9: Protected merge and production proof

- [ ] **Step 1: Re-read PR metadata and current main**; ensure PR is mergeable and the expected head is unchanged.
- [ ] **Step 2: Merge with `expected_head_sha`** through protected main.
- [ ] **Step 3: Read back main** and require exact returned merge SHA.
- [ ] **Step 4: Read Netlify production deploy** and require `ready`, `branch=main`, `commit_ref=<merge SHA>`, zero secret-scan matches.
- [ ] **Step 5: Require `Production Release Readback` success** on the same merge SHA.
- [ ] **Step 6: Run/read affected Portal V2 production/browser proof** and verify unknown/ROI evidence semantics in production.
- [ ] **Step 7: Trigger/read the approved-central blog route only through its existing candidate-PR workflow. Close the old blog visibility obligation only after the expected approved row is visible and the route reaches its normal production-proof state; do not directly push blog content to main.

### Task 10: Canonical Powerhouse and Notion writeback

**Systems:**
- Supabase `brain_records`.
- Notion Human Handbook `3dcda36a-ac8a-81ac-aad1-c88751e9e814`.
- Notion Master Register `3c3da36a-ac8a-81dd-a3fe-c4fc12bba5df`.
- Notion Canonical System Map `3dcda36a-ac8a-8152-be3d-edbb32b06239`.

- [ ] **Step 1: Upsert verification record** `powerhouse-observability-outcome-calibration-closure-v1-release-state` with allowed record kind, exact PR/candidate/merge/deploy/readback evidence and source revision.
- [ ] **Step 2: Write one deduplicated Learning record** only for new root cause/prevention not already present in branch-drift/resource-value learnings.
- [ ] **Step 3: Update Human Handbook** with evidence classes, threshold=5, formulas, provider coverage and current real measured/partial/unknown counts.
- [ ] **Step 4: Update Master Register** with exact release identity and remaining external-provider coverage obligations.
- [ ] **Step 5: Update System Map** with new v5 evidence-gating relation and any confirmed blog provider-route correction.
- [ ] **Step 6: Fetch/read back all three Notion pages and both Supabase records**.
- [ ] **Step 7: End with exactly one hard status:** `LIVE & BEWEZEN`, `DEELS LIVE`, `GEBLOKKEERD`, or `NIET GEDAAN`; only use `LIVE & BEWEZEN` when every in-scope technical obligation is closed. External providers without authoritative data stay explicit coverage gaps, not fabricated success.
