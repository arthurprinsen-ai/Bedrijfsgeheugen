# Portal V2 Full Functional SaaS Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild Portal V2 so every protected legacy portal capability is functionally usable natively in V2 with persistent customer state, real calculations, editable models/canvases, modern SaaS UX and exact production parity evidence.

**Architecture:** Keep `klantportaal.html` as the migration reference only. Add a canonical V2 domain-state layer above the existing authenticated portal-state backend, then replace generic static page rendering capability-by-capability with focused functional renderers. Shared field, validation, autosave, calculation, completion, evidence and action-conversion primitives are reused across modules; desktop and mobile share state but compose differently.

**Tech Stack:** Browser-native ES modules, existing Portal V2 shell, existing Netlify functions/API contracts, Node test runner, Playwright, Python parity gate, Netlify deploy previews and production readback workflows.

**Spec:** `docs/superpowers/specs/2026-09-09-portal-v2-full-functional-saas-parity-design.md`

## Global Constraints

- No iframe, redirect, hidden route, fallback, runtime import or user journey back to `/klantportaal`, `portal-next`, or another legacy shell.
- Legacy content and calculation semantics remain the functional source of truth until each capability is proven migrated.
- Generic `metrics/worklist/actions` cards do not satisfy parity for any editable legacy capability.
- Every migrated capability must support edit/input, persistence, reopen, validation, dependent calculations and browser proof.
- Mobile and desktop share one canonical state model.
- Reuse Strategy DNA, CSRD/Impact where functionally complete, connector builder, authenticated state, branding, import/export, print, feedback and logout.
- Derived values must come from persisted customer state or runtime evidence, never demo constants after migration.
- Each release must pass exact-SHA Required, Portal V2 tests, Netlify preview, production deploy commit-ref verification and production readback before completion is claimed.

---

## File Structure Locked by This Plan

### Shared functional platform
- Create `portal-v2/domain-state.js` — canonical capability state reads/writes, path-based updates, dirty state, confirmed persistence and subscriptions.
- Create `portal-v2/capability-contracts.js` — functional metadata for each parity capability.
- Create `portal-v2/form-primitives.js` — reusable input renderers and value extraction.
- Create `portal-v2/workspace-shell.js` — SaaS workspace composition for form/canvas/cockpit/report modes.
- Create `portal-v2/validation.js` — shared validation/result helpers.
- Create `portal-v2/calculators.js` — deterministic derived-value calculators.
- Create `portal-v2/completion.js` — capability completion logic.
- Create `portal-v2/evidence-actions.js` — owner/evidence/action conversion primitives.
- Create `portal-v2/parity-manifest-functional.js` — machine-readable migration state and test references.

### Capability modules
- Create `portal-v2/modules/company-input.js`
- Create `portal-v2/modules/overview.js`
- Create `portal-v2/modules/strategy-models.js`
- Create `portal-v2/modules/canvases.js`
- Create `portal-v2/modules/business-finance.js`
- Create `portal-v2/modules/people-market-research.js`
- Create `portal-v2/modules/compliance-ai.js`
- Create `portal-v2/modules/ma-exit.js`
- Create `portal-v2/modules/execution.js`

### Existing files to modify incrementally
- Modify `portal-v2/page-registry.js` — register functional contracts/renderers.
- Modify `portal-v2/page-shell.js` — dispatch to functional modules, retain generic renderer only for genuinely read-only pages.
- Modify `portal-v2/native-pages.js` — retire static demo content capability-by-capability.
- Modify `portal-v2/app.js` — initialize domain state and route shared context to workspaces.
- Modify `portal-v2/app.css`, `portal-v2/interaction.css`, and focused module CSS as needed for SaaS workspaces/mobile layouts.
- Modify `.github/scripts/portal_parity.py` and add V2 functional parity checking without weakening the legacy baseline guard.
- Modify/add tests under `tests/portal-v2/` and `tests/integration/portal-v2-live.spec.js`.

