# Protected Website Baseline Restoration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Herstel de inhoudelijk juiste Bedrijfsgeheugen-pagina's en maak semantic content drift voortaan release-blocking en self-healing.

**Architecture:** Een versioned accepted-baseline manifest beschermt route-identiteit, inhoudsankers, SEO en navigatie. Restauratie gebeurt selectief per route vanuit aantoonbare Git-historie op de actuele technische basis; een guardian blokkeert niet-gescopeerde contentdrift.

**Tech Stack:** Statische HTML, Node.js contracttests, GitHub Actions, Netlify/V18 build pipeline.

**Spec:** `docs/superpowers/specs/2026-08-29-site-baseline-restoration-design.md`

## Global Constraints

- Geen nieuwe marketingcopy tijdens herstel.
- Geen volledige repository rollback.
- Behoud latere SEO-, Brain-, security-, portal- en infrastructuurverbeteringen wanneer additief mogelijk.
- Beschermde content mag alleen wijzigen via expliciete scope.
- Productiepromotie vereist baseline guardian + V18 contract + live browser smoke + Pagina/SEO groen.

---

### Task 1: Reconstruct accepted content sources

**Files:**
- Create: `site/accepted-baseline.json`
- Create: `docs/development-ledger-events/2026-08-29-semantic-content-drift.md`

**Interfaces:**
- Consumes: Git history and current primary-route catalog.
- Produces: route-level accepted source refs and required content anchors.

- [ ] **Step 1:** Audit primary routes against Git history and identify replacement commits.
- [ ] **Step 2:** Record only evidence-backed accepted source refs; mark routes with no semantic drift as current-source.
- [ ] **Step 3:** Add `/over-ons` anchors proving the original story/why, belief-in-practice and the three values.
- [ ] **Step 4:** Commit the manifest and incident evidence.

### Task 2: Restore semantic-drifted pages

**Files:**
- Modify: `over-ons.html`
- Modify only other route files where Task 1 proves semantic replacement drift.

**Interfaces:**
- Consumes: `site/accepted-baseline.json` source refs.
- Produces: current technical pages with accepted semantic content restored.

- [ ] **Step 1:** Write failing regression assertions for accepted semantic anchors.
- [ ] **Step 2:** Run test and confirm RED against current content.
- [ ] **Step 3:** Restore exact evidence-backed page content while preserving additive technical/SEO integrations.
- [ ] **Step 4:** Run regression and page/SEO tests to GREEN.
- [ ] **Step 5:** Commit restoration.

### Task 3: Protect navigation identity

**Files:**
- Create: `site/navigation-baseline.json`
- Create/modify: `tests/site-baseline-guardian.test.mjs`

**Interfaces:**
- Consumes: accepted route catalog and current desktop/mobile menu sources.
- Produces: equality contract for route + label + group.

- [ ] **Step 1:** Write failing tests for missing/extra/replaced protected navigation routes.
- [ ] **Step 2:** Generate accepted navigation catalog from evidence-backed IA.
- [ ] **Step 3:** Make desktop/mobile navigation expose the same accepted route set without inventing pages.
- [ ] **Step 4:** Run guardian GREEN.

### Task 4: Enforce explicit content scope

**Files:**
- Create: `site/change-scope.schema.json`
- Modify: `tests/site-baseline-guardian.test.mjs`
- Modify: `.github/workflows/v18-production-promotion.yml`

**Interfaces:**
- Consumes: accepted baseline and optional `site/change-scope.json`.
- Produces: release-blocking semantic drift detection.

- [ ] **Step 1:** Add RED test proving a protected page replacement without scope fails.
- [ ] **Step 2:** Implement normalized-content hashing and required-anchor checks.
- [ ] **Step 3:** Add guardian to production promotion workflow.
- [ ] **Step 4:** Run full production contract GREEN.

### Task 5: Self-heal and learn

**Files:**
- Modify: `docs/self-healing-agents.md`
- Modify: `AGENTS.md`
- Modify: `docs/development-ledger.md`

**Interfaces:**
- Consumes: guardian failure report.
- Produces: permanent rule that semantic drift triggers block → restore LKG → retest → ledger/memory writeback.

- [ ] **Step 1:** Add semantic-drift failure class and repair loop.
- [ ] **Step 2:** Require agents to preserve accepted content outside declared scope.
- [ ] **Step 3:** Record this incident/root cause/regression rule in shared development memory.
- [ ] **Step 4:** Run shared-agent-memory/configuration guards.

### Task 6: Verify preview and promote exact SHA

**Files:**
- No content changes except evidence/ledger updates required by existing governance.

**Interfaces:**
- Consumes: exact restoration candidate SHA.
- Produces: verified preview and, only when all gates are green, production promotion.

- [ ] **Step 1:** Run baseline guardian, V18 Production Promotion, Live Preview Smoke, Pagina-/SEO-controle and Shared Agent Memory.
- [ ] **Step 2:** Inspect `/over-ons` in browser preview for restored story/values and correct navigation.
- [ ] **Step 3:** Merge/promote with expected-head lock only if exact candidate is green.
- [ ] **Step 4:** Verify Netlify production `commit_ref` equals merged SHA and runtime still satisfies baseline.
