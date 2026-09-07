# UI Visual Regression Guard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fail-closed, browser-backed visual regression release gate that prevents protected Bedrijfsgeheugen pages from shipping material overlap, hidden primary content, horizontal overflow, broken interactive states, or CLS above the agreed threshold.

**Architecture:** A registry-driven static contract validates coverage and dangerous layout patterns before browser work starts. A Playwright Chromium collector then measures real DOM geometry, visibility, overflow and CLS across four viewports and deterministic interaction states, emitting JSON and screenshots as evidence. The same collector runs first against PR preview/canonical built output and again against the exact production SHA after Netlify promotion.

**Tech Stack:** Node.js 24, native `node:test`, Playwright Chromium, existing canonical build tooling, GitHub Actions, Netlify production readback, existing BRAIN-DELIVERY-v2 website lane.

**Spec:** `docs/superpowers/specs/2026-09-07-ui-visual-regression-guard-design.md`

## Global Constraints

- Primary pass/fail oracle is browser geometry/semantics, not pixel-perfect screenshot equality.
- Protected viewports are exactly `390x844`, `768x1024`, `1024x768`, and `1440x900` unless a registry entry explicitly narrows them for a justified route-specific reason.
- Protected copy/visual intersection allowance defaults to `0` CSS px².
- Required copy/CTA visible ratio must be `>= 0.98`.
- Global CLS release threshold defaults to `<= 0.10`.
- Horizontal document overflow greater than `1` CSS pixel fails.
- Missing protected selectors, failed interactions, browser collector crashes, route load failures, hidden required content, material overlap and excessive CLS all fail closed.
- Intentional overlap exemptions must be selector-pair-specific and include reason, owner, maximum intersection and review/expiry date; blanket page exemptions are prohibited.
- Initial protected routes are `/`, `/prijzen`, and `/due-diligence`; broader money-page coverage is added only after the v1 gate is proven stable.
- Production readback must test `https://www.bedrijfsgeheugen.nl` after exact-SHA deployment and must not report release health when the visual gate is red.
- Website-impacting HTML/CSS/JS/generator/shell/layout-asset changes activate the gate; documentation-only changes must not launch browsers.
- TDD: each task begins with a failing test or failing synthetic fixture and ends with a focused commit.

---

## File structure locked by this plan

- `config/ui-visual-regression.json` — route/viewports/anchors/interactions/exemptions contract.
- `tools/ui-visual-regression/contract.mjs` — registry loading, schema validation, static dangerous-pattern checks, coverage checks.
- `tools/ui-visual-regression/geometry.mjs` — pure rectangle/visibility/intersection/overflow evaluation helpers.
- `tools/ui-visual-regression/browser-check.mjs` — Playwright runner, route loading, readiness, CLS observer, interaction execution, DOM measurement.
- `tools/ui-visual-regression/report.mjs` — deterministic JSON evidence serialization and failure summary.
- `tests/ui-visual-regression-contract.test.mjs` — registry/static-contract TDD tests.
- `tests/ui-visual-regression-geometry.test.mjs` — pure geometry threshold tests.
- `tests/ui-visual-regression-browser.test.mjs` — synthetic browser fixtures reproducing overlap, mobile-only breakage, late CLS and interaction failure.
- `tests/fixtures/ui-visual-regression/*.html` — synthetic deterministic failing/passing pages.
- `.github/workflows/ui-visual-regression.yml` — PR preview/build visual gate and artifact upload.
- `.github/workflows/canonical-brand-shell-live-readback.yml` — production exact-SHA visual readback integration.
- `package.json` — Playwright dependency and focused scripts.
- `config/brain-delivery-system.json` — classify visual-regression files/workflow under the website conflict/release contract.

---

### Task 1: Registry contract and fail-closed coverage

**Files:**
- Create: `config/ui-visual-regression.json`
- Create: `tools/ui-visual-regression/contract.mjs`
- Create: `tests/ui-visual-regression-contract.test.mjs`

**Interfaces:**
- Consumes: filesystem JSON and built HTML strings.
- Produces: `loadVisualRegressionRegistry(path) -> Registry`, `validateVisualRegressionRegistry(registry) -> string[]`, `validateProtectedPageCoverage(registry, routes) -> string[]`, `scanDangerousLayoutPatterns(html, pageContract) -> Violation[]`.

