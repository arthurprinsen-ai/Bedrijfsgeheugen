# Risk-Based Release Lanes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make small, isolated website fixes reach verified production faster by selecting validation depth from blast radius while preserving PR governance, exact-SHA promotion and production readback.

**Architecture:** Extend the existing BRAIN-DELIVERY-v2 website lane with a deterministic website risk classifier that emits `fast-fix`, `normal`, or `high-risk`, affected routes and required test sets. A single stable `release-gate` workflow consumes that decision, runs only the required validation for the candidate SHA, and leaves existing broad checks as staged/non-blocking evidence until parity is proven. Production verification remains exact-SHA based and is recorded separately after merge.

**Tech Stack:** Node.js 22 built-in test runner (`node:test`), GitHub Actions, Playwright/Chromium where browser verification is required, GitHub commit statuses, Netlify deploy previews, existing BRAIN-DELIVERY-v2 policy and promotion contracts.

**Spec:** `docs/superpowers/specs/2026-09-07-risk-based-release-lanes-design.md`

## Global Constraints

- `main` stays protected and production changes remain PR-backed.
- Unknown or ambiguous changed paths fail closed and cannot become `fast-fix`.
- `.github/workflows/**`, `netlify.toml`, `_redirects`, shared shell/navigation, production build tooling, canonical SEO configuration and assets consumed by multiple unrelated public routes are `high-risk`.
- Validation-only PR workflows use PR-specific concurrency keys; only shared-state or production writers may use serialized locks.
- A merge is not `LIVE_VERIFIED` until Netlify production serves the exact merged SHA and the affected production routes pass readback.
- Existing `tests/site-baseline-guardian.test.mjs` remains mandatory and must not be weakened or bypassed.
- Existing BRAIN-DELIVERY-v2 independent-lane semantics remain authoritative: unrelated main drift is not itself a synchronization reason.
- BG169 remains the production authority; the new release gate does not create a direct-main or alternate production path.

---

### Task 1: Canonical website risk classifier

**Files:**
- Create: `tools/website-release-risk.mjs`
- Create: `config/website-release-risk.json`
- Create: `tests/website-release-risk.test.mjs`
- Modify: `config/brain-delivery-system.json`

**Interfaces:**
- Consumes: `changedPaths: string[]`, accepted website route metadata from `site/accepted-baseline.json`, and `config/website-release-risk.json`.
- Produces: `classifyWebsiteRelease({ changedPaths, riskConfig, acceptedBaseline }) -> { lane, changed_files, affected_routes, risk_reasons, required_test_sets, escalated }`.
- Produces: `releaseConcurrencyKey({ workflow, prNumber }) -> string` for deterministic PR-isolated concurrency testing.

- [ ] **Step 1: Write failing classifier tests**

Add `tests/website-release-risk.test.mjs` using `node:test` and `assert/strict` with these concrete cases:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { classifyWebsiteRelease, releaseConcurrencyKey } from '../tools/website-release-risk.mjs';

const riskConfig = JSON.parse(await readFile('config/website-release-risk.json', 'utf8'));
const acceptedBaseline = JSON.parse(await readFile('site/accepted-baseline.json', 'utf8'));

test('one explicitly owned page-local asset is fast-fix', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/pages/ai-act/local-fix.css'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'fast-fix');
  assert.deepEqual(result.affected_routes, ['/ai-act']);
  assert.equal(result.escalated, false);
  assert.deepEqual(result.required_test_sets, ['baseline','static','preview','targeted-browser']);
});

