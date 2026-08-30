# V18 Test Tagged Component Development Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Borg de geaccepteerde V18-testsite als vaste baseline en maak route- en componentontwikkeling tagbaar, scope-beperkt en veilig parallel uitvoerbaar.

**Architecture:** Eén machine-readable component/route-registry bepaalt source-, area-, component-, status- en baseline-tags. CI valideert de vijf V18→test samenvoegregels, scope-isolatie, behoud van productie-only routes, exacte V18-previewidentiteit en publieke bereikbaarheid. De Netlify deploy-preview blijft dedicated V18-testcomposer gebruiken; productie blijft ongemoeid.

**Tech Stack:** statische HTML/CSS/JS, Node.js test runner, GitHub Actions, Netlify deploy previews.

**Spec:** `docs/superpowers/specs/2026-08-30-v18-test-tagged-component-development-design.md`

## Global Constraints

- Geaccepteerde source commit blijft exact `195d30e411a327553f81be40815d4c0d8da4e98d`.
- Geaccepteerde source deploy blijft exact `6a918685f3737c0008ee981a`.
- Geen mutable deploy-preview alias als source of truth.
- Productiecomposer mag deploy-preview root niet overschrijven.
- Bestaande productiepagina blijft behouden als V18 geen vervangende pagina heeft.
- Geen 404, dode CTA of verdwenen productiepagina.
- Geen productie-merge zonder expliciete visuele/business-goedkeuring.
- Geen force-push of blind overschrijven van parallel werk.

---

### Task 1: Machine-readable V18 component registry

**Files:**
- Create: `site/v18-component-registry.json`
- Test: `tests/v18-component-registry.test.mjs`

**Interfaces:**
- Consumes: `site/v18-test-source.json`, huidige routes/bestanden.
- Produces: route records met `route`, `file`, `sourceTag`, `areaTags`, `componentTags`, `statusTag`, `baselineTag`, `reason`.

- [ ] **Step 1: Write failing test**

Test vereist geldige tagwaarden, unieke routes, bestaande files en verplichte reason.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/v18-component-registry.test.mjs`
Expected: FAIL omdat registry ontbreekt.

- [ ] **Step 3: Create registry**

Leg alle zichtbare V18/Meer kernroutes vast en classificeer elke route als `source:v18-leading`, `source:production-preserved` of `source:new-v18-authored`.

- [ ] **Step 4: Run test and verify GREEN**

Run: `node --test tests/v18-component-registry.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: add tagged V18 component registry`

### Task 2: V18 merge-rule guardian

**Files:**
- Create: `tests/v18-merge-rule-guardian.test.mjs`
- Modify: `.github/workflows/v18-test-route-integrity.yml`

**Interfaces:**
- Consumes: component registry, route files, `meer.html`, blog route.
- Produces: automated proof for all five merge rules.

- [ ] **Step 1: Write failing guardian tests**

Test source tags, preserve production routes, V18-authored missing-link routes, internal local href resolution and mandatory page existence.

- [ ] **Step 2: Run RED**

Run: `node --test tests/v18-merge-rule-guardian.test.mjs`
Expected: FAIL until registry/route policy is complete.

- [ ] **Step 3: Add minimal route/tag corrections**

Only fix missing classification/routes required by test.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/v18-merge-rule-guardian.test.mjs tests/v18-component-registry.test.mjs tests/v18-test-route-integrity.test.mjs tests/v18-preview-build-contract.test.mjs`
Expected: all PASS.

- [ ] **Step 5: Wire into exact-head CI and commit**

Commit: `ci: enforce V18 merge rules and component tags`

### Task 3: Parallel scope ownership guard

**Files:**
- Create: `site/v18-scope-policy.json`
- Create: `tools/check-v18-scope.mjs`
- Create: `tests/v18-scope-policy.test.mjs`

**Interfaces:**
- Consumes: component registry and changed file list supplied by CI/environment.
- Produces: deterministic allowed/blocked result for declared owned tags/scopes.

- [ ] **Step 1: Write failing tests**

Test that `component:mobile-menu` cannot silently edit pricing/page-content files and that disjoint scopes are allowed.

- [ ] **Step 2: Run RED**

Run: `node --test tests/v18-scope-policy.test.mjs`
Expected: FAIL because checker/policy absent.

- [ ] **Step 3: Implement minimal checker/policy**

Map files/routes to component/area scopes and reject undeclared cross-scope edits.

- [ ] **Step 4: Run GREEN**

Run: `node --test tests/v18-scope-policy.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

Commit: `feat: guard parallel V18 component scopes`

### Task 4: Immutable public V18 test identity gate

**Files:**
- Modify: `.github/workflows/v18-test-route-integrity.yml`
- Modify: `.github/workflows/v18-public-preview-smoke.yml`

**Interfaces:**
- Consumes: `site/v18-test-source.json`, exact PR head, Netlify preview.
- Produces: public reachability + V18 identity + route smoke evidence.

- [ ] **Step 1: Add failing contract assertion where needed**

Require source URL to be immutable deploy permalink, exact V18 markers and no production-only identity replacement.

- [ ] **Step 2: Run CI and observe RED if contract missing**

Use exact-head pull-request run.

- [ ] **Step 3: Apply minimal workflow changes**

No production configuration changes.

- [ ] **Step 4: Verify GREEN on exact SHA**

Require route integrity, public preview smoke, live preview smoke, config guard and source reachability success.

- [ ] **Step 5: Commit**

Commit: `ci: make accepted V18 public identity a hard gate`

### Task 5: Learning ledger and final verification

**Files:**
- Modify: `docs/bedrijfsgeheugen-learning-ledger.md`
- Modify: PR #259 body if necessary.

**Interfaces:**
- Consumes: all fresh verification results.
- Produces: durable incident/prevention record and visual-review-ready test candidate.

- [ ] **Step 1: Record root cause and prevention**

Record mutable alias confusion, production-composer overwrite risk, source pinning, component tags, scope guard and public-identity gate.

- [ ] **Step 2: Verify latest PR head**

Check PR head SHA, GitHub workflow results and exact Netlify commit_ref.

- [ ] **Step 3: Verify test URL**

Use immutable deploy permalink and accepted V18 source URL only; no mutable alias as source of truth.

- [ ] **Step 4: Keep PR draft/test-only**

Do not merge.

- [ ] **Step 5: Report actual state only**

No completion claim unless fresh exact-head verification proves it.
