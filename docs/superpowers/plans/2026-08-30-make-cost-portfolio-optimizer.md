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
- Create: `scripts/brain/test-make-cost-portfolio.mjs`

**Interfaces:**
- Consumes: BRAIN-DELIVERY-v2 automation lane and the approved design spec.
- Produces: machine-readable contract fields `candidate_limit`, `selection_mode`, `required_evidence`, `allowed_actions`, `mission_control_policy`.

- [x] **Step 1: Write the failing contract test**
- [x] **Step 2: Run it through canonical Brain CI and confirm RED** — exact failure was missing `make/contracts/cost-portfolio-v1.json`.
- [x] **Step 3: Add the minimal fail-closed contract**
- [x] **Step 4: Re-run through BRAIN automation lane and confirm contract test GREEN**

### Task 2: Strengthen BG159 portfolio candidate selection without fleet-wide deep reads

**Files:**
- Modify live Make scenario: BG159 (`7132648`), code module 6 only.

**Interfaces:**
- Consumes: one existing fleet inventory result from module 4 plus previous daily snapshot.
- Produces: exactly one candidate event with `ranking_mode`, `candidate`, `selection_evidence`, and `deep_enrichment_required`.

- [x] **Step 1: Capture fresh BG159 `lastEdit` and module 6 rollback mapping** — pre-change `lastEdit=2026-08-30T13:23:04.888Z`.
- [x] **Step 2: Establish baseline evidence** — successful early-exit runs used 4 operations and typically 6 credits; latest pre-change sample `d2e06...` used 4 operations/12 credits/747580 bytes.
- [x] **Step 3: Patch only module 6 with fresh-lastEdit protection** — protected control plane/Mission Control excluded from generic mutation ranking; daily evidence preferred; no new fleet-wide detail calls; deep candidate limit remains one.
- [x] **Step 4: Verify wiring remains unchanged** — post-change `lastEdit=2026-08-30T13:48:59.830Z` and only module 6 configuration changed.
- [x] **Step 5: Run BG159 safely and verify cost envelope** — execution `0ad8ca01e9634ee4938ebf2a41f8cf85` succeeded in 5908ms, 4 operations, 6 credits, 748571 bytes, executing only modules 1/2/4/5/6 because today’s snapshot already existed.
- [x] **Step 6: Retention decision** — KEEP for this bounded change: operations did not increase and credits matched the normal 6-credit early-exit baseline; no downstream side-effect was triggered in the verification run.

### Task 3: Tighten BG162 to fail closed on unsupported cost mutations

**Files:**
- Live Make scenario BG162 (`7135438`), verification first; mutate only on proven contract gap.

- [ ] Capture fresh BG162 state and exact module 2/22 mappings.
- [ ] Verify only enabled contract actions can reach BG160 and cache/projection remains special-contract/advisory.
- [ ] Patch only if a real mismatch exists.
- [ ] Verify unsupported action cannot reach BG160.

### Task 4: Verify BG160 exact rollback executor remains the only Class-A mutation path

**Files:**
- Live Make scenario BG160 (`7134976`), verification only unless stricter contract alignment requires a fix.

- [ ] Re-read BG160 live state.
- [ ] Compare supported actions and protected IDs against repository contract.
- [ ] Verify Mission Control cannot be mutated by generic polling/schedule action.

### Task 5: Add the daily portfolio outcome obligation

**Files:**
- Modify: `config/outcome-obligations.json`
- Extend: `scripts/brain/test-make-cost-portfolio.mjs`

- [x] Write obligation test first.
- [x] Confirm RED in Brain Foundation verify: `cost-portfolio-decision-daily must be registered`.
- [x] Add obligation with idempotency key `cost-portfolio|date|inventory-fingerprint` and required evidence states.
- [x] Automation lane itself passed on exact head `a48c8e52...`; handoff then correctly blocked on declared `delivery-control-plane` overlap from concurrent `main` changes, requiring synchronization rather than blind promotion.

### Task 6: Automation-lane CI verification and PR

- [x] Open draft PR #392 to `main`.
- [x] Run relevant BRAIN lanes on exact candidate; portal/backend/website/automation lanes passed on `a48c8e52...`.
- [x] Diagnose handoff failure as declared-contract overlap, not test failure.
- [ ] Synchronize this affected lane with current main without force push.
- [ ] Obtain fresh all-green handoff evidence after sync.
- [ ] Update PR with live Make verification evidence and mark ready only when repository + Make evidence are green.

### Task 7: Production promotion and shared learning

- [ ] Perform final current-main path/contract conflict check.
- [ ] Promote exact green candidate only through BG169.
- [ ] Verify exact production identity and protected gates; merge alone is not completion.
- [ ] Route material outcome through BG168/BG166 and verify BG167 refresh.
- [ ] Close only on `PRODUCTION_GREEN` or exact `ROLLED_BACK_GREEN`.
