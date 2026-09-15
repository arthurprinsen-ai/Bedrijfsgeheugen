# Powerhouse Market-Truth Learning v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add pre-treatment experiment assignment, observed cost/effort, human feedback, causal-readiness and market-truth health to the existing Powerhouse closed loop, then deploy, verify and document it.

**Architecture:** Reuse canonical Powerhouse opportunities/actions/outcomes/runtime events and existing commercial-learning surfaces. Add only the minimal server-side persistence required for prospective assignment, observed action economics and explicit human feedback; derive all analysis from those records and existing outcomes. No parallel CRM/store/queue and no synthetic evidence.

**Tech Stack:** PostgreSQL/Supabase, pg_cron where already used, Node test runner, GitHub Actions, Notion Powerhouse projection.

**Spec:** `docs/superpowers/specs/2026-09-15-powerhouse-market-truth-learning-v1-design.md`

## Global Constraints
- Supabase/Powerhouse is canonical transactional runtime.
- No Make dependency.
- Human final send remains mandatory where already required.
- Missing commercial evidence remains NULL/insufficient_evidence; never synthesize it.
- Causal uplift requires persisted pre-treatment assignment plus matured treatment/control evidence.
- Existing identity, contact-pressure, truth, provider and compliance gates remain fail-closed.
- DDL is applied through a migration, never ad hoc schema edits.

---

### Task 1: Contract tests for market-truth persistence and causal guard

**Files:**
- Create: `tests/revenue-learning-market-truth-v1.test.mjs`
- Create later in Task 2: `supabase/migrations/20260915184500_powerhouse_market_truth_learning_v1.sql`

**Interfaces:**
- Consumes: existing repository migration conventions.
- Produces: static contract assertions for new tables, functions, views and security grants.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const p='supabase/migrations/20260915184500_powerhouse_market_truth_learning_v1.sql';

test('market truth migration defines prospective assignment and observed evidence stores', async()=>{
  const sql=await readFile(p,'utf8');
  for (const name of ['powerhouse_experiment_assignments','powerhouse_action_economics','powerhouse_human_feedback_events']) {
    assert.match(sql,new RegExp(`create\\s+table\\s+if\\s+not\\s+exists\\s+public\\.${name}`,'i'));
  }
  assert.match(sql,/assigned_at/i);
  assert.match(sql,/measurement_horizon_end/i);
  assert.match(sql,/provider_cost_eur/i);
  assert.match(sql,/human_minutes/i);
  assert.match(sql,/recommended_variant/i);
  assert.match(sql,/actual_variant/i);
});

test('causal readiness stays fail closed until pre-treatment matured evidence exists', async()=>{
  const sql=await readFile(p,'utf8');
  assert.match(sql,/powerhouse_causal_experiment_readiness_v1/i);
  assert.match(sql,/assignment_before_treatment/i);
  assert.match(sql,/insufficient_evidence/i);
  assert.match(sql,/not_proven/i);
});

