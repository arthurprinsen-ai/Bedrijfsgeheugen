# Canonical SEO Footer Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make one canonical SEO-valid footer mandatory across every governed public page, preserve the restored V18 body outside the footer, and make the rule part of the shared agent brain and release gates.

**Architecture:** `.github/canoniek/voet.html` remains the single footer source. A focused build-time injector replaces zero-or-one existing marketing footer with exactly one canonical footer on governed public HTML, using a machine-readable exception file for non-marketing/noindex surfaces. Footer SEO rules are validated against `site/seo-baseline.json`, then preview and production smoke verify the exact rendered footer and live links. The contract is added to `AGENTS.md`, shared agent documentation and material outcome memory so every current and future agent inherits it.

**Tech Stack:** Static HTML, Node.js build tooling and node:test, Python SEO checker, GitHub Actions, Netlify deploy previews/production, repository shared-memory contracts.

**Spec:** `docs/superpowers/specs/2026-08-30-seo-footer-contract-design.md`

## Global Constraints

- `.github/canoniek/voet.html` is the only authoritative footer source.
- Every public/indexable website page must render exactly one canonical footer.
- Explicit exclusions must be machine-readable and contain route/file plus reason.
- The restored historical V18 body remains protected; only the footer region may change in this feature.
- Footer anchors and destinations must align with `site/seo-baseline.json` and may not create competing primary keyword ownership.
- Footer changes are SEO changes and require `component:footer` and `area:seo` scope.
- A footer change cannot promote while footer structure, route resolution, keyword ownership, technical SEO, preview smoke or production smoke is red.
- No security weakening, destructive data changes, credential changes, paid-resource increases or force-pushes.
- Exact-head/expected-head guards are required for promotion.

---

### Task 1: Machine-readable footer governance

**Files:**
- Create: `site/footer-contract.json`
- Test: `tests/footer-contract.test.mjs`

**Interfaces:**
- Consumes: `.github/canoniek/voet.html`, `site/seo-baseline.json`
- Produces: `site/footer-contract.json` with `canonicalSource`, `requiredScopes`, `governedGlobs`, `exceptions`, `strategicDestinations`, and `rules`.

- [ ] **Step 1: Write the failing contract test**

Create `tests/footer-contract.test.mjs` that asserts:
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const read = p => readFileSync(p, 'utf8');

test('footer contract is machine-readable and SEO governed', () => {
  assert.ok(existsSync('site/footer-contract.json'));
  const c = JSON.parse(read('site/footer-contract.json'));
  assert.equal(c.canonicalSource, '.github/canoniek/voet.html');
  assert.deepEqual(c.requiredScopes, ['component:footer', 'area:seo']);
  assert.equal(c.rules.exactlyOneFooter, true);
  assert.equal(c.rules.footerChangesRequireSeoGreen, true);
  assert.equal(c.rules.v18OnlyFooterMayChange, true);
  assert.ok(Array.isArray(c.exceptions));
  assert.ok(c.exceptions.every(x => x.file && x.reason));
  assert.ok(c.strategicDestinations.includes('/bedrijfsgeheugen'));
  assert.ok(c.strategicDestinations.includes('/afas-koppeling'));
  assert.ok(c.strategicDestinations.includes('/ai-governance'));
});
```

- [ ] **Step 2: Run RED**

Run:
`node --test tests/footer-contract.test.mjs`

Expected: FAIL because `site/footer-contract.json` does not yet exist.

- [ ] **Step 3: Add minimal contract**

Create `site/footer-contract.json` with:
```json
{
  "schemaVersion": 1,
  "status": "production-governance",
  "canonicalSource": ".github/canoniek/voet.html",
  "requiredScopes": ["component:footer", "area:seo"],
  "governedGlobs": ["*.html", "blog/*/index.html"],
  "exceptions": [
    {"file":"404.html","reason":"error surface"},
    {"file":"bedankt.html","reason":"post-conversion utility page"},
    {"file":"klantportaal.html","reason":"authenticated application shell"},
    {"file":"klantportaal-demo.html","reason":"application/demo shell"},
    {"file":"index-oud.html","reason":"non-canonical archived artifact"}
  ],
  "strategicDestinations": [
    "/bedrijfsgeheugen",
    "/bedrijfsprocessen-automatiseren",
    "/systemen-koppelen",
    "/afas-koppeling",
    "/exact-online-koppeling",
    "/twinfield-koppeling",
    "/api-koppeling-laten-maken",
    "/ai-adoptie",
    "/ai-governance",
    "/ai-act",
    "/data-soevereiniteit",
    "/benchmark",
    "/blog/",
    "/over-ons",
    "/contact",
    "/privacy"
  ],
  "rules": {
    "exactlyOneFooter": true,
    "footerChangesRequireSeoGreen": true,
    "anchorsMustMatchKeywordStrategy": true,
    "noDeadFooterLinks": true,
    "noKeywordCannibalization": true,
    "v18OnlyFooterMayChange": true
  }
}
```

- [ ] **Step 4: Run GREEN**

Run:
`node --test tests/footer-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit**

