# Portal Next Complete Business OS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn `portal-next` into the complete Bedrijfsgeheugen customer portal: the approved overview dashboard becomes the canonical frontend, every protected IJsselmonde content/function area gets a native new-shell view, and Brain/Datahub/Powerhouse/action/outcome/evidence/learning are visibly connected without fake runtime truth.

**Architecture:** Keep `portal-next` as the shell and runtime presentation layer. Split customer truth, page/view definitions, trace/evidence rendering and shell orchestration into focused ES modules. Reuse the existing evidence-gated flow state/Powerhouse adapter and protected legacy parity inventory, while leaving `/klantportaal?klant=ijsselmonde` routed to `klantportaal.html` throughout this project.

**Tech Stack:** Static HTML/CSS/ES modules, Node 22 built-in test runner, Playwright 1.55 on exact Netlify deploy preview, Netlify redirects/Identity, existing Bedrijfsgeheugen portal read-model/API contracts.

**Spec:** `docs/superpowers/specs/2026-09-07-portal-next-complete-business-os-design.md`

## Global Constraints

- The approved overview design is the visual source of truth.
- No fallback to the old IJsselmonde visual design inside the new portal.
- Every existing IJsselmonde page/function must have a first-class native view in the new portal; a link alone does not count as parity.
- Runtime truth is evidence-gated; selection never starts a fake flow.
- Demo/example data exists only in explicit demo mode and is permanently labeled as example data.
- `/klantportaal?klant=ijsselmonde` must continue to serve `/klantportaal.html 200!` throughout this project.
- Production mode contains no hard-coded customer truth such as `Arthur Prinsen`, `72/100`, `€1,24M` or sample recommendations unless supplied by authorized runtime data.
- Desktop and mobile are release requirements.
- Customer identity comes from authorized portal context; query parameters preserve route context but do not establish authorization.
- Do not change unrelated public website shell/SEO behavior.

---

## File Structure

### Existing files to modify
- `portal-next/index.html` — canonical approved overview markup and shell anchors only.
- `portal-next/portal-next.css` — base tokens, shell layout and responsive behavior.
- `portal-next/reference-match.css` — exact approved overview geometry/visual matching; make this an explicit loaded layer rather than dead CSS.
- `portal-next/workspaces.css` — native page layout, trace drawer and mobile workspace layout.
- `portal-next/portal-next.js` — route/history orchestration, event wiring and runtime update dispatch only.
- `portal-next/portal-content-map.js` — canonical Business OS taxonomy and mapping from all 24 protected legacy tabs plus Brain/Powerhouse/management pages.
- `portal-next/portal-flow-state.js` — flow truth contract.
- `portal-next/portal-powerhouse-adapter.js` — normalize runtime/evidence/recovery semantics.
- `tests/portal-next-shell.test.mjs` — shell and production-safety contract.
- `tests/portal-content-map.test.mjs` — exact native coverage contract.
- `tests/portal-flow-state.test.mjs` — flow truth contract.
- `tests/portal-powerhouse-adapter.test.mjs` — Powerhouse evidence/recovery contract.
- `tests/customer-portal-routing.test.mjs` — frozen IJsselmonde routing guard plus no-recursive legacy comparison URL.
- `tests/integration/portal-next-live.spec.js` — desktop/mobile exact preview navigation, coverage and interactions.
- `.github/workflows/business-os-live-preview.yml` — exact-head asset and visual evidence gate.

### New focused modules
- `portal-next/portal-view-model.js` — converts authorized portal projection/runtime snapshot into safe overview/page view-models with neutral empty states.
- `portal-next/portal-native-pages.js` — native page definitions and render models for every mapped page ID.
- `portal-next/portal-trace.js` — source -> Datahub -> Brain -> agent -> action -> owner -> outcome -> evidence -> learning/recovery trace normalization.
- `portal-next/portal-render.js` — reusable DOM render helpers for KPI cards, summaries, native page three-layer views and trace drawer.
- `tests/portal-native-pages.test.mjs` — native coverage and three-layer composition contract.
- `tests/portal-trace.test.mjs` — causal trace/evidence contract.
- `tests/portal-production-safety-next.test.mjs` — production fixture ban, demo isolation and customer-context guard.

---

### Task 1: Freeze current routing and native coverage before UI changes

