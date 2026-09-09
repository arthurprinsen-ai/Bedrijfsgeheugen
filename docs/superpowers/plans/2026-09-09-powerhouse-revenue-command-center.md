# Powerhouse Revenue Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and ship an execution-first, Supabase-native Revenue Command Center that ranks the highest expected-revenue actions, records canonical outcomes, learns across social/blog/SEO/sales signals and improves the next decision every day.

**Architecture:** Keep Supabase `powerhouse-runtime` as canonical transactional core. Upgrade the existing Netlify LinkedIn Revenue Cockpit function into a thin authenticated read/write adapter over the Supabase core, with Notion only as enrichment/projection. Replace the current channel-first UI with an Order Queue plus Radar, Conversations, Relations, Content, Deals, Learning and System Health views.

**Tech Stack:** Supabase Edge Functions + Postgres/RLS/pg_cron, Netlify Functions, vanilla ES modules/HTML/CSS, Node `node:test`, Notion API.

**Spec:** `docs/superpowers/specs/2026-09-09-powerhouse-revenue-command-center-design.md`

## Global Constraints
- Make is not part of the critical runtime.
- Default actionable queue is bounded to 15.
- No auto-send.
- DM/post drafts fail closed without concrete context.
- `executed` and `skipped` are not success learnings.
- Revenue/order outcomes outrank engagement.
- All write actions require canonical Supabase readback before UI completion.
- No secrets in Git.

---

### Task 1: Canonical runtime and scoring contract

**Files:**
- Modify: `supabase/functions/powerhouse-runtime/index.ts`
- Create: `supabase/migrations/20260909140000_powerhouse_revenue_command_center.sql`
- Create: `tests/supabase-powerhouse-revenue-command-center.test.mjs`

