# Portal V2 Full Legacy + Powerhouse Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-prove and, where needed, restore complete legacy-to-V2 functional parity on current `main`, with all customer portal state and outcomes integrated through the existing Bedrijfsgeheugen Powerhouse contracts.

**Architecture:** Treat `klantportaal.html` and `portal-v2/legacy-functional-inventory.js` as the immutable migration baseline, then verify each of the 24 protected capabilities against V2 renderers, actions, calculations, persistence and production evidence. Repair only discovered regressions, preserve current Powerhouse/Supabase authority, and use existing BRAIN delivery gates for preview, exact-candidate promotion, production readback, rollback and learning writeback.

**Tech Stack:** Static ES modules, Node.js `node:test`, Netlify, Supabase/Powerhouse domain-state contracts, GitHub Actions/BRAIN delivery.

**Spec:** `docs/superpowers/specs/2026-09-16-portal-v2-full-legacy-powerhouse-parity-design.md`

## Global Constraints
- `klantportaal.html` remains the immutable functional baseline.
- All 24 keys in `portal-v2/legacy-functional-inventory.js` remain protected.
- No capability counts as migrated from navigation/static copy alone.
- Reuse the existing Powerhouse/Supabase state, lineage, outcome and learning contracts; create no parallel store or brain.
- Keep authentication, tenant isolation, RLS, import/export, permission-gated print, feedback, customer branding and mobile navigation fail-closed.
- Every repair follows TDD: failing regression test first, smallest cause-oriented fix second.
- Promotion must use existing BRAIN delivery authority and exact-candidate production readback.

---

### Task 1: Establish current-main parity baseline

**Files:**
- Read: `.github/scripts/portal_parity.py`
- Read: `portal-v2/legacy-functional-inventory.js`
- Read: `portal-v2/parity-gate.js`
- Read: `portal-v2/tests/parity-gate.test.mjs`
- Read: `portal-v2/tests/*`
- Read: `.github/workflows/*portal*`

**Interfaces:**
- Consumes: current protected `main` and the 24-capability inventory.
- Produces: an evidence matrix identifying any capability with missing structural, behavioral, persistence or production proof.

- [ ] **Step 1: Run BRAIN preflight**

```bash
node scripts/brain/chat-learning-preflight.mjs
```

Expected: JSON/status containing `READY`.

- [ ] **Step 2: Run the immutable legacy parity guard**

```bash
python .github/scripts/portal_parity.py
```

Expected: `PARITY GREEN` with 24 protected panels/capabilities. Any failure becomes a regression obligation.

- [ ] **Step 3: Run the executable V2 parity contract test**

```bash
node --test portal-v2/tests/parity-gate.test.mjs
```

Expected: all four parity tests pass; aggregate report is 24/24 when complete production evidence is supplied.

- [ ] **Step 4: Enumerate the full Portal V2 test suite and run it**

```bash
find portal-v2/tests -type f -name '*.test.mjs' -print | sort
node --test portal-v2/tests/*.test.mjs
```

Expected: zero failed tests. Record every failing test with its legacy capability key.

- [ ] **Step 5: Commit no code for a green baseline**

If all tests are green, do not create synthetic changes. Continue to Task 2 because runtime/persistence proof can still expose regressions.

---

### Task 2: Prove every legacy capability has executable ownership

**Files:**
- Modify if required: `portal-v2/parity-gate.js`
- Modify if required: `portal-v2/capability-contracts.js`
- Modify if required: `portal-v2/modules/functional-suite.js`
- Modify specialist modules under `portal-v2/modules/`
- Test: `portal-v2/tests/parity-gate.test.mjs`

**Interfaces:**
- Consumes: `LEGACY_FUNCTIONAL_INVENTORY` records and `listFunctionalContracts()`.
- Produces: `capabilityImplementationCoverage()` entries with non-null contract, renderer, persistence, field/model/calculation/action/dependency owners and browser evidence owner for every protected key.

- [ ] **Step 1: Add a failing test for any uncovered ownership field**

For each discovered gap, add a precise assertion, e.g.:

```js
const coverage=capabilityImplementationCoverage();
assert.equal(coverage.advies.renderer,'modules/functional-suite.js');
assert.equal(coverage.advies.persistence,'domain-state.flush');
```

- [ ] **Step 2: Run the focused test and confirm failure**

```bash
node --test portal-v2/tests/parity-gate.test.mjs
```

Expected: FAIL on the exact uncovered ownership field.

- [ ] **Step 3: Wire the missing capability to the existing owner**

Use the existing specialist module when one exists; otherwise register the page in `modules/functional-suite.js` and its contract in `capability-contracts.js`. Do not create a new persistence subsystem.