Commit message: `feat: define canonical SEO footer contract`

---

### Task 2: Deterministic canonical footer injector

**Files:**
- Create: `tools/apply-canonical-footer.mjs`
- Modify: `tools/bouw-v18-production.mjs`
- Modify: deploy-preview/test build entry point that produces governed HTML
- Test: `tests/footer-injection.test.mjs`

**Interfaces:**
- Consumes: `site/footer-contract.json`, `.github/canoniek/voet.html`
- Produces: `applyCanonicalFooter(html, file)` returning HTML with exactly one canonical footer for governed files and unchanged HTML for declared exceptions.

- [ ] **Step 1: Write RED tests**

Test these cases:
```js
assert.equal(countFooters(applyCanonicalFooter(htmlWithNoFooter, 'index.html')), 1);
assert.equal(countFooters(applyCanonicalFooter(htmlWithOldFooter, 'over-ons.html')), 1);
assert.match(applyCanonicalFooter(htmlWithOldFooter, 'over-ons.html'), /class="bgvoet"/);
assert.equal(applyCanonicalFooter(portalHtml, 'klantportaal.html'), portalHtml);
```
Also compare the normalized rendered footer to `.github/canoniek/voet.html`.

- [ ] **Step 2: Run RED**

Run:
`node --test tests/footer-injection.test.mjs`

Expected: FAIL because injector does not exist.

- [ ] **Step 3: Implement minimal injector**

Implement focused functions:
```js
export function normalizeFooter(html) { /* whitespace-only normalization */ }
export function applyCanonicalFooter(html, file) { /* exception check; replace existing footer or insert before </body> */ }
export async function applyCanonicalFootersToSite() { /* governed globs only */ }
```
Reject pages containing more than one existing marketing footer instead of silently picking one.

- [ ] **Step 4: Wire build order**

Production V18 order must be:
`historical V18 core -> persistent SEO head -> canonical footer -> verification`.

Preview/test must use the same footer injector after its page composition step so production and preview cannot drift.

- [ ] **Step 5: Run GREEN plus existing V18 tests**

Run:
`node --test tests/footer-injection.test.mjs tests/v18-production-promotion.test.mjs tests/v18-seo-layer.test.mjs tests/site-baseline-guardian.test.mjs`

Expected: all PASS.

- [ ] **Step 6: Commit**

Commit message: `feat: inject canonical footer across governed pages`

---

### Task 3: Footer SEO validation against keyword ownership

**Files:**
- Create: `tools/validate-footer-seo.mjs`
- Test: `tests/footer-seo.test.mjs`
- Modify: `.github/workflows/v18-production-promotion.yml`

**Interfaces:**
- Consumes: footer HTML, `site/footer-contract.json`, `site/seo-baseline.json`, route files/redirects.
- Produces: exit code 0 only when footer route, anchor and keyword-owner rules are valid; detailed errors otherwise.

