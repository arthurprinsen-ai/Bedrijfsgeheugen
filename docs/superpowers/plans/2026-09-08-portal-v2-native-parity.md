# Portal V2 Native Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate every protected functional capability of `klantportaal.html` into native Portal V2, with working mobile/desktop navigation, shared state/capability services, automated parity proof, exact production deployment and live readback.

**Architecture:** Portal V2 remains the single customer-facing shell. Legacy `klantportaal.html` is reference-only during migration; native V2 pages consume shared V2 routing/state/capability services and canonical backend/store APIs. A machine-readable parity manifest is the control plane: every protected legacy capability maps to a canonical V2 destination and cannot be marked complete until its functional browser contract passes.

**Tech Stack:** Static HTML/CSS/ES modules, Playwright, Node.js tests, GitHub Actions, Netlify, existing Netlify Identity and canonical portal store/functions.

**Spec:** `docs/superpowers/specs/2026-09-08-portal-v2-native-parity-design.md`

## Global Constraints

- All 24 protected legacy panel capabilities must have native V2 implementations before full parity may be claimed.
- Protected global capabilities: authentication/logout, import, export, permission-gated print, feedback, customer branding and mobile navigation.
- No runtime navigation, fetch, iframe or fallback to `/klantportaal` or `portal-next`.
- Route existence does not count as parity; user-visible behavior and state transitions must be tested.
- Mobile controls must have minimum 44×44 CSS pixel touch targets and no page-level horizontal overflow at supported widths.
- Demo/example data must never be presented as authenticated customer facts.
- Every release unit must pass exact-head Required/BRAIN/Portal V2 gates, exact Netlify production SHA verification and production readback.

---

## File Structure

### Control plane
- Create `portal-v2/parity-manifest.js`: canonical legacy→V2 capability mapping and completion metadata.
- Create `portal-v2/navigation-model.js`: shared desktop/mobile navigation model and hub definitions.
- Create `portal-v2/router.js`: canonical V2 route/state transitions, active state and browser history.
- Modify `portal-v2/app.js`: consume shared router/navigation rather than ad-hoc listeners.
- Modify `portal-v2/index.html`: semantic data attributes for every mobile/desktop navigation control.
- Modify `portal-v2/page-registry.js`: ensure every parity destination is directly addressable.

### Shared capabilities
- Create `portal-v2/portal-state.js`: authenticated project/customer view-model facade.
- Create `portal-v2/portal-actions.js`: save/import/export/feedback/print capability commands.
- Create `portal-v2/customer-branding.js`: normalized customer branding view model.
- Modify `portal-v2/legacy-parity.js`: remove compatibility naming/logic after native equivalents exist; no legacy UI dependency may remain.

### Functional page clusters
- Modify/create focused page modules beneath `portal-v2/` for each parity destination instead of embedding a second shell.
- Extend `portal-v2/native-pages.js` and `portal-v2/page-shell.js` only as dispatch/composition layers; keep page-specific behavior in focused modules when complexity warrants.

### Tests
- Create `tests/portal-v2-parity-manifest.test.mjs`.
- Create `tests/portal-v2-navigation-contract.test.mjs`.
- Create `tests/portal-v2-global-capabilities.test.mjs`.
- Create `tests/integration/portal-v2-mobile-navigation.spec.js`.
- Create `tests/integration/portal-v2-native-parity-core.spec.js`.
- Create `tests/integration/portal-v2-native-parity-business.spec.js`.
- Create `tests/integration/portal-v2-native-parity-execution.spec.js`.
- Extend `tests/portal-v2-standalone-contract.test.mjs`.
- Extend production readback workflow/tests with representative parity flows.

---

### Task 1: Parity Manifest and Fail-Closed Coverage

**Files:**
- Create: `portal-v2/parity-manifest.js`
- Create: `tests/portal-v2-parity-manifest.test.mjs`
- Read/reference: `.github/scripts/portal_parity.py`
- Read/reference: `klantportaal.html`
- Modify: `portal-v2/page-registry.js`

