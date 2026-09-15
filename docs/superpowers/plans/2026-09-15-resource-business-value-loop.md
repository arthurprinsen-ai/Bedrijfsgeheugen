# Resource Business Value Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect existing Powerhouse resource usage and impact evidence to action economics, outcomes, portal summaries and commercial next-best-action without introducing a parallel authority.

**Architecture:** Preserve `brain_budget_usage`, `powerhouse_action_economics`, sales actions/outcomes, forecast/calibration and NBA-v3 as authorities. Add optional attribution metadata in the existing AI metering path and versioned read-only projections for action business value, portal summary v2 and NBA-v4. Unknown economics/environmental impact stays neutral/unknown.

**Tech Stack:** Supabase PostgreSQL, Netlify Functions, Node.js ESM, node:test, GitHub Actions, Netlify production readback.

**Spec:** `docs/superpowers/specs/2026-09-15-resource-business-value-loop-design.md`

## Global Constraints
- Fingerprint: `powerhouse-resource-business-value-v1`.
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No Make dependency.
- No parallel ledger, CRM, ranking engine or learning system.
- Unknown impact/cost must not be represented as observed zero.
- Existing `tokenMetering` public contract must remain backward compatible.
- New DB projections must be `security_invoker` and must not widen public grants.

---

### Task 1: Regression tests for additive metering context

**Files:**
- Preserve: `tests/ai-usage-store.test.mjs`
- Create: `tests/brain-ai-usage-attribution.test.mjs`
- Modify: `netlify/functions/_ai-usage-store.mjs`
- Modify: `netlify/functions/_brain-ai.mjs`

**Interfaces:**
- Consumes: existing `createAiUsageStore().record(record)`.
- Produces: backward-compatible `record(record, context?)` with optional context metadata forwarded only to canonical usage writes.

- [x] Add a failing test proving canonical writes preserve token fields while forwarding `tenantId`, `activityType`, `actionId`, `opportunityKey`, `campaignKey`, `outcomeKey` when supplied.
- [x] Add a failing test proving omitted context leaves those metadata keys absent and keeps the existing Blob event and `tokenMetering='RECORDED'` semantics unchanged.
- [x] Run the backend lane and confirm RED was caused by missing context support: BRAIN run `35013744782`, backend job `104531941218`, 128/129 passing with only the new attribution test failing.
- [x] Implement the minimal additive context path and explicit metadata allowlist; arbitrary prompt/content keys are not forwarded.
- [x] Re-run exact backend verification; BRAIN run `35014418240` is green on head `f85222686586c83d3c773b582fbf0947d037e25f` before this evidence-only commit.

### Task 2: Canonical SQL projections

**Files:**
- Create: `supabase/migrations/20260915211500_powerhouse_resource_business_value_v1.sql`
- Create: `tests/brain-resource-business-value-contract.test.mjs`
- Harden: `scripts/brain/check_powerhouse_supabase_security.py` to recognize both safe PostgreSQL `ALTER VIEW ... security_invoker=true` and inline `CREATE VIEW ... WITH (security_invoker=true)` forms.

**Interfaces:**
- Produces: `public.powerhouse_action_business_value_v1`, `public.powerhouse_portal_resource_summary_v2`, `public.powerhouse_commercial_next_best_action_v4`.

- [x] Write the classified contract test requiring existing authorities, `security_invoker`, NULL-preserving unknown semantics, neutral NBA economics handling and explicit grant revocation.
- [x] Verify the missing migration was the intended RED state before implementation.
- [x] Create the migration with deterministic joins on explicit `metadata.action_id` and unambiguous tenant/action authorities.
- [x] Harden the security checker rather than weaken it after it falsely rejected the safe inline `security_invoker` syntax; add a self-test for that syntax.
- [x] Verify the Powerhouse Supabase Security Contract is green (`35014418150`).

### Task 3: Production apply and evidence fixture

**Files:**
- No new authority; migration applied to canonical Supabase project `adhjwmvyoixzjtmiroln`.

**Interfaces:**
- Consumes: migration from Task 2.
- Produces: production views and readback evidence.

- [x] Apply migration `powerhouse_resource_business_value_v1` atomically via Supabase migration tooling.
- [x] Verify all three views have `{security_invoker=true}` and no grants for `public`, `anon` or `authenticated`; service-role access remains explicit.
- [x] Verify production projection counts at readback: 255 action-business-value rows and 80 NBA-v4 rows; portal resource summary v2 is honestly empty while there are no non-synthetic resource observations.
- [x] Verify false-zero invariants: 0 rows with missing resource evidence represented as energy and 0 rows with missing economics represented as observed cost.
- [x] Run a controlled production transaction fixture through existing action, economics, resource and outcome writers. Observed result: €12.50 cost, €100 realized revenue, €87.50 net value, ROI 7, environmental factor coverage 0, and kWh/CO₂e/water stayed NULL without factors.
- [x] Remove the controlled fixture in the same operation and verify 0 fixture actions/economics/usage/outcomes remain.

### Task 4: Release and closed-loop proof

**Files:**
- Update canonical human documentation only after final production release proof.

**Interfaces:**
- Produces: merged PR, exact production SHA/deploy/readback, Powerhouse runtime VERIFIED state, Notion documentation.

- [x] Open PR #1632 from `bg-resource-business-value-v1` to `main`.
- [ ] Verify all required CI/gates on the exact final head. A previous Required retry reused stale PR event metadata; this evidence-only commit intentionally creates a fresh `pull_request/synchronize` event using the corrected `Change-Scope` that includes `scripts/brain/`.
- [ ] Merge with expected-head SHA.
- [ ] Verify `main`, Netlify production deploy and Production Release Readback all reference the same merge SHA.
- [ ] Upsert/read back a canonical `brain_records` release-state for fingerprint `powerhouse-resource-business-value-v1`.
- [ ] Update the Powerhouse Menselijk Handboek and Master Build/Borging/Go-Live Register with design, authorities, calculations, proof, limitations and learnings.