- [ ] **Step 1: Write RED tests**

Cover failures for:
- footer link to nonexistent route;
- strategic destination missing;
- duplicate conflicting anchor ownership for the same primary intent;
- footer containing a forbidden `javascript:`/empty destination;
- missing privacy/contact identity block.

- [ ] **Step 2: Run RED**

Run:
`node --test tests/footer-seo.test.mjs`

Expected: FAIL because validator does not exist.

- [ ] **Step 3: Implement validator**

Parse footer href/text pairs; resolve routes using real HTML files plus `_redirects`; compare strategic routes against `site/seo-baseline.json`; emit messages in the form:
`FOOTER_SEO_ERROR file=<file> href=<href> keyword=<keyword-or-none> rule=<rule>`.

- [ ] **Step 4: Add to promotion gate**

Add commands before promotion:
`node tools/validate-footer-seo.mjs`
and
`node --test tests/footer-contract.test.mjs tests/footer-injection.test.mjs tests/footer-seo.test.mjs`.

Do not replace or weaken the existing full SEO checker.

- [ ] **Step 5: Run GREEN**

Run the complete V18 Production Promotion test command plus `node tools/validate-footer-seo.mjs`.

Expected: PASS with zero footer SEO errors.

- [ ] **Step 6: Commit**

Commit message: `test: block footer changes that violate SEO ownership`

---

### Task 4: Preserve V18 outside the footer

**Files:**
- Modify: `tests/v18-seo-layer.test.mjs` or create `tests/v18-footer-boundary.test.mjs`

**Interfaces:**
- Consumes: exact historical V18 reconstruction and canonical footer injector.
- Produces: regression proof that only the footer region changes.

- [ ] **Step 1: Write regression test**

Strip `<footer class="bgvoet">...</footer>` from pre/post HTML and assert the remaining `<body>` is byte-identical. Assert the post-build footer normalizes to the canonical source.

- [ ] **Step 2: Prove test fails against a deliberately altered non-footer body fixture**

Expected: FAIL on body drift.

- [ ] **Step 3: Run against real build**

Expected: PASS when only footer differs.

- [ ] **Step 4: Commit**

Commit message: `test: protect V18 body outside canonical footer`

---

### Task 5: Public preview and production footer smoke

**Files:**
- Modify: `.github/workflows/live-preview-smoke.yml`
- Modify: `.github/workflows/production-seo-smoke.yml`
- Test: `tests/footer-public-smoke-contract.test.mjs`

**Interfaces:**
- Consumes: exact PR deploy-preview URL and `https://www.bedrijfsgeheugen.nl/`.
- Produces: release evidence for exact footer identity and live footer routes.

- [ ] **Step 1: Write RED workflow-contract test**

Require both workflows to fetch the canonical footer signature, verify exactly one `bgvoet`, and curl every footer href that is internal and expected to be public.

- [ ] **Step 2: Run RED**

Expected: FAIL until workflows contain the footer checks.

- [ ] **Step 3: Add preview checks**

After Netlify exact-head readiness, fetch `/`, `/over-ons`, `/bedrijfsgeheugen`, `/blog/` and representative strategic pages. Verify same normalized footer signature and no footer 404s.

- [ ] **Step 4: Add production checks**

On push to `main`, wait for production deploy whose `commit_ref` equals `github.sha`; then verify the same footer contract against live `www`.

- [ ] **Step 5: Run workflow-contract tests**

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `ci: verify canonical SEO footer on preview and production`

---

### Task 6: Make the rule part of the agent brain

**Files:**
- Modify: `AGENTS.md`
- Modify: `docs/development-operating-system.md`
- Modify: `docs/development-ledger.md`
- Create: `docs/canonical-seo-footer.md`
- Test: `tests/shared-footer-agent-contract.test.mjs`

**Interfaces:**
- Consumes: spec, machine contract and validation commands.
- Produces: mandatory read/behavior contract for every current/future agent.

