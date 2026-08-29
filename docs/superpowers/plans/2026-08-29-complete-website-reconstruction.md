# Complete Website Reconstruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconstruct the complete Bedrijfsgeheugen test website from accepted evidence and make route/content/navigation loss mechanically impossible to accept as green.

**Architecture:** Introduce one machine-readable website catalog as the source of truth, audit all existing/prototype/navigation routes into explicit states, restore strategic pages from accepted sources, and drive baseline/browser/navigation checks from that catalog. Keep the current V18 shared shell/menu as the single navigation implementation and keep production isolated until visual/business approval.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js `.mjs` verification tools, Playwright, GitHub Actions, Netlify.

**Spec:** `docs/superpowers/specs/2026-08-29-complete-website-reconstruction-design.md`

## Global Constraints

- Production remains unchanged until exact-candidate technical gates and required visual/business approval are green.
- Pricing requires explicit business approval.
- Current V18 shared navigation is the only mobile navigation owner.
- Existing Brain/security/AI-governance controls may not be weakened.
- File presence alone never proves a page is restored.
- Every write uses current-head/SHA guards; never force-push over concurrent agent work.

---

### Task 1: Build the complete route inventory and failing completeness test

**Files:**
- Create: `site/website-catalog.json`
- Create: `tools/audit-website-catalog.mjs`
- Create: `tests/website-catalog.test.mjs`
- Read: `site/accepted-baseline.json`, `site/navigation-baseline.json`, `sitemap.xml`, shared header/footer/menu sources, PR110 prototype evidence.

**Interfaces:**
- Produces `site/website-catalog.json` entries with `route`, `group`, `file`, `state`, `sources`, `requiredAnchors`, `navigation`, `children`, `approval`.
- `tools/audit-website-catalog.mjs` exits non-zero for unexplained discovered routes or invalid catalog entries.

- [ ] Write a test that discovers hrefs/routes from navigation baseline, sitemap and shared shell and fails when a discovered internal route is absent from the catalog.
- [ ] Run `node --test tests/website-catalog.test.mjs` and verify RED against the incomplete catalog.
- [ ] Populate the catalog with every discovered route and explicit state; do not silently classify unknown routes as accepted.
- [ ] Run the test and audit until GREEN.
- [ ] Commit only inventory/audit/test changes.

### Task 2: Replace presence-only acceptance with semantic route contracts

**Files:**
- Modify: `site/website-catalog.json`
- Modify: `site/accepted-baseline.json`
- Modify: `tests/site-baseline-guardian.test.mjs`
- Modify: `tools/apply-site-baseline.mjs` only where deterministic restoration is supported by accepted evidence.

**Interfaces:**
- Consumes Task 1 catalog.
- Produces explicit semantic requirements for all primary and strategic routes.

- [ ] Write failing tests proving `presence-seo` is insufficient for primary/strategic pages.
- [ ] Add semantic anchors and accepted source evidence for each strategic route.
- [ ] Add `/over-ons` anchors `Ons verhaal`, `Onze missie`, `Onze ambitie`, `Ons geloof`.
- [ ] Run baseline tests to GREEN without changing unrelated business copy.
- [ ] Commit semantic-contract changes.

### Task 3: Restore primary website pages to accepted versions

**Files:**
- Modify as required: `problemen.html`, `oplossingen.html`, `bedrijfsgeheugen.html`, `prijzen.html`, `cases.html`, `kennis.html`, `over-ons.html`, `inloggen.html`, `aanmelden.html`.
- Modify accepted fragments under `site/accepted-pages/` where source-backed.
- Test: `tests/integration/v18-live-runtime.spec.js`, `tests/site-baseline-guardian.test.mjs`.

**Interfaces:**
- Consumes semantic contracts.
- Produces complete primary pages using the shared shell.

- [ ] Add/extend failing route tests for every primary page and required anchor.
- [ ] Restore pages from accepted source evidence; preserve current security/runtime integrations.
- [ ] Implement the approved Over ons sequence: Verhaal → Missie → Ambitie → Geloof.
- [ ] Verify no second mobile menu/drawer implementation is introduced.
- [ ] Run Node baseline tests and Playwright route tests to GREEN.
- [ ] Commit primary-page restoration.

### Task 4: Restore product, scans, solutions and audience pages

**Files:**
- Modify only catalog-listed pages in product/operating-model, solutions and audiences groups.
- Test: `tests/website-catalog.test.mjs`, `tests/integration/v18-live-runtime.spec.js`.

