# Portal V2 Source-Derived Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make legacy → Portal V2 parity fail closed from the actual legacy source, rather than trusting only hand-maintained capability declarations.

**Architecture:** Keep `klantportaal.html` as the immutable migration baseline. Extend `.github/scripts/portal_parity.py` so it derives protected interactive legacy fields directly from the DOM source, matches those fields against exact or wildcard field contracts in `portal-v2/legacy-functional-inventory.js`, and requires executable implementation/evidence coverage. Production completion remains exact-SHA immutable Netlify + Playwright readback.

**Tech Stack:** Python 3.12 parity gate, vanilla ES module capability inventory, Node test runner, GitHub Actions, Netlify immutable deploy readback, Playwright.

**Spec:** `portal-v2/legacy-functional-inventory.js`, `portal-v2/parity-gate.js`, and `docs/parity/portal-parity-ledger.md`.

## Global Constraints

- Legacy source is the migration baseline; no manual declaration may silently erase a legacy field.
- Dynamic field groups may use explicit wildcard contracts such as `prefix:*` or `s-*`.
- A field is protected when it is an editable `input`, `select`, or `textarea` with an id inside a protected legacy panel.
- Inventory presence alone is insufficient: implementation owner, persistence owner and production-evidence owner remain required.
- Exact-SHA immutable production readback remains mandatory before `LIVE & BEWEZEN`.

---

### Task 1: Source-derived editable-field parity

**Files:**
- Modify: `.github/scripts/portal_parity.py`
- Modify: `portal-v2/tests/legacy-functional-inventory.test.mjs` only if source-derived failures prove an inventory gap.

**Interfaces:**
- Produces helpers to derive protected panel editable field ids, extract exact/wildcard inventory field contracts and match them fail-closed.
- `main()` reports the exact panel and missing field ids when legacy editable state has no V2 contract.

- [ ] Add source-derived extraction and matching helpers.
- [ ] Require every legacy editable field to match an exact or wildcard `legacyFieldId` contract.
- [ ] Preserve the existing 24-panel, global capability, overview semantics and implementation/evidence checks.
- [ ] Run `python .github/scripts/portal_parity.py` and confirm green only when source-derived field coverage is complete.

### Task 2: CI trigger completeness

**Files:**
- Modify: `.github/workflows/portal-parity.yml`

- [ ] Trigger on `portal-v2/parity-gate.js` and `portal-v2/tests/parity-gate.test.mjs` changes as well as the legacy source, inventory and ledger.
- [ ] Keep the source-derived Python gate as the workflow command.

### Task 3: Production proof linkage

**Files:**
- Verify: `.github/workflows/portal-v2-production-dom-readback.yml`
- Verify: `tests/integration/portal-v2-production-*.spec.js`

- [ ] Confirm exact-SHA immutable deployment resolution remains present.
- [ ] Confirm production DOM/mobile/visual readback remains present.
- [ ] Treat missing production evidence as an open obligation; source parity alone is never completion proof.
