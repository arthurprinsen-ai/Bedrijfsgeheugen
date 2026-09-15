# Powerhouse Data Intake & Learning Spine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing Bedrijfsgeheugen Powerhouse so all approved internal and external growth/intelligence sources are registered, ingested through canonical event lineage, freshness-checked, and consumed by the existing closed-loop learning system.

**Architecture:** Reuse existing Supabase `powerhouse_runtime_events`, `growth_events`, `growth_outcomes`, `social_metric_snapshots`, forecasts/calibration and learning tables. Add only a compact source registry/health schema if no equivalent exists, source adapters for missing GA4/GSC/external-intelligence ingestion, and one canonical health/readback workflow that fails closed and feeds existing learning/error lineage.

**Tech Stack:** GitHub Actions, Node.js, Supabase/Postgres, existing Netlify/Powerhouse server functions, provider HTTP APIs, node:test.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-data-intake-learning-spine-design.md`

## Global Constraints
- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- Supabase is canonical persistence.
- No Make dependency.
- No parallel CRM, analytics store, brain, queue, calendar or learning system.
- Secrets are never committed.
- Provider sources remain blocked rather than fake-green when credentials/access are absent.
- Production readback, not job execution alone, determines health.

---

### Task 1: Map existing ingestion contracts and tests
**Files:** inspect `.github/workflows/*`, `config/*`, `tools/*`, `netlify/functions/*`, `supabase/migrations/*`, `tests/*`.
**Produces:** exact reuse points and target interfaces for later tasks.
- [ ] Search for runtime event ingestion, growth-event ingestion, Buffer social collection, SEO/search source config, universal event producers, learning/error ledger and daily scheduler.
- [ ] Fetch the concrete files and record the exact contracts reused by Tasks 2–6.
- [ ] Run/read existing tests relevant to those contracts and preserve compatibility.

### Task 2: Canonical source registry and health contract
**Files:** create/modify only the existing canonical config and migration locations discovered in Task 1; tests in existing test layout.
**Produces:** deterministic source IDs, cadence, SLA, provider class, cost guard, target event types and health verdict logic.
- [ ] Write failing tests asserting required sources and fail-closed freshness semantics.
- [ ] Implement the source registry using config-first metadata.
- [ ] Add only the minimal Supabase health persistence required for production readback if no equivalent table exists.
- [ ] Verify idempotency keys and source-state transitions.

### Task 3: GA4 and Google Search Console adapters
**Consumes:** Task 2 source registry and existing runtime/growth ingest contract.
**Produces:** normalized observations written to existing Powerhouse lineage.
- [ ] Write failing adapter tests with representative provider payload fixtures.
- [ ] Implement GSC search analytics normalization for query/page/impressions/clicks/ctr/position/date.
- [ ] Implement GA4 report normalization for traffic/content/conversion aggregates supported by configured dimensions/metrics.
- [ ] Ensure no secrets are committed and missing credentials result in blocked health state, not success.
- [ ] Add daily GitHub Action orchestration using repository secrets and existing Supabase ingestion endpoint/pattern.

### Task 4: External market/competitor/SEO intelligence integration
**Consumes:** source registry, existing SEO/DataForSEO/public-intelligence components.
**Produces:** bounded evidence-bearing external observations in existing runtime/intelligence lineage.
- [ ] Write tests for cost guards, dedupe, evidence attribution and source timestamp.
- [ ] Reuse existing DataForSEO/search collectors; add only missing canonical adapter glue.
- [ ] Register technical SEO/web-performance/public market/news/company/competitor source classes as active, blocked or manual according to real provider capability.
- [ ] Prevent indiscriminate polling and preserve provider rate/cost guards.

### Task 5: Unified daily health + learning bridge
**Consumes:** all registered sources and existing learning/calibration loops.
**Produces:** one daily source-health/readback verdict plus canonical runtime/error/learning evidence.
- [ ] Write failing tests for fresh, stale, blocked, rejected and downstream-not-consumed states.
- [ ] Implement health evaluator from last successful collection, newest observed date, accepted/rejected counts, SLA and downstream evidence.
- [ ] Emit Powerhouse runtime events for health and failures using deterministic dedupe keys.
- [ ] Attach source observations to existing learning/calibration/revenue loops without creating another learning store.
- [ ] Add/update one canonical daily workflow that evaluates all sources.

### Task 6: Canonical documentation, regression suite and production release
**Files:** canonical current-state docs/runbooks discovered in Task 1 and existing regression test files.
**Produces:** production release evidence and explicit per-source status.
- [ ] Update canonical docs with the source registry, contracts, credentials names, schedules and troubleshooting/readback commands.
- [ ] Run all targeted tests and existing required regression suite.
- [ ] Open PR from `powerhouse/data-intake-learning-spine-v1` to `main`.
- [ ] Verify required checks; fix root causes only.
- [ ] Merge when green.
- [ ] Verify production workflow/deploy activation.
- [ ] Query production Supabase for source-health/runtime evidence, newest observation timestamps and downstream learning/readback evidence.
- [ ] Record final status per source: LIVE & BEWEZEN, DEELS LIVE, GEBLOKKEERD or NIET GEDAAN.
