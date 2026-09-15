# Powerhouse Full-Cycle Production Proof Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one fail-closed production proof that reuses the existing Powerhouse daily execution, source freshness, Buffer readback, Composio/GA4 ingestion, Gmail connector evidence, outcomes and forecast calibration lineage, and writes one canonical health/runtime verdict each day.

**Architecture:** Reuse `bg_gezondheid_meten`, `powerhouse_daily_execution_guard`, `powerhouse_reconcile_social_delivery`, `powerhouse_source_freshness_v1`, existing Buffer/GA4 tables, sales outcomes, forecast calibration and `powerhouse_runtime_events`. Add only a terminal-publication reconciliation helper plus a `powerhouse_full_cycle_production_proof` aggregator. The proof is fail-closed: missing/stale evidence remains red; no synthetic provider success is generated.

**Tech Stack:** PostgreSQL 17 / Supabase, pg_cron, Node test contracts, GitHub Actions.

**Spec:** Existing canonical contracts `powerhouse-data-intake-learning-spine-v1`, `powerhouse-daily-execution-contract-v1`, `publication-live-proof-before-daily-green-v1`, `predictive-first-mover-intelligence-v1`.

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- No Make dependency and no parallel analytics, CRM, queue or learning store.
- Green requires production readback evidence; synthetic analytics are forbidden.
- Buffer remains social publication/performance provider.
- Composio remains connected-app/provider layer; GA4 evidence lands in existing `bg_ga4_*` lineage.
- Gmail is live for send/reply/readback, but provider connection evidence must be observed and freshness-bound.
- Revenue is only observed revenue from canonical outcome tables.
- Security-definer functions revoke execute from `public`, `anon`, `authenticated` and grant only `service_role`.

---

### Task 1: Add full-cycle SQL contract

**Files:**
- Create: `supabase/migrations/20260915122500_powerhouse_full_cycle_production_proof_v1.sql`

**Interfaces:**
- Consumes: existing health/source freshness, daily guard, publication obligations, Buffer/GA4/outcome/calibration/runtime tables.
- Produces: `powerhouse_reconcile_terminal_publication_state(date)` and `powerhouse_full_cycle_production_proof(date) -> jsonb`; hourly cron evidence.

- [ ] **Step 1: Add terminal publication reconciliation**

Reconcile only `publish` channel decisions that have no delivery reference and whose canonical publication obligation is terminal `SKIPPED`, converting the decision to a fail-closed `hold/decided` with reconciliation evidence. Never convert a live/published decision.

- [ ] **Step 2: Add fail-closed full-cycle proof**

Evaluate: required source freshness, Buffer sync + social metric readback, GA4/Composio sync + batch rows, Gmail provider attestation freshness, daily execution guard, publication proof, predictive health, canonical outcomes and calibration. Zero outcomes/calibrations are observed state, not fabricated success; overdue calibration is blocking.

- [ ] **Step 3: Persist proof evidence**

Upsert deterministic `powerhouse_runtime_events` event type `full_cycle_production_proof`, write `bg_gezondheid`, and append proof to the existing `powerhouse_daily_runs.evidence` record.

- [ ] **Step 4: Schedule proof**

Use pg_cron hourly at minute 57 after the existing execution guard; unschedule an older job of the same name first so migration is idempotent.

- [ ] **Step 5: Enforce SQL security**

Revoke function execute from public/anon/authenticated; grant service_role only.

### Task 2: Add regression contract

**Files:**
- Create: `tests/supabase-powerhouse-full-cycle-production-proof.test.mjs`

**Interfaces:**
- Consumes: migration source.
- Produces: CI protection against parallel stores, false green, missing provider evidence, missing security revoke/grant and missing cron.

- [ ] **Step 1: Assert reuse-first contract**

Test that the migration references existing canonical tables/functions and does not create a new outcome/analytics/learning table.

- [ ] **Step 2: Assert provider ownership**

Test explicit Buffer, Composio/GA4 and Gmail evidence checks and forbid Windsor/Make.

- [ ] **Step 3: Assert fail-closed and writeback**

Test that overall healthy requires all blocking subproofs; verify runtime event, health and daily-run writeback and deterministic dedupe.

- [ ] **Step 4: Assert security and schedule**

Test revoke/grant and the hourly proof cron contract.

### Task 3: Production promotion and readback

**Files:**
- Update via PR only; apply the merged migration to canonical Supabase project `adhjwmvyoixzjtmiroln`.

**Interfaces:**
- Consumes: green GitHub required gates and current production provider evidence.
- Produces: merged main SHA, applied Supabase migration, fresh proof event/readback and hard final status.

- [ ] **Step 1: Open PR and require all gates green**

Do not bypass `test` or BRAIN/security gates.

- [ ] **Step 2: Merge exact tested head SHA**

Merge only when required checks pass.

- [ ] **Step 3: Apply migration to production**

Use Supabase migration API on canonical project; do not create a second project/branch.

- [ ] **Step 4: Record Gmail connector attestation**

After real Gmail sent-mail readback succeeds, write a data-minimal runtime attestation (`provider=gmail`, capability, sample count, observed_at; no body/recipient content).

- [ ] **Step 5: Run production proof and repair recoverable blockers**

Run calibrator/predictive/publisher or canonical reconciliation only where existing evidence supports it. Do not fake missing outcomes or override safety/identity holds.

- [ ] **Step 6: Verify production**

Read back function definition, cron, latest proof event, daily run state, source freshness, Buffer/GA4 evidence and security advisors. Final status is `LIVE & BEWEZEN` only if the production proof is healthy; otherwise `DEELS LIVE` with exact red subproofs.