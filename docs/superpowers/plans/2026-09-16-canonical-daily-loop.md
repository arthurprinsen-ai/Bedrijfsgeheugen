# Canonical Powerhouse Daily Closed Loop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Powerhouse, cockpit, Notion Dagplan and Content Calendar one idempotent daily closed loop with shared canonical identities, projection parity, evidence-backed outcomes, self-healing and learning writeback.

**Architecture:** Keep Supabase/Powerhouse as runtime authority. Reuse `powerhouse_daily_runs`, `powerhouse_sales_actions`, `bg_vandaag`, `powerhouse_channel_decisions`, `content_publication_obligations`, `content_operations_cockpit`, existing Brain outcome/writeback paths and the existing Notion integration credentials; add only a thin daily reconciliation Edge Function plus pure reconciliation logic. Notion Dagplan and Content Calendar remain projections and never become competing sources of truth.

**Tech Stack:** Supabase Postgres + Edge Functions (Deno/TypeScript), Notion API, Node.js 22 `node:test`, existing BRAIN/CI/CD contracts, GitHub Actions, BG169 production promotion.

**Spec:** `docs/superpowers/specs/2026-09-16-canonical-daily-loop-design.md`

## Global Constraints
- Supabase/Powerhouse remains runtime authority.
- Cockpit, Notion Dagplan and Content Calendar are projections/views, not independent sources of truth.
- No Make dependency is introduced or restored.
- Reuse existing Powerhouse action, outcome-obligation, learning, content, relationship, publication and runtime components.
- Every material action keeps stable canonical lineage from decision through execution, outcome and learning.
- Every external side effect is idempotent and evidence-backed.
- All daily semantics use `Europe/Amsterdam`.
- Unexpected empty projections fail closed when canonical actions require that projection.
- BG169 remains the only production-promotion authority for GitHub-backed releases.
- Service-role and Notion credentials remain server-side; no browser exposure and no secret committed to source control.
- No persistent table is added unless current entities are proven insufficient during implementation; prefer structured evidence on existing run/action records and existing projection mappings.

---

### Task 1: BRAIN execution gate and immutable daily-loop primitives

**Files:**
- Create: `supabase/functions/powerhouse-daily-loop/logic.mjs`
- Create: `tests/powerhouse-daily-loop-logic.test.mjs`
- Existing gate: `scripts/brain/chat-learning-preflight.mjs`
- Existing workflow: `.github/workflows/chat-learning-preflight-pr.yml`

**Interfaces:**
- Produces: `businessDateAmsterdam(date) -> YYYY-MM-DD`.
- Produces: `projectionKey(surface, sourceType, sourceId, businessDate) -> string`.
- Produces: `expectedProjections(action) -> { cockpit:boolean, dagplan:boolean, contentCalendar:boolean }`.
- Produces: `reconcileProjectionSet({ expected, actual }) -> { status, missing, duplicates, orphans, expectedCounts, actualCounts }`.
- Produces: `zeroStateIsValid({ expectedCount, actualCount }) -> boolean`.

- [ ] **Step 1: Run the mandatory BRAIN preflight on the exact candidate branch before code mutation.**

Run through CI or an isolated checkout:

```bash
node scripts/brain/chat-learning-preflight.mjs
```

Expected: JSON containing `"status": "READY"`. Any `CHAT_LEARNING_PREFLIGHT_FAILED` stops material execution until the learning-source defect is repaired.

- [ ] **Step 2: Write failing pure-logic tests.**

Create tests equivalent to:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  businessDateAmsterdam,
  projectionKey,
  expectedProjections,
  reconcileProjectionSet,
  zeroStateIsValid,
} from '../supabase/functions/powerhouse-daily-loop/logic.mjs';

test('Amsterdam business date crosses UTC midnight correctly', () => {
  assert.equal(businessDateAmsterdam(new Date('2026-09-15T22:30:00Z')), '2026-09-16');
});

test('projection keys are deterministic', () => {
  const a = projectionKey('dagplan', 'powerhouse_sales_actions', 'A-1', '2026-09-16');
  const b = projectionKey('dagplan', 'powerhouse_sales_actions', 'A-1', '2026-09-16');
  assert.equal(a, b);
});

