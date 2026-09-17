# Portal Canonical Business Inputs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist every material portal canvas, strategic model, assessment and compliance form as tenant-bound canonical business context that feeds the existing Powerhouse/Brain and portal recommendations.

**Architecture:** Reuse the existing canonical object contract, canonical portal projection layer, EU-primary portal store and Identity tenant resolution. Introduce one generic `BusinessInput` SourceTruth contract and one authenticated ingest endpoint; project raw input as first-class `businessInputs` while keeping AI interpretations/recommendations separate. A browser adapter gives old and new portal surfaces one write interface and supports idempotent legacy-state migration.

**Tech Stack:** Node ESM, Netlify Functions/Identity, existing Supabase EU portal projection gateway, Netlify Blobs fallback, node:test.

**Spec:** User requirement in Powerhouse shared context: filled portal models must durably feed the canonical company memory; no per-form parallel stores.

## Global Constraints
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No parallel brain, database, queue or form-specific persistence layer.
- Raw user input is `SourceTruth`; derived/AI conclusions remain distinct canonical objects.
- Tenant isolation derives from authenticated Identity, never client-supplied tenant ids.
- Repeated saves of the same model instance are idempotent/upserted, not duplicated.
- Legacy portal data remains readable and can be migrated without data loss.

---

### Task 1: Canonical BusinessInput contract
**Files:** Create `platform/contracts/portal-business-input.mjs`; test `tests/portal-business-input.test.mjs`.
- [x] Write failing tests for SourceTruth, lineage and stable model-instance id.
- [ ] Implement validation and canonical object creation.
- [ ] Verify contract tests pass.

### Task 2: First-class portal projection
**Files:** Modify `platform/read-models/portal-projection-layers.mjs` and `platform/read-models/portal-server-state.mjs`.
- [ ] Add `businessInputs` to merge/sanitize allowlists.
- [ ] Project `BusinessInput` with raw answers, model metadata and provenance instead of audit-only fallback.
- [ ] Verify repeat saves replace by stable id.

### Task 3: Authenticated canonical ingest
**Files:** Create `platform/api/portal-business-input-handler.mjs`; create `netlify/functions/portal-business-input.mjs`; add tests.
- [ ] Resolve tenant from Netlify Identity.
- [ ] Reject invalid/oversize input and ignore client tenant claims.
- [ ] Load canonical layer, project new SourceTruth, sanitize as canonical, and persist through EU-primary store.
- [ ] Return stored/stale/object id/sourceUpdatedAt for readback.

### Task 4: Shared browser write adapter and legacy migration
**Files:** Create `portal-next/portal-business-input-store.js`; add tests where supported.
- [ ] Add one save API for all model/form types.
- [ ] Add idempotent migration helper for legacy `bg_portaal_*` states as `LegacyPortalState` BusinessInputs.
- [ ] Keep localStorage as migration source only, never canonical authority.

### Task 5: Verification and delivery
- [ ] Run chat-learning preflight and relevant/full tests in CI-capable environment.
- [ ] Confirm PR required `test` gate green against exact head SHA.
- [ ] Merge only through protected main/release authority and verify production endpoint/readback before claiming LIVE & BEWEZEN.
- [ ] Write root cause, changes, evidence and prevention learning back to Powerhouse shared context.