**Files:**
- Modify: `tests/customer-portal-routing.test.mjs`
- Modify: `tests/portal-content-map.test.mjs`
- Create: `tests/portal-native-pages.test.mjs`

**Interfaces:**
- Consumes: existing `PORTAL_PAGE_INDEX`, protected 24 legacy tab IDs from `.github/scripts/portal_parity.py`.
- Produces: `getNativePageDefinition(pageId)` and `NATIVE_PAGE_IDS` contract to be implemented in Task 3.

- [ ] **Step 1: Write failing routing tests**

Add assertions that IJsselmonde is frozen and that the new portal's legacy comparison URL cannot recurse through `/klantportaal` once native pages are used:

```js
import { buildLegacyPortalUrl } from '../portal-next/portal-next.js';

test('Ijsselmonde remains on protected legacy portal during Portal Next build', () => {
  assert.match(redirects, /^\/klantportaal\s+klant=ijsselmonde\s+\/klantportaal\.html\s+200!$/m);
});

test('Portal Next legacy comparison bypasses public klantportaal rewrite', () => {
  assert.equal(buildLegacyPortalUrl('ijsselmonde'), '/klantportaal.html?klant=ijsselmonde');
});
```

- [ ] **Step 2: Write failing complete native coverage test**

Create `tests/portal-native-pages.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { PORTAL_PAGE_INDEX } from '../portal-next/portal-content-map.js';
import { NATIVE_PAGE_IDS, getNativePageDefinition } from '../portal-next/portal-native-pages.js';

const required = Object.keys(PORTAL_PAGE_INDEX);

test('every mapped portal page has a native definition', () => {
  assert.deepEqual([...NATIVE_PAGE_IDS].sort(), [...required].sort());
  for (const id of required) {
    const page = getNativePageDefinition(id);
    assert.equal(page.id, id);
    assert.ok(page.management);
    assert.ok(page.operational);
    assert.ok(page.trace);
  }
});
```

- [ ] **Step 3: Run tests and confirm RED**

Run:

```bash
node --test tests/customer-portal-routing.test.mjs tests/portal-content-map.test.mjs tests/portal-native-pages.test.mjs
```

Expected: FAIL because `portal-native-pages.js` does not exist and `buildLegacyPortalUrl()` still points to `/klantportaal`.

- [ ] **Step 4: Implement only the non-recursive comparison URL**

Change in `portal-next/portal-next.js`:

```js
export function buildLegacyPortalUrl(klant=getPortalCustomerSlug()) {
  return withCustomer('/klantportaal.html', klant);
}
```

Do not change `_redirects`.

- [ ] **Step 5: Run the routing/content tests**

```bash
node --test tests/customer-portal-routing.test.mjs tests/portal-content-map.test.mjs
```

Expected: PASS for routing/content-map tests; native-page test remains RED until Task 3.

- [ ] **Step 6: Commit**

```bash
git add portal-next/portal-next.js tests/customer-portal-routing.test.mjs tests/portal-content-map.test.mjs tests/portal-native-pages.test.mjs
git commit -m "test: freeze portal routing and native coverage contract"
```

---

### Task 2: Make the approved overview design the actual Portal Next shell

**Files:**
- Modify: `portal-next/index.html`
- Modify: `portal-next/portal-next.css`
- Modify: `portal-next/reference-match.css`
- Modify: `tests/portal-next-shell.test.mjs`
- Modify: `tests/integration/portal-next-live.spec.js`

**Interfaces:**
- Consumes: existing source/module nodes and runtime status data attributes used by `portal-next.js`.
- Produces: stable DOM anchors for `portal-render.js`: `#overviewKpis`, `#managementSummary`, `#recommendations`, `#quickLinks`, `#roadmapSummary`, `#opportunityRiskSummary`, `#impactSummary`, `#recentActivity`, `#traceDrawer`.

- [ ] **Step 1: Extend shell test to exact overview composition**

Add:

```js
for (const marker of [
  'Welkom terug', 'Bedrijfsgezondheid', 'Kennisborging', 'Processen',
  'Data & systemen', 'AI-volwassenheid', 'Het brein van je bedrijf',
  'AI Management Summary', 'Aanbevelingen', 'Snelle links',
  'Roadmap & voortgang', 'Kansen & bedreigingen', 'Impact overzicht',
  'Recente activiteiten'
]) assert.match(html, new RegExp(marker));
assert.match(html, /reference-match\.css/);
```

