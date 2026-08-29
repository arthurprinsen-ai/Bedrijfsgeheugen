# Parallel Component Development Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current static Bedrijfsgeheugen website into isolated, independently testable components so multiple agents can develop different site areas simultaneously without shared-file conflicts, with hero-video changes constrained to the hero-video component.

**Architecture:** Keep the static Netlify deployment model, but move authoring into component-owned fragments plus deterministic build-time composition. Shared infrastructure establishes component contracts, ownership rules, component previews and change-scope/hash guards; after that, component extraction happens in parallel worktrees and an integrator combines only green candidates.

**Tech Stack:** Static HTML/CSS/JS, Node.js 22 ESM scripts/tests, Git/GitHub branches and worktrees, GitHub Actions, Netlify deploy previews.

**Spec:** `docs/superpowers/specs/2026-08-29-component-isolation-design.md`

## Global Constraints

- Preserve the current visible website during extraction; no redesign is bundled into migration.
- Existing routes, analytics/consent behavior, proposition/copy, navigation behavior and responsive behavior remain unchanged unless separately requested.
- Generated deployable HTML is build output and must not be edited by normal component workers.
- Independent workers must have disjoint writable scopes.
- A local component request may not silently expand into unrelated files.
- Production remains on the last-known-good SHA until the exact integration preview is green.
- Hero-video media swaps must be possible by changing only `components/hero-video/media.json`, versioned hero assets and media acceptance metadata when required.
- Node.js version for CI and local scripts: 22.

---

## Dependency graph

```text
Task 1 Foundation contracts/ownership
        |
        +--> Task 2 Deterministic composers
        |
        +--> Task 3 Boundary/scope/hash validators
        |
        +--> Task 4 Component-preview CI
                 |
                 +--> Tasks 5A-5G component extraction (parallel)
                              |
                              +--> Task 6 Integration pipeline
                                           |
                                           +--> Task 7 Hero-video isolated swap proof
                                                        |
                                                        +--> Task 8 Production promotion + ledger
```

Tasks 5A through 5G are intentionally independent after Tasks 1-4 are green and should run concurrently in separate worktrees.

---

### Task 1: Establish component ownership and contract schema

**Files:**
- Create: `config/component-ownership.json`
- Create: `config/change-classes.json`
- Create: `components/_schema/contract.schema.json`
- Create: `tests/parallel-ownership.test.mjs`
- Create: `tests/change-classes.test.mjs`

**Interfaces:**
- Produces: `component-ownership.json` mapping component ids to writable glob patterns.
- Produces: `change-classes.json` mapping change classes to allowed component ids and paths.
- Produces: JSON schema consumed by component contract tests and validators.

- [ ] **Step 1: Write the failing ownership test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ownership = JSON.parse(await readFile('config/component-ownership.json', 'utf8'));

const required = ['header','hero-copy','hero-video','hero-demo','social-proof','pricing','footer'];

test('all website components have explicit writable ownership', () => {
  for (const id of required) {
    assert.ok(Array.isArray(ownership[id]), `${id} ownership missing`);
    assert.ok(ownership[id].length > 0, `${id} ownership empty`);
  }
});

