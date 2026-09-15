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
- Modify: `tests/ai-usage-store.test.mjs`
- Modify: `tests/brain-ai-backend.test.mjs` if present, otherwise the existing backend test covering `_brain-ai.mjs`
- Modify: `netlify/functions/_ai-usage-store.mjs`
- Modify: `netlify/functions/_brain-ai.mjs`

**Interfaces:**
- Consumes: existing `createAiUsageStore().record(record)`.
- Produces: backward-compatible `record(record, context?)` with optional context metadata forwarded only to canonical usage writes.

- [ ] Add a failing test proving canonical writes preserve token fields while forwarding `tenantId`, `activityType`, `actionId`, `opportunityKey`, `campaignKey`, `outcomeKey` when supplied.
- [ ] Add a failing test proving omitted context leaves those metadata keys absent and keeps `tokenMetering='RECORDED'` semantics unchanged.
- [ ] Run the targeted tests and confirm failure is due to missing context support.
- [ ] Implement the minimal additive context path.
- [ ] Re-run targeted tests and existing AI backend regression tests.

### Task 2: Canonical SQL projections

**Files:**
- Create: `supabase/migrations/20260915211500_powerhouse_resource_business_value_v1.sql`
- Create: `tests/resource-business-value-contract.test.mjs`

**Interfaces:**
- Produces: `public.powerhouse_action_business_value_v1`, `public.powerhouse_portal_resource_summary_v2`, `public.powerhouse_commercial_next_best_action_v4`.

- [ ] Write a failing contract test that requires the migration to use only existing authorities, `security_invoker`, NULL-preserving unknown semantics, neutral NBA economics handling, and explicit grant revocation.
- [ ] Run the test and verify RED because the migration does not exist.
- [ ] Create the migration with deterministic joins on explicit `metadata.action_id` and tenant/action authorities.
- [ ] Re-run the contract test and SQL/static migration tests.

### Task 3: Production apply and evidence fixture

**Files:**
- No new authority; apply the migration to Supabase.

**Interfaces:**
- Consumes: migration from Task 2.
- Produces: production views and readback evidence.

- [ ] Apply the exact migration via Supabase migration tooling.
- [ ] Verify view options, grants and columns from PostgreSQL catalog.
- [ ] Insert or reuse one explicitly synthetic controlled usage/action/economics/outcome fixture only if required, marked synthetic and excluded from ordinary business truth.
- [ ] Verify deterministic expected-vs-realized calculations and remove/contain any test fixture according to existing synthetic-data policy.

### Task 4: Release and closed-loop proof

**Files:**
- Update canonical human documentation only after production proof.

**Interfaces:**
- Produces: merged PR, exact production SHA/deploy/readback, Powerhouse runtime VERIFIED state, Notion documentation.

- [ ] Open PR from `bg-resource-business-value-v1` to `main`.
- [ ] Verify required CI/gates on the exact head.
- [ ] Merge with expected-head SHA.
- [ ] Verify `main`, Netlify production deploy and Production Release Readback all reference the same merge SHA.
- [ ] Upsert/read back a canonical `brain_records` release-state for fingerprint `powerhouse-resource-business-value-v1`.
- [ ] Update the Powerhouse Menselijk Handboek and Master Build/Borging/Go-Live Register with design, authorities, calculations, proof, limitations and learnings.