Also assert the canonical source/module IDs remain present.

- [ ] **Step 2: Extend Playwright desktop test**

At 1536x1024, assert:

```js
await expect(page.locator('.sidebar')).toBeVisible();
await expect(page.locator('#overviewKpis .kpi')).toHaveCount(5);
await expect(page.locator('.cockpit-card')).toBeVisible();
await expect(page.locator('.right-rail')).toBeVisible();
await expect(page.locator('.lower-grid')).toBeVisible();
await expect(page.locator('#recentActivity')).toBeVisible();
```

Capture `artifacts/portal-next-approved-desktop.png`.

- [ ] **Step 3: Run tests and confirm RED**

```bash
node --test tests/portal-next-shell.test.mjs
```

Expected: FAIL on missing `reference-match.css` link and new stable DOM anchors.

- [ ] **Step 4: Rebuild `index.html` overview structure to match the approved screenshot**

Use the existing markup as behavior substrate, but enforce this high-level order:

```html
<link rel="stylesheet" href="/portal-next/portal-next.css">
<link rel="stylesheet" href="/portal-next/workspaces.css">
<link rel="stylesheet" href="/portal-next/reference-match.css">
...
<section id="overviewView" ...>
  <section id="overviewKpis" class="kpis"></section>
  <div class="dashboard-grid">
    <section class="card cockpit-card">...</section>
    <aside class="right-rail">
      <section id="managementSummary" class="card"></section>
      <section id="recommendations" class="card recommendations"></section>
      <section id="quickLinks" class="card quick-links"></section>
    </aside>
  </div>
  <section class="lower-grid">
    <article id="roadmapSummary" class="card"></article>
    <article id="opportunityRiskSummary" class="card"></article>
    <article id="impactSummary" class="card"></article>
  </section>
  <section id="recentActivity" class="card recent-activity"></section>
</section>
<div id="traceDrawer" class="trace-drawer" hidden></div>
```

Preserve all existing source, Datahub, Brain, Powerhouse and module data attributes required by the flow renderer.

- [ ] **Step 5: Normalize CSS layering**

Use `portal-next.css` for tokens/base/responsive rules, `workspaces.css` for native pages/drawers, and `reference-match.css` for the exact approved overview geometry. Remove conflicting declarations only where they affect Portal Next; do not touch public website CSS.

- [ ] **Step 6: Verify shell GREEN**

```bash
node --test tests/portal-next-shell.test.mjs
node --check portal-next/portal-next.js
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add portal-next/index.html portal-next/portal-next.css portal-next/reference-match.css tests/portal-next-shell.test.mjs tests/integration/portal-next-live.spec.js
git commit -m "feat: make approved dashboard the Portal Next overview"
```

---

### Task 3: Separate production-safe customer truth from explicit demo fixtures

**Files:**
- Create: `portal-next/portal-view-model.js`
- Create: `tests/portal-production-safety-next.test.mjs`
- Modify: `portal-next/index.html`
- Modify: `portal-next/portal-next.js`

**Interfaces:**
- Produces:
  - `createEmptyPortalProjection()`
  - `buildOverviewViewModel(projection, { demo=false })`
  - `isDemoMode(search)`
- View-model output:

```js
{
  identity: { displayName, initials, role },
  kpis: [{ id, label, value, suffix, delta, status }],
  management: { opportunities, risks, trends, items },
  recommendations: [], roadmap: [], impact: [], activity: []
}
```

- [ ] **Step 1: Write production safety tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildOverviewViewModel, isDemoMode } from '../portal-next/portal-view-model.js';

const html = readFileSync(new URL('../portal-next/index.html', import.meta.url), 'utf8');

test('normal production shell contains no fixture customer truth', () => {
  for (const token of ['Arthur Prinsen','72/100','€ 1,24M','Automatiseer het offerteproces']) {
    assert.equal(html.includes(token), false, token);
  }
});

test('missing runtime data renders neutral values', () => {
  const vm = buildOverviewViewModel({}, { demo:false });
  assert.ok(vm.kpis.every(k => k.value === null));
  assert.equal(vm.identity.displayName, null);
});

