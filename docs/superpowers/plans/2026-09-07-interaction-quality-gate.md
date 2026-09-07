# Interaction Quality Gate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a central, fail-closed Interaction Quality Gate that prevents broken clicks/toggles, unreachable states, hidden content, overlap regressions, responsive leaks, accessibility/motion regressions, build-wiring loss, and preview/production drift from being released.

**Architecture:** Add a declarative interaction contract registry, a Node static validator against the final build pipeline, a reusable Playwright runner for preview/production browser checks, and a dedicated GitHub Actions workflow. The existing homepage Platform/Expertise toggle and four-state scroll story become the first canonical contracts. The same browser spec runs against deploy preview and production by switching only the base URL.

**Tech Stack:** Node.js 22, native `node:test`, Playwright 1.55.0, GitHub Actions, Netlify deploy previews, existing V18 build pipeline.

**Spec:** `docs/superpowers/specs/2026-09-07-interaction-quality-gate-design.md`

## Global Constraints

- Fail closed: a missing component, state, hook, or executable check is a failure, never a silent skip.
- Browser checks run against the final built/deployed output, not only source files.
- Preview and production use the same contract registry and browser assertions.
- Desktop and mobile are checked independently.
- Keyboard and `prefers-reduced-motion` are checked where the interaction contract requires them.
- No arbitrary long sleeps for interaction assertions; wait on explicit DOM state or stable geometry.
- Failures report contract id, route, viewport, expected/found state, failure class, and useful geometry/state evidence.
- Existing protected `main` status `test` must not be weakened. A new required interaction check is only claimed as protected after branch-protection verification succeeds.
- Automatic rollback is outside v1 scope.

---

### Task 1: Interaction Contract Registry + Static Schema Validation

**Files:**
- Create: `quality/interaction-contracts.mjs`
- Create: `quality/validate-interaction-contracts.mjs`
- Create: `tests/interaction-contract-registry.test.mjs`

**Interfaces:**
- Produces: `interactionContracts` array from `quality/interaction-contracts.mjs`.
- Produces: `validateInteractionContracts(contracts, options?) -> { ok: boolean, errors: Array<object> }`.
- Contract shape used by later tasks:

```js
{
  id: 'homepage-scroll-story',
  route: '/',
  root: '[data-bg-story-root]',
  viewports: ['desktop', 'mobile'],
  states: ['0', '1', '2', '3'],
  triggers: ['scroll', 'click'],
  requires: {
    keyboard: true,
    reducedMotion: true,
    overlapGuard: true
  },
  hooks: {
    state: 'data-bg-story-state',
    step: 'data-bg-story-step',
    overlay: 'data-bg-story-overlay'
  }
}
```

- [ ] **Step 1: Write the failing registry tests**

Create `tests/interaction-contract-registry.test.mjs` with tests that import the registry/validator and assert:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { interactionContracts } from '../quality/interaction-contracts.mjs';
import { validateInteractionContracts } from '../quality/validate-interaction-contracts.mjs';

test('critical homepage interactions are registered', () => {
  const ids = interactionContracts.map(c => c.id);
  assert.ok(ids.includes('homepage-scroll-story'));
  assert.ok(ids.includes('homepage-platform-expertise-toggle'));
});

test('registry fails closed on incomplete contracts', () => {
  const result = validateInteractionContracts([{ id: 'broken', route: '/' }]);
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(e => e.code === 'contract-incomplete'));
});