---

### Task 1: Inventory the exact legacy functional surface and fail closed on omissions

**Files:**
- Create: `portal-v2/legacy-functional-inventory.js`
- Create: `tests/portal-v2/legacy-functional-inventory.test.mjs`
- Modify: `portal-v2/parity-manifest.js`
- Modify: `.github/scripts/portal_parity.py`

**Interfaces:**
- Produces: `LEGACY_FUNCTIONAL_INVENTORY`, keyed by the 24 protected legacy capability keys, each with `fields`, `models`, `calculations`, `actions`, `dependencies`, and `globalCapabilities` where applicable.
- Produces: `assertFunctionalInventoryComplete()` for CI use.

- [ ] **Step 1: Write the failing inventory contract test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_FUNCTIONAL_INVENTORY, assertFunctionalInventoryComplete } from '../../portal-v2/legacy-functional-inventory.js';

const required = ['overzicht','profiel','dataai','aiscan','invoeren','antwoorden','business','cijfers','waarde','mensen','branche','onderzoek','beleid','aicap','strategie','canvassen','eindconclusie','dd','dna','bijhouden','wijzigingen','advies','offerte','roadmap'];

test('legacy functional inventory covers every protected capability', () => {
  assert.deepEqual(Object.keys(LEGACY_FUNCTIONAL_INVENTORY).sort(), required.sort());
  assert.doesNotThrow(() => assertFunctionalInventoryComplete());
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/portal-v2/legacy-functional-inventory.test.mjs`

Expected: FAIL because `legacy-functional-inventory.js` does not yet exist.

- [ ] **Step 3: Extract the inventory from `klantportaal.html` and related legacy JS**

Record every legacy input/control, model/canvas section, calculator/derived output, action, cross-panel dependency and global capability. Preserve exact legacy identifiers as `legacyFieldId`/`legacyActionId` wherever available so omissions are machine-detectable.

Implement shape:

```js
export const LEGACY_FUNCTIONAL_INVENTORY = Object.freeze({
  profiel: {
    fields: [{ legacyFieldId: '...', type: 'text', v2Path: 'profile....' }],
    models: [],
    calculations: ['profileCompleteness'],
    actions: ['save','review'],
    dependencies: ['overzicht']
  }
  // all 24 entries, derived from source rather than guessed
});

export function assertFunctionalInventoryComplete() {
  for (const [id, item] of Object.entries(LEGACY_FUNCTIONAL_INVENTORY)) {
    if (!Array.isArray(item.fields) || !Array.isArray(item.models) || !Array.isArray(item.calculations) || !Array.isArray(item.actions) || !Array.isArray(item.dependencies)) {
      throw new Error(`Incomplete functional inventory: ${id}`);
    }
  }
}
```

- [ ] **Step 4: Extend Python parity without weakening old baseline checks**

Add a second V2 functional inventory existence/completeness check after the existing legacy marker checks. The old 24-panel/global/overview/semantic checks remain unchanged.

- [ ] **Step 5: Run tests GREEN**

Run:
`node --test tests/portal-v2/legacy-functional-inventory.test.mjs`
`python .github/scripts/portal_parity.py`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add portal-v2/legacy-functional-inventory.js portal-v2/parity-manifest.js tests/portal-v2/legacy-functional-inventory.test.mjs .github/scripts/portal_parity.py
git commit -m "test: inventory legacy portal functionality for V2 parity"
```

---

### Task 2: Build the canonical V2 domain-state layer

**Files:**
- Create: `portal-v2/domain-state.js`
- Create: `portal-v2/validation.js`
- Create: `tests/portal-v2/domain-state.test.mjs`
- Modify: `portal-v2/app.js`

**Interfaces:**
- Produces: `createDomainState({ load, save })`.
- API: `state.get(path)`, `state.set(path,value)`, `state.patch(path,object)`, `state.subscribe(fn)`, `state.flush()`, `state.status()`.
- Status values: `idle | dirty | saving | saved | error`.

- [ ] **Step 1: Write failing domain-state tests**

```js
test('domain state tracks dirty values and confirms persistence before saved', async () => {
  const writes=[];
  const store=createDomainState({load:async()=>({profile:{name:'A'}}),save:async value=>{writes.push(structuredClone(value));return value;}});
  await store.init();
  store.set('profile.name','B');
  assert.equal(store.status(),'dirty');
  await store.flush();
  assert.equal(store.status(),'saved');
  assert.equal(writes.at(-1).profile.name,'B');
});
```

Also cover save failure retaining dirty data and status `error`, path updates, subscriptions and reload/reopen.

- [ ] **Step 2: Run RED**

Run: `node --test tests/portal-v2/domain-state.test.mjs`

Expected: module missing / functions undefined.

- [ ] **Step 3: Implement minimal canonical store**

Use the existing authenticated V2 customer-state load/save functions as adapters. Do not pass browser-selected tenant IDs to backend writes. Debounce autosave in UI, but keep `flush()` deterministic for tests and page transitions.

- [ ] **Step 4: Initialize domain state once in `app.js`**

Expose it through the shell context rather than reloading state per module.

- [ ] **Step 5: Run GREEN**

Run all Portal V2 node tests.

- [ ] **Step 6: Commit**

```bash
git add portal-v2/domain-state.js portal-v2/validation.js portal-v2/app.js tests/portal-v2/domain-state.test.mjs
git commit -m "feat: add canonical Portal V2 domain state"
```

---

### Task 3: Add functional capability contracts and workspace shell

**Files:**
- Create: `portal-v2/capability-contracts.js`
- Create: `portal-v2/workspace-shell.js`
- Create: `tests/portal-v2/capability-contracts.test.mjs`
- Modify: `portal-v2/page-registry.js`
- Modify: `portal-v2/page-shell.js`
- Modify: `portal-v2/interaction.css`

**Interfaces:**
- `getCapabilityContract(pageId)` returns `{id,legacyCapability,mode,schemaVersion,renderer,dataSlice,validators,calculators,dependencies,completionRules,browserContract}`.
- `mountWorkspace(root, contract, context)` renders desktop/mobile composition and save status.

- [ ] **Step 1: Write RED contract tests** requiring every protected editable V2 destination to have a non-generic functional contract.
- [ ] **Step 2: Run tests and prove current generic pages fail.**
- [ ] **Step 3: Implement contract registry and workspace shell.**
- [ ] **Step 4: Keep `renderNative()` only as a fallback for read-only non-parity pages.**
- [ ] **Step 5: Add browser contract checking workspace header, save state, tabs and mobile composition.**
- [ ] **Step 6: Run Portal V2 tests and commit.**

---

### Task 4: Build shared form primitives, validation, completion and evidence/action controls

**Files:**
- Create: `portal-v2/form-primitives.js`
- Create: `portal-v2/completion.js`
- Create: `portal-v2/evidence-actions.js`
- Create: `tests/portal-v2/form-primitives.test.mjs`
- Create: `tests/portal-v2/completion.test.mjs`

**Interfaces:**
- `renderField(field, value, handlers)` supports `text`, `textarea`, `number`, `percentage`, `currency`, `date`, `select`, `multiselect`, `ranked`, `range`, `triState`, `owner`, `evidence`, `repeatable`.
- `calculateCompletion(schema,state)` returns `{complete,total,percentage,missing}`.
- `renderEvidenceControl()` and `renderActionConversion()` persist through domain state.

- [ ] **Step 1: Write failing tests for all primitive types and completion behavior.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement semantic HTML controls with touch-safe labels and error messages.**
- [ ] **Step 4: Add save-state banner with exactly `Opslaan…`, `Opgeslagen`, and recoverable error UI.**
- [ ] **Step 5: Run unit/browser tests GREEN.**
- [ ] **Step 6: Commit.**

---

### Task 5: Migrate company input, answer review and real overview

**Files:**
- Create: `portal-v2/modules/company-input.js`
- Create: `portal-v2/modules/overview.js`
- Create: `tests/portal-v2/company-input.test.mjs`
- Create: `tests/portal-v2/overview-calculations.test.mjs`
- Modify: `portal-v2/page-shell.js`
- Modify: `portal-v2/native-pages.js`
- Modify: `tests/integration/portal-v2-live.spec.js`

**Interfaces:**
- Functional destinations: `profiel`, `gegevens-invullen`, `ingevulde-gegevens`, `overzicht`.
- Canonical data paths follow inventory mappings from Task 1.

- [ ] **Step 1: Write RED tests that edit representative legacy fields, save, reopen and see persisted values.**
- [ ] **Step 2: Write RED overview calculator tests for maturity, annual manual work, FTE and protected 46-week semantics.**
- [ ] **Step 3: Implement company input workspace with section progress and validation.**
- [ ] **Step 4: Implement answer review/edit with source, owner, freshness and evidence metadata.**
- [ ] **Step 5: Replace overview demo constants with derived persisted values.**
- [ ] **Step 6: Add Playwright desktop + 320/390/430 mobile persistence/reopen tests.**
- [ ] **Step 7: Run full candidate CI, deploy preview and commit.**

**Release gate:** ship this cluster independently only if exact preview and all Required checks are green.

---

### Task 6: Migrate strategy, exact legacy models, canvases and final conclusion

**Files:**
- Create: `portal-v2/modules/strategy-models.js`
- Create: `portal-v2/modules/canvases.js`
- Create: `tests/portal-v2/strategy-models.test.mjs`
- Create: `tests/portal-v2/canvases.test.mjs`
- Modify: `portal-v2/strategy-dna.js`
- Modify: `portal-v2/page-shell.js`
- Modify: `tests/integration/portal-v2-live.spec.js`

**Interfaces:**
- Functional destinations: `strategiemodellen`, `modellen`, `canvassen`, `strategie-naar-maandagochtend`, `strategy-dna`, `eindconclusie`.
- Exact model set comes only from Task 1 inventory; every discovered model receives a renderer and persistence mapping.

- [ ] **Step 1: Write a fail-closed test asserting every inventoried legacy model/canvas has a renderer.**
- [ ] **Step 2: Run RED.**
- [ ] **Step 3: Implement editable model components one family at a time (for example SWOT quadrant fields, OGSM goals/strategies/measures, market model inputs) using inventory truth.**
- [ ] **Step 4: Implement canvases as editable desktop grids and stacked mobile sections using the same state paths.**
- [ ] **Step 5: Integrate Strategy DNA with shared state rather than duplicate state.**
- [ ] **Step 6: Implement final-conclusion derivation with source traceability.**
- [ ] **Step 7: Add persistence/reopen/dependent-output browser tests for every model family.**
- [ ] **Step 8: Run full release gates and commit.**

---

### Task 7: Migrate businesscase, figures, benchmarks, value and financing

**Files:**
- Create: `portal-v2/modules/business-finance.js`
- Extend: `portal-v2/calculators.js`
- Create: `tests/portal-v2/business-finance.test.mjs`
- Modify: `portal-v2/page-shell.js`
- Modify: `tests/integration/portal-v2-live.spec.js`

**Interfaces:**
- Functional destinations: `businesscase`, `cijfers-maatstaven`, `waarde-financiering`.
- Calculators include investment, benefits, payback, benchmark delta and valuation/scenario outputs exactly mapped to legacy semantics.

- [ ] **Step 1: RED calculator tests using legacy examples/fixtures extracted in Task 1.**
- [ ] **Step 2: RED browser test editing assumptions and asserting recalculated output.**
- [ ] **Step 3: Implement editable assumptions/scenarios and calculator functions.**
- [ ] **Step 4: Add provenance/evidence for assumptions.**
- [ ] **Step 5: Add action conversion to roadmap/offerte.**
- [ ] **Step 6: Run full tests and commit.**

---

### Task 8: Migrate people, market, research, current-state tracking and changes

**Files:**
- Create: `portal-v2/modules/people-market-research.js`
- Create: `tests/portal-v2/people-market-research.test.mjs`
- Modify: `portal-v2/page-shell.js`
- Modify: `tests/integration/portal-v2-live.spec.js`

**Interfaces:**
- Functional destinations: `mensen`, `branche-markt`, `onderzoek`, `actueel-houden`, `wijzigingen`.

- [ ] **Step 1: RED tests for repeatable people/roles, knowledge-risk inputs, benchmark records, research hypotheses/evidence and freshness/review dates.**
- [ ] **Step 2: Implement modules using shared primitives.**
- [ ] **Step 3: Link material changes to affected capability dependencies and action conversion.**
- [ ] **Step 4: Browser persistence/reopen tests on desktop/mobile.**
- [ ] **Step 5: Full gates and commit.**

---

### Task 9: Migrate compliance/governance and AI assessment into real workspaces

**Files:**
- Create: `portal-v2/modules/compliance-ai.js`
- Extend: `portal-v2/calculators.js`
- Create: `tests/portal-v2/compliance-ai.test.mjs`
- Modify: `portal-v2/page-shell.js`
- Modify: `tests/integration/portal-v2-live.spec.js`

**Interfaces:**
- Functional destinations: `compliance-governance`, `compliance-command-center`, `ai-capabilities`, `ai-scan`, `data-ai`.

- [ ] **Step 1: Write RED tests proving obligations/controls/owners/evidence/risks and AI opportunities/capabilities are editable rather than static cards.**
- [ ] **Step 2: Implement control/evidence tables and AI assessment forms.**
- [ ] **Step 3: Calculate readiness/prioritisation deterministically from persisted inputs.**
- [ ] **Step 4: Integrate `koppelingen` as the canonical connection-builder action from `data-ai`; do not duplicate it.**
- [ ] **Step 5: Add browser tests for edit → save → reopen → readiness/priority update.**
- [ ] **Step 6: Full gates and commit.**

---

### Task 10: Migrate due diligence and exit readiness

**Files:**
- Create: `portal-v2/modules/ma-exit.js`
- Create: `tests/portal-v2/ma-exit.test.mjs`
- Modify: `portal-v2/page-shell.js`
- Modify: `tests/integration/portal-v2-live.spec.js`

**Interfaces:**
- Functional destinations: `due-diligence`, `exit`.

- [ ] **Step 1: RED tests for findings, evidence, materiality, red flags and value-driver linkage.**
- [ ] **Step 2: Implement dossier workspace with repeatable findings and evidence.**
- [ ] **Step 3: Implement exit-readiness derivation and links to value/roadmap.**
- [ ] **Step 4: Browser persistence/reopen proof.**
- [ ] **Step 5: Full gates and commit.**

---

### Task 11: Migrate advice, quote, roadmap, tasks and execution flows

**Files:**
- Create: `portal-v2/modules/execution.js`
- Create: `tests/portal-v2/execution.test.mjs`
- Modify: `portal-v2/page-shell.js`
- Modify: `tests/integration/portal-v2-live.spec.js`

**Interfaces:**
- Functional destinations: `advies`, `offerte`, `roadmap`, `taken-werkstromen`, `actieve-acties`, `strategie-naar-maandagochtend` action conversions.

- [ ] **Step 1: RED tests for creating advice, accepting it, converting it to roadmap/task, editing quote scope/pricing state and persisting roadmap dependencies/milestones.**
- [ ] **Step 2: Implement action conversion API against canonical domain state.**
- [ ] **Step 3: Implement advice and quote workspaces.**
- [ ] **Step 4: Implement roadmap/task editing with owners, dates, dependencies, progress and evidence.**
- [ ] **Step 5: Add end-to-end browser flow: input → advice → action → roadmap → reopen.**
- [ ] **Step 6: Full gates and commit.**

---

### Task 12: Close global parity and remove static demo authority

**Files:**
- Create: `portal-v2/parity-manifest-functional.js`
- Create: `tests/portal-v2/full-functional-parity.test.mjs`
- Modify: `portal-v2/native-pages.js`
- Modify: `portal-v2/page-shell.js`
- Modify: `.github/scripts/portal_parity.py`
- Modify: `tests/integration/portal-v2-live.spec.js`

**Interfaces:**
- `FUNCTIONAL_PARITY_MANIFEST` must map all 24 protected legacy capabilities plus auth/logout/export/import/print/feedback/branding/mobile-navigation to implementation, schema/data slice and browser-test proof.
- `openObligations()` returns an empty array only when all required entries are proven functional.

- [ ] **Step 1: Write fail-closed parity test**

```js
test('full functional parity has zero open obligations', () => {
  assert.deepEqual(openObligations(), []);
});
```

- [ ] **Step 2: Run RED until every cluster is genuinely complete.**
- [ ] **Step 3: Delete/stop exporting migrated demo constants from `native-pages.js`; leave only non-parity read-only content if still needed.**
- [ ] **Step 4: Assert no V2 source references `/klantportaal`, `portal-next`, iframe fallback or generic renderer for protected editable capabilities.**
- [ ] **Step 5: Add global regression browser flows for import/export, permission-gated print, feedback, branding, logout and mobile navigation.**
- [ ] **Step 6: Run complete local/CI suite GREEN.**
- [ ] **Step 7: Commit.**

---

### Task 13: Final production parity certification

**Files:**
- Modify: GitHub issue `#1230` with exact release evidence; no source code unless a verified defect is found.

**Interfaces:**
- Candidate exact SHA -> Required `test` success -> merge SHA -> Netlify `commit_ref` exact match -> production browser/readback success.

- [ ] **Step 1: Run Required, Portal V2 tests and preview on exact candidate SHA.**
- [ ] **Step 2: Verify the full functional parity browser suite on preview including representative desktop and 320/390/430 mobile workflows.**
- [ ] **Step 3: Merge only with SHA lock after all required checks are green.**
- [ ] **Step 4: Wait for Netlify production and verify `commit_ref` equals exact merge SHA.**
- [ ] **Step 5: Run production DOM/runtime/browser readback covering overview input, one strategy model/canvas, one financial calculator, one compliance edit, connector builder open, and one execution flow.**
- [ ] **Step 6: Update issue #1230 with exact SHA, deploy ID, test/run evidence and `openObligations() = []`.**
- [ ] **Step 7: Only now mark full legacy functional parity complete.**

---

## Plan Self-Review

**Spec coverage:** Tasks 1–13 cover inventory, canonical domain state, capability contracts, SaaS workspaces, reusable form primitives, all 24 protected capability groups, calculations/dependencies, existing module reuse, models/canvases, global capabilities, mobile/desktop behavior, parity gate and production certification.

**Placeholder scan:** The implementation inventory itself must be source-derived in Task 1; this is intentional and test-gated, not a TODO. No task permits guessing or skipping an inventoried model/field.

**Type consistency:** The plan consistently uses `createDomainState`, `getCapabilityContract`, `mountWorkspace`, `calculateCompletion`, `LEGACY_FUNCTIONAL_INVENTORY`, `FUNCTIONAL_PARITY_MANIFEST`, and `openObligations()` as shared interfaces.

**Release strategy:** Tasks 1–4 form the foundation; Tasks 5–11 are independently shippable capability clusters; Tasks 12–13 close parity. No cluster may claim parity merely because static cards or navigation exist.