test('demo mode is explicit only', () => {
  assert.equal(isDemoMode('?demo=1'), true);
  assert.equal(isDemoMode('?klant=ijsselmonde'), false);
});
```

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tests/portal-production-safety-next.test.mjs
```

- [ ] **Step 3: Implement safe view model**

Production empty KPI shape must be explicit:

```js
const KPI_DEFS = [
 ['health','Bedrijfsgezondheid'],
 ['knowledge','Kennisborging'],
 ['process','Processen'],
 ['data','Data & systemen'],
 ['ai','AI-volwassenheid']
];

export function createEmptyPortalProjection(){
  return { identity:null, kpis:{}, management:null, recommendations:[], roadmap:[], impact:[], activity:[] };
}

export function isDemoMode(search=''){
  return new URLSearchParams(search).get('demo') === '1';
}
```

`buildOverviewViewModel()` must use runtime values only when present and otherwise return `null` values/status `unavailable`; do not fabricate deltas.

- [ ] **Step 4: Remove fixture facts from `index.html`**

Replace hard-coded values/person with empty render hosts and neutral accessibility copy. Demo fixture values, if retained, live inside `portal-view-model.js` behind `demo=1` and carry `demo:true`.

- [ ] **Step 5: Wire overview rendering through `portal-next.js`**

Import the view model and render empty/live/demo state without changing runtime flow truth.

- [ ] **Step 6: Verify GREEN**

```bash
node --test tests/portal-production-safety-next.test.mjs tests/portal-next-shell.test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add portal-next/portal-view-model.js portal-next/index.html portal-next/portal-next.js tests/portal-production-safety-next.test.mjs
git commit -m "feat: separate live portal truth from demo fixtures"
```

---

### Task 4: Implement native page definitions for every protected portal area

**Files:**
- Create: `portal-next/portal-native-pages.js`
- Modify: `portal-next/portal-content-map.js`
- Modify: `tests/portal-native-pages.test.mjs`
- Modify: `tests/portal-content-map.test.mjs`

**Interfaces:**
- Produces:
  - `NATIVE_PAGE_IDS: Set<string>`
  - `getNativePageDefinition(id): NativePageDefinition`
  - `listNativePagesForWorkspace(workspace): NativePageDefinition[]`

Native page definition:

```js
{
  id, label, sectionId, workspace,
  management: { title, summary, metrics:[] },
  operational: { title, kind, actions:[] },
  trace: { enabled:true, traceType },
  sourceContract: { legacyTab, projectionKeys:[] }
}
```

- [ ] **Step 1: Expand tests to require all 24 protected legacy tabs plus new Brain/Powerhouse and management pages**

