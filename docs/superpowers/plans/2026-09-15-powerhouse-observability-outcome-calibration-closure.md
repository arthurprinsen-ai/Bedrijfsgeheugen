# Powerhouse Observability → Outcome → Calibration Closure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining Powerhouse evidence loop so real provider/runtime usage, observed costs, human feedback and commercial outcomes can safely influence realized value, forecast calibration, Next Best Action and Portal V2 without parallel systems or fabricated evidence.

**Architecture:** Extend existing metering/outcome/calibration contracts additively, keep Supabase/Powerhouse as canonical authority, and expose only evidence-backed projections to NBA and Portal V2. Repair the approved-central blog visibility obligation through its existing Notion/GitHub route. Finish with exact-SHA protected release, production readback, runtime learning writeback and Notion documentation.

**Tech Stack:** Node.js/ESM, Netlify Functions, PostgreSQL/Supabase, GitHub Actions, Notion API, Portal V2 JavaScript, existing Powerhouse CI/BRAIN governance.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-observability-outcome-calibration-closure-design.md`

## Global Constraints

- `EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP`.
- No Make dependency and no new CRM, outcome ledger, resource ledger, queue, analytics store, learning plane or ranking engine.
- Stable public/runtime contracts change additively only.
- Unknown cost/resource/environmental/business-value dimensions remain `NULL`/unknown, never synthetic zero.
- Explicit tenant/action/opportunity/outcome lineage is required for learned business value.
- Cross-tenant ambiguity fails closed.
- Existing NBA-v3 remains ranking/decision authority; economics/resource evidence is additive enrichment only.
- Calibration/NBA influence is neutral until explicit, versioned evidence thresholds are met.
- No generic token→CO₂/water/kWh factors may be invented.
- Production status requires exact candidate/main/Netlify/readback identity and canonical writeback.

---

## File structure and responsibility map

- `netlify/functions/_ai-usage-store.mjs` — canonical AI usage mirror and allowlisted business-context propagation.
- `netlify/functions/_brain-ai.mjs` — caller-side construction of usage context without changing stable token-metering status semantics.
- `netlify/functions/_cost-projection-store.mjs` — existing cost dashboard/read model; remove legacy Make assumptions from new evidence logic, do not make it a new authority.
- `netlify/functions/_revenue-learning-store.mjs` — existing revenue learning persistence path.
- `netlify/functions/_revenue-learning-model.mjs` — existing observed-outcome/calibration model entry point.
- `netlify/functions/revenue-learning-context.mjs`, `revenue-learning-evaluate.mjs`, `revenue-learning-project.mjs` — existing scheduled/runtime evaluation route to reuse.
- `supabase/migrations/<timestamp>_powerhouse_observability_outcome_calibration_closure_v1.sql` — evidence maturity, calibration eligibility and portal/NBA projections; no parallel base ledger.
- `portal-v2/csrd-impact.js` plus existing Portal V2 read-model/render files discovered during implementation — render canonical evidence maturity/coverage and fail-closed unknowns.
- `powerhouse/assurance/portal-v2-parity.json` and `scripts/powerhouse-assurance-check.mjs` — parity/evidence contract for the affected Portal V2 capability.
- `scripts/publish_approved_blog_v2.py` — existing approved-central Notion selection/render logic; repair row visibility/token authority here if root cause is confirmed.
- `.github/workflows/approved-central-blog.yml` — existing publication orchestration; only modify if workflow identity/credentials need corrected wiring.
- `tests/backend/*.test.mjs`, `tests/portal-*.test.mjs`, and existing Python/workflow contract tests — TDD coverage in already classified delivery lanes.
- `docs/superpowers/specs/...` and this plan — design/plan authority only, not runtime truth.

---

### Task 1: Baseline and failing attribution tests

**Files:**
- Modify/Test: `tests/backend/ai-usage-store.test.mjs`
- Modify/Test: existing `_brain-ai` backend test file discovered from current main
- Read: `netlify/functions/_ai-usage-store.mjs`
- Read: `netlify/functions/_brain-ai.mjs`

**Interfaces:**
- Consumes: `createAiUsageStore(...).record(record, context)` and `createCanonicalAiUsageWriter`.
- Produces: verified context contract `{tenantId, activityType, actionId, opportunityKey, campaignKey, outcomeKey}` while preserving existing `tokenMetering`/`canonicalTokenMetering` semantics.

- [ ] **Step 1: Write/extend failing tests** asserting only the six allowlisted business keys reach canonical metadata; unknown metadata keys, prompts and response text do not.
- [ ] **Step 2: Add failing tests** asserting existing success/error token-metering enums are unchanged when canonical mirroring succeeds/fails.
- [ ] **Step 3: Run the narrow backend tests** with `node --test <exact-test-files>` and verify the new assertions fail for any missing caller context.
- [ ] **Step 4: Implement the minimal caller propagation** in `_brain-ai.mjs` and, only if required, validation in `_ai-usage-store.mjs`.
- [ ] **Step 5: Re-run the narrow tests** and then the repository backend lane; require all green.
- [ ] **Step 6: Commit** `test/feat: close canonical AI usage attribution`.

### Task 2: Canonical observed economics/outcome evidence projection

**Files:**
- Create: `supabase/migrations/<timestamp>_powerhouse_observability_outcome_calibration_closure_v1.sql`
- Create/Modify Test: `tests/backend/powerhouse-observability-outcome-sql-contract.test.mjs`
- Read only: current definitions of `powerhouse_action_economics`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_action_business_value_v1`, `powerhouse_forecasts`, `powerhouse_forecast_calibration`, NBA-v3/v4.

**Interfaces:**
- Consumes: existing canonical action/economics/outcome/forecast stores.
- Produces: versioned read-only projection(s) for dimension-level evidence maturity and calibration eligibility; existing base stores remain authority.

- [ ] **Step 1: Write the failing SQL-contract test** for `security_invoker=true`, no `anon/authenticated/public` grant expansion, explicit action/tenant joins, nullable unknown semantics and no heuristic opportunity matching.
- [ ] **Step 2: Run the test** and confirm RED because the closure migration/projection does not yet exist.
- [ ] **Step 3: Inspect live schemas** before writing SQL; copy exact column names/types and existing RPCs rather than guessing.
- [ ] **Step 4: Add the migration** defining evidence maturity per dimension (`resource`, `economics`, `outcome`, `forecast`) and a combined `calibration_eligible` boolean/reason. Preserve `powerhouse_action_business_value_v1`; create a successor projection only if its current contract cannot carry the additional evidence fields additively.
- [ ] **Step 5: Encode explicit versioned thresholds** in SQL/config, e.g. minimum observed comparable outcomes before an efficiency/calibration contribution can become non-neutral. Threshold values must be named constants/config records, not embedded unexplained literals.
- [ ] **Step 6: Re-run SQL-contract tests** until GREEN, including deterministic observed-cost + realized-revenue ROI and NULL when either side is absent.
- [ ] **Step 7: Commit** `feat: add evidence maturity and calibration eligibility projections`.

### Task 3: Human feedback and outcome capture through existing lineage

**Files:**
- Modify: `netlify/functions/_revenue-learning-store.mjs`
- Modify: `netlify/functions/_revenue-learning-model.mjs`
- Modify if required: `netlify/functions/revenue-learning-context.mjs`
- Modify if required: `netlify/functions/revenue-learning-evaluate.mjs`
- Test: corresponding `tests/backend/revenue-learning*.test.mjs`

**Interfaces:**
- Consumes: canonical action IDs plus observed outcome/human-feedback events.
- Produces: deduplicated evidence records for `reply`, observation-window `no_reply`, `meeting_booked`, `meeting_held`, `proposal_created/sent`, `won`, `lost`, realized revenue, `skip`, `hold`, `edit`, `override`, `rejection`, `manual_call`.

- [ ] **Step 1: Write failing tests** proving human feedback is retained as first-class evidence but is not reinterpreted as a commercial win/loss.
- [ ] **Step 2: Add failing tests** proving `no_reply` requires an elapsed configured observation window and provider silence alone remains unknown.
- [ ] **Step 3: Add failing tests** proving realized revenue accepts only explicitly observed amounts and proposal/forecast value cannot flow into realized revenue.
- [ ] **Step 4: Implement the smallest normalization/validation change** in the existing revenue-learning path; reuse current dedupe/idempotency fields.
- [ ] **Step 5: Run narrow and full backend tests**; require no change to existing outcome meanings.
- [ ] **Step 6: Commit** `feat: capture observed human and commercial outcomes`.

### Task 4: Forecast error and calibration gating

**Files:**
- Modify: SQL migration from Task 2 or add a second focused migration if current-main movement requires isolation.
- Modify: `netlify/functions/_revenue-learning-model.mjs`
- Modify/Test: `tests/backend/revenue-learning*.test.mjs`

**Interfaces:**
- Consumes: pre-action forecast identity/version/confidence + post-action comparable outcome.
- Produces: forecast error only for comparable pairs; evidence threshold status; neutral economics/resource contribution below threshold.

- [ ] **Step 1: Write failing tests**: outcome without prior forecast yields no forecast error and no synthetic backfill.
- [ ] **Step 2: Write failing tests**: comparable prior forecast + observed outcome yields deterministic error/calibration input.
- [ ] **Step 3: Write failing tests**: evidence below threshold keeps NBA economics/resource contribution at neutral zero-weight/unknown-evidence state, not negative score.
- [ ] **Step 4: Implement minimal model/projection logic**, preserving NBA-v3 authority and using v4/successor only for additive evidence fields.
- [ ] **Step 5: Run backend + SQL contract suites**.
- [ ] **Step 6: Commit** `feat: gate calibration and NBA economics on observed evidence`.

### Task 5: Portal V2 canonical evidence consumption

**Files:**
- Modify: `portal-v2/csrd-impact.js`
- Modify: exact Portal V2 read-model/render file(s) identified from current main for Resource/CSRD/business-value panels.
- Modify: `powerhouse/assurance/portal-v2-parity.json` only for the affected capability/evidence contract.
- Test: `tests/portal-resource-footprint.test.mjs`
- Test: existing Portal V2 parity/assurance test files.

**Interfaces:**
- Consumes: canonical Portal resource/value projection from Supabase/shared portal service.
- Produces: tenant-scoped UI model with per-dimension `{value, evidence_class, coverage, freshness, confidence}` and supported realized ROI/value.

- [ ] **Step 1: Write failing portal tests** proving unknown does not render as `0`, ROI is omitted without observed cost+revenue, and dimension-level evidence classes remain independent.
- [ ] **Step 2: Write failing parity test** proving Portal V2 uses the canonical projection rather than local recomputation/static sample for this capability.
- [ ] **Step 3: Implement minimal render/read-model changes**; preserve sample labeling for absent live evidence.
- [ ] **Step 4: Run portal tests and assurance checker**.
- [ ] **Step 5: Commit** `feat: render canonical business value evidence in Portal V2`.

### Task 6: Approved-central blog row-visibility root cause and repair

**Files:**
- Modify/Test: `scripts/publish_approved_blog_v2.py`
- Modify if evidence requires it: `.github/workflows/approved-central-blog.yml`
- Test: existing approved-blog Python/workflow tests in the classified automation lane
- Do not create an alternate queue/source/publisher.

**Interfaces:**
- Consumes: current approved-central Notion data source and `NOTION_TOKEN` integration.
- Produces: deterministic eligible-row selection or an exact authority/visibility error; candidate-PR path remains unchanged.

- [ ] **Step 1: Reproduce the current row-visibility failure** using the workflow-equivalent token/query contract without publishing content.
- [ ] **Step 2: Write a regression test** for the confirmed root cause (data-source endpoint/version/integration visibility/filter identity); do not guess the fix before reproduction.
- [ ] **Step 3: Implement the smallest repair** in `publish_approved_blog_v2.py` or workflow credential/wiring, preserving six eligibility filters, candidate PR delivery and queue pending-until-production-proof semantics.
- [ ] **Step 4: Run local deterministic blog tests/verification fixture** and require no production article publication during the test.
- [ ] **Step 5: Commit** `fix: restore approved-central blog row visibility`.

### Task 7: Supabase apply, security readback and end-to-end transaction fixture

**Files:**
- No new permanent test-data files.
- Uses migration(s) from Tasks 2/4 and existing Supabase RPCs/writers.

**Interfaces:**
- Consumes: production schema and service-side canonical writers.
- Produces: catalog/grant readback plus rollback-safe proof of the complete evidence chain.

- [ ] **Step 1: Apply migration(s) atomically** to Supabase production.
- [ ] **Step 2: Read back** view definitions/options, exact columns, grants, RLS/security-invoker semantics and threshold/config values.
- [ ] **Step 3: Execute one transaction-scoped fixture** creating/reusing a synthetic canonical action, attributed resource observation, observed economics, prior forecast and observed realized revenue/outcome.
- [ ] **Step 4: Assert inside the transaction** attribution count, cost, revenue, net realized value, ROI, calibration eligibility/error behavior and NULL environmental impact with zero valid factor.
- [ ] **Step 5: Roll back/cleanup** and query every touched base table to prove zero fixture residue.
- [ ] **Step 6: Query real production data separately** and record counts for measured/partial/unknown actions, resource coverage, economics coverage, outcome coverage, calibration-eligible actions and NBA evidence use.

### Task 8: Candidate PR and exact-head CI

**Files:**
- All files changed in Tasks 1–6 plus spec/plan.

**Interfaces:**
- Produces: one PR against current protected `main` with explicit Change-Scope and Scope-Budget metadata.

- [ ] **Step 1: Compare branch to current `main`**; if main moved, consolidate only still-valid deltas onto a fresh successor branch and reuse existing branch-drift learning.
- [ ] **Step 2: Run local/classified tests** and delivery classifier before opening PR.
- [ ] **Step 3: Open PR** with exact scope metadata and no unrelated files.
- [ ] **Step 4: Wait for terminal Required `test`, BRAIN, Supabase-security and applicable portal/automation lanes on the exact head SHA.
- [ ] **Step 5: Diagnose any red/cancelled job with systematic debugging; never bypass branch protection or weaken a gate to make it green.

### Task 9: Protected merge and production proof

**Files:** none unless a failing production readback exposes a real defect, in which case return to TDD on a new candidate head.

**Interfaces:**
- Consumes: exact green candidate head.
- Produces: exact merge/main/Netlify/readback identity.

- [ ] **Step 1: Re-read PR head and current main immediately before merge**.
- [ ] **Step 2: Merge with `expected_head_sha` through protected branch rules.
- [ ] **Step 3: Verify `main` equals returned merge SHA.
- [ ] **Step 4: Verify Netlify production deploy is `ready`, branch `main`, and `commit_ref` equals merge SHA; secret scan has zero matches.
- [ ] **Step 5: Verify Production Release Readback is `success` on the same SHA.
- [ ] **Step 6: Run affected Portal V2 production/browser readback.
- [ ] **Step 7: If the blog fix is included, run/observe the approved-central route through candidate-PR/provider proof without bypass and close the prior row-visibility obligation only when exact production evidence exists.

### Task 10: Canonical runtime learning and human documentation writeback

**Files/Systems:**
- Supabase `brain_records` existing allowed record kinds.
- Notion Human Handbook.
- Notion Master Build/Borging/Go-Live Register.
- Notion Canonical System Map.

**Interfaces:**
- Consumes: exact production evidence from Tasks 7–9.
- Produces: current VERIFIED state, deduplicated learning/prevention and human-readable architecture/readback.

- [ ] **Step 1: Upsert one current-state verification record** with fingerprint `powerhouse-observability-outcome-calibration-closure-v1`, exact candidate/PR/merge/deploy/readback IDs and hard status.
- [ ] **Step 2: Write only new learning** not already covered by branch-drift/resource-business-value learnings; include root cause, prevention, evidence and source revision.
- [ ] **Step 3: Update Human Handbook** with evidence classes, threshold contract, provider coverage, calibration semantics and current measured/partial/unknown production counts.
- [ ] **Step 4: Update Master Register** with exact release identity, closed/open obligations and current truth state.
- [ ] **Step 5: Update Canonical System Map** only if provider routes/component relationships/gates/lineage materially changed.
- [ ] **Step 6: Fetch/read back all three Notion pages and the Supabase verification/learning records.
- [ ] **Step 7: Final status** must be one of `LIVE & BEWEZEN`, `DEELS LIVE`, `GEBLOKKEERD`, `NIET GEDAAN`; `LIVE & BEWEZEN` is allowed only when all in-scope technical obligations are closed. External provider coverage gaps remain explicit unknown/coverage obligations rather than fabricated success.