test('new stores are server side and secured', async()=>{
  const sql=await readFile(p,'utf8');
  for (const name of ['powerhouse_experiment_assignments','powerhouse_action_economics','powerhouse_human_feedback_events']) {
    assert.match(sql,new RegExp(`alter\\s+table\\s+public\\.${name}\\s+enable\\s+row\\s+level\\s+security`,'i'));
    assert.match(sql,new RegExp(`revoke\\s+all\\s+on\\s+public\\.${name}\\s+from\\s+anon\\s*,\\s*authenticated`,'i'));
  }
});
```

- [ ] **Step 2: Run test to verify RED**

Run: `node --test tests/revenue-learning-market-truth-v1.test.mjs`
Expected: FAIL because migration does not yet exist.

- [ ] **Step 3: Commit the RED contract**

Commit message: `test: define Powerhouse market-truth learning contract`

### Task 2: Persist pre-treatment assignments, action economics and human feedback

**Files:**
- Create: `supabase/migrations/20260915184500_powerhouse_market_truth_learning_v1.sql`
- Test: `tests/revenue-learning-market-truth-v1.test.mjs`

**Interfaces:**
- Produces:
  - `public.powerhouse_experiment_assignments`
  - `public.powerhouse_action_economics`
  - `public.powerhouse_human_feedback_events`
  - `public.powerhouse_assign_experiment_v1(...)`
  - `public.powerhouse_record_action_economics_v1(...)`
  - `public.powerhouse_record_human_feedback_v1(...)`

- [ ] **Step 1: Implement server-only tables with uniqueness/idempotency**

Use UUID primary keys, `created_at/updated_at`, dedupe keys, foreign-key-by-business-key where safe, nonnegative checks for cost/minutes, assignment arm check `treatment|holdout`, and feedback check `approve|edit|skip|cancel|override|alternative_action`.

- [ ] **Step 2: Implement assignment function**

The function must persist before treatment, refuse to mutate an existing assignment arm, save eligibility snapshot/model version/horizon, and return the canonical row. Stable hash may choose arm when caller omits it, but stored assignment is authority.

- [ ] **Step 3: Implement economics and human-feedback recorders**

Both must be idempotent on caller-supplied dedupe key and preserve observed NULLs. Human feedback stores both recommended and actual variants when supplied.

- [ ] **Step 4: Apply RLS/grants**

Enable RLS. Revoke anon/authenticated access. Grant only service-role execution/select/insert/update needed by the canonical runtime functions.

- [ ] **Step 5: Run contract test**

Run: `node --test tests/revenue-learning-market-truth-v1.test.mjs`
Expected: PASS.

### Task 3: Derived market-truth and causal-readiness surfaces

**Files:**
- Modify: `supabase/migrations/20260915184500_powerhouse_market_truth_learning_v1.sql`
- Test: `tests/revenue-learning-market-truth-v1.test.mjs`

**Interfaces:**
- Produces:
  - `powerhouse_causal_experiment_readiness_v1`
  - `powerhouse_market_truth_unit_economics_v1`
  - `powerhouse_human_feedback_effectiveness_v1`
  - `powerhouse_market_truth_health_v1`

- [ ] **Step 1: Add experiment readiness view**

Expose counts for treatment/holdout, matured assignments, assignment-before-treatment validity, observed outcomes per arm and `causal_status` of `not_proven|insufficient_evidence|ready_for_estimation`. Never emit an uplift estimate when sample criteria are unmet.

- [ ] **Step 2: Add observed unit economics view**

Join executed actions/economics/outcomes and calculate only observed cost totals, human minutes, realized revenue, cost per observed reply/meeting/proposal/win where denominator exists, and revenue/cost ratio where observed cost > 0.

- [ ] **Step 3: Add human feedback effectiveness view**

Aggregate feedback class, subsequent observed outcomes and realized revenue without treating a skip/edit itself as a market loss.

- [ ] **Step 4: Add market-truth health view**

Expose assignment count, matured experiments, causal-ready experiments, actions with economics, feedback rows, calibration samples, realized revenue and sparse-evidence warnings.

- [ ] **Step 5: Secure all views**

Set `security_invoker=true`, revoke anon/authenticated, grant service_role select.

### Task 4: Daily writeback and GA4 resolution evidence

**Files:**
- Modify: `supabase/migrations/20260915184500_powerhouse_market_truth_learning_v1.sql`

**Interfaces:**
- Produces:
  - `powerhouse_market_truth_daily_v1(date)`
  - runtime resolution event for the historical GA4 freshness error when current source health is healthy.

- [ ] **Step 1: Implement daily function**

Read `powerhouse_market_truth_health_v1`, merge the result into the current day's `powerhouse_daily_runs.evidence.market_truth_learning`, and return the same JSON. Do not change the daily run to green if another canonical guard is red.

- [ ] **Step 2: Resolve GA4 incident by evidence, not deletion**

Insert an idempotent `source_health_resolved` runtime event referencing the historical error timestamp/subject when current GA4 freshness is healthy. Keep the original error row unchanged.

- [ ] **Step 3: Add daily cron only if no equivalent existing canonical scheduler invokes it**

If a compatible daily commercial loop exists, integrate via that existing route instead of introducing a duplicate cron. Otherwise add one low-frequency daily invocation after the commercial learning run.

### Task 5: Production migration, readback and repository merge

**Files:**
- Create/modify release documentation under `docs/learning/` with exact production evidence.

**Interfaces:**
- Produces: deployed Supabase schema/function/view state and canonical GitHub main SHA.

- [ ] **Step 1: Apply the migration with Supabase `apply_migration`**
- [ ] **Step 2: Run production readback** for table/function/view existence, security, row counts and a harmless prospective assignment/evidence path using an internal test subject that cannot trigger outbound execution.
- [ ] **Step 3: Create PR and wait for Required, Revenue Learning, Supabase Security, BRAIN delivery and relevant cockpit workflows to complete green.**
- [ ] **Step 4: Merge only after green gates and re-read current `main`.**
- [ ] **Step 5: Re-run production health/readback after merge.**

### Task 6: Canonical Powerhouse writeback and human documentation

**Files:**
- Modify existing Notion `Powerhouse Menselijk Handboek — Processen, Data, Intelligentie, Algoritmen & Samenhang`.
- Add/update existing `Powerhouse Latest Verified State` row.
- Write existing Supabase `brain_records` Verification/Learning/Memory/CurrentState records.

**Interfaces:**
- Produces: human and machine-readable canonical current state.

- [ ] **Step 1: Write `brain_records`** with merged main SHA, migration version, CI run IDs, production counts, truth boundaries and remaining sparse-evidence obligations.
- [ ] **Step 2: Update Menselijk Handboek** with experiment assignment, outcome maturity, economics, human feedback, causal-readiness and incident-resolution semantics.
- [ ] **Step 3: Add/update Latest Verified State** with `Status=verified`, `Writeback State=read_back`, exact metrics/evidence and rollback target.
- [ ] **Step 4: Re-fetch Notion and re-query `brain_records` to prove writeback.**
- [ ] **Step 5: Final status** may be `LIVE & BEWEZEN` only if deploy, merge, production readback, CI and writeback are all proven; otherwise report the exact lower status.