Use the legacy set from `.github/scripts/portal_parity.py` and assert every `legacyTab` maps to exactly one or more native page IDs.

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tests/portal-native-pages.test.mjs tests/portal-content-map.test.mjs
```

- [ ] **Step 3: Implement page definitions**

Create explicit entries for all IDs already present in `PORTAL_PAGE_INDEX`, including:

`overzicht`, `profiel`, `data-ai`, `ai-scan`, `kansenkaart`, `gegevens-invullen`, `ingevulde-gegevens`, `businesscase`, `cijfers-maatstaven`, `waarde-financiering`, `mensen`, `branche-markt`, `onderzoek`, `compliance-governance`, `ai-capabilities`, `strategiemodellen`, `modellen`, `canvassen`, `eindconclusie`, `due-diligence`, `exit`, `strategie-naar-maandagochtend`, `actueel-houden`, `wijzigingen`, `advies`, `offerte`, `roadmap`, `uitvoeringsladder`, `taken-werkstromen`, `bronnenstatus`, `datahubstatus`, `brain-verwerking`, `agentstatus`, `actieve-acties`, `recovery-obligations`, `outcomes-evidence`, `learning-writeback`, `self-heal`, `audittrail`, `koppelingen`, `gebruikers`, `documenten`, `instellingen`, `audit`.

Do not put customer facts in definitions; definitions are schema/copy/action contracts only.

- [ ] **Step 4: Map each page into a Business OS workspace**

Use exact workspace labels already supported by shell routing. Multiple legacy subjects may appear in one workspace, but no page ID may be orphaned.

- [ ] **Step 5: Verify GREEN**

```bash
node --test tests/portal-native-pages.test.mjs tests/portal-content-map.test.mjs
```

- [ ] **Step 6: Commit**

```bash
git add portal-next/portal-native-pages.js portal-next/portal-content-map.js tests/portal-native-pages.test.mjs tests/portal-content-map.test.mjs
git commit -m "feat: define complete native Business OS page coverage"
```

---

### Task 5: Build the reusable three-layer native page renderer

**Files:**
- Create: `portal-next/portal-render.js`
- Modify: `portal-next/workspaces.css`
- Modify: `portal-next/portal-next.js`
- Modify: `tests/portal-native-pages.test.mjs`
- Modify: `tests/integration/portal-next-live.spec.js`

**Interfaces:**
- Consumes: `NativePageDefinition`, authorized page projection data and optional trace.
- Produces:
  - `renderOverview(root, vm)`
  - `renderNativePage(root, definition, data)`
  - `renderNeutralValue(value, fallback='Geen geverifieerde data')`
  - `openTraceDrawer(trace)` / `closeTraceDrawer()`

- [ ] **Step 1: Add renderer contract tests**

Test generated markup or DOM-safe string builders for the required layers:

```js
const page = getNativePageDefinition('advies');
const html = renderNativePageMarkup(page, {});
assert.match(html, /data-layer="management"/);
assert.match(html, /data-layer="operational"/);
assert.match(html, /data-layer="trace"/);
assert.match(html, /Geen geverifieerde data/);
```

- [ ] **Step 2: Run and confirm RED**

```bash
node --test tests/portal-native-pages.test.mjs
```

- [ ] **Step 3: Implement reusable renderer**

Every page uses:

```html
<section class="native-page">
  <header class="native-page__hero">...</header>
  <section class="native-page__management" data-layer="management">...</section>
  <section class="native-page__operational" data-layer="operational">...</section>
  <section class="native-page__trace" data-layer="trace">...</section>
</section>
```

Trace layer should be a compact card/button that opens the detail drawer, not a permanently expanded audit dump.

- [ ] **Step 4: Replace generic workspace cards with actual native page navigation**

`renderRoute()` should render the workspace landing view plus page tiles from `listNativePagesForWorkspace()`. Clicking a page changes `?page=<id>` using `history.pushState` while preserving `klant` and `demo`.

- [ ] **Step 5: Add browser history support**

On `popstate`, re-resolve current route/page from URL and render without losing tenant context.

- [ ] **Step 6: Extend Playwright coverage**

For every native page ID:

```js
await page.goto(`${preview}/portal-next/?page=${id}`, { waitUntil:'networkidle' });
await expect(page.locator('.native-page')).toBeVisible();
await expect(page.locator('[data-layer="management"]')).toBeVisible();
await expect(page.locator('[data-layer="operational"]')).toBeVisible();
await expect(page.locator('[data-layer="trace"]')).toBeVisible();
```

- [ ] **Step 7: Verify GREEN**

```bash
node --test tests/portal-native-pages.test.mjs tests/portal-next-shell.test.mjs
```

- [ ] **Step 8: Commit**

```bash
git add portal-next/portal-render.js portal-next/workspaces.css portal-next/portal-next.js tests/portal-native-pages.test.mjs tests/integration/portal-next-live.spec.js
git commit -m "feat: render all portal pages natively in Business OS shell"
```

---

### Task 6: Implement causal trace and evidence drill-down

**Files:**
- Create: `portal-next/portal-trace.js`
- Create: `tests/portal-trace.test.mjs`
- Modify: `portal-next/portal-render.js`
- Modify: `portal-next/portal-powerhouse-adapter.js`
- Modify: `portal-next/workspaces.css`

**Interfaces:**
- Produces:

```js
normalizeTrace(raw) => {
  sources: [], datahub: null, brain: null, agent: null,
  action: null, owner: null, outcome: null,
  evidence: [], learning: null, recovery: null,
  classification: 'unverified'|'observed'|'verified'|'blocked'
}
```

- [ ] **Step 1: Write trace tests**

```js
test('verified requires evidence', () => {
  assert.equal(normalizeTrace({ outcome:{status:'completed'}, evidence:[] }).classification, 'unverified');
  assert.equal(normalizeTrace({ outcome:{status:'completed'}, evidence:['ev-1'] }).classification, 'verified');
});

