# Powerhouse Make Cost Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce Make credits, data transfer, AI-token usage and runtime across the Powerhouse scenario estate while preserving production semantics, freshness, publishing, commercial responsiveness, security, observability and learning.

**Architecture:** Optimize highest-cost and highest-frequency paths first using cache-first reads, bounded deltas, deterministic routing, deduplicated writes and AI only where uncertainty remains. Every scenario change is one reversible hypothesis with baseline/post-change evidence and rollback if any protected metric regresses by more than 10% without explicit acceptance.

**Tech Stack:** Make.com scenarios, Notion/Datahub, Make API, JavaScript code modules, GitHub regression contracts, native LinkedIn/Instagram/GA4/GSC connectors.

**Spec:** `docs/superpowers/specs/2026-08-30-powerhouse-make-cost-architecture-design.md`

## Global Constraints

- Never bypass approval, brand, narrative, publication, security or production-promotion gates.
- Preserve idempotency, dedupe, attribution and source-of-truth contracts.
- Preserve commercial P0/P1 freshness and unanswered inbound handling.
- Normal cockpit/API reads must be cache-first and must not fan out to live Notion/Datahub on cache hit.
- DM learning remains bounded, recent/change-only, idempotent and attribution-preserving.
- Schedule reduction is allowed only with verified non-critical SLA evidence.
- Publishing retries remain bounded and idempotent.
- AI is not used for deterministic health checks, routing, dedupe, fingerprints or known-policy evaluation when code/filter logic can do the job.
- Any >10% protected-metric regression without explicit justification causes rollback.
- Every material optimization records baseline, change, post-state, savings, rollback and learning.

---

### Task 1: Stabilize and regression-lock the cost machinery

**Systems:**
- Make scenario `7088656` — PH Agent 14 Make Cost Optimizer v3 stable runner
- Make scenario `7135438` — BG 162 Adaptive Cost & Quality Governor v1
- Make scenario `7032571` — BG 82 Powerhouse Cost + Runtime Guard v8.1
- Make scenario `7132648` — BG 159 Powerhouse Cost Snapshot Collector v1

**Interfaces:**
- Consumes: current Make execution metadata, scenario task payloads, protected-metric rules.
- Produces: one bounded optimization recommendation/action per invocation and a deterministic health contract.

- [ ] **Step 1: Capture baseline health**

Record for each scenario: trigger/schedule, latest successful run, operations, credits, transfer, duration and current validation warnings. For Agent 14 explicitly verify `Runtime health check` returns exactly `OK`.

- [ ] **Step 2: Verify no dead or recursive cost path remains**

Inspect Agent 14 modules and confirm it is only `StartSubscenario -> AI Ask -> ReturnData` until a validated bounded learning-write path is reintroduced. Reject any unconditional agent-to-agent dispatch or broken datastore full-context read.

- [ ] **Step 3: Enforce one-candidate/one-hypothesis governor behavior**

Verify BG162 routes only one cost candidate at a time and does not infer schedule changes for webhook/on-demand scenarios. Preserve the existing `CACHE_FIRST_PROJECTION_REQUIRED` response for instant read paths that lack a cache projection.

- [ ] **Step 4: Verify guard frequency is not increased**

Keep BG82 at its current four-hour backstop unless verified SLA evidence says otherwise. Do not add a new polling guardian for the same invariant.

- [ ] **Step 5: Post-check**

Run Agent 14 health once. Success criteria: exact `OK`, no 404, no validation error, no extra recursive Make invocation, <= current operations/credits for the health path.

---

### Task 2: Finish Mission Control cache-first conversion

**Systems:**
- Make scenario `7071153` — BG 139 Mission Control API
- Make scenario `7152387` — BG 190 Mission Control Cache-First Read Service v1

**Baseline evidence:** recent BG139 cache-hit runs are about 4 operations, 5 credits and ~22 KB transfer; historical direct path was about 7 operations, 8 credits and ~71 KB transfer per request.

**Interfaces:**
- Consumes: webhook request and cached `mission-control:v24` projection.
- Produces: the same Mission Control JSON contract and source header.

- [ ] **Step 1: Snapshot both scenario blueprints and module mappings**

Capture BG139 modules 15/16/18/19/20 and BG190 write-through behavior before editing.

- [ ] **Step 2: Replace broad datastore listing with exact-key retrieval when supported**

Change the cache read from broad `/v2/data-stores/175080/data` listing to exact-key retrieval for `mission-control:v24`. If exact-key retrieval is unavailable, keep the bounded list call and document that evidence; do not invent an endpoint.

- [ ] **Step 3: Preserve cache-hit fast path**

A valid, unexpired cache hit must execute only cache read, validation and response. It must not invoke BG190 or any live Notion/Datahub source.

- [ ] **Step 4: Preserve write-through miss path**

A cache miss may call BG190 once; the rebuilt payload must be persisted so subsequent reads become hits. Keep browser `Cache-Control` at 3600 seconds unless a measured freshness contract requires less.