- [ ] **Step 1: Write failing registry validation tests**

Create `tests/ui-visual-regression-contract.test.mjs` with concrete cases for duplicate routes, missing required anchors, invalid viewport dimensions, blanket exemptions and missing expiry dates. Include a positive fixture containing exactly `/`, `/prijzen`, and `/due-diligence`.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateVisualRegressionRegistry,
  validateProtectedPageCoverage,
} from '../tools/ui-visual-regression/contract.mjs';

const valid = {
  version: 'UI-VISUAL-REGRESSION-v1',
  defaults: {
    clsMax: 0.10,
    visibleRatioMin: 0.98,
    horizontalOverflowMaxPx: 1,
    overlapMaxAreaPx2: 0,
    viewports: [
      { name: 'phone', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'small-desktop', width: 1024, height: 768 },
      { name: 'desktop', width: 1440, height: 900 }
    ]
  },
  pages: [
    { route: '/', required: ['main h1'], protectedPairs: [] },
    { route: '/prijzen', required: ['main h1'], protectedPairs: [] },
    { route: '/due-diligence', required: ['main h1'], protectedPairs: [] }
  ]
};

test('v1 registry accepts required critical routes', () => {
  assert.deepEqual(validateVisualRegressionRegistry(valid), []);
  assert.deepEqual(validateProtectedPageCoverage(valid, ['/', '/prijzen', '/due-diligence']), []);
});

test('blanket page exemption fails closed', () => {
  const broken = structuredClone(valid);
  broken.pages[0].exempt = true;
  assert.ok(validateVisualRegressionRegistry(broken).some(x => x.includes('blanket')));
});
```

- [ ] **Step 2: Run the test and confirm RED**

Run:

```bash
node --test tests/ui-visual-regression-contract.test.mjs
```

Expected: FAIL because `tools/ui-visual-regression/contract.mjs` does not exist.

- [ ] **Step 3: Implement the registry validator**

Implement strict object checks in `contract.mjs`; reject unknown/invalid structural values, duplicate routes, empty `required` selectors, unsupported interaction types, and exemptions without `selectorA`, `selectorB`, `reason`, `owner`, `maxIntersectionAreaPx2`, and ISO `reviewAfter`.

- [ ] **Step 4: Add the initial real registry**

Create `config/ui-visual-regression.json` with the four default viewports and route entries for `/`, `/prijzen`, and `/due-diligence`. Use stable selectors/data attributes where already available; when a stable data attribute does not yet exist, use the narrowest semantic selector and schedule its replacement in Task 4 rather than weakening fail-closed behavior.

- [ ] **Step 5: Add static dangerous-pattern tests**

Test that `scanDangerousLayoutPatterns()` rejects a protected visual using unbounded `position:absolute` plus transform translation over a copy container, while a two-column grid/flex fixture passes. The scanner is intentionally heuristic and only blocks patterns already known to be dangerous; browser geometry remains authoritative.

- [ ] **Step 6: Run the focused tests GREEN**

```bash
node --test tests/ui-visual-regression-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add config/ui-visual-regression.json tools/ui-visual-regression/contract.mjs tests/ui-visual-regression-contract.test.mjs
git commit -m "feat: add visual regression registry contract"
```

---

### Task 2: Pure geometry and visibility evaluator

**Files:**
- Create: `tools/ui-visual-regression/geometry.mjs`
- Create: `tests/ui-visual-regression-geometry.test.mjs`

**Interfaces:**
- Consumes: normalized rectangle/viewport/style measurements.
- Produces: `intersectionArea(a,b) -> number`, `visibleRatio(rect, viewport) -> number`, `evaluateGeometry(sample, thresholds) -> Violation[]`, `evaluateHorizontalOverflow({scrollWidth, clientWidth}, maxPx) -> Violation[]`.

- [ ] **Step 1: Write failing threshold tests**

Cover: zero intersection passes; one-pixel material area fails when allowance is zero; 97% visible fails; 98% passes; horizontal overflow of 1px passes and 2px fails; hidden/opacity-zero/display-none required elements fail regardless of rectangle.

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { intersectionArea, evaluateGeometry } from '../tools/ui-visual-regression/geometry.mjs';

test('protected rectangles may not intersect by default', () => {
  const a = { x: 0, y: 0, width: 100, height: 100 };
  const b = { x: 99, y: 0, width: 100, height: 100 };
  assert.equal(intersectionArea(a, b), 100);
  assert.ok(evaluateGeometry({ required: [], pairs: [{ a, b, allowance: 0 }] }, { visibleRatioMin: .98 }).length > 0);
});
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/ui-visual-regression-geometry.test.mjs
```