test('open recovery obligation dominates completed presentation', () => {
  assert.equal(normalizeTrace({ recovery:{open:true}, evidence:['ev-1'] }).classification, 'blocked');
});
```

Also assert every normalized trace exposes the ten causal slots even when values are null.

- [ ] **Step 2: Run RED**

```bash
node --test tests/portal-trace.test.mjs
```

- [ ] **Step 3: Implement `normalizeTrace`**

Never emit internal raw reasoning text. `brain` is a safe decision/context artifact reference or summary supplied by the projection, not hidden chain-of-thought.

- [ ] **Step 4: Feed adapter data into trace**

Extend `mapRuntimeSnapshotToPortalFlow()` only with evidence/recovery fields needed by the UI; preserve existing status semantics.

- [ ] **Step 5: Implement trace drawer**

Show ordered steps:

`Bron -> Datahub -> AI Brain -> Powerhouse -> Actie -> Eigenaar -> Outcome -> Evidence -> Learning -> Recovery/Prevention`

Missing steps show `Niet beschikbaar`; verified styling only when evidence contract says verified.

- [ ] **Step 6: Verify**

```bash
node --test tests/portal-trace.test.mjs tests/portal-powerhouse-adapter.test.mjs tests/portal-flow-state.test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add portal-next/portal-trace.js portal-next/portal-render.js portal-next/portal-powerhouse-adapter.js portal-next/workspaces.css tests/portal-trace.test.mjs
git commit -m "feat: add evidence-gated causal trace drill-down"
```

---

### Task 7: Wire authenticated runtime/read-model data into Portal Next without weakening security

**Files:**
- Modify: `portal-next/portal-next.js`
- Modify: `portal-next/portal-view-model.js`
- Create/Modify: `tests/portal-production-safety-next.test.mjs`
- Read-only reference: `portal/app.mjs`, `netlify/functions/portal-state.mjs`, `platform/api/portal-state-handler.mjs`

**Interfaces:**
- Consumes existing authenticated `/api/portal-state` contract with Netlify Identity bearer token.
- Produces `loadAuthorizedPortalProjection()` returning safe empty state when not authenticated/unavailable.

- [ ] **Step 1: Write security contract tests**

Assert Portal Next:
- calls `/api/portal-state` only with bearer token;
- does not add `tenant=` query/body parameters;
- preserves `klant` only for UI/routing context;
- never uses query-string slug as authorization;
- sends only `vraag` to `/api/portaalvraag` if/when real AI is enabled.

- [ ] **Step 2: Run RED**

```bash
node --test tests/portal-production-safety-next.test.mjs
```

- [ ] **Step 3: Implement authenticated projection load**

Follow the production `portal/app.mjs` boundary rather than inventing a second tenant mechanism:

```js
async function loadAuthorizedPortalProjection(){
  const user = window.netlifyIdentity?.currentUser?.();
  const token = await user?.jwt?.();
  if (!token) return createEmptyPortalProjection();
  const response = await fetch('/api/portal-state', { headers:{ authorization:`Bearer ${token}` } });
  if (!response.ok) return createEmptyPortalProjection();
  return response.json();
}
```

Use the exact identity API shape already proven in the repository; adjust syntax to match current production implementation if different.

- [ ] **Step 4: Normalize runtime snapshot before rendering**

Pass runtime fields through `mapRuntimeSnapshotToPortalFlow()` and management/page data through `buildOverviewViewModel()` / native page renderers.

- [ ] **Step 5: Keep demo mode separate**

`demo=1` never writes or masquerades as authenticated truth. It may render fixture data even while no user is logged in, but every fixture region remains visibly labeled `Voorbeeld`.

- [ ] **Step 6: Verify**

```bash
node --test tests/portal-production-safety-next.test.mjs tests/portal-production-contract.test.mjs tests/portal-powerhouse-adapter.test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add portal-next/portal-next.js portal-next/portal-view-model.js tests/portal-production-safety-next.test.mjs
git commit -m "feat: connect Portal Next to authenticated portal projection"
```

---

### Task 8: Connect overview actions, recommendations, KPI cards and quick links to native pages and traces

**Files:**
- Modify: `portal-next/portal-render.js`
- Modify: `portal-next/portal-next.js`
- Modify: `tests/integration/portal-next-live.spec.js`

**Interfaces:**
- KPI target map examples:
  - health -> `profiel`
  - knowledge -> `mensen` or `documenten`
  - process -> `taken-werkstromen`
  - data -> `bronnenstatus`
  - ai -> `ai-capabilities`
- Recommendation contract: `{ id, title, priority, pageId, traceId, actionId }`.

- [ ] **Step 1: Add failing Playwright interaction tests**

```js
await page.locator('[data-kpi-id="data"]').click();
await expect(page.locator('[data-page-id="bronnenstatus"]')).toBeVisible();

