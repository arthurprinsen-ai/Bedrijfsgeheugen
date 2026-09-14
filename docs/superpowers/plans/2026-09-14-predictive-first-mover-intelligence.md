# Predictive First-Mover Intelligence v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak Predictive First-Mover Intelligence een dagelijks, meetbaar en fail-closed onderdeel van Powerhouse zodat Bedrijfsgeheugen vóór de markt relevante problemen kan voorspellen en die voorsprong commercieel kan omzetten richting €1.000.000 gerealiseerde omzet uiterlijk 14 september 2027.

**Architecture:** Hergebruik de bestaande signal-, content-, delivery- en learningketen. Voeg één canonieke forecast/first-mover laag toe vóór `powerhouse-content-orchestrator` v3, laat content provenance naar forecasts bewaren en sluit de lus via outcome/readback/calibration en revenue learning.

**Tech Stack:** Supabase Postgres, Supabase Edge Functions (Deno/TypeScript), pg_cron/pg_net, Anthropic governance registry, Buffer/readback, bestaande social/revenue learning stores, GitHub docs/tests.

**Spec:** `docs/superpowers/specs/2026-09-14-predictive-first-mover-intelligence-design.md`

## Global Constraints
- Canoniek contract: `predictive-first-mover-intelligence-v1`.
- Revenue operating contract: `growth-revenue-os-1m-2027-v1`.
- Hoofddoel: €1.000.000 gerealiseerde omzet uiterlijk 2027-09-14.
- Channel identity blijft `channel-identity-hard-gate-v2` fail-closed.
- Geen parallel shadow system.
- Geen toekomstvoorspelling als bestaand feit presenteren.
- Geen groen/completed zonder execution/readback/calibration evidence.
- Bestaande publicatiepaden blijven leidend.

---

### Task 1: Canonieke predictive datalaag en scoring

**Files:**
- Create: Supabase migration `predictive_first_mover_intelligence_v1`
- Test: SQL contract assertions via `information_schema`, constraints en view-output

**Interfaces:**
- Consumes: `bg_externe_signalen`, `bg_zoekwoordkansen`, social/revenue/growth evidence.
- Produces: `powerhouse_predictive_signals`, `powerhouse_forecasts`, `powerhouse_first_mover_claims`, `powerhouse_forecast_calibration`, `powerhouse_first_mover_queue`.

- [ ] **Step 1: Verify RED** — query for required tables/view and confirm the complete v1 contract is absent/incomplete.
- [ ] **Step 2: Apply migration** — create/normalize tables, checks, indexes and queue view; preserve existing compatible rows.
- [ ] **Step 3: Verify GREEN** — assert all objects, allowed states/modes and queue columns exist; insert a transaction-scoped fixture and prove saturation reduces first-mover rank.
- [ ] **Step 4: Verify no shadow duplication** — confirm a single table/view per canonical object.

### Task 2: Predictive engine

**Files:**
- Create/Deploy: Supabase Edge Function `powerhouse-predictive-engine`
- Test: controlled invocation against real signal tables with no publication side effects.

**Interfaces:**
- Consumes: fresh `bg_externe_signalen`, `bg_zoekwoordkansen`, `powerhouse_opportunities`, recent social/revenue learnings and existing forecasts.
- Produces: normalized predictive signals + candidate/active forecasts with evidence lineage and score components.

- [ ] **Step 1: Verify RED** — prove no active edge function currently owns the forecast contract.
- [ ] **Step 2: Implement minimal engine** — governance-gated AI creates evidence-bound forecasts; no content/publishing actions.
- [ ] **Step 3: Verify GREEN** — invoke engine and prove every produced forecast has probability, confidence, horizon/expected_by, evidence refs, saturation, strategic fit, commercial potential and first-mover score.
- [ ] **Step 4: Fail-closed test** — insufficient evidence yields no active forecast and records health evidence.

### Task 3: Orchestrator integration

**Files:**
- Modify/Deploy: `powerhouse-content-orchestrator` next version
- Test: invocation with/without predictive queue rows.

**Interfaces:**
- Consumes: top `powerhouse_first_mover_queue` rows in addition to existing recommendations/performance/rules.
- Produces: channel decisions and content artifacts with `forecast_id`, `claim_id`, `prediction_mode`, `prediction_rationale`, evidence refs.

- [ ] **Step 1: Verify RED** — current v3 does not query `powerhouse_first_mover_queue`.
- [ ] **Step 2: Add predictive candidates to decision context** without removing existing recommendation logic.
- [ ] **Step 3: Preserve truth gate** — prompt explicitly distinguishes forecast from fact.
- [ ] **Step 4: Verify GREEN** — a selected predictive candidate is traceable from decision/artifact back to forecast; non-selected candidates remain untouched.

### Task 4: Calibration and learning loop

**Files:**
- Create/Deploy: `powerhouse-forecast-calibrator`
- Create: SQL helper/view for due calibrations if needed.
- Test: fixture forecasts for materialized and missed outcomes.

**Interfaces:**
- Consumes: active/expired forecasts, external/search/growth/social/revenue evidence.
- Produces: calibration rows, Brier component, actual lead days, outcome/revenue evidence, updated forecast lifecycle.

- [ ] **Step 1: Verify RED** — prove due forecasts currently have no automatic calibration owner.
- [ ] **Step 2: Implement deterministic due selection** before AI interpretation.
- [ ] **Step 3: Implement evidence-bound materialized/missed calibration** and Brier calculation.
- [ ] **Step 4: Verify GREEN** — probability 0.8 + observed outcome 1 yields Brier component 0.04; missed yields 0.64.
- [ ] **Step 5: Feed calibration summary back into next predictive-engine context and existing revenue learning evidence where attribution exists.

### Task 5: Daily scheduling and fail-closed health

**Files:**
- Create/Modify: pg_cron jobs and health/execution guard SQL.
- Modify/Deploy: `bg-master-control` or canonical health endpoint to expose predictive freshness.

**Interfaces:**
- Produces daily order: signal refresh -> predictive engine -> content orchestrator -> publisher/readback -> calibration/learning.

- [ ] **Step 1: Verify RED** — no complete scheduled predictive chain exists.
- [ ] **Step 2: Schedule predictive engine before daily content orchestration and calibrator after outcome/readback window.
- [ ] **Step 3: Add health fields:** last predictive run, active forecasts, queue size, due calibrations, last calibration, degraded reason, revenue target progress.
- [ ] **Step 4: Harden execution guard** — missing predictive evidence or overdue calibration makes daily state degraded, never completed.
- [ ] **Step 5: Verify GREEN** — run status query proves healthy only with required evidence.

### Task 6: Live proof and architecture readback

**Files:**
- Update: this plan/spec only if actual interfaces differ after implementation.

**Interfaces:**
- End-to-end proof: signal -> forecast -> queue -> channel decision/artifact -> delivery state -> calibration obligation/readback.

- [ ] **Step 1: Run predictive engine in production with real current evidence.
- [ ] **Step 2: Read back created/updated forecast and first-mover queue record.
- [ ] **Step 3: Run content orchestrator and prove forecast provenance if selected, or explicit skip/hold if not selected.
- [ ] **Step 4: Verify existing truth/channel gates remain active.
- [ ] **Step 5: Verify calibration obligation exists for every active forecast.
- [ ] **Step 6: Report only evidenced live status; list any remaining external blocker separately.
