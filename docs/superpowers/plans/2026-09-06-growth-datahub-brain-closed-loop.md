# Growth DataHub Brain Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist website and commercial growth outcomes in the EU DataHub, preserve them while Make is paused, and replay safely through BG211 so Powerhouse learns from leads, orders and revenue instead of traffic alone.

**Architecture:** Netlify validates and queues growth events, then writes them server-to-server to a token-authenticated Supabase Edge Function. Supabase stores immutable events/outcomes plus a replay queue/read model. BG211 remains the canonical Brain route; Make delivery stays gated by `BG211_DELIVERY_ENABLED` and is retried only after runtime authority returns.

**Tech Stack:** Static HTML, Node.js Netlify Functions, Netlify Blobs, Supabase Postgres + Edge Functions, Make BG212/BG211/BG205/BG168/BG166, node:test, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-06-growth-datahub-brain-closed-loop-design.md`

## Global Constraints
- All public site URLs must be absolute `https://www.bedrijfsgeheugen.nl/...` URLs.
- Never collect form contents, email, phone, names or free-text visitor PII in growth learning tables.
- Supabase growth storage is server-only with RLS and revoked anon/authenticated privileges.
- Website requests must remain successful when Make/Brain is paused.
- No paid/repeated Make retry while organization/team is quota-paused.
- No `learned` claim without BG211 -> BG168 -> BG166 execution/readback evidence.
- Revenue/outcome mutation requires server-side service-token authentication.

---

### Task 1: Contract tests
**Files:**
- Create: `tests/growth-datahub-closed-loop.test.mjs`
- Create: `tools/seo-growth/datahub-contract.mjs`

- [ ] Add RED tests for accepted event fields, PII rejection, allowed outcome stages, idempotency keys and business-value scoring.
- [ ] Run `node --test tests/growth-datahub-closed-loop.test.mjs` and verify RED.
- [ ] Implement the minimal normalization/scoring helpers.
- [ ] Re-run and verify GREEN.

### Task 2: EU DataHub schema
**Files:**
- Create: `supabase/migrations/20260906_growth_datahub_closed_loop.sql`

- [ ] Create `growth_events`, `growth_outcomes`, `growth_page_daily`, `growth_brain_queue`.
- [ ] Add unique event/outcome identities and attribution indexes.
- [ ] Add server-only RLS/privilege restrictions.
- [ ] Add idempotent RPCs for event/outcome persistence and daily rollup.
- [ ] Apply migration to project `adhjwmvyoixzjtmiroln` and read schema back.

### Task 3: Token-authenticated Supabase ingest
**Files:**
- Create repository contract: `supabase/functions/growth-datahub-ingest/index.ts`
- Deploy Edge Function: `growth-datahub-ingest`

- [ ] Require `x-bg-service-token`; compare SHA-256 to the same existing service-token hash used by the portal EU service.
- [ ] Accept `event`, `outcome`, and `status` actions only.
- [ ] Use service role internally; never expose database credentials.
- [ ] Persist through RPC and return dedupe/readback state.
- [ ] Canary event and query DataHub for exact event id.

### Task 4: Netlify durable dual-write
**Files:**
- Modify: `netlify/functions/growth-event.mjs`
- Create: `netlify/functions/growth-outcome.mjs`
- Create: `netlify/functions/growth-replay.mjs`

- [ ] Keep Blobs queue as first local durability layer.
- [ ] Persist normalized event to `growth-datahub-ingest` using `BG_PORTAL_EU_SERVICE_TOKEN`.
- [ ] Make DataHub failure non-blocking to page requests but visible in queue state.
- [ ] Add authenticated outcome endpoint for `lead|qualified_lead|appointment|proposal|won_order|revenue`.
- [ ] Add bounded replay endpoint/scheduled function; do nothing while `BG211_DELIVERY_ENABLED!=true` and cap work per run.

### Task 5: Powerhouse producer + deferred obligation
**Files:**
- Modify: `config/universal-event-producers.json`
- Create/update deferred writeback row in Supabase.

- [ ] Add explicit `growth-datahub-outcome` producer with BG211/BG205/BG168/BG166 lineage.
- [ ] Store current Make quota blocker as one deduped open deferred writeback.
- [ ] Preserve exact replay target `BG211 -> BG168 -> BG166` and no retry storm.

### Task 6: Full verification and production
- [ ] Run focused node tests.
- [ ] Run existing SEO order + SEO growth test suites.
- [ ] Run full Netlify-equivalent build.
- [ ] Open/update PR, wait required checks.
- [ ] Merge only when green.
- [ ] Verify Netlify production commit equals merge SHA.
- [ ] Live canary `/api/growth-event` and verify Supabase DataHub readback.
- [ ] Verify `/api/growth-outcome` rejects unauthenticated calls.
- [ ] Attempt exactly one BG211 canary only if Make runtime authority is available; otherwise leave delivery disabled and preserve open obligation.