**Interfaces:**
- Consumes: existing `powerhouse_runtime_events`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_sales_learnings`, `powerhouse_daily_runs`, `powerhouse_content_recommendations`.
- Produces: `powerhouse_opportunities`, stage/evidence projection, expected-revenue score components, `/opportunities`, richer `/actions`, `/outcomes`, `/learning`, `/daily` responses.

- [ ] **Step 1: Write failing tests** asserting revenue-first score components, immutable order/revenue evidence, opportunity lifecycle progression, no learning from `executed`/`skipped`, 15-item queue, cross-channel topic/channel learning and fail-closed DM/post behavior.
- [ ] **Step 2: Run** `node --test tests/supabase-powerhouse-revenue-command-center.test.mjs` and confirm RED against current source.
- [ ] **Step 3: Add migration** for private RLS-enabled `powerhouse_opportunities` with unique `opportunity_key`, `subject_key`, `person_key`, `company_key`, `stage`, `expected_value_eur`, `probability`, `confidence`, `score_components`, `last_evidence_at`, `last_action_at`, `next_action_at`, `status`, timestamps and indexes. Add service-role grants only.
- [ ] **Step 4: Upgrade runtime** so ingest/outcome/daily keep opportunity projection synchronized, compute `expected_revenue_value`, expose explainable score components, preserve current evidence guards, and use confidence/sample-size-aware learning.
- [ ] **Step 5: Run** the focused test again and confirm GREEN.

### Task 2: Secure Netlify-to-Supabase adapter

**Files:**
- Modify: `netlify/functions/linkedin-revenue-cockpit.mjs`
- Create: `tests/linkedin-revenue-command-center-api.test.mjs`

**Interfaces:**
- Consumes: `POWERHOUSE_CORE_URL`, `POWERHOUSE_CORE_TOKEN`, existing internal Basic Auth and Notion credentials.
- Produces: schema `powerhouse-revenue-command-center-v1` GET snapshot and POST outcome/refresh writeback.

- [ ] **Step 1: Write failing tests** for Basic Auth, missing core token fail-closed, GET canonical Supabase queue, Notion enrichment degradation without total failure, POST outcome delegation and canonical readback.
- [ ] **Step 2: Run** `node --test tests/linkedin-revenue-command-center-api.test.mjs` and confirm RED.
- [ ] **Step 3: Implement core client** calling `/health`, `/actions?limit=15`, `/learning` and `/opportunities` using `x-powerhouse-token`; treat Notion as optional enrichment rather than source of truth.
- [ ] **Step 4: Implement POST** outcome types `executed`, `reply_received`, `no_response`, `meeting_booked`, `offer_created`, `offer_accepted`, `offer_rejected`, `order_won`, `order_lost`, `revenue_observed`, `not_relevant`, `defer`; refresh snapshot after successful writeback.
- [ ] **Step 5: Run** focused API tests and confirm GREEN.

### Task 3: Revenue Command Center client

**Files:**
- Modify: `intern/linkedin-revenue/index.html`
- Modify: `intern/linkedin-revenue/cockpit.js`
- Modify: `tests/linkedin-revenue-cockpit.test.mjs`

**Interfaces:**
- Consumes: `powerhouse-revenue-command-center-v1` snapshot.
- Produces: Order Queue, Radar, Conversations, Relations, Content, Deals, Learning and System Health views with canonical outcome controls.

- [ ] **Step 1: Update tests to RED** requiring `data-cockpit="powerhouse-revenue-command-center"`, max 15, Order Queue, expected revenue/probability/confidence, all secondary views, canonical POST outcome buttons, stale/degraded state and no localStorage completion truth.
- [ ] **Step 2: Run** `node --test tests/linkedin-revenue-cockpit.test.mjs` and confirm RED.
- [ ] **Step 3: Replace layout** with execution-first Order Queue and responsive views; each card displays stage, expected order value, probability/confidence, expected revenue value, why-now evidence, next best action, channel, source, and guarded draft.
- [ ] **Step 4: Replace `Gedaan` localStorage** with POST outcome controls; on write failure retain card state and show error; on success reload canonical snapshot.
- [ ] **Step 5: Add Learning/Content/System views** showing only decision-relevant learnings, cross-channel recommendations, daily-run freshness, source health and Make-free core health.
- [ ] **Step 6: Run** cockpit tests and confirm GREEN.

### Task 4: Production credentials and scheduler

**Files:**
- No secret values committed.
- Netlify environment: `POWERHOUSE_CORE_TOKEN` production/functions/runtime.
- Supabase token row: scoped `health,actions,outcomes,learning,daily` plus opportunities/read scope supported by runtime.

**Interfaces:**
- Produces authenticated Netlify→Supabase production path.

- [ ] **Step 1: Generate a cryptographically random server token** outside Git and hash it with SHA-256.
- [ ] **Step 2: Insert only the hash** in `powerhouse_device_tokens` with server scopes and label `netlify-revenue-command-center`.
- [ ] **Step 3: Store only the raw token** as secret Netlify env `POWERHOUSE_CORE_TOKEN` for production functions/runtime.
- [ ] **Step 4: Verify** token-authenticated `/health` and `/actions` from a server-side canary path.
- [ ] **Step 5: Verify pg_cron daily job** remains active and a same-day `/daily` call is idempotent.

### Task 5: Integration and release gates

**Files:**
- Modify only if required by existing lane classifier: delivery config/tests.
- Tests: all files from Tasks 1–3 plus existing LinkedIn and Supabase regression tests.

**Interfaces:**
- Produces protected-main candidate and production release evidence.

- [ ] **Step 1: Run focused suite**: `node --test tests/supabase-powerhouse-revenue-command-center.test.mjs tests/supabase-powerhouse-v96-native.test.mjs tests/linkedin-revenue-runtime.test.mjs tests/linkedin-revenue-cockpit.test.mjs tests/linkedin-revenue-command-center-api.test.mjs`.
- [ ] **Step 2: Open scoped PR** with exact changed paths and Scope-Budget.
- [ ] **Step 3: Wait for Required test**; diagnose root cause if red, do not bypass.
- [ ] **Step 4: Merge only when required `test` is green.**
- [ ] **Step 5: Deploy latest canonical `powerhouse-runtime` Edge Function and apply migration if not already applied.
- [ ] **Step 6: Verify Netlify production deploy** serves exact merged commit.

### Task 6: Production closed-loop canary and writeback

**Files:**
- Notion verified-state page only; no code unless canary finds a defect.

**Interfaces:**
- Proves `signal → action → outcome → learning → changed next decision` and daily autonomous loop.

- [ ] **Step 1: Read production health** and assert runtime version, `unifiedCore=true`, `makeCriticalPath=false`, DB and learning feedback true.
- [ ] **Step 2: Use synthetic evidence canaries** for DM with context, DM without context, post with context and post without context; verify fail-closed guards.
- [ ] **Step 3: Record synthetic downstream outcome** and verify learning/sample/confidence writeback plus changed later ranking.
- [ ] **Step 4: Verify order/revenue outcome** writes immutable evidence and updates deal/opportunity projection.
- [ ] **Step 5: Verify daily run** completed and returns a bounded fresh Order Queue/content recommendations.
- [ ] **Step 6: Verify live internal cockpit** loads canonical Supabase data and POST writeback works from deployed page. Real LinkedIn browser extraction remains a separate physical-browser readback if this environment cannot control the user's Mac/Chrome.
- [ ] **Step 7: Update and re-fetch** the Powerhouse Latest Verified State record with exact merge SHA, runtime version, canary evidence and any remaining external browser gate.

## Self-review
- Spec coverage: architecture, scoring, lifecycle, security, degraded sources, social/blog/SEO cross-learning, daily scheduler, UI, production and Notion writeback all map to Tasks 1–6.
- Placeholder scan: no TBD/TODO/implement-later instructions.
- Type consistency: canonical keys are `action_id`, `opportunity_key`, `expected_value_eur`, `probability`, `confidence`, `score_components`; the Netlify adapter maps these to camelCase UI fields only at the boundary.