test('missing, duplicate and orphan projections make reconciliation non-green', () => {
  const result = reconcileProjectionSet({
    expected: [{ key:'dagplan:1', surface:'dagplan' }],
    actual: [{ key:'dagplan:1', surface:'dagplan' }, { key:'dagplan:1', surface:'dagplan' }, { key:'orphan', surface:'dagplan' }],
  });
  assert.equal(result.status, 'REPAIRING');
  assert.equal(result.duplicates.length, 1);
  assert.equal(result.orphans.length, 1);
});

test('zero state is invalid only when expected projection count is non-zero', () => {
  assert.equal(zeroStateIsValid({ expectedCount: 0, actualCount: 0 }), true);
  assert.equal(zeroStateIsValid({ expectedCount: 2, actualCount: 0 }), false);
});
```

Add CET, CEST, spring-forward and autumn-fallback cases using fixed UTC timestamps.

- [ ] **Step 3: Run the test and verify RED.**

```bash
node --test tests/powerhouse-daily-loop-logic.test.mjs
```

Expected: FAIL because `logic.mjs` or exports do not exist.

- [ ] **Step 4: Implement the minimal pure functions with no database/network access.**

Use `Intl.DateTimeFormat('en-CA', { timeZone:'Europe/Amsterdam', ... })` for business date. Projection keys must be deterministic strings such as:

```js
`${surface}:${sourceType}:${sourceId}:${businessDate}`
```

`expectedProjections()` must classify canonical `powerhouse_sales_actions` as cockpit-visible and Dagplan-visible only when they are active/human-actionable; content records are Content Calendar-visible only when an existing content obligation/channel decision requires planning/publication. Do not encode publication execution into this helper.

- [ ] **Step 5: Run tests and verify GREEN.**

```bash
node --test tests/powerhouse-daily-loop-logic.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add supabase/functions/powerhouse-daily-loop/logic.mjs tests/powerhouse-daily-loop-logic.test.mjs
git commit -m "test: define canonical daily loop reconciliation"
```

### Task 2: Read-only daily reconciliation coordinator

**Files:**
- Create: `supabase/functions/powerhouse-daily-loop/index.ts`
- Modify: `supabase/config.toml`
- Create: `tests/powerhouse-daily-loop-contract.test.mjs`

**Interfaces:**
- Consumes: Task 1 helpers.
- Reads: `powerhouse_daily_runs`, `bg_vandaag`, `powerhouse_sales_actions`, `powerhouse_channel_decisions`, `content_operations_cockpit`, `content_publication_obligations`.
- POST body: `{ action:"reconcile", runDate?:"YYYY-MM-DD", dryRun?:boolean }`.
- Returns: `{ ok, runDate, runId, status, canonicalActionCount, expectedCounts, actualCounts, missing, duplicates, orphans, blockers, evidence }`.

- [ ] **Step 1: Add a failing contract test that requires the new function to authenticate with the existing Powerhouse scheduler/shared-secret pattern, calculate Amsterdam date, support `dryRun:true`, and avoid writes in dry-run mode.**

The test should read the function source and assert absence of Make endpoints/identifiers and presence of canonical table/view names.

- [ ] **Step 2: Run RED.**

```bash
node --test tests/powerhouse-daily-loop-contract.test.mjs
```

Expected: FAIL because the Edge Function does not exist.

- [ ] **Step 3: Implement a read-only first version.**

Use `createClient` with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, authenticate using the existing `powerhouse_daily_scheduler_token`/shared-secret route already used by current Powerhouse functions, resolve the daily run for `runDate`, read canonical current actions from `bg_vandaag`, and read content state from `content_operations_cockpit` plus channel decisions/obligations. Return parity diagnostics only; do not create Notion pages yet.

- [ ] **Step 4: Register the function without changing JWT/security policy of unrelated functions.**

Add only:

```toml
[functions.powerhouse-daily-loop]
enabled = true
verify_jwt = false
entrypoint = "./functions/powerhouse-daily-loop/index.ts"
```

Function-level shared-secret authorization remains mandatory.

- [ ] **Step 5: Run contract + logic tests.**

```bash
node --test tests/powerhouse-daily-loop-logic.test.mjs tests/powerhouse-daily-loop-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit.**

