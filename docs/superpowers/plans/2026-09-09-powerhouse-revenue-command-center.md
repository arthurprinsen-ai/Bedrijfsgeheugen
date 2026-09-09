# Powerhouse Revenue Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current informational LinkedIn Revenue Cockpit with a production Revenue Command Center that ranks and executes evidence-backed next-best-actions against the canonical Supabase Revenue & Growth Core, learns from real outcomes, and optimizes for orders and revenue.

**Architecture:** Keep Supabase `powerhouse-runtime` as the single transactional source of truth. Add a minimal opportunity/deal projection and command-center snapshot on top of existing runtime events/actions/outcomes/learnings; make the Netlify internal endpoint an authenticated adapter over that core; replace the current local-only cockpit UX with an execution-first Order Queue and secondary Radar/Conversations/Relations/Content/Deals/Learning views. Notion, LinkedIn, Buffer/social, blog/SEO and website remain evidence adapters/projections, not competing brains.

**Tech Stack:** Supabase Postgres + Edge Functions (Deno/TypeScript), Netlify Functions (Node ESM), vanilla HTML/CSS/ES modules, Node `node:test`, GitHub Actions, Notion as context/projection.

**Spec:** `docs/superpowers/specs/2026-09-09-powerhouse-revenue-command-center-design.md`

## Global Constraints

- Make is not part of the critical runtime or fallback.
- Canonical loop: `SIGNAL → CONTEXT → DECISION → ACTION → EVIDENCE → OUTCOME → LEARNING → NEXT DECISION`.
- Primary optimization target is downstream revenue/orders; engagement is intermediate evidence only.
- Maximum default actionable queue is 15.
- No auto-send for DM/email/WhatsApp/social replies.
- DM drafts require real conversation context; post replies require real post text/direct evidence.
- WhatsApp requires a real phone number plus explicit permission; email requires a real address.
- `executed` and `skipped` are process states, not positive learning outcomes.
- All canonical writes must be read back before UI marks completion.
- Existing Supabase runtime/event/action/outcome/learning tables are reused; no parallel persistence model.

---

### Task 1: Opportunity and Deal Projection

**Files:**
- Create: `supabase/migrations/20260909140500_powerhouse_revenue_command_center.sql`
- Test: `tests/powerhouse-revenue-command-center-schema.test.mjs`

**Interfaces:**
- Consumes: existing `powerhouse_runtime_events`, `powerhouse_sales_actions`, `powerhouse_sales_outcomes`, `powerhouse_sales_learnings`.
- Produces: `powerhouse_opportunities`, `powerhouse_opportunity_stage_events`, RPC `powerhouse_command_center_snapshot(p_limit integer default 15)`.

- [ ] **Step 1: Write failing schema test**

Create `tests/powerhouse-revenue-command-center-schema.test.mjs` asserting the migration contains RLS/service-role protection, opportunity lifecycle stages, stage history, expected value/probability/confidence fields, and bounded snapshot RPC.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const migrationUrl = new URL('../supabase/migrations/20260909140500_powerhouse_revenue_command_center.sql', import.meta.url);
const source = () => readFile(migrationUrl, 'utf8');

test('command center opportunity projection is private and bounded', async () => {
  const sql = await source();
  assert.match(sql, /create table if not exists public\.powerhouse_opportunities/i);
  assert.match(sql, /create table if not exists public\.powerhouse_opportunity_stage_events/i);
  assert.match(sql, /alter table public\.powerhouse_opportunities enable row level security/i);
  assert.match(sql, /grant all on public\.powerhouse_opportunities to service_role/i);
  assert.match(sql, /powerhouse_command_center_snapshot\(p_limit integer default 15\)/i);
  assert.match(sql, /least\(coalesce\(p_limit,15\),50\)/i);
});

