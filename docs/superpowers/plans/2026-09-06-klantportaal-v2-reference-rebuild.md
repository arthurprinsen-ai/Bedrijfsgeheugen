# Klantenportaal V2 Reference Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the full customer portal in the approved dashboard design while preserving all existing page identities, customer context, legacy functionality and Brain/Powerhouse status semantics.

**Architecture:** Introduce a new `portal-v2` presentation shell with a compact dashboard, explicit page registry and evidence-gated flow renderer. Reuse the existing `portal-next/portal-content-map.js` and legacy bridge semantics so the visual rebuild does not discard existing portal functionality.

**Tech Stack:** Static HTML/CSS/JavaScript, existing portal content map, same-origin legacy bridge, SVG dotted flows, `node:test` contract tests, Netlify.

**Spec:** `docs/superpowers/specs/2026-09-06-klantportaal-v2-reference-design.md`

## Global Constraints
- Do not replace or merge production `klantportaal.html` before explicit release approval.
- Preserve `?klant=<slug>` throughout navigation and legacy bridge calls.
- No active runtime-flow claim without evidence; preview/demo must be labeled.
- No active source means no source flow; no active module means no output flow.
- Mobile must be a touch-first translation of the same design system, not a scaled desktop canvas.
- Every current portal page identity must remain reachable.

---

### Task 1: Lock page coverage and visual contract
**Files:**
- Modify: `tests/portal-content-map.test.mjs`
- Create: `tests/klantportaal-v2-design.test.mjs`

**Interfaces:**
- Consumes: `PORTAL_SECTIONS`, `PORTAL_PAGE_INDEX` from `portal-next/portal-content-map.js`.
- Produces: regression assertions for complete page coverage and required dashboard regions.

- [ ] Write failing assertions for the required dashboard labels, five KPI cards, all eight source categories, all sixteen portal modules and all portal page groups.
- [ ] Run `node --test tests/portal-content-map.test.mjs tests/klantportaal-v2-design.test.mjs` and confirm the new design assertions fail before implementation.
- [ ] Keep all legacy mappings already asserted by `portal-content-map.test.mjs`.
- [ ] Commit the contract tests.

### Task 2: Build the reference-matched desktop shell
**Files:**
- Create: `portal-v2/index.html`
- Create: `portal-v2/app.css`

**Interfaces:**
- Produces semantic regions: `#sources`, `#modules`, `#flowSvg`, `.kpis`, `.right`, `.lower`, `.activities`.

- [ ] Recreate the approved desktop composition: 260px sidebar, header/actions, five KPI cards, main cockpit + 300px right rail, lower management cards and recent activity.
- [ ] Keep typography, spacing, pale-card styling, blue/violet gradients and compact proportions aligned with the approved screenshot.
- [ ] Add the AI Brain/Datahub/Powerhouse stack centrally without adding an extra horizontal Powerhouse column.
- [ ] Re-run the design contract test.
- [ ] Commit the shell.

### Task 3: Implement source/module interaction and no-fake-flow behavior
**Files:**
- Create: `portal-v2/app.js`
- Create: `portal-v2/flow-state.js`
- Test: `tests/klantportaal-v2-flow.test.mjs`

**Interfaces:**
- `selectSource(id|null)` updates source focus.
- `selectModule(id|null)` updates module focus.
- `deriveFlowState({source,module,runtime})` returns `{sourceFlow,processingFlow,outputFlow,status}`.

- [ ] Write failing tests for idle, source-only, source+module preview and blocked runtime state.
- [ ] Implement pure flow-state derivation first.
- [ ] Bind source/module clicks so selected items stay sharp and other items dim.
- [ ] Draw animated SVG dotted paths only when `deriveFlowState` enables them.
- [ ] Ensure blocked/failed states stop the output route.
- [ ] Run focused flow tests and commit.

### Task 4: Preserve full current portal navigation and legacy behavior
**Files:**
- Create: `portal-v2/page-registry.js`
- Create: `portal-v2/legacy-bridge.js`
- Test: `tests/klantportaal-v2-pages.test.mjs`

**Interfaces:**
- `listPortalGroups()` returns all visible page groups from `PORTAL_SECTIONS`.
- `buildLegacyUrl(pageId, klantSlug)` preserves `?klant=` and legacy tab metadata.

- [ ] Write failing tests that every page in `PORTAL_PAGE_INDEX` is exposed by the v2 registry.
- [ ] Reuse the legacy-tab mapping instead of duplicating page identities.
- [ ] Add an “Alle portalpagina’s” workspace/drawer in the new design.
- [ ] On same-origin production, use the legacy bridge; on external preview, offer the live portal URL as fallback instead of claiming embedded functionality.
- [ ] Run page-registry tests and commit.

### Task 5: Reintroduce strategy, execution, change and Powerhouse status workspaces
**Files:**
- Create: `portal-v2/workspaces.js`
- Test: `tests/klantportaal-v2-workspaces.test.mjs`

**Interfaces:**
- `strategyTrace()` uses existing `buildStrategyTrace`.
- `executionTrace()` uses existing `buildExecutionLadderTrace`.
- `changeTrace()` uses existing `buildChangeTrace`.

- [ ] Add visible workspace entries for Strategie → maandagochtend, Uitvoeringsladder, Actueel houden, Wijzigingen and Brein & Powerhouse.
- [ ] Preserve full trace orders from the existing content map helpers.
- [ ] Add status cards for sources, Datahub, Brain, agents, recovery, evidence, learning and audit.
- [ ] Keep status copy evidence-gated and avoid verified/completed claims without evidence.
- [ ] Run workspace tests and commit.

### Task 6: Build the mobile translation in the same design language
**Files:**
- Modify: `portal-v2/app.css`
- Test: `tests/klantportaal-v2-mobile.test.mjs`

**Interfaces:**
- Mobile breakpoint: `max-width:760px`.

- [ ] Write failing static assertions for hidden desktop sidebar, horizontally swipeable KPI/source/module rows and a fixed five-item bottom navigation.
- [ ] Make the central Brain stack the first large visual inside the cockpit on phone.
- [ ] Use swipeable cards for KPI/source/module lists; never scale the whole desktop page.
- [ ] Stack right-rail and management cards vertically.
- [ ] Re-run mobile contract test and commit.

### Task 7: Create a self-contained external review build
**Files:**
- Create: `klantportaal-v2-test.html`
- Test: `tests/klantportaal-v2-preview.test.mjs`

**Interfaces:**
- Test page must contain all CSS/JS required to render without RawGitHack-relative assets.

- [ ] Generate the self-contained review page from the v2 shell.
- [ ] Mark preview state as noindex/nofollow and no-production-claim.
- [ ] Verify JavaScript syntax with `node --check` on extracted script.
- [ ] Verify required DOM markers and page groups using `node:test` or HTML parsing.
- [ ] Commit the review artifact.

### Task 8: Branch-wide verification and release gate
**Files:**
- Modify only tests/docs if verification discovers a defect.

**Interfaces:**
- No production deployment in this task.

- [ ] Run all portal-v2 focused tests.
- [ ] Run the existing portal-next contract tests to ensure no coverage regression.
- [ ] Run the repository's Netlify-equivalent build command if environment permits.
- [ ] Check PR status and changed-file diff.
- [ ] Keep PR draft and production untouched until explicit merge/deploy approval.