**Interfaces:**
- Produces: `LEGACY_PARITY_ITEMS`, `GLOBAL_PARITY_CAPABILITIES`, `getParityItem(id)`, `listOpenParityItems()`.
- Consumes: canonical V2 page IDs from `page-registry.js`.

- [ ] **Step 1: Write the failing manifest test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_PARITY_ITEMS, GLOBAL_PARITY_CAPABILITIES } from '../portal-v2/parity-manifest.js';
import { findPage } from '../portal-v2/page-registry.js';

const expected = ['overzicht','profiel','dataai','aiscan','invoeren','antwoorden','business','cijfers','waarde','mensen','branche','onderzoek','beleid','aicap','strategie','canvassen','eindconclusie','dd','dna','bijhouden','wijzigingen','advies','offerte','roadmap'];

test('all protected legacy panels have canonical V2 destinations', () => {
  assert.deepEqual(LEGACY_PARITY_ITEMS.map(x => x.legacyId), expected);
  for (const item of LEGACY_PARITY_ITEMS) {
    assert.ok(item.v2Pages.length > 0, item.legacyId);
    for (const pageId of item.v2Pages) assert.ok(findPage(pageId), `${item.legacyId} -> ${pageId}`);
    assert.ok(item.requiredBehaviors.length > 0, `${item.legacyId} must define behavior, not route-only parity`);
  }
});

test('all protected global capabilities are represented', () => {
  assert.deepEqual(GLOBAL_PARITY_CAPABILITIES.map(x => x.id), ['auth','logout','export','import','print','feedback','customer-branding','mobile-navigation']);
});
```

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/portal-v2-parity-manifest.test.mjs`
Expected: FAIL because `portal-v2/parity-manifest.js` does not exist.

- [ ] **Step 3: Implement the manifest**

Create immutable records for all 24 protected panels with the exact V2 mapping from the approved spec and explicit `requiredBehaviors` arrays. Global capabilities get the same treatment. `listOpenParityItems()` returns anything whose `status !== 'proven'`; initial statuses remain `open` until corresponding integration tests exist and pass.

- [ ] **Step 4: Run test and verify GREEN**

Run: `node --test tests/portal-v2-parity-manifest.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add portal-v2/parity-manifest.js portal-v2/page-registry.js tests/portal-v2-parity-manifest.test.mjs
git commit -m "test: add fail-closed Portal V2 parity manifest"
```

---

### Task 2: Shared Router and Fully Functional Bottom Bar

**Files:**
- Create: `portal-v2/navigation-model.js`
- Create: `portal-v2/router.js`
- Modify: `portal-v2/app.js`
- Modify: `portal-v2/index.html`
- Modify: `portal-v2/app.css`
- Create: `tests/portal-v2-navigation-contract.test.mjs`
- Create: `tests/integration/portal-v2-mobile-navigation.spec.js`

**Interfaces:**
- Produces: `navigatePortal(target, options)`, `currentPortalRoute()`, `subscribePortalRoute(listener)`, `PORTAL_NAV_ITEMS`.
- Consumes: `openPortalPage(pageId)` for native page rendering.

- [ ] **Step 1: Write failing static navigation contract**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('portal-v2/index.html','utf8');
const app = fs.readFileSync('portal-v2/app.js','utf8');