- [ ] **Step 4: Re-run focused and full portal tests**

```bash
node --test portal-v2/tests/parity-gate.test.mjs
node --test portal-v2/tests/*.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit the smallest ownership repair**

```bash
git add portal-v2
 git commit -m "fix(portal-v2): restore executable legacy capability ownership"
```

---

### Task 3: Prove legacy calculations and semantics

**Files:**
- Modify if required: capability-specific modules in `portal-v2/modules/`
- Modify if required: shared calculation helpers already used by V2
- Test: existing calculation/model tests under `portal-v2/tests/`
- Test: add focused regression tests under `portal-v2/tests/`

**Interfaces:**
- Consumes: legacy calculation names from `LEGACY_FUNCTIONAL_INVENTORY`.
- Produces: deterministic V2 values preserving legacy semantics and current canonical calculation authority.

- [ ] **Step 1: Map every inventory calculation to an exported or render-observable V2 calculation**

Check at minimum overview/maturity, 46-week annualization, capacity-not-cash semantics, financial/value models, people metrics, benchmarks, AI scan/capabilities, strategy prioritization, canvases, synthesis, DD, DNA, advice/offerte and roadmap calculations.

- [ ] **Step 2: Add a failing regression test for each discovered mismatch**

Example semantic invariant:

```js
assert.equal(result.weeksPerYear,46);
assert.match(result.capacityExplanation,/ruimte die je terugkrijgt/i);
```

- [ ] **Step 3: Run the focused test and confirm failure**

```bash
node --test portal-v2/tests/<focused-test>.test.mjs
```

- [ ] **Step 4: Apply the smallest calculation fix in the existing authority**

Do not duplicate formula logic in renderers; fix the canonical helper/module that already owns the calculation.

- [ ] **Step 5: Run all calculation and portal tests**

```bash
node --test portal-v2/tests/*.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add portal-v2
 git commit -m "fix(portal-v2): restore protected legacy calculations"
```

---

### Task 4: Prove all editable capability slices survive Powerhouse roundtrip

**Files:**
- Modify if required: `portal-v2/domain-state.js` or its existing equivalent
- Modify if required: capability modules that call `domain-state.flush`
- Test: existing persistence/roundtrip tests in `portal-v2/tests/`

**Interfaces:**
- Consumes: editable fields/repeatable groups from `LEGACY_FUNCTIONAL_INVENTORY`.
- Produces: tenant-scoped persisted state that survives write -> server/store roundtrip -> reload with downstream recalculation intact.

- [ ] **Step 1: Build the set of editable legacy capabilities from inventory**

The test must derive the list from `fields.length > 0`, not a hand-maintained subset.

- [ ] **Step 2: Add/extend a failing aggregate persistence test**

The test writes a unique sentinel value per editable capability, flushes through the real portal state adapter, reloads the state and asserts the sentinel survives only in the correct tenant scope.

- [ ] **Step 3: Run the aggregate persistence test and confirm any failure**

```bash
node --test portal-v2/tests/*persistence*.test.mjs
```

- [ ] **Step 4: Repair only the broken mapping/write/read path**

Reuse current domain-state serializers and existing Supabase/Powerhouse contract. Do not introduce localStorage as authoritative fallback for business state.

- [ ] **Step 5: Re-run persistence plus complete portal suite**

```bash
node --test portal-v2/tests/*persistence*.test.mjs
node --test portal-v2/tests/*.test.mjs
```

- [ ] **Step 6: Commit**

```bash
git add portal-v2
 git commit -m "fix(portal-v2): restore complete Powerhouse state roundtrip"
```

---

### Task 5: Prove strategy-to-outcome closed loop

**Files:**
- Modify if required: `portal-v2/strategy-dna.js`
- Modify if required: `portal-v2/modules/dna-library.js`
- Modify if required: `portal-v2/modules/functional-suite.js`
- Modify if required: existing roadmap/advice/businesscase/outcome integration modules
- Test: focused integration test under `portal-v2/tests/`

**Interfaces:**
- Consumes: strategy/DNA themes, department/capability links, recommendation state and business case inputs.
- Produces: a linked roadmap/action and observable outcome/writeback reference using existing canonical Powerhouse identifiers.

- [ ] **Step 1: Add a failing integration test for the full chain**

The test must create/update a strategy theme, derive/select a recommendation, add it to roadmap, assert a canonical action/writeback payload is produced, and confirm lineage points back to the originating strategy evidence.

- [ ] **Step 2: Run and confirm failure if the chain is incomplete**

```bash
node --test portal-v2/tests/*strategy*outcome*.test.mjs
```

- [ ] **Step 3: Repair missing links using existing contracts**

Reuse existing roadmap, action, outcome and learning identifiers. No parallel queue, CRM or outcome table.

- [ ] **Step 4: Re-run integration plus full portal tests**

```bash
node --test portal-v2/tests/*strategy*outcome*.test.mjs
node --test portal-v2/tests/*.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add portal-v2
 git commit -m "fix(portal-v2): close strategy-to-outcome Powerhouse loop"
```

---

### Task 6: Prove protected global interactions and mobile parity

**Files:**
- Modify if required: `portal-v2/app.js`
- Modify if required: `portal-v2/app.css`
- Modify if required: global interaction modules already used by V2
- Test: relevant DOM/mobile/visual tests in `portal-v2/tests/`

**Interfaces:**
- Consumes: authenticated customer context and current portal state.
- Produces: working logout, import/export, permission-gated print, feedback, customer branding and mobile navigation.

- [ ] **Step 1: Add/confirm DOM action assertions for all global capabilities**

The test must verify each action is present and invokes the existing implementation rather than a dead button or placeholder.

- [ ] **Step 2: Run browser/DOM tests**

```bash
node --test portal-v2/tests/*dom*.test.mjs portal-v2/tests/*mobile*.test.mjs portal-v2/tests/*visual*.test.mjs
```

- [ ] **Step 3: Fix only observed interaction/responsive regressions**

Preserve accepted customer branding and desktop/mobile content parity.

- [ ] **Step 4: Re-run full portal suite**

```bash
node --test portal-v2/tests/*.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add portal-v2
 git commit -m "fix(portal-v2): restore protected global and mobile interactions"
```

---

### Task 7: Run security, accessibility, console/network and release gates

**Files:**
- Modify only if a gate exposes a real regression.
- Read: `.github/workflows/`
- Read: relevant Supabase/RLS/security gate scripts.

**Interfaces:**
- Consumes: completed candidate branch SHA.
- Produces: green candidate evidence suitable for BRAIN promotion.

- [ ] **Step 1: Run complete local/static portal checks**

```bash
python .github/scripts/portal_parity.py
node --test portal-v2/tests/*.test.mjs
```

- [ ] **Step 2: Run repository-required validation commands discovered from the matching workflows**

Execute the exact commands used by Required/Portal V2/BRAIN/Supabase security gates. Do not substitute weaker local checks.

- [ ] **Step 3: Verify no browser console/network regressions and accessibility blockers**

Use the existing browser/preview test harness. Zero unexpected console errors, failed required requests or accessibility failures are allowed.

- [ ] **Step 4: Repair failures TDD-first and repeat gates**

Every repair gets a focused regression assertion before changing implementation.

- [ ] **Step 5: Commit any gate-driven repair**

```bash
git add .
 git commit -m "fix(portal-v2): satisfy full parity release gates"
```

---

### Task 8: Preview, exact-candidate production promotion and 24/24 readback

**Files:**
- No direct production file edits outside the normal branch/PR flow.
- Evidence/writeback files only as required by existing BRAIN contracts.

**Interfaces:**
- Consumes: exact tested candidate SHA.
- Produces: production deployment/readback proving all 24 capabilities plus protected global interactions on the exact promoted candidate.

- [ ] **Step 1: Open the normal PR and wait for required checks**

Required checks must run on the exact candidate SHA.

- [ ] **Step 2: Run BRAIN deploy preflight for the exact candidate**

```bash
node tools/brain-delivery-system.mjs deploy-preflight --sha <exact-candidate-sha>
```

Expected: `DEPLOY_SOURCE_READY` or the repository-prescribed safe staging flow if the source is a linked worktree.

- [ ] **Step 3: Promote only through the existing production authority**

Do not bypass BG169 or protected-branch rules.

- [ ] **Step 4: Collect production evidence keyed by all 24 legacy capability IDs**

Each entry must have `production: 'verified'` based on actual production DOM/runtime evidence, not synthetic injection.

- [ ] **Step 5: Evaluate aggregate parity using production evidence**

```js
const report=evaluatePortalParity({productionEvidence});
if(!report.ok || report.verifiedCount!==24) process.exit(1);
```

Expected: `ok === true`, `verifiedCount === 24`, `total === 24`.

- [ ] **Step 6: Verify Powerhouse writeback/outcome evidence**

Confirm the production change, evidence, outcome and prevention/learning record are visible through the existing shared-context/material-outcome path.

- [ ] **Step 7: Final status**

Only declare `LIVE & BEWEZEN` when exact production identity, 24/24 capability evidence, protected global interactions, Powerhouse roundtrip, security gates and learning/writeback are all green. Otherwise continue the repair loop or report only a genuine `BLOCKED_HARD_BOUNDARY` with exact evidence and minimal remaining action.
