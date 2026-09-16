# Portal V2 Full Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Portal V2 functionally equivalent to the protected legacy portal for all 24 capabilities and global portal functions, backed by canonical Powerhouse state and production evidence.

**Architecture:** Reuse the existing Portal V2 shell, `legacy-functional-inventory.js`, capability contracts, domain-state adapter, functional suite and specialist workspaces. Replace generic/static parity surfaces with capability-specific workspaces and canonical calculations; keep Powerhouse as sole business-state authority and require server-confirmed persistence plus exact-SHA production evidence.

**Tech Stack:** Browser-native ES modules, Node test runner, Playwright production integration tests, GitHub Actions, Netlify, canonical Powerhouse/Supabase state.

**Spec:** `docs/superpowers/specs/2026-09-16-portal-v2-full-parity-design.md`

## Global Constraints
- All 24 protected legacy capabilities are mandatory.
- Global portal capabilities are mandatory: authenticated customer context, logout, export, import, permission-gated print, feedback, customer branding, mobile navigation.
- No parallel Portal V2 datastore, duplicate business calculation authority, duplicate roadmap, or duplicate learning system.
- Editable state must persist through tenant-scoped, server-confirmed canonical Powerhouse writeback.
- No hardcoded/demo business values may masquerade as customer-derived results.
- Exact deployment SHA must be proven before production DOM/browser assertions.
- Overall Portal V2 may be marked LIVE & BEWEZEN only when all protected capabilities and global capabilities are verified.

---

### Task 1: Runtime dispatch to real capability workspaces

**Files:**
- Modify: `portal-v2/page-shell.js`
- Test: `portal-v2/tests/page-shell-functional-parity.test.mjs`

**Interfaces:**
- Consumes: `getCapabilityContract(pageId)`, `listFunctionalSuitePages()`, `mountFunctionalWorkspace(...)`, `mountCanvasWorkspace(...)`, specialist workspace mounts.
- Produces: every protected page routes to a real capability renderer/workspace instead of generic `renderNative` fallback when a functional implementation exists.

- [ ] Write a failing test that reads `page-shell.js` and proves protected functional-suite pages are dispatched via `mountFunctionalWorkspace`, and `canvassen` via `mountCanvasWorkspace`.
- [ ] Run the targeted test and confirm it fails on current code.
- [ ] Import and wire functional/canvas workspace dispatch with specialized-page precedence.
- [ ] Run targeted and Portal V2 tests; require green.
- [ ] Commit the change.

### Task 2: Remove hardcoded legacy overview truth

**Files:**
- Modify: `portal-v2/legacy-parity.js`
- Modify if required: `portal-v2/modules/overview.js`
- Test: `portal-v2/tests/overview-canonical-parity.test.mjs`

**Interfaces:**
- Consumes: canonical domain state and existing overview calculation helpers.
- Produces: overview values are derived from customer state or explicitly unavailable; no static business claims.

- [ ] Add failing assertions that forbidden hardcoded values (`3,4 / 5`, `6.720 uur`, `3,7 FTE`, `11%`, `68%`) do not exist in production overview parity source.
- [ ] Add behavior tests for derived overview values from canonical fixture state.
- [ ] Replace static values with canonical derivation or no-evidence labels.
- [ ] Run targeted and regression tests.
- [ ] Commit.

### Task 3: Capability contract completeness gate

**Files:**
- Create: `portal-v2/parity-gate.js`
- Modify: `.github/scripts/portal_parity.py`
- Test: `portal-v2/tests/parity-gate.test.mjs`

**Interfaces:**
- Consumes: `LEGACY_FUNCTIONAL_INVENTORY`, `listFunctionalContracts`, functional/specialist implementation registries and assurance ledger.
- Produces: machine-readable failure for any missing field/model/calculation/action/dependency implementation or evidence owner.

- [ ] Write failing tests for missing renderer, calculator, action, persistence and production-evidence ownership.
- [ ] Implement the smallest registry/gate needed to make each test pass.
- [ ] Extend CI parity script to fail on incomplete capability mapping.
- [ ] Run tests and parity script.
- [ ] Commit.

### Task 4: Data-entry, profile and answer-review parity