test('component ownership scopes do not overlap', () => {
  const pairs = [];
  const entries = Object.entries(ownership);
  for (let i = 0; i < entries.length; i++) {
    for (let j = i + 1; j < entries.length; j++) {
      const [a, aPaths] = entries[i];
      const [b, bPaths] = entries[j];
      for (const ap of aPaths) for (const bp of bPaths) {
        if (ap === bp) pairs.push(`${a}:${b}:${ap}`);
      }
    }
  }
  assert.deepEqual(pairs, []);
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
node --test tests/parallel-ownership.test.mjs
```

Expected: FAIL because `config/component-ownership.json` does not exist.

- [ ] **Step 3: Add the ownership manifest**

```json
{
  "header": ["components/header/**", "tests/components/header.test.mjs"],
  "hero-copy": ["components/hero-copy/**", "tests/components/hero-copy.test.mjs"],
  "hero-video": ["components/hero-video/**", "assets/hero/**", "tests/components/hero-video.test.mjs"],
  "hero-demo": ["components/hero-demo/**", "tests/components/hero-demo.test.mjs"],
  "social-proof": ["components/social-proof/**", "tests/components/social-proof.test.mjs"],
  "pricing": ["components/pricing/**", "tests/components/pricing.test.mjs"],
  "footer": ["components/footer/**", "tests/components/footer.test.mjs"]
}
```

- [ ] **Step 4: Add the change-class manifest**

```json
{
  "hero-video-media": {
    "components": ["hero-video"],
    "allowed": [
      "components/hero-video/media.json",
      "assets/hero/**",
      "tests/fixtures/hero-video/**"
    ]
  },
  "header-navigation": {
    "components": ["header"],
    "allowed": ["components/header/**", "tests/components/header.test.mjs"]
  },
  "component-interface-change": {
    "components": ["*"],
    "allowed": ["components/**", "pages/**", "tools/**", "config/**", "tests/**"]
  }
}
```

- [ ] **Step 5: Add the contract schema**

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "type": "object",
  "required": ["id", "version", "root", "ownedFiles", "invariants"],
  "properties": {
    "id": {"type": "string", "pattern": "^[a-z0-9-]+$"},
    "version": {"type": "integer", "minimum": 1},
    "root": {"type": "string", "minLength": 1},
    "ownedFiles": {"type": "array", "items": {"type": "string"}, "minItems": 1},
    "invariants": {"type": "array", "items": {"type": "string"}},
    "jsEntry": {"type": ["string", "null"]},
    "dependencies": {"type": "array", "items": {"type": "string"}}
  },
  "additionalProperties": true
}
```

- [ ] **Step 6: Run ownership and manifest tests**

Run:

```bash
node --test tests/parallel-ownership.test.mjs tests/change-classes.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add config components/_schema tests/parallel-ownership.test.mjs tests/change-classes.test.mjs
git commit -m "feat: add component ownership contracts"
```

---

### Task 2: Build deterministic full-page and component-preview composers

**Files:**
- Create: `pages/home.page.json`
- Create: `tools/compose-site.mjs`
- Create: `tools/compose-component-preview.mjs`
- Create: `tests/page-composition.test.mjs`
- Create: `tests/component-preview-composition.test.mjs`
- Create: `preview/component-shell.html`

**Interfaces:**
- `composeSite({ pageManifest, outputPath }) -> Promise<void>` writes generated homepage output.
- `composeComponentPreview({ componentId, outputPath }) -> Promise<void>` writes a minimal component-only preview.

- [ ] **Step 1: Write the failing deterministic composition test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { composeSite } from '../tools/compose-site.mjs';

test('same component inputs produce byte-identical homepage output', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'bg-compose-'));
  const a = join(dir, 'a.html');
  const b = join(dir, 'b.html');
  await composeSite({ pageManifest: 'pages/home.page.json', outputPath: a });
  await composeSite({ pageManifest: 'pages/home.page.json', outputPath: b });
  assert.equal(await readFile(a, 'utf8'), await readFile(b, 'utf8'));
});
```

- [ ] **Step 2: Run and verify RED**

```bash
node --test tests/page-composition.test.mjs
```

Expected: FAIL because composer does not exist.

- [ ] **Step 3: Add page manifest**

```json
{
  "components": [
    "header",
    "hero-copy",
    "hero-video",
    "hero-demo",
    "social-proof",
    "pricing",
    "footer"
  ]
}
```

- [ ] **Step 4: Implement `compose-site.mjs`**

Implementation requirements:

```js
export async function composeSite({ pageManifest, outputPath }) {
  // 1. read page manifest
  // 2. resolve each components/<id>/<id>.html in declared order
  // 3. concatenate deterministic CSS links and JS entries from contracts
  // 4. inject into a stable HTML shell
  // 5. write exactly one output file
}
```

The implementation must sort generated CSS/JS references by page order and must not mutate component source files.

- [ ] **Step 5: Implement component preview composition**

```js
export async function composeComponentPreview({ componentId, outputPath }) {
  // Validate componentId against config/component-ownership.json.
  // Load only the selected component contract/HTML/CSS/JS.
  // Inject into preview/component-shell.html.
  // Do not load sibling component markup.
}
```

- [ ] **Step 6: Run composition tests**

```bash
node --test tests/page-composition.test.mjs tests/component-preview-composition.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add pages tools preview tests/page-composition.test.mjs tests/component-preview-composition.test.mjs
git commit -m "feat: add deterministic component composers"
```

---

### Task 3: Add boundary, change-scope and protected-sibling hash validators

**Files:**
- Create: `tools/verify-component-boundaries.mjs`
- Create: `tools/verify-change-scope.mjs`
- Create: `tools/verify-component-hashes.mjs`
- Create: `tests/component-boundaries.test.mjs`
- Create: `tests/change-scope.test.mjs`
- Create: `tests/component-hash-protection.test.mjs`

**Interfaces:**
- `verifyBoundaries(componentId) -> Promise<{ok:boolean, violations:string[]}>`
- `verifyChangeScope({ base, head, changeClass }) -> Promise<{ok:boolean, violations:string[]}>`
- `verifyProtectedHashes({ base, head, targetComponent }) -> Promise<{ok:boolean, changedSiblings:string[]}>`

- [ ] **Step 1: Write failing cross-component CSS test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { verifyBoundaries } from '../tools/verify-component-boundaries.mjs';

test('hero-video cannot target header internals', async () => {
  const result = await verifyBoundaries('hero-video');
  assert.equal(result.ok, true, result.violations.join('\n'));
});
```