Expected: module-not-found failure.

- [ ] **Step 3: Implement minimal pure functions**

Keep this module browser-independent. Normalize negative widths/heights to zero, compute viewport clipping deterministically, and return violation objects with stable `ruleId`, `selector`, `selectorPair`, `actual`, and `limit` fields.

- [ ] **Step 4: Run GREEN**

```bash
node --test tests/ui-visual-regression-geometry.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/ui-visual-regression/geometry.mjs tests/ui-visual-regression-geometry.test.mjs
git commit -m "feat: add visual geometry evaluator"
```

---

### Task 3: Playwright browser collector with CLS and interaction states

**Files:**
- Modify: `package.json`
- Create: `tools/ui-visual-regression/browser-check.mjs`
- Create: `tools/ui-visual-regression/report.mjs`
- Create: `tests/ui-visual-regression-browser.test.mjs`
- Create: `tests/fixtures/ui-visual-regression/overlap.html`
- Create: `tests/fixtures/ui-visual-regression/pass-grid.html`
- Create: `tests/fixtures/ui-visual-regression/mobile-overlap.html`
- Create: `tests/fixtures/ui-visual-regression/late-cls.html`
- Create: `tests/fixtures/ui-visual-regression/interaction-cover.html`

**Interfaces:**
- Consumes: registry from Task 1, thresholds from registry, geometry helpers from Task 2, `baseUrl` and `outputDir` CLI/env inputs.
- Produces: `runVisualRegression({baseUrl, registryPath, outputDir, routeFilter}) -> Promise<RunReport>` and CLI exit code `1` whenever any protected measurement fails.

- [ ] **Step 1: Add Playwright dependency and scripts**

Update `package.json` to include:

```json
{
  "scripts": {
    "test:ui-visual": "node --test tests/ui-visual-regression-contract.test.mjs tests/ui-visual-regression-geometry.test.mjs tests/ui-visual-regression-browser.test.mjs",
    "check:ui-visual": "node tools/ui-visual-regression/browser-check.mjs"
  },
  "devDependencies": {
    "playwright": "^1.55.0"
  }
}
```

Retain existing dependencies unchanged.

- [ ] **Step 2: Write the five synthetic browser fixtures and failing tests**

Tests must prove:

1. `overlap.html`: visual absolutely covers heading -> fail `overlap`.
2. `pass-grid.html`: same content in separate grid columns -> pass.
3. `mobile-overlap.html`: desktop clean, `390x844` broken -> phone state fails.
4. `late-cls.html`: delayed insertion generates CLS > 0.10 -> fail `cls`.
5. `interaction-cover.html`: initial state clean, deterministic toggle/drag state covers required text -> fail after interaction.

Use a local Node HTTP server created inside the test process so the browser uses real navigation rather than `page.setContent()` for CLS cases.

- [ ] **Step 3: Run browser tests RED**

```bash
npm install
npx playwright install --with-deps chromium
node --test tests/ui-visual-regression-browser.test.mjs
```

Expected: FAIL because browser collector/report modules are missing.

- [ ] **Step 4: Implement browser readiness and CLS observation**

In `browser-check.mjs`, before navigation install a `PerformanceObserver` for `layout-shift` entries that excludes `hadRecentInput`. After navigation wait for `document.fonts.ready`, `networkidle` where possible, and a deterministic 750ms stability window. Record total CLS plus individual shift values/sources where the browser exposes them.

- [ ] **Step 5: Implement DOM measurement and interaction execution**