```bash
git add supabase/functions/powerhouse-daily-loop supabase/config.toml tests/powerhouse-daily-loop-contract.test.mjs
git commit -m "feat: add daily loop reconciliation coordinator"
```

### Task 3: Idempotent Notion Dagplan projection

**Files:**
- Create: `supabase/functions/powerhouse-daily-loop/notion-dagplan.mjs`
- Modify: `supabase/functions/powerhouse-daily-loop/index.ts`
- Create: `tests/notion-dagplan-projection.test.mjs`

**Interfaces:**
- Produces: `buildDagplanProjection(action, runDate) -> { projectionKey, properties }`.
- Produces: `reconcileDagplan({ notionToken, dataSourceId, expectedItems, fetchImpl }) -> { created, updated, unchanged, missingAfterReadback, duplicates, pageRefs }`.
- Canonical Notion data source: `3c6b3335-e38b-40c3-aba1-e5bd7196f347` supplied through non-secret config/env, not treated as authority.
- Uses existing Notion credential already available to the deployed Notion integration; no new secret name is introduced unless runtime inspection proves the existing credential is inaccessible to this function.

- [ ] **Step 1: Write failing tests using a fake `fetchImpl`.**

Cover:
- `Bron = Powerhouse`;
- `Bron-ID = action.action_id`;
- deterministic `Duplicaatsleutel = projectionKey(...)`;
- `Datum = runDate`;
- rerunning the same action updates/returns the same page instead of creating a second page;
- unrelated human-created Notion rows are never deleted;
- zero expected actions performs no create/update calls;
- duplicate readback is reported instead of silently accepted.

- [ ] **Step 2: Run RED.**

```bash
node --test tests/notion-dagplan-projection.test.mjs
```

Expected: FAIL because projection module is absent.

- [ ] **Step 3: Implement deterministic query-before-write + readback.**

Search the Dagplan data source by `Bron-ID`/`Duplicaatsleutel`; update exactly one matching canonical projection, create only when absent, and fail reconciliation on >1 active match. Map only fields proven by the fetched Dagplan schema; never invent status/select values. Preserve any Notion page ID only as projection evidence.

- [ ] **Step 4: Integrate it behind `dryRun:false` in `powerhouse-daily-loop`.**

The coordinator must calculate expected Dagplan items first, call `reconcileDagplan`, then re-read and feed actual identities back into `reconcileProjectionSet`.

- [ ] **Step 5: Run tests GREEN.**

```bash
node --test tests/powerhouse-daily-loop-logic.test.mjs tests/notion-dagplan-projection.test.mjs tests/powerhouse-daily-loop-contract.test.mjs
```

- [ ] **Step 6: Commit.**

```bash
git add supabase/functions/powerhouse-daily-loop tests/notion-dagplan-projection.test.mjs
git commit -m "feat: reconcile canonical actions into Notion Dagplan"
```

### Task 4: Content Calendar parity without duplicate publication

**Files:**
- Modify: `supabase/functions/powerhouse-daily-loop/index.ts`
- Modify only if necessary: `supabase/functions/content-operations/index.ts`
- Create: `tests/daily-loop-content-parity.test.mjs`

**Interfaces:**
- Reads existing `powerhouse_channel_decisions`, `content_publication_obligations`, `content_operations_cockpit` and existing `sync_content_publication_obligations` RPC.
- The daily loop may invoke the existing synchronization/reconciliation route, but it must never call publication providers directly.

- [ ] **Step 1: Write failing tests proving the coordinator treats content obligations as the expected Content Calendar/publication projection, calls the existing sync route at most once per run, and never contains Buffer/LinkedIn publication side-effect code.**

- [ ] **Step 2: Run RED.**

```bash
node --test tests/daily-loop-content-parity.test.mjs
```

- [ ] **Step 3: Implement content parity.**