test('all five mobile nav items are real routed controls', () => {
  for (const id of ['overview','portal','data-ai','tasks','more']) {
    assert.match(html, new RegExp(`data-mobile-nav="${id}"`));
  }
  assert.doesNotMatch(app, /mobileMore[^\n]+classList\.add\('open'\)[\s\S]*$/);
});
```

- [ ] **Step 2: Run static contract and verify RED**

Run: `node --test tests/portal-v2-navigation-contract.test.mjs`
Expected: FAIL because only More is currently wired.

- [ ] **Step 3: Implement shared navigation model and router**

`PORTAL_NAV_ITEMS` must define these targets:
- `overview` → `overzicht`
- `portal` → `hub:portal`
- `data-ai` → `hub:data-ai`
- `tasks` → `hub:tasks`
- `more` → `hub:more`

`navigatePortal()` updates canonical URL state using `history.pushState`, calls native page/hub rendering, updates `aria-current`/active classes for mobile and desktop and supports `popstate` for back/forward navigation.

- [ ] **Step 4: Wire every mobile and desktop navigation control**

Replace decorative sidebar/mobile buttons with `data-nav-target`/`data-mobile-nav` controls. No top-level button remains without behavior.

- [ ] **Step 5: Write Playwright mobile navigation flow**

```js
import { test, expect } from '@playwright/test';

