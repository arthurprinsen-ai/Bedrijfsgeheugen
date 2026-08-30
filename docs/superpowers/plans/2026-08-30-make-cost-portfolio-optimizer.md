# Make Cost Portfolio Optimizer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the existing BG159/BG162/BG160 cost control plane so the Make fleet is optimized portfolio-first with verified outcome efficiency, exact reversible mutations, and BRAIN-DELIVERY-v2 governance.

**Architecture:** Reuse BG159 as the single fleet sensor, BG162 as the economy governor, BG160 as deterministic Class-A executor, and BG168/BG166/BG167 for shared learning/current state. Do not introduce a parallel optimizer. Repository-backed governance artifacts travel through the automation delivery lane and BG169; live Make mutations use fresh `lastEdit`, exact preconditions, bounded action classes, outcome verification, and deterministic rollback.

**Tech Stack:** Make scenarios/API, JavaScript code modules, GitHub Actions, BRAIN-DELIVERY-v2, BG159/BG162/BG160/BG168/BG166/BG167/BG169.

**Spec:** `docs/superpowers/specs/2026-08-30-make-cost-portfolio-optimizer-design.md`

## Global Constraints

- `NO SILENT FAILURE`
- `NO LOST OBLIGATION`
- `GREEN MEANS OUTCOME VERIFIED`
- `RED MEANS AGENTS KEEP WORKING`
- `GREEN CANDIDATE MEANS PROMOTE TO PRODUCTION`
- No credentials/OAuth/permission changes.
- No security weakening.
- No destructive or irreversible data changes.
- No paid-resource increase.
- No legally or financially binding actions.
- BG169 remains production authority for GitHub-backed changes.
- BG168/BG166/BG167 remain material outcome/error/current-state path.
- Mission Control BG139/BG186/BG188/BG190/BG191 keeps its stricter existing promotion contract unchanged.
- Maximum two identical retries per hypothesis.
- Optimize one primary Make mutation at a time by default.
- Retain a cost change only when verified net savings are positive and protected outcomes remain equal or better.

---

### Task 1: Lock the portfolio decision contract into repository tests

**Files:**
- Create: `make/contracts/cost-portfolio-v1.json`
- Create: `make/contracts/cost-portfolio-v1.test.mjs`

**Interfaces:**
- Consumes: BRAIN-DELIVERY-v2 automation lane and the approved design spec.
- Produces: machine-readable contract fields `candidate_limit`, `selection_mode`, `protected_scenarios`, `required_evidence`, `allowed_actions`, `mission_control_policy`.

- [ ] **Step 1: Write the failing contract test**

The test must require the contract file, assert `candidate_limit === 1`, require a two-stage selection mode, require `credits_per_verified_outcome` in retained-decision evidence, prohibit Mission Control free-form rewrites, and require BG168/BG166/BG167 writeback.

- [ ] **Step 2: Run the test and confirm RED**

Run: `node --test make/contracts/cost-portfolio-v1.test.mjs`
Expected: FAIL because `make/contracts/cost-portfolio-v1.json` does not yet exist.

- [ ] **Step 3: Add the minimal contract**

Create the JSON contract with the exact invariants from the approved spec and explicit action classes: `SAFE_POLLING_CHANGE`, `SAFE_SCHEDULE_CHANGE`, and future actions disabled until separately proven.

- [ ] **Step 4: Run the test and confirm GREEN**