For the run date, invoke `sync_content_publication_obligations` through the existing server-side Supabase route, then read `content_operations_cockpit`. Match by existing obligation/content/channel identity. Existing `record_content_publication_state` and provider receipts remain publication truth; the daily loop only verifies them.

- [ ] **Step 4: Verify legacy Make is not required.**

```bash
grep -RniE 'make\.com|hook\.eu[0-9]?\.make|scenario.?7051207|BG121|BG138|BG146' supabase/functions/powerhouse-daily-loop tests/daily-loop-content-parity.test.mjs
```

Expected: no runtime dependency matches; historical names may appear only in documentation/tests explicitly asserting retirement.

- [ ] **Step 5: Run all daily-loop tests GREEN and commit.**

```bash
node --test tests/powerhouse-daily-loop-logic.test.mjs tests/notion-dagplan-projection.test.mjs tests/daily-loop-content-parity.test.mjs tests/powerhouse-daily-loop-contract.test.mjs
git add supabase/functions/powerhouse-daily-loop supabase/functions/content-operations/index.ts tests/daily-loop-content-parity.test.mjs
git commit -m "feat: reconcile content calendar in daily loop"
```

### Task 5: Persist run evidence and self-healing outcome obligations

**Files:**
- Modify: `supabase/functions/powerhouse-daily-loop/index.ts`
- Create or modify only after current schema read: one migration under `supabase/migrations/` only if existing `powerhouse_daily_runs.evidence`/Brain obligation structures cannot represent parity evidence.
- Create: `tests/daily-loop-recovery-contract.test.mjs`

**Interfaces:**
- Writes daily parity evidence into the existing daily-run evidence/state mechanism when semantically compatible.
- On mismatch, uses existing Brain/outcome-obligation and material-outcome writeback paths; no new recovery queue.
- Material outcomes are `RECOVERY`, `AUTO_REPAIR`, or `MISSED_OBLIGATION` as appropriate.

- [ ] **Step 1: Re-read production schema before writing and lock exact column names in the implementation.**

Run read-only SQL against `information_schema.columns` for `powerhouse_daily_runs`, `brain_outcome_obligations`, `outcome_obligations`, and material-outcome tables/functions. Do not assume stale historical schema.

- [ ] **Step 2: Add failing tests for state transitions.**

Require:

```text
all expected/readback aligned -> GREEN
safe mismatch found -> REPAIRING -> repair -> GREEN + AUTO_REPAIR
outcome due without evidence -> MISSED_OBLIGATION
credentials/permissions required -> BLOCKED_HARD_BOUNDARY
```

Also assert a second identical reconciliation does not create a second recovery obligation or material outcome.

- [ ] **Step 3: Run RED.**

```bash
node --test tests/daily-loop-recovery-contract.test.mjs
```

- [ ] **Step 4: Implement recovery using current canonical Brain paths.**

Create obligations with a deterministic idempotency key derived from run date + projection key + failure class. After safe repair, perform readback before writing `AUTO_REPAIR`. Never mark `GREEN` when evidence is missing.

- [ ] **Step 5: Run GREEN and commit.**

```bash
node --test tests/powerhouse-daily-loop-*.test.mjs tests/notion-dagplan-projection.test.mjs tests/daily-loop-content-parity.test.mjs tests/daily-loop-recovery-contract.test.mjs
git add supabase/functions/powerhouse-daily-loop supabase/migrations tests/daily-loop-recovery-contract.test.mjs
git commit -m "feat: close daily loop with evidence and recovery"
```

### Task 6: Expose one loop health contract in the cockpit

**Files:**
- Modify: `supabase/functions/bg-dagoverzicht/index.ts`
- Create: `tests/bg-dagoverzicht-loop-health.test.mjs`

**Interfaces:**
- Existing `actie:'lijst'`, `actie:'content'`, `actie:'uitkomst'` remain backward compatible.
- Add `actie:'loop_health'` returning the latest canonical daily-loop evidence for the requested Amsterdam date.
- Response: `{ datum, status, runId, canonicalActionCount, expectedCounts, actualCounts, missingCount, duplicateCount, orphanCount, dueOutcomes, completedOutcomes, missedOutcomes, autoRepairCount, blockers, reconciledAt, version }`.