**Interfaces:**
- Produces source-backed content for `/product`, `/hoe-het-werkt`, `/frisse-blik`, `/zelfscan`, `/ai-scan`, `/afmaakindex`, `/monitor`, `/benchmark`, `/expertises`, `/systemen-koppelen`, `/ai-adoptie`, `/ai-marketing-mkb`, `/due-diligence`, `/voor-mkb`, `/investeerders-ma` and any additional discovered routes in these groups.

- [ ] Add failing browser/semantic tests for routes currently marked wrong/missing/legacy-review.
- [ ] Restore accepted content and shared shell route by route.
- [ ] Preserve portal/Bedrijfsgeheugen, Business Operating Intelligence/bedrijfsbesturing, scans, evidence and proposition content where accepted evidence contains them.
- [ ] Run tests after each coherent route group; keep business-sensitive changes flagged for approval.
- [ ] Commit the restored route groups.

### Task 5: Restore knowledge, governance and integration pages

**Files:**
- Modify catalog-listed knowledge/governance/integration HTML files.
- Test: `tests/website-catalog.test.mjs`, SEO/link checker tests, Playwright smoke.

**Interfaces:**
- Produces valid routes for blog/governance/knowledge and AFAS/Exact/Twinfield/Webshop/API integration content.

- [ ] Write failing tests for missing/wrong-version routes and internal-link targets.
- [ ] Restore source-backed content without weakening AI Act/data-sovereignty messaging or governed AI runtime.
- [ ] Verify canonical URLs, titles, descriptions and internal links.
- [ ] Run SEO/link/browser tests to GREEN.
- [ ] Commit knowledge/integration restoration.

### Task 6: Make navigation, megamenu and footer derive from one route truth

**Files:**
- Modify: `site/navigation-baseline.json`
- Modify shared navigation/footer sources only as necessary.
- Modify: `assets/js/menu.js` only if catalog parity requires it; do not create another menu owner.
- Test: navigation/browser tests.

**Interfaces:**
- Consumes catalog navigation placement.
- Produces parity across desktop header, mobile drilldown, megamenu and footer.

- [ ] Write failing parity tests comparing catalog placements with rendered desktop/mobile/footer links.
- [ ] Correct missing/stale navigation links using existing shared V18 components.
- [ ] Test mobile root, drilldown, Back, Escape, close-on-link and desktop parity.
- [ ] Run browser tests to GREEN.
- [ ] Commit navigation parity changes.

### Task 7: Add exact-preview-SHA verification and self-healing guard

**Files:**
- Modify: `.github/workflows/live-preview-smoke.yml` or current equivalent.
- Modify/create verification helper under `tools/`.
- Modify self-healing/ledger documentation where required.

**Interfaces:**
- Produces a preview verification that checks the publicly accessible URL itself and exact candidate SHA before reporting success.

- [ ] Write a failing contract test reproducing the prior false-green state: GitHub Netlify status success while the public preview URL returns 404/wrong candidate.
- [ ] Add exact-SHA/public-fetch verification and fail closed on mismatch/404.
- [ ] Add recovery logging so agents retry/redeploy based on a new hypothesis rather than handing out a broken URL.
- [ ] Run workflow/unit contract tests to GREEN.
- [ ] Commit preview guard.

### Task 8: Full candidate verification and visual/business handoff

**Files:**
- Update: reconstruction ledger/report generated from catalog.
- No production content writes in this task.

**Interfaces:**
- Produces exact candidate SHA, public preview URL, route audit, visual artifacts and approval list.

- [ ] Run catalog audit and confirm zero unexplained route gaps.
- [ ] Run baseline, SEO, Shared Agent Memory, Business OS, V18 promotion and Live Preview gates on the exact head.
- [ ] Fetch and browser-test the public preview URL independently.
- [ ] Capture desktop/mobile visual artifacts for primary pages and business-sensitive pages.
- [ ] Report only unresolved visual/business decisions, including pricing; do not merge while any required approval is outstanding.
- [ ] Commit recovery/audit evidence to the candidate branch.

### Task 9: Production promotion after explicit approval

**Files:**
- Promotion/ledger records only; production code is the already-verified candidate.

**Interfaces:**
- Produces exact GitHub main ↔ Netlify production SHA convergence or immediate rollback.

- [ ] Rebase/reverify against current main if main moved.
- [ ] Require exact-head gates green after any rebase/merge-base change.
- [ ] Merge only after explicit visual/business approval.
- [ ] Verify Netlify production is `ready` at the exact merge SHA and smoke all protected routes.
- [ ] On any production regression, rollback to last-known-good and continue repair.
- [ ] Record `PRODUCTION_PROMOTION` or `PRODUCTION_ROLLBACK` in shared memory/ledger.