for (const viewport of [{width:320,height:720},{width:390,height:844},{width:430,height:932}]) {
  test(`bottom navigation works at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('/portal-v2/', { waitUntil:'domcontentloaded' });
    for (const id of ['portal','data-ai','tasks','more','overview']) {
      const button = page.locator(`[data-mobile-nav="${id}"]`);
      await expect(button).toBeVisible();
      const box = await button.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
      await button.click();
      await expect(button).toHaveAttribute('aria-current','page');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    }
  });
}
```

- [ ] **Step 6: Verify browser back/forward**

Add assertions that navigation to Data & AI → Taken → back returns to Data & AI, and forward returns to Taken, without full legacy navigation.

- [ ] **Step 7: Run tests and verify GREEN**

Run:
`node --test tests/portal-v2-navigation-contract.test.mjs`
`npx playwright test tests/integration/portal-v2-mobile-navigation.spec.js --workers=1`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add portal-v2/navigation-model.js portal-v2/router.js portal-v2/app.js portal-v2/index.html portal-v2/app.css tests/portal-v2-navigation-contract.test.mjs tests/integration/portal-v2-mobile-navigation.spec.js
git commit -m "feat: make Portal V2 navigation fully functional"
```

---

### Task 3: Native Hubs for Portal, Data & AI, Tasks and More

**Files:**
- Create: `portal-v2/hubs.js`
- Modify: `portal-v2/page-shell.js`
- Modify: `portal-v2/saas-theme.css`
- Test: `tests/portal-v2-navigation-contract.test.mjs`
- Test: `tests/integration/portal-v2-mobile-navigation.spec.js`

**Interfaces:**
- Produces: `renderPortalHub(hubId)` returning native V2 HTML/DOM content.
- Consumes: `PORTAL_SECTIONS` and parity manifest.

- [ ] **Step 1: Write failing hub assertions**

Each hub must contain canonical V2 links/buttons, never old portal URLs. Data & AI must surface `data-ai`, `koppelingen`, `ai-scan`, `ai-capabilities`, `datahubstatus`, `brain-verwerking`, `agentstatus`. Tasks must surface `taken-werkstromen`, `actieve-acties`, `roadmap`, `recovery-obligations`, `outcomes-evidence`.

- [ ] **Step 2: Implement native hub rendering**

Use the same SaaS cards/tokens as the current V2 shell; include status/context but do not invent customer metrics. Empty/loading states must be explicit.

- [ ] **Step 3: Run navigation integration tests**

Expected: every hub opens on mobile/desktop and every linked page is directly addressable.

- [ ] **Step 4: Commit**

```bash
git add portal-v2/hubs.js portal-v2/page-shell.js portal-v2/saas-theme.css tests/portal-v2-navigation-contract.test.mjs tests/integration/portal-v2-mobile-navigation.spec.js
git commit -m "feat: add native Portal V2 navigation hubs"
```

---

### Task 4: Shared Authenticated State and Customer Branding

**Files:**
- Create: `portal-v2/portal-state.js`
- Create: `portal-v2/customer-branding.js`
- Modify: `portal-v2/app.js`
- Modify: `portal-v2/page-shell.js`
- Create: `tests/portal-v2-global-capabilities.test.mjs`

**Interfaces:**
- Produces: `loadPortalContext()`, `subscribePortalContext()`, `getCustomerBranding(context)`.
- Must distinguish `{mode:'authenticated'|'preview'|'empty'|'error'}`.

- [ ] **Step 1: Write failing tests for preview/customer separation**

Ensure hard-coded KPI values cannot be labelled as authenticated facts when no authenticated project data exists.

- [ ] **Step 2: Implement normalized portal context**

Use existing canonical portal-state/project/read-model endpoints where already available; server-only secrets must never enter client state.

- [ ] **Step 3: Implement customer branding**

Render customer name/logo when safe and available; otherwise initials fallback. Preserve Bedrijfsgeheugen product identity.

- [ ] **Step 4: Verify auth/logout semantics remain functional**

Keep Netlify Identity behavior but expose it through native V2 shell controls.

- [ ] **Step 5: Commit**

`git commit -m "feat: add native Portal V2 customer context"`

---

### Task 5: Global Capabilities — Import, Export, Print and Feedback

**Files:**
- Create: `portal-v2/portal-actions.js`
- Create: `portal-v2/global-actions-ui.js`
- Modify: `portal-v2/app.js`
- Modify: `portal-v2/page-shell.js`
- Extend: `tests/portal-v2-global-capabilities.test.mjs`
- Create: `tests/integration/portal-v2-global-capabilities.spec.js`

**Interfaces:**
- Produces: `exportPortalData()`, `validatePortalImport(file)`, `importPortalData(payload)`, `requestPrint()`, `submitPortalFeedback(payload)`.

- [ ] **Step 1: Write failing contract tests for all protected globals**
- [ ] **Step 2: Implement deterministic export and validated import**
- [ ] **Step 3: Preserve permission-gated print behavior and print CSS**
- [ ] **Step 4: Implement feedback sheet with page/project context and success/error state**
- [ ] **Step 5: Add Playwright round-trip and denial-path tests**
- [ ] **Step 6: Commit**

`git commit -m "feat: migrate Portal V2 global customer capabilities"`

---

### Task 6: Core Input and Evidence Parity Cluster

**Legacy obligations:** `profiel`, `dataai`, `aiscan`, `invoeren`, `antwoorden`, `onderzoek`.

**V2 destinations:** `profiel`, `data-ai`, `ai-scan`, `kansenkaart`, `gegevens-invullen`, `ingevulde-gegevens`, `onderzoek`.

**Files:**
- Create focused page modules under `portal-v2/pages/` for these destinations.
- Modify `portal-v2/native-pages.js` to dispatch to them.
- Create `tests/integration/portal-v2-native-parity-core.spec.js`.

**Required behaviors:** editable input, validation, persistence, answer readback, actual data/AI state, scan outcomes, research evidence and revisit/edit flow.

- [ ] **Step 1: Add failing browser flows for edit→save→readback**
- [ ] **Step 2: Implement native input/readback pages against canonical state APIs**
- [ ] **Step 3: Migrate profile/data/scan/research behavior**
- [ ] **Step 4: Mark manifest items proven only after integration tests pass**
- [ ] **Step 5: Commit each coherent capability group separately**

---

### Task 7: Business, People, Market and Strategy Parity Cluster

**Legacy obligations:** `business`, `cijfers`, `waarde`, `mensen`, `branche`, `strategie`, `canvassen`, `eindconclusie`, `dd`, `dna`.

**V2 destinations:** `businesscase`, `cijfers-maatstaven`, `waarde-financiering`, `mensen`, `branche-markt`, `strategiemodellen`, `strategie-naar-maandagochtend`, `canvassen`, `eindconclusie`, `due-diligence`, `strategy-dna`.

- [ ] **Step 1: Add failing behavior contracts per legacy obligation**
- [ ] **Step 2: Port calculations/assumptions with semantic parity, not DOM copying**
- [ ] **Step 3: Port editable strategy/canvas state and conclusions**
- [ ] **Step 4: Port due-diligence evidence/risk interaction**
- [ ] **Step 5: Run desktop/mobile browser matrix and mark proven items**

---

### Task 8: Execution Parity Cluster

**Legacy obligations:** `bijhouden`, `wijzigingen`, `advies`, `offerte`, `roadmap`.

**V2 destinations:** `actueel-houden`, `wijzigingen`, `advies`, `offerte`, `roadmap`, plus additive `taken-werkstromen`.

- [ ] **Step 1: Add failing flows for monitoring/change history/advice/offer/roadmap**
- [ ] **Step 2: Port real change/update state**
- [ ] **Step 3: Port recommendation rationale/priority/action path**
- [ ] **Step 4: Port offer selection/totals/story/next action**
- [ ] **Step 5: Port roadmap timeline/task/progress interactions**
- [ ] **Step 6: Verify mobile interaction and persistence**

---

### Task 9: Compliance and Existing V2-Native Capabilities Integration

**Legacy obligation:** `beleid`, `aicap`.

**V2 destinations:** `compliance-governance`, `compliance-command-center`, `ai-capabilities`.

**Additive V2:** CSRD & Impact, sources/datahub/brain/agents, recovery, outcomes/evidence, learning/writeback, self-heal, audittrail.

- [ ] **Step 1: Add behavior tests tying compliance status to evidence/risk/actions**
- [ ] **Step 2: Ensure AI-capability parity and existing V2 enhancements coexist**
- [ ] **Step 3: Ensure CSRD mobile design remains no-overflow and 44px touch compliant**
- [ ] **Step 4: Link Brain/Powerhouse status into the same shared router/context model**

---

### Task 10: Full Parity Gate and Production Proof

**Files:**
- Extend `tests/portal-v2-parity-manifest.test.mjs`
- Extend `tests/portal-v2-standalone-contract.test.mjs`
- Create/extend production Playwright parity readback.
- Modify relevant GitHub Actions workflow only if existing central runner does not already include these tests.

- [ ] **Step 1: Make `listOpenParityItems()` fail CI unless zero items remain for full-parity release**
- [ ] **Step 2: Run complete static + browser parity suite**
- [ ] **Step 3: Verify standalone architecture bans `/klantportaal`, `portal-next`, iframe/fetch fallback**
- [ ] **Step 4: Run Required, BRAIN, Portal V2 desktop/mobile preview on exact candidate SHA**
- [ ] **Step 5: Merge only when required branch protection is green**
- [ ] **Step 6: Verify Netlify production `commit_ref` equals merge SHA**
- [ ] **Step 7: Run representative production parity flows on `https://www.bedrijfsgeheugen.nl/portal-v2/`**
- [ ] **Step 8: Confirm zero open parity obligations before claiming full replacement**

---

## Release Units

1. Navigation + parity control plane.
2. Shared authenticated state + global capabilities.
3. Core input/evidence parity.
4. Business/strategy parity.
5. Execution parity.
6. Compliance + additive V2 integration.
7. Full parity closure.

Each unit is an isolated branch/PR from current `main` and may release independently once its own exact-head gates are green. Full parity is claimed only after unit 7.

## Self-Review

- Spec coverage: all 24 protected panels, all 8 global capabilities, mobile/desktop navigation, state/data separation, standalone architecture, browser matrix and exact production readback are assigned to tasks above.
- Placeholder scan: no TBD/TODO/"implement later" placeholders are used.
- Interface consistency: navigation, parity manifest and portal context interfaces are defined before consumers.
- Scope: the work is intentionally split into seven production-capable release units; Task 1–3 form the first sub-project and can ship independently without pretending full parity is complete.