- [ ] **Step 2: Write failing synthetic scope test**

```js
test('hero-video-media rejects header changes', async () => {
  const result = await verifyChangeScope({
    base: process.env.TEST_BASE,
    head: process.env.TEST_HEAD,
    changeClass: 'hero-video-media'
  });
  assert.equal(result.ok, false);
  assert.ok(result.violations.some(v => v.includes('header')));
});
```

- [ ] **Step 3: Implement boundary validation rules**

Reject component CSS/JS when:
- CSS contains another `data-bg-component="..."` root;
- CSS contains unscoped global selectors `body`, `html`, `nav`, `footer`, `h1` outside shared tokens;
- JS calls `document.querySelector` with another component root;
- component-owned file references a sibling component internal class.

- [ ] **Step 4: Implement change-scope validation using `git diff --name-only`**

Required command:

```bash
git diff --name-only "$BASE"..."$HEAD"
```

Normalize paths, load `config/change-classes.json`, and reject any changed path that matches neither the class allowlist nor the declared component ownership.

- [ ] **Step 5: Implement protected sibling hashes**

For every non-target component, hash sorted file path + file bytes from base and head. Return changed sibling ids. The hash is evidence only; never rewrite source files.

- [ ] **Step 6: Run validator tests**

```bash
node --test tests/component-boundaries.test.mjs tests/change-scope.test.mjs tests/component-hash-protection.test.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tools tests/component-boundaries.test.mjs tests/change-scope.test.mjs tests/component-hash-protection.test.mjs
git commit -m "feat: enforce component isolation boundaries"
```

---

### Task 4: Add parallel component CI and preview jobs

**Files:**
- Create: `.github/workflows/component-preview.yml`
- Create: `tools/detect-changed-components.mjs`
- Create: `tests/detect-changed-components.test.mjs`

**Interfaces:**
- `detectChangedComponents(base, head) -> Promise<string[]>`
- GitHub Actions matrix uses returned component ids.

- [ ] **Step 1: Write failing changed-component detection test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyPaths } from '../tools/detect-changed-components.mjs';

test('classifies independent component paths', () => {
  assert.deepEqual(
    classifyPaths([
      'components/header/header.css',
      'components/hero-video/media.json',
      'components/pricing/pricing.html'
    ]).sort(),
    ['header','hero-video','pricing']
  );
});
```

- [ ] **Step 2: Implement path classifier**

```js
export function classifyPaths(paths) {
  // read ownership manifest once
  // map each path to exactly one component
  // return unique sorted component ids
}
```

- [ ] **Step 3: Add GitHub Actions matrix workflow**

Workflow requirements:

```yaml
strategy:
  fail-fast: false
  matrix:
    component: ${{ fromJson(needs.detect.outputs.components) }}