test('opportunity lifecycle and expected-value evidence are explicit', async () => {
  const sql = await source();
  for (const stage of ['signal','opportunity','lead','meeting','offer','order','revenue','lost']) assert.match(sql, new RegExp(stage, 'i'));
  for (const field of ['expected_order_value_eur','order_probability','probability_confidence','expected_revenue_eur','last_evidence_at','next_action_at']) assert.match(sql, new RegExp(field, 'i'));
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/powerhouse-revenue-command-center-schema.test.mjs`
Expected: FAIL because the migration does not exist.

- [ ] **Step 3: Implement migration**

Create tables keyed by stable `opportunity_key`, stage enum/check constraint, evidence JSONB, expected order value, probability/confidence, expected revenue, last/next action timestamps, immutable stage-event rows, RLS/service-role grants, indexes, and snapshot RPC joining the highest-priority unresolved action per opportunity/subject.

- [ ] **Step 4: Run test and verify GREEN**

Run: `node --test tests/powerhouse-revenue-command-center-schema.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260909140500_powerhouse_revenue_command_center.sql tests/powerhouse-revenue-command-center-schema.test.mjs
git commit -m "feat: add revenue opportunity projection"
```

### Task 2: Revenue-First Decisioning in `powerhouse-runtime`

**Files:**
- Modify: `supabase/functions/powerhouse-runtime/index.ts`
- Test: `tests/powerhouse-revenue-command-center-runtime.test.mjs`

**Interfaces:**
- Consumes: Task 1 opportunity projection/RPC and existing runtime action/outcome/learning functions.
- Produces: `expectedRevenueScore(event, learnings)`, opportunity upsert/stage transition behavior, command-center route, outcome-driven stage updates.

- [ ] **Step 1: Write failing runtime tests**

Test that source includes revenue-first expected-value ranking, explicit probability confidence, canonical stage updates for meeting/offer/order/revenue/lost, no positive learning for `executed`/`skipped`, and a `command-center` GET route.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/powerhouse-revenue-command-center-runtime.test.mjs`
Expected: FAIL on missing command-center behavior.

- [ ] **Step 3: Implement minimal runtime changes**

Add stage priors, evidence-quality factor, urgency factor, strategic-fit factor and expected-order-value calculation. On ingest, upsert opportunity context when a stable subject/company/opportunity exists. On outcome, transition stages only for evidence-backed downstream outcomes. Add `GET /command-center?limit=15` returning the snapshot RPC plus current learnings/daily health. Preserve existing fail-closed DM/post/channel guards.

- [ ] **Step 4: Run old and new runtime tests**

Run: `node --test tests/supabase-powerhouse-v96-native.test.mjs tests/powerhouse-revenue-command-center-runtime.test.mjs`
Expected: PASS, zero failures.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/powerhouse-runtime/index.ts tests/powerhouse-revenue-command-center-runtime.test.mjs
git commit -m "feat: rank actions by expected revenue"
```

### Task 3: Internal Command-Center Backend Adapter

**Files:**
- Modify: `netlify/functions/linkedin-revenue-cockpit.mjs`
- Test: `tests/linkedin-revenue-command-center.test.mjs`

**Interfaces:**
- Consumes: authenticated internal request; Supabase `powerhouse-runtime` command-center/actions/outcomes routes; Notion enrichment sources.
- Produces: `schemaVersion: 'powerhouse-revenue-command-center-v2'`, `GET` snapshot and `POST` outcome writeback.

- [ ] **Step 1: Write failing adapter tests**

Mock fetch and assert: GET reads Supabase canonical command-center state first; Notion is optional enrichment; POST requires `actionId` + outcome, delegates to Supabase, then re-fetches/read-backs the updated snapshot; failures remain fail-closed; Basic Auth remains required.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/linkedin-revenue-command-center.test.mjs`
Expected: FAIL because current function is GET-only and Notion-first.

- [ ] **Step 3: Implement adapter**

Use `POWERHOUSE_RUNTIME_URL` and `POWERHOUSE_RUNTIME_TOKEN` server-side. GET returns canonical order queue, opportunity/deal projections, learnings, daily-run health and Notion enrichment. POST supports outcomes `executed`, `reply_received`, `no_response`, `meeting_booked`, `offer_created`, `offer_accepted`, `offer_rejected`, `order_won`, `order_lost`, `revenue_observed`, `not_relevant`, `defer`, then performs a readback GET before responding success.

- [ ] **Step 4: Run adapter tests**

Run: `node --test tests/linkedin-revenue-command-center.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add netlify/functions/linkedin-revenue-cockpit.mjs tests/linkedin-revenue-command-center.test.mjs
git commit -m "feat: expose canonical revenue command center"
```

### Task 4: Replace Cockpit UX with Order Queue

**Files:**
- Modify: `intern/linkedin-revenue/index.html`
- Modify: `intern/linkedin-revenue/cockpit.js`
- Test: `tests/linkedin-revenue-command-center-ui.test.mjs`

**Interfaces:**
- Consumes: Task 3 v2 snapshot/writeback schema.
- Produces: execution-first UI with primary Order Queue and secondary Radar, Conversations, Relations, Content, Deals, Learning, System views.

- [ ] **Step 1: Write failing UI contract test**

Assert HTML/JS contain `Order Queue`, `Radar`, `Conversations`, `Relations`, `Content`, `Deals`, `Learning`, expected revenue/probability/confidence rendering, outcome controls, stale/degraded state and no `localStorage` completion path.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/linkedin-revenue-command-center-ui.test.mjs`
Expected: FAIL against current cockpit.

- [ ] **Step 3: Implement UI**

Make Order Queue the default screen. Each card must show person/company, stage, expected order value, probability/confidence, expected revenue, why-now evidence, channel, next action, message only when context-ready, source links, and canonical outcome buttons. POST outcomes to the internal adapter; keep button pending until server readback returns; then refresh the snapshot. Render degraded/stale timestamps without inventing fresh state.

- [ ] **Step 4: Run UI contract and syntax tests**

Run: `node --test tests/linkedin-revenue-command-center-ui.test.mjs && node --check intern/linkedin-revenue/cockpit.js`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add intern/linkedin-revenue/index.html intern/linkedin-revenue/cockpit.js tests/linkedin-revenue-command-center-ui.test.mjs
git commit -m "feat: build revenue command center UI"
```

### Task 5: Cross-Channel Content-to-Revenue Learning

**Files:**
- Modify: `supabase/functions/powerhouse-runtime/index.ts`
- Test: `tests/powerhouse-content-to-revenue-loop.test.mjs`

**Interfaces:**
- Consumes: existing social/blog/SEO/runtime events and sales outcomes/learnings.
- Produces: cross-channel learning recommendations where downstream commercial evidence can reinforce/suppress topic/channel/content recommendations and commercial objections can create content opportunities.

- [ ] **Step 1: Write failing cross-channel test**

Assert social/blog/SEO event types and order/revenue outcomes share topic/content keys; high-engagement but poor downstream conversion can create a negative/suppress effect; proven commercial objections/questions can produce a content recommendation; revenue-weight remains above engagement-weight.

- [ ] **Step 2: Run RED**

Run: `node --test tests/powerhouse-content-to-revenue-loop.test.mjs`
Expected: FAIL on missing bidirectional propagation.

- [ ] **Step 3: Implement bidirectional propagation**

Extend daily aggregation to combine topic/content learnings from social/blog/SEO and sales outcomes. Create recommendation types `reinforce_revenue_topic`, `suppress_low_conversion_topic`, `answer_commercial_objection`, each with evidence and confidence/sample size. Do not suppress from a single weak sample; require minimum sample/confidence thresholds.

- [ ] **Step 4: Run runtime + cross-channel suite**

Run: `node --test tests/powerhouse-content-to-revenue-loop.test.mjs tests/powerhouse-revenue-command-center-runtime.test.mjs tests/supabase-powerhouse-v96-native.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/powerhouse-runtime/index.ts tests/powerhouse-content-to-revenue-loop.test.mjs
git commit -m "feat: connect content learning to revenue"
```

### Task 6: Daily Autonomous Revenue Run and Recovery Evidence

**Files:**
- Modify: `supabase/migrations/20260909140500_powerhouse_revenue_command_center.sql`
- Test: `tests/powerhouse-daily-revenue-loop.test.mjs`

**Interfaces:**
- Consumes: daily scheduler already present; Task 2 command-center runtime.
- Produces: idempotent daily run evidence, bounded queue refresh, recovery obligation state on scheduler/runtime failure.

- [ ] **Step 1: Write failing scheduler contract test**

Assert migration preserves a single daily Supabase-native cron job, idempotent run-date semantics, no Make URL/string, and persistent failure/recovery state.

- [ ] **Step 2: Run RED**

Run: `node --test tests/powerhouse-daily-revenue-loop.test.mjs`
Expected: FAIL until recovery evidence is represented.

- [ ] **Step 3: Implement scheduler/recovery additions**

Add/extend daily-run evidence fields for degraded sources, last error fingerprint, retry/recovery state and exact queue/recommendation counts. Preserve one daily cron invocation against `powerhouse-runtime/daily` using the stored scoped device token from Supabase Vault.

- [ ] **Step 4: Run scheduler tests**

Run: `node --test tests/powerhouse-daily-revenue-loop.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260909140500_powerhouse_revenue_command_center.sql tests/powerhouse-daily-revenue-loop.test.mjs
git commit -m "feat: harden autonomous revenue loop"
```

### Task 7: Production Release, Canary, and Canonical Readback

**Files:**
- Modify only if required by existing delivery classifier: `config/brain-delivery-system.json`
- Update: Powerhouse Latest Verified State in Notion after production evidence exists.

**Interfaces:**
- Consumes: Tasks 1–6 candidate branch.
- Produces: protected-main merge, production Supabase migration/function, production Netlify deploy, evidence-backed canary, Notion verified-state writeback.

- [ ] **Step 1: Run focused full suite**

Run:
```bash
node --test \
  tests/supabase-powerhouse-v96-native.test.mjs \
  tests/powerhouse-revenue-command-center-schema.test.mjs \
  tests/powerhouse-revenue-command-center-runtime.test.mjs \
  tests/linkedin-revenue-command-center.test.mjs \
  tests/linkedin-revenue-command-center-ui.test.mjs \
  tests/powerhouse-content-to-revenue-loop.test.mjs \
  tests/powerhouse-daily-revenue-loop.test.mjs
node --check intern/linkedin-revenue/cockpit.js
```
Expected: all tests pass, zero failures.

- [ ] **Step 2: Open scoped PR**

Use explicit `Change-Scope` covering only migration/function/cockpit/adapter/tests and a realistic `Scope-Budget`. Wait for protected `test` required check to pass.

- [ ] **Step 3: Merge only after required gate is green**

Use squash merge. Record exact merged SHA.

- [ ] **Step 4: Deploy production backend**

Apply the production migration through Supabase migration tooling. Deploy `powerhouse-runtime` from exact merged source. Verify function is ACTIVE and reports expected runtime version/`makeCriticalPath:false`.

- [ ] **Step 5: Verify production Netlify/internal cockpit**

Read back the deployed internal page/function on the exact production deploy corresponding to merged SHA. Confirm v2 schema, 15-or-fewer Order Queue items, no local-only completion state, and degraded state if any enrichment source is unavailable.

- [ ] **Step 6: Execute production canary**

Use a synthetic but production-path canary subject to prove: signal → action → outcome → learning → changed later decision. Separately verify order/revenue outcome creates downstream learning/attribution evidence. Do not use fabricated LinkedIn content as proof of real LinkedIn feed/DM extraction.

- [ ] **Step 7: Verify daily autonomous run**

Run/observe `powerhouse-runtime/daily`; read `powerhouse_daily_runs`; verify state `completed`, queue count ≤15, recommendation counts/evidence present, and no Make dependency.

- [ ] **Step 8: Real browser acceptance**

On the user's actual authenticated Chrome runtime, verify: page loads with no JS/runtime errors, grounded LinkedIn post opportunity appears only with real post evidence, grounded DM reply appears only with real thread evidence, outcome writeback is read back, and queue refreshes. If direct desktop control is unavailable, this remains the only external acceptance blocker and must be reported as such rather than falsely marked green.

- [ ] **Step 9: Notion canonical writeback**

Update `Powerhouse Latest Verified State` with exact merged SHA, Supabase function version, production deploy/readback evidence, canary evidence, daily-run evidence and browser evidence. Set `Status=verified` / `Loop Status=closed` only when all production criteria including real browser acceptance are met.
