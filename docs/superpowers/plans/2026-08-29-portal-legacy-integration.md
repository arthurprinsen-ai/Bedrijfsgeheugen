# Portal Legacy Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the current portal prototype into the production Bedrijfsgeheugen portal while preserving every meaningful legacy portal capability and making the approved white enterprise/SaaS design the binding UI baseline.

**Architecture:** Keep the current dependency-light static portal shell, but split business contracts, legacy mapping, view models, renderers and data adapters into focused modules. Existing legacy portal concepts are mapped into one canonical operating model and exposed through the approved dashboard layout; new Business Operating Intelligence capabilities are additive. Production promotion follows the existing preview → verify → promote → production-verify → rollback/self-heal contract.

**Tech Stack:** HTML, CSS, native ES modules, Node.js built-in test runner, Netlify static hosting/functions, existing Bedrijfsgeheugen Brain/Datahub APIs and repository agent contracts.

**Spec:** `docs/superpowers/specs/2026-08-29-portal-legacy-integration-design.md`

## Global Constraints

- The approved white/off-white enterprise portal design is the visual baseline; the dark-sidebar prototype is not the target.
- No existing portal capability, metric, report, action, integration, administration function, user route or meaningful dashboard object may disappear silently.
- Existing portal/source data must be mapped into canonical objects; users must not be required to re-enter legacy state.
- Existing routes and saved links remain valid through preserved routes or explicit aliases.
- `Done` for actions means executed + verified + registered result evidence.
- Only `Realised` value with valid evidence contributes to Verified Value Created.
- AI/agents inherit equal or narrower permissions than the invoking user/policy.
- AI is not the system of record for company data.
- Cached useful state target <1s; interactive target <2s; background refresh must be non-blocking.
- Repository invariants remain binding: no silent failure, no lost obligations, production-green verification, self-heal or rollback on regressions.
- No new frontend framework dependency is introduced in this plan.

---

## File Structure

### Existing files to modify
- `portal/index.html` — semantic application entry only.
- `portal/styles.css` — replace dark prototype styling with approved white enterprise design system.
- `portal/app.mjs` — reduce to application bootstrap, router and cross-screen interactions.
- `portal/core.mjs` — canonical business rules and route contracts.
- `portal/data.mjs` — temporary compatibility/sample fixture only; no longer the canonical source of presentation logic.
- `tests/portal-core.test.mjs` — core invariants.
- `tests/portal-ui.test.mjs` — baseline design and interaction invariants.

### New focused modules
- `portal/legacy-map.mjs` — legacy menu/capability → canonical route mapping.
- `portal/view-model.mjs` — stable view-model builders used by renderers and future real data adapters.
- `portal/render-shell.mjs` — approved sidebar/topbar/mobile shell.
- `portal/render-today.mjs` — executive overview preserving legacy dashboard content.
- `portal/render-company.mjs` — Bedrijfsgezondheid + Bedrijf + Business Graph.
- `portal/render-intelligence.mjs` — intelligence feed/pipeline.
- `portal/render-decisions.mjs` — decision views.
- `portal/render-execution.mjs` — actions/roadmap/agents.
- `portal/render-impact.mjs` — monthly impact, reports and Verified Value.
- `portal/render-memory.mjs` — knowledge, history and evidence.
- `portal/render-admin.mjs` — integrations, billing, users, roles, governance, settings.
- `portal/data-adapter.mjs` — cached/delta-aware portal state adapter with sample fallback contract.
- `portal/permissions.mjs` — tenant/entity/RBAC/ABAC/object-action permission evaluation.
- `portal/evidence.mjs` — evidence/confidence/provenance normalization.
- `tests/portal-legacy-baseline.test.mjs` — regression gate for every retained legacy capability.
- `tests/portal-view-model.test.mjs` — view-model and canonical mapping tests.
- `tests/portal-permissions.test.mjs` — permission and AI boundary tests.
- `tests/portal-data-adapter.test.mjs` — cache/delta/fallback contract tests.
- `tests/portal-production-contract.test.mjs` — route/deploy/static asset production contract.

---

### Task 1: Lock the legacy portal baseline as executable tests

**Files:**
- Create: `tests/portal-legacy-baseline.test.mjs`
- Modify: `tests/portal-ui.test.mjs`
- Modify: `portal/core.mjs`