```

Each matrix job must run:

```bash
node --test tests/components/${{ matrix.component }}.test.mjs
node tools/verify-component-boundaries.mjs ${{ matrix.component }}
node tools/compose-component-preview.mjs ${{ matrix.component }} dist/component-${{ matrix.component }}.html
```

The shared integration job runs scope/hash/composition tests once after matrix success.

- [ ] **Step 4: Verify workflow syntax and detector tests**

```bash
node --test tests/detect-changed-components.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/component-preview.yml tools/detect-changed-components.mjs tests/detect-changed-components.test.mjs
git commit -m "ci: run component checks in parallel"
```

---

## Parallel extraction wave

After Tasks 1-4 are green, create one worktree/branch per task below. Each worker must use the ownership manifest as its hard writable scope and must not edit `index.html`, `pages/**`, `tools/**`, `config/**`, or another component directory.

### Task 5A: Extract header component

**Files:**
- Create: `components/header/header.html`
- Create: `components/header/header.css`
- Create: `components/header/header.js`
- Create: `components/header/contract.json`
- Create: `tests/components/header.test.mjs`

**Interfaces:** root `data-bg-component="header"`; behavior must match current accepted navigation.

- [ ] Capture current header markup/styles/behavior from baseline.
- [ ] Write contract test asserting logo, current navigation links, mobile trigger, keyboard behavior and no external component selectors.
- [ ] Run test RED.
- [ ] Extract exact current header without redesign.
- [ ] Run component test + component preview.
- [ ] Confirm baseline-equivalent responsive behavior.
- [ ] Commit `feat: extract header component`.

### Task 5B: Extract footer component

**Files:** `components/footer/*`, `tests/components/footer.test.mjs`.

**Interfaces:** root `data-bg-component="footer"`; preserve existing links and CTA.

- [ ] Capture current footer baseline.
- [ ] Write failing contract test for link groups, CTA and accessibility.
- [ ] Extract exact footer markup/CSS/JS.
- [ ] Run component preview and responsive smoke.
- [ ] Commit `feat: extract footer component`.

### Task 5C: Extract hero-copy component

**Files:** `components/hero-copy/*`, `tests/components/hero-copy.test.mjs`.

**Interfaces:** root `data-bg-component="hero-copy"`; copy text is protected content.

- [ ] Snapshot current heading, lead, USP and CTA text.
- [ ] Write failing exact-content and structure test.
- [ ] Extract without changing wording or CTA destinations.
- [ ] Run component preview at mobile/desktop widths.
- [ ] Commit `feat: extract hero copy component`.

### Task 5D: Extract social-proof component

**Files:** `components/social-proof/*`, `tests/components/social-proof.test.mjs`.

- [ ] Capture current proof/rating markup.
- [ ] Write failing structure/content test.
- [ ] Extract without visual changes.
- [ ] Run component preview.
- [ ] Commit `feat: extract social proof component`.

### Task 5E: Extract pricing component

**Files:** `components/pricing/*`, `tests/components/pricing.test.mjs`.

- [ ] Identify the current homepage pricing/package section actually rendered on baseline.
- [ ] Write failing test for package names, CTA destinations and responsive structure.
- [ ] Extract exact current section.
- [ ] Run preview and component tests.
- [ ] Commit `feat: extract pricing component`.

### Task 5F: Extract hero-demo component

**Files:** `components/hero-demo/*`, `tests/components/hero-demo.test.mjs`.

**Interfaces:** root `data-bg-component="hero-demo"`; owns demo/chat only, never hero video.

- [ ] Snapshot current demo/chat markup and styles.
- [ ] Write failing test proving no `<video>` ownership in hero-demo.
- [ ] Extract exact demo behavior.
- [ ] Run component preview.
- [ ] Commit `feat: extract hero demo component`.

### Task 5G: Extract hero-video component

**Files:**
- Create: `components/hero-video/hero-video.html`
- Create: `components/hero-video/hero-video.css`
- Create: `components/hero-video/hero-video.js`
- Create: `components/hero-video/contract.json`
- Create: `components/hero-video/media.json`
- Create: `tests/components/hero-video.test.mjs`
- Move/copy accepted versioned hero media to: `assets/hero/`

**Interfaces:** root `data-bg-component="hero-video"`; `media.json` is the only normal media-swap interface.

- [ ] Write failing test requiring exactly one canonical video and local media manifest.
- [ ] Write failing test requiring poster fallback and fixed aspect ratio.
- [ ] Write failing test forbidding header/demo/social-proof selectors.
- [ ] Extract current accepted hero-video placement if present; if baseline intentionally has no hero video, create the component slot but keep `enabled:false` in `media.json` until a separately accepted media change.
- [ ] Implement local fallback to poster without sibling DOM mutation.
- [ ] Run existing iPhone/Safari media fingerprint tests against the selected media asset when enabled.
- [ ] Run component preview.
- [ ] Commit `feat: extract isolated hero video component`.

---

### Task 6: Integrate green component candidates into generated homepage

**Files:**
- Modify: `pages/home.page.json`
- Modify: `tools/compose-site.mjs`
- Create: `tests/integration/component-integration.test.mjs`
- Modify build config only if required to generate deployable `index.html` from components.

**Interfaces:** consumes only green component contracts and source trees.

- [ ] Create integration branch from the exact current migration baseline.
- [ ] Merge/rebase only green Task 5 component commits.
- [ ] Run ownership overlap validation; expected zero overlaps.
- [ ] Compose homepage into a temporary generated path.
- [ ] Compare protected routes/content invariants to baseline.
- [ ] Run full component suite and page composition tests.
- [ ] Build Netlify preview for exact integration SHA.
- [ ] Verify responsive smoke at representative mobile and desktop widths.
- [ ] Commit integration wiring separately from component extraction commits.

---

### Task 7: Prove hero-video-only changes cannot damage siblings

**Files:**
- Modify only: `components/hero-video/media.json`
- Add versioned test media under: `assets/hero/`
- Create: `tests/fixtures/hero-video/acceptance.json`

**Interfaces:** change class `hero-video-media`.

- [ ] Record base hashes for header, hero-copy, hero-demo, social-proof, pricing and footer.
- [ ] Change only `media.json` and the versioned hero media asset.
- [ ] Run `verify-change-scope` with `hero-video-media`; expected PASS.
- [ ] Run protected sibling hash validator; expected no changed siblings.
- [ ] Run hero-video component tests and component preview.
- [ ] Run integration preview without editing any sibling component.
- [ ] Verify exact preview SHA and media runtime acceptance.
- [ ] Re-run sibling hashes after preview candidate; expected byte-identical siblings.
- [ ] Commit `test: prove isolated hero video swap path`.

---

### Task 8: Promote architecture only after exact green preview and record operational memory

**Files:**
- Modify: `docs/development-ledger.md`
- Modify shared agent documentation only if the implemented operational commands differ from this spec.

**Interfaces:** production promotion follows existing exact-SHA/last-known-good contract.

- [ ] Run all component, ownership, boundary, scope, composition and integration tests.
- [ ] Verify exact Netlify preview SHA is `ready`.
- [ ] Verify routes, analytics/consent, navigation, hero-demo, social proof, pricing and footer against protected baseline.
- [ ] Verify at least three component matrix jobs execute concurrently in CI evidence.
- [ ] Verify two disjoint component branches integrate without manual source conflict resolution.
- [ ] Promote exact green integration SHA through existing production gate.
- [ ] Verify exact production SHA/deploy and smoke checks.
- [ ] Append `CONTRACT_CHANGE`, `IMPROVEMENT` and `PRODUCTION_PROMOTION` ledger entries with exact evidence.
- [ ] If production regresses, rollback immediately to recorded pre-migration last-known-good and continue repair on isolated branch.

---

## Execution model

Use **subagent-driven development** for implementation. Tasks 1-4 are foundation tasks with review checkpoints. Once Task 4 is green, dispatch Tasks 5A-5G concurrently, one fresh agent/worktree per component. The integrator must not begin Task 6 until the desired component candidates are individually green, but one failed component must not block unrelated component candidates from continuing.

## Plan self-review

- Spec coverage: ownership, contracts, component previews, parallel worktrees, CI matrix, scope guards, sibling hashes, hero-video isolation, integration preview, rollback and production evidence are covered.
- Placeholder scan: no TBD/TODO/implement-later instructions remain.
- Interface consistency: component ids match spec and manifests; `hero-video-media` remains the narrow media-swap class; generated output remains integrator-owned.