await page.locator('[data-recommendation-id]').first().click();
await expect(page.locator('#traceDrawer')).toBeVisible();
```

- [ ] **Step 2: Implement page/trace targets**

All cards preserve current customer query parameter. If target data is unavailable, open the native page with neutral empty state rather than doing nothing.

- [ ] **Step 3: Implement quick-link targets**

Map at least Connections, New connection, Hours & invoices/subscription, My tasks, Knowledge/Documents, Reports/Audit, Users and Settings into native pages or an explicit unavailable-state page.

- [ ] **Step 4: Verify keyboard and touch behavior**

Buttons use actual `<button>` elements, visible focus, >=44px mobile hit targets where practical, Escape closes drawers, no overlay masks essential text.

- [ ] **Step 5: Run tests**

```bash
node --test tests/portal-next-shell.test.mjs tests/portal-native-pages.test.mjs
```

Exact browser checks run in Task 10 preview.

- [ ] **Step 6: Commit**

```bash
git add portal-next/portal-render.js portal-next/portal-next.js tests/integration/portal-next-live.spec.js
git commit -m "feat: connect overview cards to native Business OS views"
```

---

### Task 9: Enforce exact desktop/mobile visual regression contract

**Files:**
- Modify: `tests/integration/portal-next-live.spec.js`
- Modify: `.github/workflows/business-os-live-preview.yml`
- Modify: `portal-next/reference-match.css`
- Modify: `portal-next/portal-next.css`
- Modify: `portal-next/workspaces.css`

**Interfaces:**
- Produces screenshots:
  - `artifacts/portal-next-approved-desktop.png`
  - `artifacts/portal-next-approved-mobile.png`
  - `artifacts/portal-next-native-page.png`
  - `artifacts/portal-next-trace-drawer.png`

- [ ] **Step 1: Expand exact preview workflow asset checks**

Fetch and syntax-check:

```bash
curl -fsS "$PREVIEW_URL/portal-next/portal-view-model.js" -o /tmp/portal-view-model.js
curl -fsS "$PREVIEW_URL/portal-next/portal-native-pages.js" -o /tmp/portal-native-pages.js
curl -fsS "$PREVIEW_URL/portal-next/portal-trace.js" -o /tmp/portal-trace.js
curl -fsS "$PREVIEW_URL/portal-next/portal-render.js" -o /tmp/portal-render.js
node --check /tmp/portal-view-model.js
node --check /tmp/portal-native-pages.js
node --check /tmp/portal-trace.js
node --check /tmp/portal-render.js
```

Replace old workflow expectation that production HTML literally contains `Preview · voorbeelddata...`; production shell should now be safe by default. Assert an explicit demo marker is available only on `?demo=1` through Playwright.

- [ ] **Step 2: Add desktop composition geometry checks**

At 1536x1024 assert:
- sidebar left of main;
- 5 KPI cards on one row;
- central cockpit and right rail side-by-side;
- lower three cards present;
- recent activity visible;
- no root horizontal overflow.

- [ ] **Step 3: Add mobile checks**

At 390x844 assert:
- desktop sidebar hidden or transformed per approved responsive design;
- mobile nav visible;
- KPI cards remain readable (horizontal controlled scroller or stacked layout, no clipped text);
- cockpit is usable without page overflow;
- trace drawer fits viewport;
- no text-hidden-behind-overlay regression.

- [ ] **Step 4: Tune only Portal Next CSS until Playwright passes**

Do not fix visual failures by weakening assertions unless the approved design requirement itself changed.

- [ ] **Step 5: Upload visual evidence in workflow**

Add `actions/upload-artifact@v4` for `artifacts/portal-next-*.png`, retention 14 days.

- [ ] **Step 6: Commit**

```bash
git add tests/integration/portal-next-live.spec.js .github/workflows/business-os-live-preview.yml portal-next/reference-match.css portal-next/portal-next.css portal-next/workspaces.css
git commit -m "test: gate Portal Next against approved desktop and mobile design"
```

---

### Task 10: Full verification, PR review and isolated release only

**Files:**
- No new product files unless verification exposes a real defect.
- Update PR #1029 body/status.

**Interfaces:**
- Requires exact current branch head SHA.
- Produces exact-head CI, Netlify preview and visual artifact evidence.

- [ ] **Step 1: Run focused tests**

```bash
node --test \
  tests/portal-next-shell.test.mjs \
  tests/portal-content-map.test.mjs \
  tests/portal-native-pages.test.mjs \
  tests/portal-flow-state.test.mjs \
  tests/portal-powerhouse-adapter.test.mjs \
  tests/portal-trace.test.mjs \
  tests/portal-production-safety-next.test.mjs \
  tests/customer-portal-routing.test.mjs \
  tests/portal-production-contract.test.mjs