- [ ] **Step 1: Add failing contract tests that verify existing actions remain intact and `loop_health` is read-only.**

- [ ] **Step 2: Run RED.**

```bash
node --test tests/bg-dagoverzicht-loop-health.test.mjs
```

- [ ] **Step 3: Implement `loop_health`.**

Reuse current authenticated `bg-dagoverzicht` surface. Read the latest daily-run evidence and/or the coordinator’s canonical readback; do not recompute a competing truth in the browser.

- [ ] **Step 4: Run GREEN plus regression tests.**

```bash
node --test tests/bg-dagoverzicht-loop-health.test.mjs tests/powerhouse-daily-loop-logic.test.mjs tests/powerhouse-daily-loop-contract.test.mjs
```

- [ ] **Step 5: Commit.**

```bash
git add supabase/functions/bg-dagoverzicht/index.ts tests/bg-dagoverzicht-loop-health.test.mjs
git commit -m "feat: expose canonical daily loop health"
```

### Task 7: Attach reconciliation to the existing daily runtime

**Files:**
- Modify: `supabase/functions/powerhouse-runtime/index.ts` only at the existing daily-run completion path, or the existing scheduler workflow that already invokes `powerhouse-content-orchestrator` if that path is the current production authority.
- Modify: `tests/powerhouse-daily-loop-contract.test.mjs`

**Interfaces:**
- Exactly one logical reconciliation call per daily run, but reruns are safe/idempotent.
- Reconciliation occurs after canonical daily action generation and content obligation synchronization, before a run is considered fully green.

- [ ] **Step 1: Add a failing test that requires the existing runtime/scheduler path to invoke `powerhouse-daily-loop` with the same `runDate` and no independently generated action IDs.**

- [ ] **Step 2: Run RED.**

```bash
node --test tests/powerhouse-daily-loop-contract.test.mjs
```

- [ ] **Step 3: Make the smallest integration edit.**

Reuse the current scheduler token. If the existing runtime is event-ingest only and the daily scheduler is elsewhere, integrate at that scheduler instead; do not create a second cron merely for this feature.

- [ ] **Step 4: Run all daily-loop tests and the mandatory preflight.**

```bash
node scripts/brain/chat-learning-preflight.mjs
node --test tests/powerhouse-daily-loop-logic.test.mjs tests/powerhouse-daily-loop-contract.test.mjs tests/notion-dagplan-projection.test.mjs tests/daily-loop-content-parity.test.mjs tests/daily-loop-recovery-contract.test.mjs tests/bg-dagoverzicht-loop-health.test.mjs
```

Expected: READY + all PASS.

- [ ] **Step 5: Commit.**

```bash
git add supabase/functions/powerhouse-runtime/index.ts tests/powerhouse-daily-loop-contract.test.mjs
git commit -m "feat: run canonical reconciliation in daily runtime"
```

### Task 8: Canonical documentation and legacy retirement

**Files:**
- Modify: relevant repository System Map/Brain documentation discovered from current canonical config.
- Update in Notion: `Powerhouse Canonical System Map & Agent Update Contract`.
- Update in Notion: `Powerhouse Menselijk Handboek — Processen, Data, Intelligentie, Algoritmen & Samenhang`.
- Update in Notion: `Powerhouse Cockpit — Architecture & Operations Runbook`.
- Update in Notion: `Powerhouse Cockpit — Error Register & Release Gates`.
- Update in Notion: `Powerhouse — Master Build, Borging & Go-Live Register — 21 augustus 2026`.

**Interfaces:**
- Documents authority, dataflow, identities, expected projection membership, parity semantics, recovery, timezone semantics, owners/writers/readers and production proof.

- [ ] **Step 1: Document the exact implemented runtime, not the intended design.**

Include a human-readable flow:

```text
powerhouse_daily_runs
  -> canonical actions / channel decisions
  -> cockpit + Dagplan + Content Calendar projections
  -> execution/provider evidence
  -> outcome obligation reconciliation
  -> material outcome / learning
  -> next Powerhouse cycle
```

