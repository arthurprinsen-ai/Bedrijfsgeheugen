# Powerhouse Unified Revenue & Growth Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Converge existing Powerhouse v96, Buffer/social learning, blog/SEO growth signals, LinkedIn/Notion sales actions and daily work generation onto one Supabase-native revenue-first closed loop with no Make dependency in the critical path.

**Architecture:** Extend the existing production-proven `powerhouse-runtime` Edge Function and database schema into the canonical event/action/outcome/learning core. Existing channel collectors remain adapters: they normalize evidence, then call the same core ingest API; the core computes cross-channel learnings, produces bounded daily actions/content recommendations, and projects current state to cockpit/Notion. Existing release and safety contracts are preserved.

**Tech Stack:** Supabase Postgres + Edge Functions (Deno/TypeScript), Node.js 22, Netlify Functions, GitHub Actions, Notion projection, Buffer API.

**Spec:** `docs/superpowers/specs/2026-09-09-powerhouse-unified-revenue-growth-core-design.md`

## Global Constraints

- Make is absent from the critical path.
- Revenue/orders are highest-weight outcomes; engagement metrics are evidence only.
- No DM reply without real conversation context.
- No post reply without real post text.
- No WhatsApp action without phone evidence and explicit permission; no email action without a real email address.
- No auto-send in this release.
- Daily loop is idempotent and bounded.
- Notion is a knowledge/work projection, not transactional truth.
- Existing production paths remain rollback targets until live readback passes.

---

### Task 1: Bring the existing v96 Supabase runtime onto the unified branch

**Files:**
- Create from proven branch: `supabase/functions/powerhouse-runtime/index.ts`
- Create from proven branch: `supabase/migrations/20260909090000_powerhouse_v96_supabase_native_runtime.sql`
- Create from proven branch: `tests/powerhouse-v96-supabase-native.test.mjs`

