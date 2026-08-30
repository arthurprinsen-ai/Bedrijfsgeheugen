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

- [x] Write the failing contract test.
- [x] Run it through canonical Brain CI and confirm RED — exact failure was missing `make/contracts/cost-portfolio-v1.json`.
- [x] Add the minimal fail-closed contract.
- [x] Re-run through BRAIN automation lane and confirm contract test GREEN.

### Task 2: Strengthen BG159 portfolio candidate selection without fleet-wide deep reads

**Files:**
- Modify live Make scenario BG159 (`7132648`), code module 6 only.

- [x] Capture fresh BG159 state and exact module 6 rollback mapping — pre-change `lastEdit=2026-08-30T13:23:04.888Z`.
- [x] Establish baseline — normal early exit is 4 operations and typically 6 credits.
- [x] Patch only module 6 with fresh-lastEdit protection: two-stage cheap-then-deep ranking, protected control plane/Mission Control excluded from generic mutation, daily baseline preferred, no new fleet-wide detail calls, exactly one deep candidate.
- [x] Verify wiring remains unchanged — post-change `lastEdit=2026-08-30T13:48:59.830Z`.
- [x] Verify run `0ad8ca01e9634ee4938ebf2a41f8cf85`: success, 5908ms, 4 operations, 6 credits, 748571 bytes, modules 1/2/4/5/6 only.
- [x] KEEP bounded change: no extra operations or side effects in verification run.

### Task 3: Tighten BG162 to fail closed on unsupported cost mutations

- [ ] Capture fresh BG162 state and module 2/22 mappings.
- [ ] Verify only enabled contract actions can reach BG160 and cache/projection remains special-contract/advisory.
- [ ] Patch only if a real mismatch exists.
- [ ] Verify unsupported action cannot reach BG160.

### Task 4: Verify BG160 exact rollback executor remains the only Class-A mutation path

- [ ] Re-read BG160 live state.
- [ ] Compare supported actions and protected IDs against repository contract.
- [ ] Verify Mission Control cannot be mutated by generic polling/schedule action.

### Task 5: Add the daily portfolio outcome obligation

- [x] Write obligation test first.
- [x] Confirm RED: `cost-portfolio-decision-daily must be registered`.
- [x] Add obligation with idempotency key `cost-portfolio|date|inventory-fingerprint`.
- [x] Automation lane passed on exact head `a48c8e52...`; first handoff correctly blocked on concurrent declared `delivery-control-plane` overlap.

### Task 6: Automation-lane CI verification and PR

- [x] Open draft PR #392.
- [x] Relevant BRAIN lanes passed on `a48c8e52...`.
- [x] Diagnose handoff failure as declared-contract overlap, not test failure.
- [x] Root-cause and recover sync-order mistake: first constructed merge commit was not referenced before a subsequent plan write; no production or main state changed.
- [ ] Branch synchronization must finish as a non-force fast-forward from actual branch head to a merge commit containing latest main plus feature tree.
- [ ] Obtain fresh all-green handoff evidence.
- [ ] Update PR evidence and mark ready only when repository + Make evidence are green.

### Task 7: Production promotion and shared learning

- [ ] Final current-main path/contract conflict check.
- [ ] Promote exact green candidate only through BG169.
- [ ] Verify exact production identity and protected gates.
- [ ] Route material outcome through BG168/BG166 and verify BG167 refresh.
- [ ] Close only on `PRODUCTION_GREEN` or exact `ROLLED_BACK_GREEN`.