- [ ] **Step 2: Mark BG121/BG138/BG146 Make-era syncs as historical/superseded only after production evidence proves the replacement.** Do not delete their audit history.

- [ ] **Step 3: Record exact table/view/function authority and the fact that Notion is projection only.**

- [ ] **Step 4: Commit repository documentation changes and verify Notion readback.**

### Task 9: Pull request, gates, deploy and production proof

**Files:** No new product files unless verification finds a defect.

- [ ] **Step 1: Open a PR from the implementation branch to protected `main`.**

The PR body must name the design/spec, list exact changed components, declare BRAIN delivery scope/dependencies, rollback identity, and state that Make is not a dependency.

- [ ] **Step 2: Verify exact PR-head gates.**

Required evidence includes at least:
- mandatory Chat Learning preflight READY;
- repository required `test` check GREEN;
- CodeQL/security gates GREEN where configured;
- daily-loop unit/contract tests GREEN;
- relevant BRAIN/Required gates GREEN;
- no unrelated protected baseline regression.

- [ ] **Step 3: Deploy candidate Edge Functions through the existing supported Supabase release path.**

Deploy only exact PR-approved code for `powerhouse-daily-loop` and any modified existing functions. Do not alter secrets/credentials during deploy.

- [ ] **Step 4: Run production reconciliation for the current Europe/Amsterdam date.**

Capture:
- daily run ID/date;
- canonical action IDs/count;
- expected/actual cockpit projection count;
- expected/actual Dagplan identities/count;
- expected/actual Content Calendar identities/count;
- missing/duplicate/orphan sets;
- obligation/evidence state;
- loop health state.

- [ ] **Step 5: Run the same reconciliation a second time and prove idempotency.**

Expected: no extra Notion pages, no duplicate content obligations/publications, no extra canonical action identities, no duplicate recovery outcome.

- [ ] **Step 6: Verify Notion production readback.**

Query the canonical Dagplan for the run date and confirm every expected Dagplan action has exactly one matching canonical `Bron-ID`/`Duplicaatsleutel`. A legitimate zero expected set may be green; a zero actual set with non-zero expected actions is red and triggers repair.

- [ ] **Step 7: Verify outcome and learning writeback.**

If a repair occurred, confirm `AUTO_REPAIR`/`RECOVERY` evidence and refreshed shared context. If no repair occurred, confirm the daily run still contains parity/readback evidence.

- [ ] **Step 8: Promote through BG169 only after all candidate gates are green.**

Read back exact promoted/merged SHA. Do not direct-push around protected `main` or bypass BG169.

- [ ] **Step 9: Verify production again against the exact promoted SHA.**

`LIVE & BEWEZEN` requires the 12 production acceptance criteria from the design spec, including stable identity, parity, evidence, learning, gates and exact production identity.

- [ ] **Step 10: Write final material outcome and close the open Powerhouse obligation.**

Record root cause of the stale Dagplan projection, changed components, proof, outcome, regression prevention and reusable learning in the existing shared Brain/Notion lineage.

## Rollback procedure

If production verification fails after deployment:

1. stop only the changed projection-write path;
2. preserve existing external publication/readback evidence;
3. do not delete human Notion content;
4. restore last-known-good through BG169;
5. verify production green;
6. emit `PRODUCTION_ROLLBACK`/recovery evidence;
7. repair on the same canonical lane and rerun tests/gates before re-promotion.

## Plan self-review

- Spec coverage: authority, identities, all three projection surfaces, zero-state, timezone/DST, self-healing, outcome evidence, learning, security, observability, documentation, rollback and BG169 production proof are each mapped to a task.
- Placeholder scan: no TBD/TODO/future-fill steps remain.
- Type/interface consistency: `runDate`, canonical `action_id`, deterministic `projectionKey`, reconciliation status and loop-health response are used consistently across tasks.
- Scope control: no new CRM, queue, calendar, brain, analytics store or generic workflow engine is introduced; a new persistent table is explicitly disallowed unless current schema is proven insufficient.