Run: `node --test make/contracts/cost-portfolio-v1.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit only the contract and its test.

### Task 2: Strengthen BG159 portfolio candidate selection without fleet-wide deep reads

**Files:**
- Modify live Make scenario: BG159 (`7132648`), code module 6 and only if necessary module 17.
- Record exact before-state in shared learning after verification.

**Interfaces:**
- Consumes: one existing fleet inventory result from module 4 plus previous daily snapshot.
- Produces: exactly one candidate event with `ranking_mode`, `candidate`, `selection_evidence`, and explicit `deep_enrichment_required`.

- [ ] **Step 1: Capture fresh BG159 `lastEdit` and module configuration**

Use Make `scenario_get` and `scenario_module_get`; persist the exact pre-change module mapping as rollback evidence.

- [ ] **Step 2: Establish baseline evidence**

Use recent BG159 execution evidence to record credits/run, operations/run, data transfer and whether the expensive enrichment path was skipped or executed.

- [ ] **Step 3: Patch only module 6**

Change the ranking from raw highest daily credits to a deterministic stage-1 score that uses already-available fleet fields only: active state, known daily credits, transfer, operations, schedule/actionability, protected-control-plane exclusion, and unresolved-evidence exclusion. Keep top-depth at one candidate so no new fleet-wide API calls are added.

- [ ] **Step 4: Verify BG159 configuration exactly**

Fetch the scenario again and verify the intended mapper changed and all unrelated modules/wiring remain unchanged.

- [ ] **Step 5: Run BG159 once if safe and verify cost envelope**

Expected: no extra fleet-wide detail calls; deep enrichment only when the daily snapshot creates a new actionable candidate. Compare operations/credits against baseline.

- [ ] **Step 6: Roll back if optimizer overhead or outcome evidence regresses**

Restore the exact captured mapper if the run is more expensive without a stronger decision or if protected behavior changes.

### Task 3: Tighten BG162 to fail closed on unsupported cost mutations

**Files:**
- Modify live Make scenario: BG162 (`7135438`), modules 2 and/or 22 only.

**Interfaces:**
- Consumes: BG159 portfolio event.
- Produces: `NO_ACTION`, `CACHE_FIRST_PROJECTION_REQUIRED`, or an exact allowlisted Class-A executor payload.

- [ ] **Step 1: Capture fresh BG162 state and exact module mappings**

Store module 2 and 22 before-state and `lastEdit` for drift protection.

- [ ] **Step 2: Verify current supported actions**

Confirm only proven Class-A actions are executable; cache/projection remains advisory unless a separate explicit promotion contract authorizes activation.

- [ ] **Step 3: Patch the validator only if a gap exists**

Add explicit rejection for any action not in the repository cost contract. Do not expand action types in this task.

- [ ] **Step 4: Verify no unsupported action reaches BG160**

Use an on-demand dry event or existing evidence path that does not trigger external side effects. Expected: unsupported actions return advisory/no-action.

### Task 4: Verify BG160 exact rollback executor remains the only Class-A mutation path

**Files:**
- Live Make scenario: BG160 (`7134976`), verification only unless a contract mismatch is found.

**Interfaces:**
- Consumes: exact `PASS_A` payload from BG162.
- Produces: applied-and-verified or rolled-back-and-verified result plus learning writeback.

- [ ] **Step 1: Re-read BG160 live state**

Verify supported actions, protected scenario IDs, exact precondition check, reservation, verify, rollback, rollback verification and learning modules.

- [ ] **Step 2: Compare against repository contract**

If BG160 is stricter than or equal to the contract, make no change. If it is looser, tighten only the mismatching allowlist/precondition.

- [ ] **Step 3: Verify no Mission Control scenario can be mutated by generic polling/schedule action**

Expected: protected IDs fail closed.

### Task 5: Add the daily portfolio outcome obligation

**Files:**
- Modify: `config/outcome-obligations.json`
- Modify or extend: `make/contracts/cost-portfolio-v1.test.mjs`

**Interfaces:**
- Produces obligation `cost-portfolio-decision-daily` owned by `agent-cost`.

- [ ] **Step 1: Extend the test to require the obligation**

Require daily evidence of one of: `SAFE_OPTIMIZATION_CANDIDATE`, `VERIFIED_NO_ACTION`, or `BLOCKED_HARD_BOUNDARY`, plus BG168/BG167 visibility for material changes.

- [ ] **Step 2: Run RED**

Expected: FAIL until obligation is registered.

- [ ] **Step 3: Add the obligation**

Use idempotency key `cost-portfolio|date|inventory-fingerprint` and recovery policy that refreshes inventory, reuses known fingerprints, and never performs duplicate side effects.

- [ ] **Step 4: Run GREEN**

Run the focused contract test plus existing outcome-obligation tests.

### Task 6: Automation-lane CI verification and PR

**Files:**
- No additional production code unless a gate reveals a root-cause defect.

**Interfaces:**
- Consumes: exact feature SHA.
- Produces: BRAIN-DELIVERY-v2 automation-lane evidence.

- [ ] **Step 1: Run focused tests**

Run the new Make cost contract test and existing delivery/outcome tests.

- [ ] **Step 2: Run automation lane suite**

Equivalent gate: `node scripts/brain/test-all.mjs && node --test tests/delivery-*.test.mjs tests/brain-delivery-system.test.mjs make/contracts/cost-portfolio-v1.test.mjs`.

- [ ] **Step 3: Open PR to `main` from `automation/make-cost-portfolio-v1`**

PR must state exact scope, Make live-state evidence, rollback identities, and that Mission Control special invariants were not changed.

- [ ] **Step 4: Wait for exact GitHub CI evidence and inspect failures**

Red is non-terminal. Fix only actual root causes; do not recreate the branch for non-overlapping `main` drift.

### Task 7: Production promotion and shared learning

**Files:**
- Repository merge/promotion only after exact green candidate evidence.

**Interfaces:**
- Consumes: exact green PR head and current-main drift evidence.
- Produces: exact production identity, `PRODUCTION_PROMOTION` or rollback, and BG168/BG166/BG167 writeback.

- [ ] **Step 1: Perform current-main path/contract conflict check**

Non-overlapping drift keeps the tested candidate valid. Real overlap requires synchronization of this lane only.

- [ ] **Step 2: Promote through BG169**

No direct `main` writer bypass.

- [ ] **Step 3: Verify exact production identity and all protected gates**

A merge/commit alone is not completion.

- [ ] **Step 4: Write material outcome and refresh shared context**

Record verified savings behavior, no-action behavior, any failed hypotheses, rollback identity and reusable prevention rule through BG168/BG166; verify BG167 visibility.

- [ ] **Step 5: Close only on `PRODUCTION_GREEN` or exact `ROLLED_BACK_GREEN`**