**Files:**
- Modify: `portal-v2/modules/company-input.js`
- Modify: `portal-v2/modules/functional-suite.js`
- Test: `portal-v2/tests/company-input.test.mjs`
- Test: `portal-v2/tests/full-input-parity.test.mjs`

**Interfaces:**
- Consumes: inventory fields for `profiel`, `invoeren`, `antwoorden` and domain-state flush.
- Produces: all company financial, financing, customer, measurement, policy, ESG and scan-answer input/review surfaces with reload persistence.

- [ ] Test every inventory input group has an editable/reviewable V2 field owner.
- [ ] Test save -> flush -> reload fixture equivalence.
- [ ] Fill missing schema mappings and review rendering.
- [ ] Run targeted tests.
- [ ] Commit.

### Task 5: Finance and value calculation parity

**Files:**
- Modify: `portal-v2/modules/functional-suite.js`
- Create as needed: focused calculator modules under `portal-v2/calculators/`
- Test: `portal-v2/tests/finance-value-parity.test.mjs`

**Interfaces:**
- Consumes: profile, metrics, business-case and value-finance canonical state.
- Produces: all inventory calculations for businesscase/cijfers/waarde, including benefit, delay cost, payback, KPI ratios, DCF, DuPont, Altman Z, interest coverage, DSCR, break-even, safety margin and sensitivity.

- [ ] Write one failing behavior test per named inventory calculation.
- [ ] Implement minimal pure calculators using existing semantics and units.
- [ ] Wire calculation cards/evidence to functional workspace.
- [ ] Run all finance/value tests.
- [ ] Commit.

### Task 6: People, market and research parity

**Files:**
- Modify: `portal-v2/modules/functional-suite.js`
- Create focused calculators if required.
- Test: `portal-v2/tests/people-market-research-parity.test.mjs`

**Interfaces:** canonical people/market/research state -> benchmark deltas, growth context, research matrix, do-nothing cost and evidence cards.

- [ ] Test every inventory field/model/calculation/action for these three capabilities.
- [ ] Implement missing calculations and derived views.
- [ ] Prove downstream recalculation after people/market edits.
- [ ] Run regression tests.
- [ ] Commit.

### Task 7: Compliance, AI capability and CSRD/resource-impact parity

**Files:**
- Modify: `portal-v2/modules/functional-suite.js`
- Modify: `portal-v2/csrd-impact.js`
- Modify relevant compliance engine modules.
- Test: existing compliance tests plus `portal-v2/tests/csrd-full-parity.test.mjs`

**Interfaces:** canonical policies/ESG/AI/resource evidence -> readiness, risk, actions and auditable impact; no fabricated resource values.

- [ ] Test all policy/ESG/AI inventory inputs and calculations.
- [ ] Test CO2/water/energy/material/AI-token resource metrics require evidence with provenance/freshness/confidence.
- [ ] Implement missing projections and fail-closed no-evidence state.
- [ ] Run compliance/CSRD tests.
- [ ] Commit.

### Task 8: Complete strategic model inventory and generalized workspace

**Files:**
- Inspect legacy portal sources first; do not invent models.
- Modify: `portal-v2/strategic-models.js`
- Modify: `portal-v2/modules/strategic-model-workspace.js`
- Modify: `portal-v2/modules/functional-suite.js`
- Test: `portal-v2/tests/strategic-models.test.mjs`
- Test: `portal-v2/tests/strategic-models-full-parity.test.mjs`

**Interfaces:** canonical Powerhouse state -> all legacy strategic model outputs, explanations, current positions, conclusions, notes, advice contribution and roadmap actions.

- [ ] Locate and enumerate every legacy strategic model from repository source/evidence.
- [ ] Add failing tests for each discovered model and model-specific calculation/action.
- [ ] Generalize model workspace from BCG-only to registered model renderers without weakening BCG behavior.
- [ ] Implement model derivations and canonical writebacks.
- [ ] Test strategy aggregation and downstream advice/roadmap effects.
- [ ] Commit.

### Task 9: Canvases and final conclusion integration

**Files:**
- Modify only where needed: `portal-v2/modules/canvas-workspace.js`, `portal-v2/canvas-presentation.js`, `portal-v2/modules/functional-suite.js`
- Test: existing functional/canvas tests plus `portal-v2/tests/strategy-conclusion-crossflow.test.mjs`