For each route/viewport/state, collect `getBoundingClientRect()`, `display`, `visibility`, `opacity`, document `scrollWidth/clientWidth`, and element clipping. Supported v1 interactions are exactly:

```js
{ type: 'click', selector: '[data-ui-action="..."]' }
{ type: 'drag-x-percent', selector: '[data-ui-action="..."]', percent: 25 }
{ type: 'drag-x-percent', selector: '[data-ui-action="..."]', percent: 50 }
{ type: 'drag-x-percent', selector: '[data-ui-action="..."]', percent: 75 }
```

Any missing selector or failed action throws a contract violation rather than skipping the state.

- [ ] **Step 6: Implement evidence reporting**

`report.mjs` writes `${outputDir}/ui-visual-regression.json` with commit/deploy identity, base URL, route, viewport, state, CLS, rectangles, visible ratios, overflow, violations and timestamp. On failure call `page.screenshot({ fullPage: true, path })` once per failing route/viewport/state.

- [ ] **Step 7: Run browser tests GREEN**

```bash
npm run test:ui-visual
```

Expected: all contract, geometry and browser synthetic tests PASS.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json tools/ui-visual-regression tests/ui-visual-regression-*.test.mjs tests/fixtures/ui-visual-regression
git commit -m "feat: add browser visual regression collector"
```

---

### Task 4: Bind real homepage/prijzen/due-diligence anchors and reproduce the 2026-09-07 incident

**Files:**
- Modify: `index.html` or the canonical generator responsible for the relevant homepage section, preferring generator/source over generated output.
- Modify: source/generator for `/prijzen` only when stable visual-regression data attributes are absent.
- Modify: source/generator for `/due-diligence` only when stable visual-regression data attributes are absent.
- Modify: `config/ui-visual-regression.json`
- Create: `tests/ui-visual-regression-real-pages.test.mjs`

**Interfaces:**
- Consumes: browser runner from Task 3.
- Produces: stable `data-ui-vr-*` anchors in final built output and a regression fixture that maps the exact homepage failure class to a protected pair.

- [ ] **Step 1: Add a failing real-page contract test**

The test builds/loads the canonical homepage and asserts the final HTML contains stable anchors for the automation section copy branch and visual branch, for example:

```js
assert.match(html, /data-ui-vr-section="homepage-automation"/);
assert.match(html, /data-ui-vr-copy="homepage-automation"/);
assert.match(html, /data-ui-vr-visual="homepage-automation"/);
```

Do the equivalent minimal required-anchor checks for `/prijzen` and `/due-diligence`.

- [ ] **Step 2: Run RED**

```bash
node --test tests/ui-visual-regression-real-pages.test.mjs
```

Expected: FAIL until stable anchors exist in the final built output.

- [ ] **Step 3: Add stable anchors at the source/generator boundary**

Do not use visible Dutch copy as the long-term selector. Preserve the current fixed two-column homepage layout while adding stable `data-ui-vr-*` attributes. Ensure the build pipeline does not strip them.

- [ ] **Step 4: Register the exact protected pairs and required elements**

Update the registry so the homepage automation copy/visual pair has `maxIntersectionAreaPx2: 0`; required heading/body/CTA selectors have `visibleRatioMin: 0.98`; `/due-diligence` uses the default CLS 0.10 cap and includes its primary hero/CTA anchors.

- [ ] **Step 5: Add explicit incident regression**

Create a test fixture using the old broken absolute/translated visual pattern from the 2026-09-07 incident and assert the browser runner reports the homepage automation pair as overlapping. Then run the current canonical page and assert it passes the same contract.

- [ ] **Step 6: Run GREEN**

```bash
node --test tests/ui-visual-regression-real-pages.test.mjs
npm run test:ui-visual
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add index.html config/ui-visual-regression.json tests/ui-visual-regression-real-pages.test.mjs tools tests pages assets
git commit -m "test: lock visual contracts to critical pages"
```

Only stage source/generator files actually changed; do not stage unrelated generated noise.

---

### Task 5: PR release gate and diagnostic artifacts

**Files:**
- Create: `.github/workflows/ui-visual-regression.yml`
- Modify: `config/brain-delivery-system.json`
- Create: `tests/ui-visual-regression-delivery.test.mjs`

**Interfaces:**
- Consumes: canonical build commands and `npm run check:ui-visual`.
- Produces: GitHub check named exactly `UI visual regression`, uploaded `ui-visual-regression-evidence` artifact, website-lane activation for all guard files.

- [ ] **Step 1: Write failing delivery classification test**

Assert `config/brain-delivery-system.json` classifies all of these under the website lane/conflict contract:

```text
config/ui-visual-regression.json
tools/ui-visual-regression/
tests/ui-visual-regression-
.github/workflows/ui-visual-regression.yml
```

Also assert docs-only changes remain non-browser work.

- [ ] **Step 2: Run RED**

```bash
node --test tests/ui-visual-regression-delivery.test.mjs
```

Expected: FAIL because the paths/workflow are not registered.

- [ ] **Step 3: Add website-lane and conflict-contract paths**

Modify the existing `website-shell-contract` or add a narrowly named `ui-visual-regression` conflict contract without changing unrelated delivery semantics. The website lane must include the registry/tool/tests/workflow so BRAIN delivery cannot classify them as unowned.

- [ ] **Step 4: Add PR workflow**

Create `.github/workflows/ui-visual-regression.yml` with `pull_request` on `main`, path filters for layout-impacting website files, Node 24, `npm ci`, Chromium installation, canonical build, and browser check. Use the deploy-preview URL when Netlify preview metadata is available; otherwise start a deterministic local HTTP server over canonical built output and run the same collector so the check never silently skips.

Required terminal steps:

```yaml
- name: Run UI visual regression
  env:
    UI_VR_BASE_URL: ${{ env.UI_VR_BASE_URL }}
    UI_VR_OUTPUT_DIR: .artifacts/ui-visual-regression
  run: npm run check:ui-visual