**Interfaces:**
- Produces: `LEGACY_CAPABILITIES: readonly LegacyCapability[]`
- Produces: `PRIMARY_ROUTES: readonly string[]`
- `LegacyCapability = { id:string, label:string, canonicalRoute:string, requiredSurface:string }`

- [ ] **Step 1: Write the failing baseline test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { LEGACY_CAPABILITIES } from '../portal/core.mjs';

const required = [
  'overzicht','bedrijfsgezondheid','strategie-uitvoering','processen-organisatie',
  'kennis','data-koppelingen','ai-insights','acties-impact','rapportages',
  'koppelingen-bouwen','roadmap','facturen-abonnement','organisatie-gebruikers','instellingen','frisse-blik'
];

test('every approved legacy portal capability remains represented', () => {
  const ids = new Set(LEGACY_CAPABILITIES.map(x => x.id));
  for (const id of required) assert.equal(ids.has(id), true, `missing legacy capability ${id}`);
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `node --test tests/portal-legacy-baseline.test.mjs`
Expected: FAIL because `LEGACY_CAPABILITIES` does not exist.

- [ ] **Step 3: Add the canonical legacy registry to `portal/core.mjs`**

```js
export const LEGACY_CAPABILITIES = Object.freeze([
  {id:'overzicht',label:'Overzicht',canonicalRoute:'today',requiredSurface:'executive-overview'},
  {id:'bedrijfsgezondheid',label:'Bedrijfsgezondheid',canonicalRoute:'health',requiredSurface:'health'},
  {id:'strategie-uitvoering',label:'Strategie & uitvoering',canonicalRoute:'company/strategy',requiredSurface:'strategy-roadmap'},
  {id:'processen-organisatie',label:'Processen & organisatie',canonicalRoute:'company/processes',requiredSurface:'process-organisation'},
  {id:'kennis',label:'Kennis',canonicalRoute:'memory/knowledge',requiredSurface:'knowledge'},
  {id:'data-koppelingen',label:'Data & koppelingen',canonicalRoute:'company/data',requiredSurface:'data-integrations'},
  {id:'ai-insights',label:'AI & Insights',canonicalRoute:'intelligence',requiredSurface:'ai-intelligence'},
  {id:'acties-impact',label:'Acties & impact',canonicalRoute:'execution',requiredSurface:'actions-impact'},
  {id:'rapportages',label:'Rapportages',canonicalRoute:'impact/reports',requiredSurface:'reports'},
  {id:'koppelingen-bouwen',label:'Koppelingen bouwen',canonicalRoute:'admin/integrations',requiredSurface:'integration-builder'},
  {id:'roadmap',label:'Roadmap',canonicalRoute:'execution/roadmap',requiredSurface:'roadmap'},
  {id:'facturen-abonnement',label:'Facturen & abonnement',canonicalRoute:'admin/billing',requiredSurface:'billing'},
  {id:'organisatie-gebruikers',label:'Organisatie & gebruikers',canonicalRoute:'admin/users',requiredSurface:'users'},
  {id:'instellingen',label:'Instellingen',canonicalRoute:'admin/settings',requiredSurface:'settings'},
  {id:'frisse-blik',label:'Frisse Blik Scan',canonicalRoute:'admin/frisse-blik',requiredSurface:'upsell'}
]);
```

- [ ] **Step 4: Extend `tests/portal-ui.test.mjs` to assert the approved visual direction**

Add assertions for `.sidebar`, `.topbar`, `.dashboard-grid`, `.right-rail`, electric-blue primary tokens and absence of the old dark-shell variable names as the dominant baseline.

- [ ] **Step 5: Run Task 1 tests**

Run: `node --test tests/portal-core.test.mjs tests/portal-ui.test.mjs tests/portal-legacy-baseline.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add portal/core.mjs tests/portal-ui.test.mjs tests/portal-legacy-baseline.test.mjs
git commit -m "test: lock portal legacy capability baseline"
```

---

### Task 2: Introduce route compatibility and legacy mapping

**Files:**
- Create: `portal/legacy-map.mjs`
- Modify: `portal/core.mjs`
- Test: `tests/portal-legacy-baseline.test.mjs`

**Interfaces:**
- Produces: `resolvePortalRoute(input:string): { route:string, legacyId:string|null }`
- Produces: `legacyHref(id:string): string`

- [ ] **Step 1: Add failing tests for old and new routes**

```js
import { resolvePortalRoute } from '../portal/legacy-map.mjs';

test('legacy overview resolves to today', () => {
  assert.deepEqual(resolvePortalRoute('overzicht'), {route:'today',legacyId:'overzicht'});
});

test('legacy data route resolves to canonical company data', () => {
  assert.deepEqual(resolvePortalRoute('data-koppelingen'), {route:'company/data',legacyId:'data-koppelingen'});
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/portal-legacy-baseline.test.mjs`
Expected: module-not-found failure.

- [ ] **Step 3: Implement `portal/legacy-map.mjs` using `LEGACY_CAPABILITIES`**

Use a frozen `Map` generated from the registry. Unknown routes must fall back to `today`; canonical routes must pass through unchanged.

- [ ] **Step 4: Update `routeFromHash()` in `portal/core.mjs` to call `resolvePortalRoute()`**

Route parsing must preserve `route/subroute` and never silently throw.

- [ ] **Step 5: Run focused route tests**

Run: `node --test tests/portal-core.test.mjs tests/portal-legacy-baseline.test.mjs`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add portal/core.mjs portal/legacy-map.mjs tests/portal-legacy-baseline.test.mjs
git commit -m "feat: preserve legacy portal routes"
```

---

### Task 3: Build stable canonical view models for old + new portal state

**Files:**
- Create: `portal/view-model.mjs`
- Create: `tests/portal-view-model.test.mjs`
- Modify: `portal/data.mjs`

**Interfaces:**
- Produces: `buildTodayViewModel(state)`
- Produces: `buildHealthViewModel(state)`
- Produces: `buildBusinessGraphViewModel(state)`
- Produces: `buildImpactViewModel(state)`
- Produces: `buildAdminViewModel(state)`

- [ ] **Step 1: Write failing tests that require legacy overview content**

```js
import { buildTodayViewModel } from '../portal/view-model.mjs';
import { sampleState } from '../portal/data.mjs';

test('today view preserves legacy management summary sections and KPI cards', () => {
  const vm = buildTodayViewModel(sampleState);
  assert.deepEqual(vm.managementSummary.sections.map(x => x.id), ['opportunities','threats','trends','conclusion']);
  assert.deepEqual(vm.healthCards.slice(0,5).map(x => x.id), [
    'bedrijfsgezondheid','kennisborging','processen','data-systemen','ai-volwassenheid'
  ]);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/portal-view-model.test.mjs`
Expected: module-not-found or missing export failure.

- [ ] **Step 3: Refactor `portal/data.mjs` to export one `sampleState` object**

`sampleState` must contain `company`, `managementSummary`, `healthCards`, `roadmap`, `recommendedActions`, `monthlyImpact`, `activities`, `integrationStatus`, `quickLinks`, `graph`, `signals`, `decisions`, `actions`, `valueItems`, `memories`, `agents`, `audit`.

- [ ] **Step 4: Implement pure builders in `portal/view-model.mjs`**

Builders must not access DOM, `window`, network or storage. They return display-ready immutable data structures.

- [ ] **Step 5: Add tests for Business Graph legacy nodes and Verified Value**

Require legacy nodes `Kennis`, `Processen`, `Mensen`, `Doelen & strategie`, `Systemen`, `Data`, `Acties`, plus the new additive nodes. Require only evidence-backed `Realised` items in verified total.

- [ ] **Step 6: Run focused tests**

Run: `node --test tests/portal-view-model.test.mjs tests/portal-core.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add portal/data.mjs portal/view-model.mjs tests/portal-view-model.test.mjs
git commit -m "refactor: add canonical portal view models"
```

---

### Task 4: Replace the dark prototype shell with the approved white enterprise design

**Files:**
- Create: `portal/render-shell.mjs`
- Modify: `portal/styles.css`
- Modify: `portal/app.mjs`
- Test: `tests/portal-ui.test.mjs`

**Interfaces:**
- Produces: `renderShell({nav,user,company,lastSync}): string`
- Produces DOM hooks: `#portal-main`, `#command-trigger`, `#ai-open`, `#notification-open`, `#profile-menu`, `.left-nav`, `.topbar`, `.mobile-nav`

- [ ] **Step 1: Update UI tests first**

Require the shell to include the approved left navigation groups, search field, `Vraag het Bedrijfsgeheugen AI`, notification/help/profile actions, white background, blue active navigation and responsive bottom navigation.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/portal-ui.test.mjs`
Expected: FAIL because current shell still matches the dark prototype.

- [ ] **Step 3: Implement `render-shell.mjs`**

Navigation must present the retained legacy concepts and the new domains without hiding administration. Keep `BEHEER` as a visual group.

- [ ] **Step 4: Rewrite `portal/styles.css` tokens**

Use CSS custom properties with at minimum:

```css
:root {
  --bg: #f8faff;
  --surface: #ffffff;
  --ink: #0b1741;
  --muted: #66718f;
  --blue: #1557ff;
  --blue-soft: #eef3ff;
  --border: #e7ebf4;
  --success: #1daa72;
  --warning: #ff9d2f;
  --danger: #ef4b4b;
  --radius: 16px;
}
```

Cards use subtle borders/elevation; no dark full-height sidebar background.

- [ ] **Step 5: Reduce `portal/app.mjs` shell responsibility to bootstrap/bind**

Import `renderShell()` and stop embedding large shell markup in `app.mjs`.

- [ ] **Step 6: Run UI tests and syntax check**

Run: `node --check portal/app.mjs && node --test tests/portal-ui.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add portal/render-shell.mjs portal/styles.css portal/app.mjs tests/portal-ui.test.mjs
git commit -m "feat: adopt approved enterprise portal design"
```

---

### Task 5: Rebuild Vandaag as the preserved legacy executive dashboard plus BOI additions

**Files:**
- Create: `portal/render-today.mjs`
- Modify: `portal/app.mjs`
- Modify: `portal/styles.css`
- Test: `tests/portal-legacy-baseline.test.mjs`
- Test: `tests/portal-view-model.test.mjs`

**Interfaces:**
- Consumes: `buildTodayViewModel(state)`
- Produces: `renderToday(vm): string`

- [ ] **Step 1: Add failing content-order test**

Assert the render contains, in order: welcome/period/export, AI Management Summary, five baseline health cards, Business Graph overview, monthly impact, recent activities, integration status; and right rail contains roadmap, recommended actions, quick links.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/portal-legacy-baseline.test.mjs`
Expected: FAIL because current `todayPage()` does not preserve the approved composition.

- [ ] **Step 3: Implement `render-today.mjs` with the screenshot composition**

Desktop grid: main content + right rail. Management Summary preserves `Kansen`, `Bedreigingen`, `Trends`, `Conclusie`. KPI row preserves the five approved legacy cards. Business Graph teaser keeps “Alles verbonden in één overzicht”.

- [ ] **Step 4: Add additive BOI information without replacing legacy blocks**

Use compact decision-needed/risk/opportunity/change badges inside or directly below the management summary. Do not remove roadmap/recommended actions.

- [ ] **Step 5: Update `portal/app.mjs` router to call `renderToday()`**

- [ ] **Step 6: Run focused tests**

Run: `node --check portal/render-today.mjs && node --test tests/portal-legacy-baseline.test.mjs tests/portal-view-model.test.mjs tests/portal-ui.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add portal/render-today.mjs portal/app.mjs portal/styles.css tests/portal-legacy-baseline.test.mjs tests/portal-view-model.test.mjs
git commit -m "feat: restore and upgrade executive portal overview"
```

---

### Task 6: Split remaining portal domains into focused renderers without capability loss

**Files:**
- Create: `portal/render-company.mjs`
- Create: `portal/render-intelligence.mjs`
- Create: `portal/render-decisions.mjs`
- Create: `portal/render-execution.mjs`
- Create: `portal/render-impact.mjs`
- Create: `portal/render-memory.mjs`
- Create: `portal/render-admin.mjs`
- Modify: `portal/app.mjs`
- Test: `tests/portal-legacy-baseline.test.mjs`

**Interfaces:**
- Each renderer exports `renderX(viewModel): string`.
- Router map in `app.mjs` resolves canonical route root to renderer.

- [ ] **Step 1: Add failing route/surface tests**

For every `LEGACY_CAPABILITIES.requiredSurface`, assert one canonical renderer contains a stable `data-surface="..."` marker.

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/portal-legacy-baseline.test.mjs`
Expected: FAIL for missing stable surfaces.

- [ ] **Step 3: Implement company/health renderer**

Preserve Bedrijfsgezondheid, Strategie & uitvoering, Processen & organisatie, Data & koppelingen. Add Business Graph drill-down, owners, dependencies and evidence.

- [ ] **Step 4: Implement intelligence + contextual AI renderer**

Preserve AI & Insights concept and add `Detect → Verify → Match → Score → Impact → Prioritise → Recommend` pipeline.

- [ ] **Step 5: Implement decisions + execution renderer**

Execution must preserve Acties, Roadmap and Koppelingen bouwen entry points. Enforce owner before Active and verified outcome before Done in displayed state.

- [ ] **Step 6: Implement impact + memory renderer**

Impact preserves Rapportages and monthly impact. Memory preserves Kennis and history/evidence.

- [ ] **Step 7: Implement admin renderer**

Preserve integrations, billing, organisation/users, settings, Frisse Blik. Add roles/permissions, AI Governance, Agents & automation, Audit.

- [ ] **Step 8: Replace monolithic render functions in `app.mjs` with imports**

- [ ] **Step 9: Run full portal tests**

Run: `node --check portal/app.mjs && node --test tests/portal-*.test.mjs`
Expected: PASS.

- [ ] **Step 10: Commit**

```bash
git add portal/render-*.mjs portal/app.mjs tests/portal-legacy-baseline.test.mjs
git commit -m "refactor: split portal domains into stable renderers"
```

---

### Task 7: Add permission, evidence and AI-governance contracts

**Files:**
- Create: `portal/permissions.mjs`
- Create: `portal/evidence.mjs`
- Create: `tests/portal-permissions.test.mjs`
- Modify: `portal/core.mjs`
- Modify: `portal/render-admin.mjs`

**Interfaces:**
- Produces: `canAccess(subject, object, action): boolean`
- Produces: `effectiveAiScope(subject, requestedObjects): string[]`
- Produces: `normaliseEvidence(input): EvidenceRecord`
- `EvidenceRecord = { id, sourceType, sourceLabel, verified, confidence, capturedAt, provenance }`

- [ ] **Step 1: Write failing permission tests**

```js
import { canAccess, effectiveAiScope } from '../portal/permissions.mjs';

test('AI never expands a user scope', () => {
  const subject = {tenant:'t1',entity:'nl',roles:['finance'],objectAllow:['kpi:margin']};
  assert.deepEqual(effectiveAiScope(subject,['kpi:margin','person:salary']), ['kpi:margin']);
});
```

- [ ] **Step 2: Run and confirm RED**

Run: `node --test tests/portal-permissions.test.mjs`
Expected: module-not-found failure.

- [ ] **Step 3: Implement deterministic permission evaluation**

Deny by default. Tenant mismatch always denies. Explicit object/action deny overrides allow. AI uses intersection only.

- [ ] **Step 4: Implement evidence normalization**

Regulatory evidence distinguishes official source from AI interpretation using `sourceType`.

- [ ] **Step 5: Surface governance state in admin renderer**

Show AI inventory/model-provider/purpose/risk/human oversight/evaluation/incidents/version/audit as first-class sections.

- [ ] **Step 6: Run tests**

Run: `node --test tests/portal-permissions.test.mjs tests/portal-core.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add portal/permissions.mjs portal/evidence.mjs portal/core.mjs portal/render-admin.mjs tests/portal-permissions.test.mjs
git commit -m "feat: add portal permissions and AI governance contracts"
```

---

### Task 8: Replace presentation-only data access with cached/delta-aware adapter

**Files:**
- Create: `portal/data-adapter.mjs`
- Create: `tests/portal-data-adapter.test.mjs`
- Modify: `portal/app.mjs`
- Modify: `portal/data.mjs`

**Interfaces:**
- Produces: `createPortalDataAdapter({fetchState, now, storage})`
- Adapter API: `loadInitial(): Promise<{state,source:'cache'|'remote'|'sample'}>`
- Adapter API: `refreshDelta(since:string|null): Promise<{state,changed:string[]}>`
- Adapter API: `subscribe(listener): () => void`

- [ ] **Step 1: Write failing cache-first test**

Use an in-memory storage double. Assert valid cached state returns before remote refresh and does not block initial rendering.

- [ ] **Step 2: Write failing stale-cache/delta test**

Assert stale cache is shown with `stale:true`, remote delta updates only changed object IDs, and unchanged view-model references are not rebuilt unnecessarily.

- [ ] **Step 3: Run and confirm RED**

Run: `node --test tests/portal-data-adapter.test.mjs`
Expected: module-not-found failure.

- [ ] **Step 4: Implement adapter with no hard dependency on a specific backend endpoint**

`fetchState` is injected. Sample state is a development fallback only and must remain visibly labelled when used.

- [ ] **Step 5: Wire `app.mjs` bootstrap to `loadInitial()` then non-blocking `refreshDelta()`**

Remove direct renderer imports from raw sample arrays.

- [ ] **Step 6: Run tests and syntax checks**

Run: `node --check portal/data-adapter.mjs && node --test tests/portal-data-adapter.test.mjs tests/portal-view-model.test.mjs tests/portal-ui.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add portal/data-adapter.mjs portal/data.mjs portal/app.mjs tests/portal-data-adapter.test.mjs
git commit -m "feat: add cache-first delta portal data adapter"
```

---

### Task 9: Production contracts, responsive verification and release gate

**Files:**
- Create: `tests/portal-production-contract.test.mjs`
- Modify: `_redirects` only if a legacy route requires an HTTP alias not handled client-side.
- Modify: `_headers` only if portal module/security headers need an additive rule.
- Modify: `docs/development-ledger.md`

**Interfaces:**
- Production entry: `/portal/`
- Required static assets: `/portal/app.mjs`, `/portal/styles.css` and imported ES modules.

- [ ] **Step 1: Write failing production contract tests**

Assert `portal/index.html` loads `app.mjs`; all static module imports resolve to repository files; legacy route aliases resolve via application routing or explicit `_redirects`; no route points to a missing portal artifact.

- [ ] **Step 2: Run and confirm any contract failures**

Run: `node --test tests/portal-production-contract.test.mjs`
Expected: RED only for genuine missing release contracts; if already green, record that evidence and do not create unnecessary redirect/header changes.

- [ ] **Step 3: Run complete local portal gate**

Run:

```bash
node --check portal/app.mjs
node --test tests/portal-*.test.mjs
```

Expected: all PASS.

- [ ] **Step 4: Create preview candidate and verify exact commit**

Use the repository's established branch/PR path. Netlify deploy-preview must be `ready`, secret scan clear and exact commit SHA equal to PR head.

- [ ] **Step 5: Perform browser-level smoke verification on preview**

Verify desktop: approved white dashboard, sidebar, topbar, AI Management Summary, five baseline cards, graph, right rail, all primary routes. Verify mobile: no horizontal breakage, bottom navigation, AI access, management cards readable. Verify legacy route aliases.

- [ ] **Step 6: Promote only after green preview**

Merge using expected head SHA. Do not force. If `main` moved, sync/retest before merge.

- [ ] **Step 7: Verify production exact commit and smoke checks**

Production deploy must be `ready` and reference the merge commit containing the portal change. Re-run HTTP/browser smoke checks on `/portal/`.

- [ ] **Step 8: On regression, rollback to last-known-good and continue repair**

Apply `AGENTS.md`: production stays green; failed candidate is not presented as done.

- [ ] **Step 9: Record the material outcome**

Append to `docs/development-ledger.md`: baseline, changes, test evidence, preview deploy, production deploy, legacy capability verification, any repair/rollback, and prevention rules.

- [ ] **Step 10: Commit ledger evidence if needed after deployment**

```bash
git add docs/development-ledger.md
git commit -m "docs: record portal integration production verification"
```

---

## Self-Review

### Spec coverage
- Visual baseline: Tasks 1, 4, 5.
- Legacy functionality preservation: Tasks 1, 2, 5, 6, 9.
- Business Graph: Tasks 3, 5, 6.
- Intelligence: Task 6.
- Decisions and execution: Task 6.
- Verified Value: Tasks 3, 6.
- Memory/evidence: Tasks 6, 7.
- Agents/governance/EU AI Act: Tasks 6, 7.
- Access control: Task 7.
- Data migration/cache/delta updates: Task 8.
- Compatibility/routes: Tasks 2, 9.
- Responsive/performance/release verification: Tasks 4, 8, 9.
- Existing self-healing/outcome obligations: Task 9 and Global Constraints.

### Placeholder scan
No `TBD`, `TODO`, “implement later”, implicit error-handling instructions or undefined neighboring interfaces remain.

### Type/interface consistency
`LEGACY_CAPABILITIES` is introduced in Task 1 and consumed by Task 2 and Task 6. Pure view-model builders are introduced in Task 3 and consumed by Task 5 onward. Permission/evidence APIs are self-contained in Task 7. The data adapter introduced in Task 8 wraps state delivery without changing renderer signatures.