python3 .github/scripts/portal_parity.py
```

Expected: all PASS and protected legacy parity GREEN.

- [ ] **Step 2: Syntax check every Portal Next module**

```bash
for f in portal-next/*.js; do node --check "$f"; done
```

Expected: all zero exit.

- [ ] **Step 3: Confirm routing unchanged**

```bash
grep -E '^/klantportaal[[:space:]]+klant=ijsselmonde[[:space:]]+/klantportaal\.html[[:space:]]+200!$' _redirects
```

Expected: exact protected line exists.

- [ ] **Step 4: Self-review plan/spec coverage**

Verify all definition-of-complete items in the spec have evidence. In particular, do not call native parity complete if any protected page still merely opens the legacy bridge.

- [ ] **Step 5: Push/update draft PR and wait for exact-head checks**

Required relevant lanes include repository `test`, Business OS Experience, Business OS Live Preview, live preview smoke, BRAIN delivery classification and any path-triggered portal checks. If main moves and BRAIN current-main handoff blocks, sync current main once after assessing semantic conflicts; do not bypass protection.

- [ ] **Step 6: Inspect visual artifacts**

Review desktop, mobile, native-page and trace-drawer screenshots for overlap, clipped labels, unreadable status, fake active flows and divergence from the approved reference.

- [ ] **Step 7: Mark PR ready only after exact-head evidence is green**

Do not merge while draft or while required `test` is expected/pending.

- [ ] **Step 8: Merge with expected head SHA**

Use protected merge workflow with exact head SHA after all checks green.

- [ ] **Step 9: Verify isolated production deployment**

Confirm Netlify production deploy `commit_ref` equals merge commit and `/portal-next/` serves the new assets. Do **not** alter or reinterpret IJsselmonde route.

- [ ] **Step 10: Final evidence statement**

Report separately:
- new Portal Next code deployed: yes/no with exact SHA;
- approved overview design verified: yes/no with artifact evidence;
- native page coverage count;
- runtime/evidence safety gates;
- IJsselmonde route unchanged: yes/no;
- any remaining legacy dependency, if one exists.

---

## Plan self-review

### Spec coverage
- Approved 1:1 overview design: Tasks 2 and 9.
- Complete native IJsselmonde page/function coverage: Tasks 1, 4, 5 and 10.
- End-to-end Brain/Datahub/Powerhouse/action/outcome/evidence/learning trace: Tasks 6 and 8.
- Three information layers: Tasks 4 and 5.
- Evidence-gated runtime truth: Tasks 3, 6 and 7 plus existing flow-state tests.
- No fictitious production truth: Task 3 and Task 7.
- IJsselmonde unchanged: Tasks 1 and 10.
- Legacy bridge phased out only after native parity: Tasks 1, 4, 5 and final verification.
- Desktop/mobile release quality: Task 9.
- Exact-head release evidence: Task 10.

### Placeholder scan
No TBD/TODO/"implement later" steps. Every code-producing task defines concrete files, interfaces, tests, commands and acceptance conditions.

### Type/interface consistency
`NativePageDefinition`, overview view-model shape and normalized trace shape are defined once above and consumed consistently by later tasks. `portal-next.js` remains the orchestrator; rendering/data/trace responsibilities are split into focused modules.