- [ ] **Step 5: Verify with two equivalent reads**

First read may be MISS; second must be CACHE. Compare operations, credits, transfer and duration. Target: cache hit <=4 operations, <=5 credits and materially below 71 KB transfer; no response-schema regression.

---

### Task 3: Repair and optimize DM learning sync

**Systems:**
- Make scenario `7032929` — BG 84 DM identity + unified learning sync v1.5 idempotent

**Baseline evidence:** successful recent run ~6 operations, 6 credits, ~44 KB transfer; historical cumulative transfer is very high. Two recent validation-init failures and a 429 were observed.

**Interfaces:**
- Consumes: recent DM conversation records.
- Produces: normalized identity/attribution and one idempotent Datahub learning snapshot.

- [ ] **Step 1: Fix current scenario validation before any cost optimization**

Inspect the current module configuration and resolve the exact validation error. Do not continue with cost mutation until the scenario initializes cleanly.

- [ ] **Step 2: Keep candidate filter as semantic intersection**

The source query must require both: `Laatste bericht op >= now-2d` AND `Attribution Updated is empty`, with a hard candidate limit of 3.

- [ ] **Step 3: Keep pre-write idempotency gate**

Before update/create, query Datahub by stable `Interaction Key` with page size 1. Already-seen keys must terminate without update or create.

- [ ] **Step 4: Avoid redundant normalization writes**

If the source already contains complete identity, attribution root/touch, confidence and update timestamp consistent with the target snapshot, skip the source update and write only the missing Datahub snapshot if required.

- [ ] **Step 5: Verify**

Run one bounded execution. Success criteria: scenario initializes, no 429 under normal single-run load, <=3 candidates, no duplicate Datahub item, attribution unchanged, operations/transfer <= baseline for equivalent candidate count.

---

### Task 4: Collapse broad commercial intelligence reads

**Systems:**
- `7060781` — BG 126 Contextual Commercial Brain v2.1
- `7060907` — BG 127 Unified Audience Intelligence Cohorts
- `7060937` — BG 128 All Evidence Cross Channel Strategy Intelligence v2
- `7066416` — BG 131 Powerhouse Trading Cockpit API

**Baseline evidence:** BG126 ~257 KB per successful run, BG127 ~183-280 KB, BG128 ~153-324 KB; all recently experienced a shared 429 window.

**Interfaces:**
- Consumes: commercial evidence, audience/cohort and strategy snapshots.
- Produces: commercial recommendations/current-state projections used by Dagplan/cockpit.

- [ ] **Step 1: Identify overlapping Notion/Datahub reads**

Inspect all source-query modules and list duplicated databases, filters and fields. Mark the single authoritative projection for each shared data set.

- [ ] **Step 2: Introduce/reuse bounded current-state projections**

Where two or more scenarios read the same broad source, have one scheduled intelligence build persist the compact projection and make downstream consumers read that projection instead of repeating full source queries.

- [ ] **Step 3: Bound and project source reads**

Add date/change windows, page-size limits and field projection so each scenario retrieves only fields consumed downstream.

- [ ] **Step 4: Stagger non-time-critical scheduled source loads**

If multiple jobs hit Notion simultaneously and their SLA permits, move them into non-overlapping minutes without changing required freshness. Do not change real-time/webhook paths.

- [ ] **Step 5: Verify**

For each scenario, compare one equivalent successful run. Target: >=25% transfer reduction across the group, no new 429, unchanged commercial output schema and protected action freshness.

---

### Task 5: Optimize content, narrative and production chains

**Systems:**
- `6802405` — BG 09 Adaptive Narrative + Channel Portfolio Engine v7.2
- `6804589` — BG 14 Narrative calibration + adaptive learning controller
- `6809662` — BG 16 Cross-channel SEO blog updater
- `6844930` — BG 24 Mira Instagram production brief
- BG 25 LinkedIn carousel production successor(s)
- BG 22 SEO publisher successor(s)
- BG 42 approval/dayplan successor(s)
- BG 171/native LinkedIn publish successor(s) discovered during execution

**Interfaces:**
- Consumes: approved due content, narrative/brand state and channel requirements.
- Produces: generated assets, scheduled/published output and verified publication evidence.

- [ ] **Step 1: Map the live successor chain**

Find active successors for BG22/BG25/BG42/BG171 and document which scenario owns approval, generation, dispatch, publishing and verification.

- [ ] **Step 2: Gate expensive work before AI/media modules**

Only approved items that are due and still missing the required artifact/publication may enter AI, image, video or carousel generation. Empty/already-complete batches must stop before expensive modules.

- [ ] **Step 3: Reuse narrative and channel snapshots**

Persist one compact narrative/channel state per version/day and reuse it across posts instead of recalculating the same portfolio context repeatedly.

- [ ] **Step 4: Keep publication verification deterministic**

Successful post verification should use publisher ID/public URL/status fields first; do not call AI merely to decide whether a URL or post ID exists.