test('root public HTML change is normal unless explicitly proven local', () => {
  const result = classifyWebsiteRelease({ changedPaths:['ai-automatisering-mkb.html'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'normal');
  assert.ok(result.affected_routes.includes('/ai-automatisering-mkb'));
});

test('shared navigation change is high-risk', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/js/menu.js'], riskConfig, acceptedBaseline });
  assert.equal(result.lane, 'high-risk');
  assert.equal(result.escalated, true);
});

test('workflow and Netlify config always escalate', () => {
  for (const path of ['.github/workflows/live-preview-smoke.yml','netlify.toml','_redirects']) {
    assert.equal(classifyWebsiteRelease({ changedPaths:[path], riskConfig, acceptedBaseline }).lane, 'high-risk');
  }
});

test('unknown path cannot become fast-fix', () => {
  const result = classifyWebsiteRelease({ changedPaths:['assets/future/unknown.css'], riskConfig, acceptedBaseline });
  assert.notEqual(result.lane, 'fast-fix');
  assert.equal(result.escalated, true);
});

test('different PRs get different validation concurrency groups', () => {
  assert.equal(releaseConcurrencyKey({workflow:'release-gate', prNumber:1089}), 'release-gate-pr-1089');
  assert.equal(releaseConcurrencyKey({workflow:'release-gate', prNumber:1090}), 'release-gate-pr-1090');
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
node --test tests/website-release-risk.test.mjs
```

Expected: FAIL because `tools/website-release-risk.mjs` and `config/website-release-risk.json` do not yet exist.

- [ ] **Step 3: Add the explicit risk configuration**

Create `config/website-release-risk.json` with these top-level keys and semantics:

```json
{
  "version": "WEBSITE-RELEASE-RISK-v1",
  "highRiskPaths": [
    ".github/workflows/",
    "netlify.toml",
    "_redirects",
    "tools/site-shell/",
    "tools/bouw-v18-",
    "tools/normaliseer-site-ui.mjs",
    "tools/controleer-site-ui.mjs",
    "assets/js/menu.js",
    "site/seo-baseline.json",
    "site/navigation-baseline.json"
  ],
  "normalRootHtml": true,
  "pageLocalAssets": {
    "assets/pages/ai-act/": ["/ai-act"]
  },
  "fastFixRequiredTestSets": ["baseline", "static", "preview", "targeted-browser"],
  "normalRequiredTestSets": ["baseline", "static", "preview", "targeted-browser", "page-seo"],
  "highRiskRequiredTestSets": ["baseline", "static", "preview", "targeted-browser", "page-seo", "shared-contracts", "full-regression"]
}
```

Do not bulk-classify existing `assets/**` as low risk. Add page-local ownership prefixes only when their route ownership is explicit and verified.

- [ ] **Step 4: Implement the minimal deterministic classifier**

Create `tools/website-release-risk.mjs` with pure exported functions. Matching must use exact files or prefix entries ending in `/`; path uncertainty escalates. Root `*.html` derives route `/filename-without-.html`, while `index.html` derives `/`. A route found in `site/accepted-baseline.json` is accepted; an unknown derived route escalates to `normal` rather than `fast-fix`.

The result object must be frozen or otherwise immutable-by-convention and sorted deterministically so identical diffs produce identical JSON.

- [ ] **Step 5: Run classifier tests**

Run:

```bash
node --test tests/website-release-risk.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Register the classifier in BRAIN delivery scope**

Modify `config/brain-delivery-system.json` so these new paths are website delivery work and part of the website-shell/release conflict domain where appropriate:

```text
tools/website-release-risk.mjs
config/website-release-risk.json
tests/website-release-risk.test.mjs
```

- [ ] **Step 7: Run delivery classification regressions**

Run:

```bash
node --test tests/brain-delivery-system.test.mjs tests/website-release-risk.test.mjs
```

Expected: PASS, including existing independent-lane tests.

- [ ] **Step 8: Commit Task 1**

```bash
git add tools/website-release-risk.mjs config/website-release-risk.json tests/website-release-risk.test.mjs config/brain-delivery-system.json
git commit -m "feat: classify website release risk"
```

---

### Task 2: Targeted Fast Fix browser verifier

**Files:**
- Create: `tools/verify-targeted-website-routes.mjs`
- Create: `tests/website-targeted-route-contract.test.mjs`
- Modify: `tests/integration/` only if a reusable Playwright fixture already exists and is strictly needed.

**Interfaces:**
- Consumes: `BASE_URL`, JSON array of routes, optional JSON interaction contracts.
- Produces: process exit `0` only when all routes pass; `.artifacts/targeted-route-verification.json` containing route, HTTP status, identity result, browser error count and viewport results.

- [ ] **Step 1: Write failing pure contract tests**

Test exported helpers without launching a browser:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { routeIdentity, summarizeRouteResult } from '../tools/verify-targeted-website-routes.mjs';

test('route identity accepts the matching canonical path', () => {
  assert.equal(routeIdentity({ route:'/ai-act', canonical:'https://www.bedrijfsgeheugen.nl/ai-act', title:'AI Act | Bedrijfsgeheugen' }).ok, true);
});

test('blank page is a hard failure', () => {
  assert.equal(summarizeRouteResult({ visibleText:'   ', html:'<html><body></body></html>', pageErrors:[], failedAssets:[] }).ok, false);
});

test('uncaught browser error is a hard failure', () => {
  assert.equal(summarizeRouteResult({ visibleText:'content', html:'<main>content</main>', pageErrors:['ReferenceError'], failedAssets:[] }).ok, false);
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
node --test tests/website-targeted-route-contract.test.mjs
```

Expected: FAIL because verifier helpers are missing.

- [ ] **Step 3: Implement verifier helpers and CLI**

Use Playwright only in CLI execution. For each route:

1. request/navigate to `${BASE_URL}${route}`;
2. require a successful response;
3. verify canonical pathname or accepted route identity;
4. listen for `pageerror`;
5. listen for failed same-origin critical CSS/JS/document requests;
6. verify non-empty visible body/main text;
7. repeat at desktop `1440x1200` and mobile `390x844`;
8. capture screenshots only as evidence, not as the correctness predicate;
9. write `.artifacts/targeted-route-verification.json`.

- [ ] **Step 4: Run pure unit tests**

```bash
node --test tests/website-targeted-route-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Run a local static-server smoke against one known route**

Use the repo's simplest available local HTTP serving method. If Python is used:

```bash
python3 -m http.server 8088 >/tmp/bg-http.log 2>&1 &
SERVER_PID=$!
BASE_URL=http://127.0.0.1:8088 node tools/verify-targeted-website-routes.mjs --routes '["/"]'
kill "$SERVER_PID"
```

Expected: verifier produces `.artifacts/targeted-route-verification.json`; if the homepage build requires generation before serving, execute the existing accepted homepage build command first rather than weakening the verifier.

- [ ] **Step 6: Commit Task 2**

```bash
git add tools/verify-targeted-website-routes.mjs tests/website-targeted-route-contract.test.mjs
git commit -m "test: add targeted website route verifier"
```

---

### Task 3: Stable lane-aware release gate

**Files:**
- Create: `.github/workflows/release-gate.yml`
- Create: `tests/release-gate-contract.test.mjs`
- Modify: `.github/workflows/paginacontrole.yml`
- Modify: `.github/workflows/live-preview-smoke.yml`

**Interfaces:**
- Consumes: PR base SHA, PR head SHA, classifier JSON.
- Produces: stable GitHub Actions job/status named exactly `release-gate` and artifacts containing classifier plus lane verification evidence.

- [ ] **Step 1: Write failing workflow contract tests**

Add tests that read the workflow text and require:

```js
assert.match(workflow, /name:\s*Release Gate/);
assert.match(workflow, /release-gate-pr-/);
assert.match(workflow, /cancel-in-progress:\s*true/);
assert.match(workflow, /website-release-risk\.mjs/);
assert.match(workflow, /verify-targeted-website-routes\.mjs/);
assert.match(workflow, /netlify\/bedrijfsgeheugen\/deploy-preview/);
```

Also assert `paginacontrole.yml` remains PR-isolated and does not use `repo-schrijven` for PR validation.

- [ ] **Step 2: Run and confirm failure**

```bash
node --test tests/release-gate-contract.test.mjs
```

Expected: FAIL because `.github/workflows/release-gate.yml` does not exist.

- [ ] **Step 3: Implement `release-gate.yml`**

Use:

```yaml
name: Release Gate
on:
  pull_request:
    branches: [main]

concurrency:
  group: release-gate-pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

The workflow must:

1. checkout exact PR head with `fetch-depth: 0`;
2. run `node scripts/brain/chat-learning-preflight.mjs` before material work;
3. diff base...head and classify website risk;
4. always run `node --test tests/site-baseline-guardian.test.mjs` for website work;
5. always run classifier/unit static checks;
6. poll the exact head SHA for `netlify/bedrijfsgeheugen/deploy-preview`, failing immediately on `failure`/`error`;
7. run targeted browser checks for classifier `affected_routes`;
8. run `.github/scripts/paginacontrole.py` and `.github/scripts/seocontrole.py` only when required test sets include `page-seo`;
9. run existing shared/full regression contracts only for `high-risk`;
10. upload classifier and route evidence on `always()`;
11. expose a final job named `release-gate` that fails if any lane-required dependency failed or was unexpectedly skipped.

Do not make the final aggregation depend on unrelated repository-wide workflows.

- [ ] **Step 4: Keep existing workflows as staged evidence, not silent duplicates**

Modify `paginacontrole.yml` and `live-preview-smoke.yml` only enough to avoid redundant blocking in the staged rollout. Preserve their current standalone/manual/scheduled diagnostic value. Do not delete either workflow in this task.

For `live-preview-smoke.yml`, keep existing exact-head preview semantics while removing homepage-only work from candidates whose classifier-derived scope is unrelated once the new release gate owns targeted routes.

- [ ] **Step 5: Run contract tests**

```bash
node --test tests/release-gate-contract.test.mjs tests/live-preview-trigger-scope.test.mjs tests/website-release-risk.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add .github/workflows/release-gate.yml .github/workflows/paginacontrole.yml .github/workflows/live-preview-smoke.yml tests/release-gate-contract.test.mjs
git commit -m "feat: add lane-aware release gate"
```

---

### Task 4: Production exact-SHA readback

**Files:**
- Create: `tools/verify-production-release.mjs`
- Create: `tests/production-release-readback.test.mjs`
- Create: `.github/workflows/production-release-readback.yml`

**Interfaces:**
- Consumes: merged PR number, merge SHA, affected routes, observed Netlify production deploy SHA/status.
- Produces: `LIVE_VERIFIED` only when observed production SHA equals merge SHA and route checks pass; `.artifacts/production-release-readback.json` is immutable evidence for the workflow run.

- [ ] **Step 1: Write failing exact-SHA tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateProductionReadback } from '../tools/verify-production-release.mjs';

test('matching merge and deployed SHA can become LIVE_VERIFIED', () => {
  assert.equal(evaluateProductionReadback({mergeSha:'a'.repeat(40), deployedSha:'a'.repeat(40), deployStatus:'ready', routesOk:true}).status, 'LIVE_VERIFIED');
});

test('SHA mismatch is never live success', () => {
  const result = evaluateProductionReadback({mergeSha:'a'.repeat(40), deployedSha:'b'.repeat(40), deployStatus:'ready', routesOk:true});
  assert.equal(result.status, 'RELEASE_INCOMPLETE');
  assert.equal(result.reason, 'production_sha_mismatch');
});

test('route regression keeps release non-green', () => {
  assert.equal(evaluateProductionReadback({mergeSha:'a'.repeat(40), deployedSha:'a'.repeat(40), deployStatus:'ready', routesOk:false}).status, 'PRODUCTION_RED');
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
node --test tests/production-release-readback.test.mjs
```

Expected: FAIL because the module is missing.

- [ ] **Step 3: Implement pure readback evaluator and CLI**

The CLI must accept `--merge-sha`, `--deployed-sha`, `--deploy-status`, `--routes-json` and `--routes-ok`. It must reject non-40-character Git SHAs, write the full evidence JSON, and exit non-zero for `RELEASE_INCOMPLETE` or `PRODUCTION_RED`.

- [ ] **Step 4: Add the post-merge workflow**

`production-release-readback.yml` triggers on pushes to `main`. It must:

1. prove PR association for the pushed SHA using the same governed provenance concept as `Main Write Integrity`;
2. read affected routes from merged-PR evidence where available; if unavailable, derive conservatively from the merge diff and escalate scope rather than skip verification;
3. wait for Netlify production to report the exact merge SHA ready;
4. run targeted production route verification against `https://www.bedrijfsgeheugen.nl`;
5. run `tools/verify-production-release.mjs`;
6. upload `.artifacts/production-release-readback.json` with 30-day retention;
7. create/update a deduplicated incident on SHA mismatch or route regression;
8. never claim green solely because the GitHub merge succeeded.

- [ ] **Step 5: Run tests**

```bash
node --test tests/production-release-readback.test.mjs tests/website-targeted-route-contract.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 4**

```bash
git add tools/verify-production-release.mjs tests/production-release-readback.test.mjs .github/workflows/production-release-readback.yml
git commit -m "feat: verify exact production release SHA"
```

---

### Task 5: Integrate risk depth into BRAIN-DELIVERY-v2 without breaking independence

**Files:**
- Modify: `tools/brain-delivery-system.mjs`
- Modify: `tests/brain-delivery-system.test.mjs`
- Modify: `config/brain-delivery-system.json`
- Modify: `.github/workflows/unified-brain-delivery.yml`

**Interfaces:**
- Extends website lane metadata with `riskLane`, `affectedRoutes`, and `requiredTestSets` while keeping existing `lane.id === 'website'`, `candidateIdentity`, `testedIdentity`, independent promotion and exact-SHA rules intact.

- [ ] **Step 1: Add failing integration tests**

Extend `tests/brain-delivery-system.test.mjs` with:

```js
test('website delivery plan carries risk lane metadata without losing independent promotion', async () => {
  const policy = JSON.parse(await readFile('config/brain-delivery-system.json', 'utf8'));
  const plan = createDeliveryPlan({ changedPaths:['ai-automatisering-mkb.html'], headSha:'abcdef1234567890', policy });
  const website = plan.lanes.find(lane => lane.id === 'website');
  assert.equal(website.independentPromotion, true);
  assert.ok(['normal','high-risk'].includes(website.riskLane));
  assert.ok(Array.isArray(website.requiredTestSets));
});
```

Also add a test proving unrelated backend/portal lanes do not inherit website browser tests.

- [ ] **Step 2: Run and confirm failure**

```bash
node --test tests/brain-delivery-system.test.mjs
```

Expected: FAIL on missing `riskLane` metadata.

- [ ] **Step 3: Extend delivery plan only for website lane**

Import the risk classifier into `tools/brain-delivery-system.mjs`. When a website lane is present, attach classifier output to that lane; do not turn Fast/Normal/High Risk into new global BRAIN component lanes. This keeps the existing conflict-aware independent delivery model stable while adding website-specific validation depth.

- [ ] **Step 4: Make Unified Brain Delivery delegate website quality depth**

Modify the website branch of `.github/workflows/unified-brain-delivery.yml` so it runs cheap invariant tests directly and treats the stable `release-gate` as the website browser/preview evidence contract, rather than always running unrelated heavyweight suites twice.

Do not alter backend, portal or automation verification commands except where needed to consume a shared manifest field safely.

- [ ] **Step 5: Run BRAIN delivery regressions**

```bash
node --test tests/brain-delivery-system.test.mjs tests/delivery-*.test.mjs tests/website-release-risk.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add tools/brain-delivery-system.mjs tests/brain-delivery-system.test.mjs config/brain-delivery-system.json .github/workflows/unified-brain-delivery.yml
git commit -m "feat: integrate website risk depth with brain delivery"
```

---

### Task 6: Guarded rollout and branch-protection transition evidence

**Files:**
- Create: `tests/release-lane-rollout-contract.test.mjs`
- Modify: `.github/workflows/main-protection-observation.yml`
- Modify: `scripts/brain/main-protection-certification.mjs`
- Create: `docs/changes/2026-09-07-risk-based-release-lanes.md`

**Interfaces:**
- Production protection observation must certify the intended required status set after rollout; during observation it must report whether `release-gate` exists and is green without silently claiming branch protection was changed when it was not.

- [ ] **Step 1: Write failing rollout contract test**

Require the protection observation/certification code to distinguish:

```text
RELEASE_GATE_OBSERVED
RELEASE_GATE_REQUIRED
LEGACY_REQUIRED_CHECKS_PRESENT
```

and to report a non-ready state when the repository still protects only an obsolete generic status but the migration has not yet been applied.

- [ ] **Step 2: Run and confirm failure**

```bash
node --test tests/release-lane-rollout-contract.test.mjs
```

Expected: FAIL before certification support is added.

- [ ] **Step 3: Extend protection observation**

Update `main-protection-observation.yml` and `main-protection-certification.mjs` so evidence reports the observed required checks and the intended release contract. Do not fabricate or assume branch-protection mutation; certification is observation unless a separately authorized GitHub administration path performs the change.

- [ ] **Step 4: Write rollout record**

Create `docs/changes/2026-09-07-risk-based-release-lanes.md` recording:

- old blocking model;
- classifier version;
- status name `release-gate`;
- observation phase start;
- exact checks retained for High Risk;
- evidence required before removing legacy blocking;
- rollback rule: restore previous required-check set if Fast Fix safety equivalence is disproven.

- [ ] **Step 5: Run governance and release tests**

```bash
node --test tests/release-lane-rollout-contract.test.mjs tests/release-gate-contract.test.mjs tests/brain-delivery-system.test.mjs tests/website-release-risk.test.mjs tests/production-release-readback.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit Task 6**

```bash
git add tests/release-lane-rollout-contract.test.mjs .github/workflows/main-protection-observation.yml scripts/brain/main-protection-certification.mjs docs/changes/2026-09-07-risk-based-release-lanes.md
git commit -m "chore: add guarded release lane rollout evidence"
```

---

### Task 7: End-to-end candidate verification before enabling Fast Fix as blocking policy

**Files:**
- Modify only files found defective by this verification cycle; every defect requires its own regression first.

**Interfaces:**
- Input: one controlled Fast Fix candidate, one Normal candidate, one High Risk candidate.
- Output: evidence proving correct lane choice, PR isolation, preview exact-SHA verification and production readback semantics.

- [ ] **Step 1: Run the complete focused test suite**

```bash
node --test \
  tests/website-release-risk.test.mjs \
  tests/website-targeted-route-contract.test.mjs \
  tests/release-gate-contract.test.mjs \
  tests/production-release-readback.test.mjs \
  tests/release-lane-rollout-contract.test.mjs \
  tests/brain-delivery-system.test.mjs \
  tests/site-baseline-guardian.test.mjs \
  tests/live-preview-trigger-scope.test.mjs
```

Expected: all PASS.

- [ ] **Step 2: Run BRAIN chat-learning preflight**

```bash
node scripts/brain/chat-learning-preflight.mjs
```

Expected: output contains `status: READY`; otherwise stop material promotion and repair the preflight contract first.

- [ ] **Step 3: Validate three real diffs in observation mode**

Use repository history or controlled candidate branches to classify:

1. a page-local visual/interactivity fix -> `fast-fix` only if all files are explicitly owned;
2. a root HTML/content/SEO change -> `normal`;
3. shared menu/build/workflow change -> `high-risk`.

Record classifier JSON for all three in workflow artifacts or the change record.

- [ ] **Step 4: Prove concurrency isolation**

Start or inspect two independent PR validations and verify their concurrency groups are `release-gate-pr-<PR1>` and `release-gate-pr-<PR2>`, with neither cancelling or waiting on the other.

- [ ] **Step 5: Prove exact preview identity**

For the controlled Fast Fix PR, verify the Netlify deploy-preview status belongs to its exact head SHA before targeted browser verification starts.

- [ ] **Step 6: Prove production mismatch fails closed**

Run the production readback evaluator with a synthetic mismatched SHA and preserve the failing evidence. Do not simulate a real production mutation.

- [ ] **Step 7: Promote the policy only after observation evidence is green**

Change native branch protection to require the stable `release-gate` only when the connected GitHub capability has permission to make that administrative change and the observation evidence proves safety. If the available GitHub connection cannot modify branch protection, leave protection unchanged, mark this as the sole external governance action still required, and do not claim the migration is fully active.

- [ ] **Step 8: Final verification before completion claim**

Fetch the current branch head, all relevant GitHub Actions statuses and Netlify production status. Claim success only when the exact deployed SHA and route evidence satisfy the spec.

- [ ] **Step 9: Commit any verification-only documentation changes**

```bash
git add docs/changes/2026-09-07-risk-based-release-lanes.md
git commit -m "docs: record release lane verification evidence"
```

## Completion Definition

Implementation is complete only when all of the following are true:

- `fast-fix`, `normal` and `high-risk` classification is deterministic and unit-tested;
- unknown/shared paths cannot downgrade to Fast Fix;
- independent PRs have independent concurrency groups;
- Fast Fix still runs accepted baseline, static, exact-preview and targeted desktop/mobile browser verification;
- SEO-sensitive and shared changes escalate instead of bypassing broad checks;
- the stable `release-gate` is green only when the selected lane's required checks are green;
- exact production SHA readback exists and rejects mismatch;
- `Main Write Integrity` remains intact;
- BRAIN-DELIVERY-v2 independent delivery tests remain green;
- branch protection is either observably updated to the stable gate or explicitly reported as the remaining permission-bound action, never assumed;
- a release is called live only after `LIVE_VERIFIED` evidence.