**Interfaces:** six canvases + canonical sources -> final synthesis/consensus/recommendations.

- [ ] Preserve already proven six-canvas save/reload behavior.
- [ ] Add failing cross-flow test: canvas change changes strategy/final conclusion where dependency applies.
- [ ] Implement missing synthesis linkage.
- [ ] Update stale Canvassen assurance only with existing production evidence.
- [ ] Commit.

### Task 10: Due diligence and Strategy DNA parity

**Files:**
- Modify: DD/DNA existing modules and functional suite.
- Test: existing DNA tests plus `portal-v2/tests/dd-dna-full-parity.test.mjs`

**Interfaces:** canonical DD evidence + capability catalog + Strategy DNA state -> readiness/materiality/red flags/transferability/theme impact/maturity/sequencing.

- [ ] Test all DD and DNA inventory fields/models/calculations/actions.
- [ ] Reuse capability catalog and existing DNA library/search/translation.
- [ ] Implement missing calculation/writeback paths.
- [ ] Run tests.
- [ ] Commit.

### Task 11: Execution, advice, offer and roadmap parity

**Files:**
- Modify existing delivery/execution modules and functional suite.
- Test: `portal-v2/tests/execution-full-parity.test.mjs`

**Interfaces:** canonical changes/decisions/advice/offers/roadmap -> freshness, impact, priorities, price and progress; actions write into existing canonical roadmap/outcome structures.

- [ ] Test inventory fields/calculations/actions for bijhouden, wijzigingen, advies, offerte and roadmap.
- [ ] Implement missing action handlers, pricing and progress/value calculations.
- [ ] Prove add/drag/complete/remove/reload semantics where the legacy contract requires them.
- [ ] Run tests.
- [ ] Commit.

### Task 12: Global portal capabilities and cross-capability consistency

**Files:**
- Modify existing global actions/navigation/branding/state modules only as needed.
- Test: `portal-v2/tests/global-capabilities-parity.test.mjs`
- Test: `portal-v2/tests/cross-capability-recalculation.test.mjs`

**Interfaces:** authenticated tenant identity + canonical state -> global actions and deterministic downstream recalculation.

- [ ] Test login/context isolation, logout, export/import, permission-gated print, feedback, branding and mobile navigation.
- [ ] Test canonical source edits invalidate/recompute every declared dependent capability.
- [ ] Implement only missing behavior.
- [ ] Run full Portal V2 suite.
- [ ] Commit.

### Task 13: Release-wide assurance and production E2E

**Files:**
- Modify: `powerhouse/assurance/portal-v2-parity.json`
- Modify/add Playwright integration specs under `tests/integration/`.
- Modify workflow only if the existing exact-SHA runner cannot cover aggregate parity.

**Interfaces:** release SHA -> exact Netlify deploy -> authenticated DOM/browser/mobile/readback -> per-capability evidence ledger.

- [ ] Add aggregate test that refuses 24/24 completion unless every protected capability is `verified` and global tests are green.
- [ ] Run Required, BRAIN, Portal V2 tests and Powerhouse Assurance on feature head.
- [ ] Open protected PR and merge only after required checks are green.
- [ ] Verify exact merged SHA is promoted to production.
- [ ] Execute full authenticated production tour at desktop plus widths 320/390/430, including edit/save/reload on editable capabilities.
- [ ] Execute visual regression.
- [ ] Update assurance ledger from terminal evidence only.

### Task 14: Canonical Powerhouse and human-readable closure

**Files/Systems:** canonical Supabase Powerhouse records + Notion Latest Verified State + Human Handbook.

**Interfaces:** production evidence -> CurrentState + Learning + documentation readback.

- [ ] Write release CurrentState and evidence IDs to existing canonical `brain_records`.
- [ ] Close only obligations proven closed; preserve unresolved obligations.
- [ ] Write prevention learnings and ancestry/deploy evidence.
- [ ] Update Notion Latest Verified State and Human Handbook.
- [ ] Read both stores back.
- [ ] Re-check protected `main`, production exact SHA ancestry and all production runners.
- [ ] Declare overall `LIVE & BEWEZEN` only if aggregate gate is 24/24 + global green; otherwise report `DEELS LIVE` with exact remaining obligations.