- [ ] **Step 5: Verify**

Test with an approved non-duplicate candidate or a dry/no-op path where publication must not occur. Success: no gate bypass, no duplicate publish, no copy alteration, lower operations on empty/already-complete paths.

---

### Task 6: Optimize SEO, research and measurement

**Systems:**
- `7053689` — BG 98 Cost-Bounded Topic-Gated Research Registry Loop
- `7035987` — BG 87 SEO Learning native GSC+GA4
- `6801662` — BG 05 Native GA4 + GSC Weekly KPI
- `7046811` — BG 104 Website Measurement Snapshot v2
- `7046838` — BG 107 Native LinkedIn Company Metrics v2
- `7141270` — BG 180 Native Instagram Metrics + Scene Learning v2

**Interfaces:**
- Consumes: analytics/search/social metrics and research requests.
- Produces: reusable evidence, KPI snapshots and learning deltas.

- [ ] **Step 1: Fingerprint freshness before external research**

For BG98, reuse previously verified evidence until its explicit freshness horizon expires. Run Tavily only for approved claims/topics whose evidence is absent or stale.

- [ ] **Step 2: Use date deltas for analytics ingestion**

GA4/GSC/social scenarios query only the period since the last successful snapshot plus the minimum overlap needed for late-arriving corrections.

- [ ] **Step 3: Consolidate duplicate KPI extraction**

Where BG05/BG87/BG104 consume overlapping GA4/GSC metrics, persist a shared raw/normalized daily snapshot and derive multiple outputs deterministically.

- [ ] **Step 4: Skip unchanged writes**

Hash/fingerprint normalized KPI payloads and do not write a new Notion/Datahub object when the persisted state is identical.

- [ ] **Step 5: Verify**

Compare transfer and operations for one equivalent scheduled window. Preserve KPI values and source timestamps; target >=20% combined reduction for overlapping analytics jobs.

---

### Task 7: Remove long-tail duplication and retired noise

**Systems:** all active/inactive/error scenarios, including retired monitors such as `7100596` and duplicate-numbered/successor flows.

**Interfaces:**
- Consumes: scenario inventory and ownership/compatibility map.
- Produces: a smaller estate with one owner per contract and explicit successor mapping.

- [ ] **Step 1: Inventory by contract, not by name**

Group scenarios into: API/cockpit, commercial/Dagplan, DM, publishing, SEO/research, metrics, agents, production promotion, monitoring/guardians.

- [ ] **Step 2: Mark successor coverage**

For each inactive/error/legacy scenario, identify active successor and prove trigger, inputs, outputs, side effects, SLA and idempotency compatibility.

- [ ] **Step 3: Retire only proven duplicates**

Deactivate only when successor coverage is complete and recent production evidence is green. Do not deactivate unique fallback/rollback paths.

- [ ] **Step 4: Remove orphan schedules and dead error monitors**

Ensure retired scenarios cannot continue to consume schedule checks, email monitoring or failed initialization attempts.

- [ ] **Step 5: Verify**

Run the regression guardian/QA suite and check that protected publishing, commercial, API and production contracts remain green.

---

### Task 8: Make low-cost architecture mandatory for every new scenario

**Systems:**
- GitHub `AGENTS.md` / relevant engineering guardrails
- Make QA/Cost Guard scenarios
- Production promotion controller `7137190` (BG169) and regression runner `7088574` (PH Agent 11)

**Interfaces:**
- Consumes: proposed/new scenario metadata and regression results.
- Produces: admission pass/fail before production promotion.

- [ ] **Step 1: Add deterministic admission checks**

Reject production promotion when a new scheduled/read-heavy scenario lacks stable dedupe key, bounded batch, cache/delta strategy, AI justification, protected metrics or compatibility mapping.

- [ ] **Step 2: Add known-cost-regression tests**

Cover at minimum: Mission Control live fan-out on cache hit, BG84 broad OR candidate selection, unconditional agent chaining, unbounded source query, duplicate writes and polling added where an event path exists.

- [ ] **Step 3: Wire failures into BG169 promotion gate**

A failed cost regression test blocks promotion exactly like other protected regressions; it must not silently warn and continue.

- [ ] **Step 4: Persist savings learning**

Store verified optimization fingerprints and measured before/after metrics so Agent 14 and future agents reuse proven patterns rather than rediscovering them.

- [ ] **Step 5: Final estate verification**

Produce a before/after scorecard containing total scenario count, active scheduled count, daily operations estimate, daily credits estimate, transfer estimate, AI-call count estimate, error/429 rate and protected-metric status.

## Execution Order

1. Task 1 — cost machinery
2. Task 2 — Mission Control
3. Task 3 — DM sync
4. Task 4 — commercial intelligence
5. Task 5 — content/publishing
6. Task 6 — SEO/research/measurement
7. Task 7 — long-tail retirement
8. Task 8 — admission/regression enforcement

Do not start the next task while the current task has an unresolved protected regression.