test('real interaction registry is valid', () => {
  const result = validateInteractionContracts(interactionContracts);
  assert.deepEqual(result.errors, []);
  assert.equal(result.ok, true);
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
node --test tests/interaction-contract-registry.test.mjs
```

Expected: FAIL because `quality/interaction-contracts.mjs` and validator do not yet exist.

- [ ] **Step 3: Implement minimal registry and validator**

Register both homepage interactions. The Platform/Expertise contract must require desktop/mobile, click + keyboard, visible selected state, and no hidden selected panel. The scroll-story contract must require all four states, scroll + click, reduced-motion, overlap guard, and the three stable `data-bg-story-*` hooks.

`validateInteractionContracts` must reject duplicate ids, missing route/root/viewports/states/triggers/hooks, unsupported viewport values, zero states, and contracts with no trigger.

Return structured errors:

```js
{ code: 'contract-incomplete', id: 'broken', field: 'root', message: '...' }
```

- [ ] **Step 4: Run the registry tests and verify GREEN**

```bash
node --test tests/interaction-contract-registry.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add quality/interaction-contracts.mjs quality/validate-interaction-contracts.mjs tests/interaction-contract-registry.test.mjs
git commit -m "test: add interaction contract registry"
```

---

### Task 2: Final-Build Static Wiring Gate

**Files:**
- Create: `quality/check-final-interaction-wiring.mjs`
- Create: `tests/interaction-final-build-wiring.test.mjs`
- Read/verify: `tools/prijzen-uit-de-homepage.mjs`
- Read/verify: `tools/bouw-v18-homepage-scroll-story.mjs`
- Read/verify: `tools/bouw-v18-homepage-platform-expertise-toggle.mjs`
- Read/verify: `netlify.toml`

**Interfaces:**
- Consumes: `interactionContracts`.
- Produces: `checkFinalInteractionWiring({ rootDir }) -> { ok, errors }`.

- [ ] **Step 1: Write failing static-gate tests**

Create fixtures in-memory or temporary files and assert the checker classifies at least:

```js
assert.equal(result.errors[0].code, 'build-wiring-loss');
```

Also test the real repository: `netlify.toml` must execute `tools/prijzen-uit-de-homepage.mjs`; that pipeline must import both homepage interaction builders; the scroll story source must include canonical state setter and stable hooks; toggle source must expose ARIA selected/controls and keyboard wiring.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/interaction-final-build-wiring.test.mjs
```

Expected: FAIL because the checker does not exist.

- [ ] **Step 3: Implement the checker**

The checker reads the effective Netlify command, the final pricing/page-policy pipeline, and registered component source files. It must produce exact diagnostics with `contractId`, `code`, `path`, and missing marker.

Example failure:

```js
{
  contractId: 'homepage-scroll-story',
  code: 'build-wiring-loss',
  path: 'tools/prijzen-uit-de-homepage.mjs',
  expected: 'bouw-v18-homepage-scroll-story.mjs'
}
```

- [ ] **Step 4: Run static tests and existing homepage regression tests**

```bash
node --test \
  tests/interaction-final-build-wiring.test.mjs \
  tests/seo-homepage-scroll-story-interaction.test.mjs \
  tests/seo-homepage-platform-expertise-toggle.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add quality/check-final-interaction-wiring.mjs tests/interaction-final-build-wiring.test.mjs
git commit -m "test: enforce final interaction wiring"
```

---

### Task 3: Reusable Browser Interaction Gate

**Files:**
- Create: `tests/integration/interaction-quality-gate.spec.js`
- Create: `quality/browser/interaction-assertions.js`
- Create: `quality/browser/failure-report.js`

**Interfaces:**
- Consumes: `BASE_URL` environment variable and `interactionContracts`.
- Produces Playwright failures categorized as `interaction-no-op`, `state-unreachable`, `scroll-desync`, `content-hidden`, `overlay-obstruction`, `responsive-leak`, `a11y-interaction-regression`, or `motion-regression`.
- Produces diagnostic JSON attachment per failed contract when Playwright artifact support is available.

- [ ] **Step 1: Write a deliberately failing browser fixture test path**

The helper API must include:

```js
await assertVisibleAndReadable(locator, { minOpacity: 0.45 });
await assertNoForbiddenOverlap(subject, blocker, { maxOverlapRatio: 0.02 });
await assertStateChanged(page, readState, action, { failureClass: 'interaction-no-op' });
```

Unit-test the geometry helper with rectangles that clearly overlap and clearly do not.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/interaction-browser-helpers.test.mjs
```

Expected: FAIL until helper module exists.

- [ ] **Step 3: Implement browser helpers**

Use bounding rectangles, computed style (`display`, `visibility`, `opacity`, clipping dimensions), and explicit state attributes. Do not infer success merely because a click promise resolved.

- [ ] **Step 4: Implement the Playwright contract runner**

For `homepage-scroll-story`:
- open `/` on desktop 1440×1000;
- assert root exists;
- assert state 0 initially reachable;
- activate steps/CTA and assert states 1–3 change `data-bg-story-state`;
- separately drive scrolling through all four states and verify the same state machine;
- verify each active overlay/state is visible/readable;
- verify earlier steps remain readable and future steps are not below the configured opacity threshold;
- verify yellow cost widget does not obstruct the story while story desktop mode is active;
- rerun at 390×844 and assert non-sticky mobile behavior;
- rerun with `page.emulateMedia({ reducedMotion: 'reduce' })` and verify state changes still work without relying on animation.

For `homepage-platform-expertise-toggle`:
- activate both tabs by click;
- assert selected button `aria-selected="true"` and active panel visible;
- assert prior panel hidden;
- drive tab switch with keyboard and verify state changes;
- run desktop and mobile viewports.

- [ ] **Step 5: Run Playwright locally against a served final build**

Build exactly with the Netlify command, then serve repository root locally and run:

```bash
BASE_URL=http://127.0.0.1:4173 npx playwright test tests/integration/interaction-quality-gate.spec.js --workers=1
```

Expected: all registered contract checks PASS.

- [ ] **Step 6: Commit**

```bash
git add quality/browser tests/integration/interaction-quality-gate.spec.js tests/interaction-browser-helpers.test.mjs
git commit -m "test: add browser interaction quality gate"
```

---

### Task 4: PR Preview CI Gate

**Files:**
- Create: `.github/workflows/interaction-quality-gate.yml`
- Modify: `.github/workflows/live-preview-smoke.yml` only if duplication can be safely removed without reducing existing coverage.

**Interfaces:**
- Produces GitHub Actions job/check named exactly `interaction-quality-gate`.
- Consumes Netlify deploy-preview status and URL.

- [ ] **Step 1: Add a static workflow contract test**

Create `tests/interaction-quality-workflow.test.mjs` asserting the workflow:
- triggers on PRs to `main` for relevant website/tools/quality/test paths;
- checks out the PR head SHA;
- waits for the Netlify deploy preview status;
- installs Playwright 1.55.0 + Chromium;
- runs static registry/wiring tests;
- runs `tests/integration/interaction-quality-gate.spec.js` against the deploy-preview URL;
- uploads Playwright report/screenshots on failure.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/interaction-quality-workflow.test.mjs
```

Expected: FAIL because the workflow does not exist.

- [ ] **Step 3: Create `.github/workflows/interaction-quality-gate.yml`**

Use `actions/checkout@v5`, `actions/setup-node@v5`, Node 22, and the same Netlify status wait strategy already proven in `live-preview-smoke.yml`. Do not duplicate arbitrary sleeps after page load; browser assertions wait on hooks.

Required commands include:

```bash
node --test tests/interaction-contract-registry.test.mjs tests/interaction-final-build-wiring.test.mjs
npm install --no-save --package-lock=false @playwright/test@1.55.0
npx playwright install --with-deps chromium
BASE_URL="https://deploy-preview-${{ github.event.pull_request.number }}--bedrijfsgeheugen.netlify.app" npx playwright test tests/integration/interaction-quality-gate.spec.js --workers=1
```

- [ ] **Step 4: Verify workflow contract GREEN**

```bash
node --test tests/interaction-quality-workflow.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/interaction-quality-gate.yml tests/interaction-quality-workflow.test.mjs
git commit -m "ci: add interaction quality gate"
```

---

### Task 5: Production Readback Using the Same Contracts

**Files:**
- Create: `.github/workflows/interaction-production-readback.yml`
- Create: `tests/interaction-production-readback-workflow.test.mjs`

**Interfaces:**
- Uses the same `tests/integration/interaction-quality-gate.spec.js` with `BASE_URL=https://www.bedrijfsgeheugen.nl`.
- Runs after production/main deployment or by explicit workflow dispatch, depending on repository-supported event wiring.
- Failure is reported as `preview-production-drift` when preview passed but production contract fails.

- [ ] **Step 1: Write failing workflow contract test**

Require production URL, same browser spec, Chromium install, artifacts on failure, and no alternate assertion implementation.

- [ ] **Step 2: Verify RED**

```bash
node --test tests/interaction-production-readback-workflow.test.mjs
```

- [ ] **Step 3: Implement production readback workflow**

Use a `push` trigger on `main` plus `workflow_dispatch` unless an existing deploy-success webhook/workflow-run trigger can be reused safely. The job must wait/retry only for site availability, then run the exact same interaction spec against production.

- [ ] **Step 4: Verify GREEN**

```bash
node --test tests/interaction-production-readback-workflow.test.mjs
```

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/interaction-production-readback.yml tests/interaction-production-readback-workflow.test.mjs
git commit -m "ci: add production interaction readback"
```

---

### Task 6: Required-Check Verification, Full Validation, PR, and Release Evidence

**Files:**
- Modify only if justified by evidence: `.github/workflows/required-test.yml`
- Do not change branch protection unless the API proves write permission and the repository setting can be updated safely.

**Interfaces:**
- Verifies existing required `test` is intact.
- Verifies whether `interaction-quality-gate` is required before merge; if permission prevents configuration, records that as an explicit blocker rather than claiming success.

- [ ] **Step 1: Run the complete relevant local/static test set**

```bash
node --test \
  tests/interaction-contract-registry.test.mjs \
  tests/interaction-final-build-wiring.test.mjs \
  tests/interaction-browser-helpers.test.mjs \
  tests/interaction-quality-workflow.test.mjs \
  tests/interaction-production-readback-workflow.test.mjs \
  tests/seo-homepage-scroll-story-interaction.test.mjs \
  tests/seo-homepage-platform-expertise-toggle.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run the real final Netlify build command**

```bash
node tools/bouw-powerhouse-auth.mjs && \
node tools/bouw-kennisindex.mjs && \
node tools/bouw-v18-production.mjs && \
node tools/apply-tabbladen.mjs && \
node tools/bouw-v18-views.mjs && \
node tools/bouw-v18-chrome-alles.mjs && \
node tools/prijzen-uit-de-homepage.mjs && \
node tools/bouw-release-evidence.mjs
```

Expected: exit 0.

- [ ] **Step 3: Run the browser gate against that final local build**

Serve the root and execute Playwright using `BASE_URL=http://127.0.0.1:4173`. Expected: all interaction contracts PASS on desktop/mobile/reduced-motion paths.

- [ ] **Step 4: Rebase/refresh implementation branch from current `main` before PR if main advanced**

Do not merge stale/diverged implementation branches. Compare `main...HEAD` and ensure only intended quality-gate files plus the approved spec/plan are included.

- [ ] **Step 5: Open PR to `main`**

PR description must state:
- exact fault classes prevented;
- static + browser coverage;
- preview and production readback behavior;
- branch-protection status as verified fact, not assumption.

- [ ] **Step 6: Wait for and inspect CI evidence**

Do not claim complete while any required/interaction/preview check is pending or failing. For a failure, inspect the failing job/artifact and fix the root cause rather than retrying the same opaque path repeatedly.

- [ ] **Step 7: Verify branch-protection/ruleset state**

Read GitHub branch protection/ruleset for `main`. Confirm existing `test` remains required. Confirm whether `interaction-quality-gate` is required. If API write access is unavailable, report one explicit remaining repository-setting action; do not weaken or replace `test`.

- [ ] **Step 8: After merge/deploy, verify production readback**

Confirm the production workflow ran against `https://www.bedrijfsgeheugen.nl` on the merged commit and all registered contracts passed. Only then claim the prevention layer is live.

- [ ] **Step 9: Final evidence record**

Record merge SHA, successful preview interaction run, successful production readback run, and branch-protection result. These are the minimum evidence set for “fouten structureel geborgd”.