- name: Upload visual regression evidence
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: ui-visual-regression-evidence
    path: .artifacts/ui-visual-regression
    if-no-files-found: error
```

- [ ] **Step 5: Run delivery tests GREEN**

```bash
node --test tests/ui-visual-regression-delivery.test.mjs
npm run test:ui-visual
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add .github/workflows/ui-visual-regression.yml config/brain-delivery-system.json tests/ui-visual-regression-delivery.test.mjs
git commit -m "ci: gate releases on visual regression"
```

---

### Task 6: Exact-production visual readback

**Files:**
- Modify: `.github/workflows/canonical-brand-shell-live-readback.yml`
- Create: `tests/ui-visual-regression-production-readback.test.mjs`

**Interfaces:**
- Consumes: exact-SHA production wait already present in `canonical-brand-shell-live-readback.yml`, browser collector from Task 3.
- Produces: production readback that cannot report green until the exact production SHA also passes visual regression.

- [ ] **Step 1: Write a failing workflow contract test**

Read `.github/workflows/canonical-brand-shell-live-readback.yml` as text and assert the production job installs Chromium and executes the visual collector after exact production identity is established:

```js
assert.match(workflow, /playwright install.*chromium/s);
assert.match(workflow, /check:ui-visual/);
assert.match(workflow, /https:\/\/www\.bedrijfsgeheugen\.nl/);
assert.match(workflow, /EXPECTED_COMMIT/);
```

- [ ] **Step 2: Run RED**

```bash
node --test tests/ui-visual-regression-production-readback.test.mjs
```

Expected: FAIL because production browser readback is not wired yet.

- [ ] **Step 3: Extend the existing production-readback job**

Keep the current exact-Netlify-commit polling. Once the current shell/SEO/growth checks establish that production corresponds to `${{ github.sha }}`, install Chromium and run:

```bash
UI_VR_BASE_URL=https://www.bedrijfsgeheugen.nl \
UI_VR_OUTPUT_DIR=.artifacts/ui-visual-regression-production \
UI_VR_EXPECTED_COMMIT="$EXPECTED_COMMIT" \
npm run check:ui-visual
```

Upload evidence with `if: always()`. A collector failure must fail the job; do not wrap it in `|| true`.

- [ ] **Step 4: Run workflow contract GREEN**

```bash
node --test tests/ui-visual-regression-production-readback.test.mjs
npm run test:ui-visual
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/canonical-brand-shell-live-readback.yml tests/ui-visual-regression-production-readback.test.mjs
git commit -m "ci: verify visual geometry in production readback"
```

---

### Task 7: Required-check enforcement, failure evidence, and full verification

**Files:**
- Modify: repository required-check configuration only through the existing supported governance mechanism if the repo already manages required checks as code; otherwise leave branch protection unchanged and document the manual/administrative limitation in the PR.
- Modify: existing release-evidence tooling only if needed to include the new check result; do not broaden unrelated release semantics.
- Create: `tests/ui-visual-regression-release-contract.test.mjs`

**Interfaces:**
- Consumes: workflow/check from Tasks 5–6.
- Produces: release evidence showing visual gate state and a final verification command set.

- [ ] **Step 1: Write release-contract test**

Assert that a website-impacting candidate cannot be considered fully healthy in release evidence when `UI visual regression` is red/missing, and that production readback evidence includes route, viewport, state and failure rule when red.

- [ ] **Step 2: Run RED**

```bash
node --test tests/ui-visual-regression-release-contract.test.mjs
```

Expected: FAIL until release evidence recognizes the new gate.

- [ ] **Step 3: Wire visual gate into existing release evidence**

Use the repository's current release-evidence/check aggregation path. Do not create a second independent notion of production health. The resulting evidence must distinguish `preview_visual_green` and `production_visual_green` and only set overall website health green when both required phases that apply to the event are green.

- [ ] **Step 4: Run all focused and existing website release tests**

```bash
npm run test:ui-visual
node --test tests/ui-visual-regression-real-pages.test.mjs
node --test tests/ui-visual-regression-delivery.test.mjs
node --test tests/ui-visual-regression-production-readback.test.mjs
node --test tests/ui-visual-regression-release-contract.test.mjs
node tools/site-shell/diagnose-shell-gate.mjs
BG_PRICING_STAGE=verify node tools/prijzen-uit-de-homepage.mjs
```

Expected: all commands exit `0`.

- [ ] **Step 5: Run the real browser guard against canonical built output**

Start the same static server used by CI, then:

```bash
UI_VR_BASE_URL=http://127.0.0.1:4173 UI_VR_OUTPUT_DIR=.artifacts/ui-visual-regression npm run check:ui-visual
```

Expected: `/`, `/prijzen`, and `/due-diligence` pass all four viewports; no protected overlap, no required visible ratio below `0.98`, CLS `<= 0.10`, horizontal overflow `<= 1px`.

- [ ] **Step 6: Verify RED behavior before merge**

Temporarily run the synthetic broken fixture suite and confirm the process exits non-zero for overlap, mobile-only overlap, late CLS, missing selector and interaction-cover cases. Revert any deliberate break before commit.

- [ ] **Step 7: Commit**

```bash
git add tests/ui-visual-regression-release-contract.test.mjs tools .github config
 git commit -m "feat: enforce visual health in website release evidence"
```

- [ ] **Step 8: Open PR and require evidence before production claim**

PR description must list the exact tested SHA and include:

```text
UI visual regression: green
Routes: /, /prijzen, /due-diligence
Viewports: 390x844, 768x1024, 1024x768, 1440x900
CLS max: 0.10
Visible ratio min: 0.98
Horizontal overflow max: 1px
Overlap default: 0px²
```

Do not merge while any required check is expected/pending/red. After merge, verify the production Netlify deploy is the exact merged SHA and the production visual readback is green before saying the guard is live.

---

## Self-review result

- **Spec coverage:** static contract, browser geometry, CLS, four viewports, interaction states, evidence JSON/screenshots, preview gate, exact-production readback, fail-closed selectors, exemptions, initial critical routes and delivery classification are all mapped to explicit tasks.
- **Placeholder scan:** no `TBD`, `TODO`, “implement later”, or unspecified generic error-handling steps remain.
- **Interface consistency:** registry -> geometry -> browser runner -> workflow -> production readback uses the same thresholds and violation/report model throughout.
- **Scope:** v1 intentionally stops at `/`, `/prijzen`, and `/due-diligence`; all-money-page auto-discovery remains Phase 2/3 from the approved design and is not required to prove the first release gate.