**Interfaces:**
- Produces: authenticated routes `health`, `ingest`, `actions`, `outcomes`, `learning`; tables `powerhouse_runtime_events`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_sales_learnings`.

- [ ] **Step 1: copy the already production-proven files from branch `powerhouse-v96-supabase-native` without rewriting behavior.**
- [ ] **Step 2: run the v96 contract tests and confirm the baseline passes before extending it.**
- [ ] **Step 3: commit the baseline import.**

### Task 2: Add canonical content/topic identity and revenue-weighted learning

**Files:**
- Create: `supabase/migrations/20260909103000_powerhouse_unified_growth_core.sql`
- Modify: `supabase/functions/powerhouse-runtime/index.ts`
- Create: `tests/powerhouse-unified-growth-core.test.mjs`

**Interfaces:**
- Consumes: existing v96 event/action/outcome tables.
- Produces: `content_key`, `topic_key`, `campaign_key`, `opportunity_key` columns; `powerhouse_content_recommendations`; `powerhouse_daily_runs`; deterministic revenue weights.

- [ ] **Step 1: write failing tests asserting outcome weights `revenue/order > offer > meeting > reply > lead > engagement > impression`, cross-channel topic learning, and immutable event evidence.**
- [ ] **Step 2: add the migration with new identity columns, recommendation/daily-run tables, indexes, RLS, and helper RPCs.**
- [ ] **Step 3: extend runtime learning so outcome effects carry `topic_key`, `content_key`, `channel`, `sample_size`, and a revenue-weighted `priority_delta`; learned adjustments query both subject-specific and topic/channel learnings.**
- [ ] **Step 4: run the focused unified-core test plus the original v96 test.**
- [ ] **Step 5: commit.**

### Task 3: Make Buffer/social an adapter into the single core

**Files:**
- Modify: `netlify/functions/buffer-social-collect.mjs`
- Modify: `netlify/functions/_buffer-social-collector.mjs`
- Create: `netlify/functions/_powerhouse-core-client.mjs`
- Create: `tests/powerhouse-buffer-core-adapter.test.mjs`

**Interfaces:**
- Produces: `social_post_published` and `social_metric_observed` events through `powerhouse-runtime/ingest` using idempotency keys already derived from Buffer post IDs/timestamps.

- [ ] **Step 1: write a failing adapter test proving Buffer no longer requires `_social-learning-store` for the primary path and posts normalized social evidence to the core client.**
- [ ] **Step 2: implement `_powerhouse-core-client.mjs` with `ingestPowerhouseEvent`, `recordPowerhouseOutcome`, `getPowerhouseActions`; authenticate with `POWERHOUSE_CORE_TOKEN` and `POWERHOUSE_CORE_URL`; fail closed when unconfigured.**
- [ ] **Step 3: map each normalized Buffer post to one publication event plus one metric event preserving text, content hash, platform and observed metrics.**
- [ ] **Step 4: keep legacy social-store delivery as noncritical fallback only when explicitly enabled by `BG_LEGACY_SOCIAL_FALLBACK=true`.**
- [ ] **Step 5: run Buffer collector tests and unified adapter test.**
- [ ] **Step 6: commit.**

### Task 4: Route blog/SEO/website growth observations into the same core

**Files:**
- Modify: `netlify/functions/growth-event.mjs`
- Create: `tools/seo-growth/powerhouse-core-map.mjs`
- Create: `tests/powerhouse-growth-event-core.test.mjs`

**Interfaces:**
- Produces canonical `website_conversion`, `seo_metric_observed`, `lead_created`, and content interaction events with `content_key/topic_key` when derivable.

- [ ] **Step 1: write a failing test for mapping existing normalized growth observations into canonical Powerhouse events without removing existing DataHub persistence.**
- [ ] **Step 2: implement `mapGrowthObservationToPowerhouseEvent(observation,input)` and derive stable content keys from canonical URL/content fingerprint.**
- [ ] **Step 3: after existing DataHub persistence, send the mapped observation to the Powerhouse core client; report `powerhouse_core` status separately so core failure cannot be misreported as success.**
- [ ] **Step 4: run existing SEO-growth tests plus the new core adapter test.**
- [ ] **Step 5: commit.**

### Task 5: Add daily autonomous revenue-and-content cycle

**Files:**
- Modify: `supabase/functions/powerhouse-runtime/index.ts`
- Create: `netlify/functions/powerhouse-daily-cycle.mjs`
- Create: `tests/powerhouse-daily-cycle.test.mjs`
- Create: `.github/workflows/powerhouse-unified-core.yml`

**Interfaces:**
- Adds route `daily` and client-facing daily cycle with maximum 15 sales actions and maximum 10 content recommendations.

- [ ] **Step 1: write failing tests proving same-day rerun dedupes, queue is bounded, and recommendations use cross-channel learning while vanity-only content cannot outrank downstream commercial success.**
- [ ] **Step 2: add a `daily` runtime route that records one `powerhouse_daily_runs` row per date, refreshes learning summaries, retrieves the top action queue, and writes bounded topic/content recommendations.**
- [ ] **Step 3: create a scheduled Netlify function at `30 6 * * *` to trigger the authenticated daily route every day and return degraded status on failure.**
- [ ] **Step 4: add CI for v96 + unified core + Buffer + growth + daily tests.**
- [ ] **Step 5: run all focused tests.**
- [ ] **Step 6: commit.**

### Task 6: Project one runtime truth to Notion and cockpit consumers

**Files:**
- Create: `netlify/functions/powerhouse-current-projection.mjs`
- Create: `tests/powerhouse-current-projection.test.mjs`
- Modify only if required by existing cockpit contract: `platform/linkedin-revenue-cockpit.mjs`

**Interfaces:**
- Consumes: core `actions`, `learning`, daily recommendations.
- Produces: one projection shape `{today, feed, dm, connections, content, learning, health}`.

- [ ] **Step 1: write a failing projection test proving all tabs are filtered views over the same canonical action state, not separate ranking engines.**
- [ ] **Step 2: implement the projection function using core APIs and preserve existing cockpit send-ready evidence guards.**
- [ ] **Step 3: expose enough stable fields for Notion writeback: `Actiekanaal`, `Volgende actie`, `Actiedatum`, `Salesstatus`, `Powerhouse reden`, `Omzetkans`, outcome and learning evidence.**
- [ ] **Step 4: run LinkedIn Revenue Cockpit tests and projection tests.**
- [ ] **Step 5: commit.**

### Task 7: Deploy Supabase core and prove live cross-channel closed loop

**Files:**
- Production Supabase migration/function deployment (no repository-only substitute).

**Interfaces:**
- Live production routes: `health`, `ingest`, `actions`, `outcomes`, `learning`, `daily`.

- [ ] **Step 1: apply both v96 and unified migrations to the active Supabase project.**
- [ ] **Step 2: deploy the current unified `powerhouse-runtime` Edge Function.**
- [ ] **Step 3: run production health readback and require `makeCriticalPath=false`.**
- [ ] **Step 4: run four real canaries: social metric event, blog/SEO event, grounded DM event, revenue/order outcome.**
- [ ] **Step 5: verify the resulting learning changes the next decision/recommendation and that the daily route is idempotent.**
- [ ] **Step 6: verify private tables/RLS and no service credential in public code.**

### Task 8: PR, required CI, merge and post-merge readback

**Files:**
- PR metadata and existing branch protection/release workflows.

- [ ] **Step 1: open a scoped PR with `Change-Scope` and `Scope-Budget` metadata so Required test branch hygiene can classify the change.**
- [ ] **Step 2: wait for the new unified-core workflow, LinkedIn Revenue Cockpit, Required test and BRAIN delivery checks; diagnose failures at root cause rather than force-merging.**
- [ ] **Step 3: merge only when the repository-required `test` context is green and the head SHA is stable.**
- [ ] **Step 4: verify main contains the exact merged core and production Supabase remains healthy after merge.**
- [ ] **Step 5: update Notion Powerhouse Latest Verified State from blocked/Make-dependent wording to unified Supabase-native current state, retaining Chrome LinkedIn adapter verification as a separate explicit evidence obligation if it cannot be executed remotely.**