- [ ] **Step 1: Write RED agent-contract test**

Assert `AGENTS.md` explicitly contains:
- `Canonical SEO Footer Contract`;
- `.github/canoniek/voet.html`;
- `site/footer-contract.json`;
- `component:footer`;
- `area:seo`;
- requirement that footer changes cannot promote when SEO gate is red;
- material outcome type `CONTRACT_CHANGE` or `IMPROVEMENT` writeback.

- [ ] **Step 2: Run RED**

Run:
`node --test tests/shared-footer-agent-contract.test.mjs`

Expected: FAIL before docs are updated.

- [ ] **Step 3: Update agent brain docs**

Add a section to `AGENTS.md` stating that every current/future agent must read and obey the footer contract before modifying footer, navigation-linked SEO architecture, build composition, or keyword ownership. Add `docs/canonical-seo-footer.md` to the mandatory read chain for relevant website/SEO tasks.

Document self-heal behavior: restore canonical footer automatically for structural drift; do not autonomously change keyword ownership without a tested contract change.

- [ ] **Step 4: Record ledger outcome**

Append a `CONTRACT_CHANGE` entry with spec path, implementation plan path, reason, invariants, tests, and expected production evidence.

- [ ] **Step 5: Run GREEN**

Run:
`node --test tests/shared-footer-agent-contract.test.mjs tests/shared-agent-memory.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

Commit message: `docs: make SEO footer contract part of agent brain`

---

### Task 7: Shared Powerhouse memory writeback

**Files/Systems:**
- Repository shared-memory mechanism documented by the existing shared-agent-memory design.
- Powerhouse Direct Knowledge Base shared memory record.

**Interfaces:**
- Consumes: final contract, final test evidence and production deploy evidence.
- Produces: shared material outcome visible to agents as `CONTRACT_CHANGE` and, after production, `PRODUCTION_PROMOTION`.

- [ ] **Step 1: Write repository memory event**

Record fingerprint `canonical-seo-footer-v1`, owner `website-seo`, scopes `component:footer` + `area:seo`, canonical source, machine contract, validator, allowed auto-repair and hard boundary for semantic keyword-owner changes.

- [ ] **Step 2: Write the same facts to shared Powerhouse knowledge**

Use the existing shared-memory/Notion path; do not create a second competing knowledge base.

- [ ] **Step 3: Verify discoverability**

Search/read shared team context using `canonical-seo-footer-v1` and prove the contract is returned for a future-agent style query about changing the footer.

- [ ] **Step 4: Commit any repository-side memory index update**

Commit message: `chore: publish canonical footer contract to shared memory`

---

### Task 8: Exact-head promotion and final verification

**Files:** no new feature files unless a failure exposes a root cause.

**Interfaces:**
- Consumes: green candidate PR SHA.
- Produces: exact production deploy and live evidence.

- [ ] **Step 1: Run full local/CI contract set**

Required: footer tests, V18 promotion tests, site baseline guardian, complete SEO checker, shared memory tests.

- [ ] **Step 2: Verify exact Netlify deploy-preview SHA**

Require Netlify `commit_ref == PR head SHA` and state `ready`.

- [ ] **Step 3: Verify public preview**

Check representative pages all have the same canonical footer, footer links resolve, V18 outside-footer identity remains intact, and technical SEO remains green.

- [ ] **Step 4: Refetch PR head and main**

Merge only with `expected_head_sha` if the PR remains mergeable and no concurrent main movement invalidates the candidate.

- [ ] **Step 5: Verify exact production deploy**

Require production Netlify `commit_ref == merge SHA`, state `ready`, then run the real production footer/SEO smoke.

- [ ] **Step 6: Write final material outcomes**

Write `IMPROVEMENT` + `PRODUCTION_PROMOTION` with exact SHA/deploy ID, tests, public URL evidence and prevention rule. If production is red, write `PRODUCTION_ROLLBACK`, restore last-known-good and continue recovery.
