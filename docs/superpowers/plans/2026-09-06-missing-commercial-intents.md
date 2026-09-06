# Missing Commercial Intent Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining material commercial-intent gaps without creating thin or cannibalizing pages.

**Architecture:** Reuse the current Bedrijfsgeheugen static-page shell and shared `assets/stijl.js` conversion runtime. Consolidate overlapping intents onto one canonical owner; create only five new canonical service pages. Every page is production-gated by canonical/H1/metadata, price-or-price-logic, evidence, objections, ownership/no-lock-in, CTA and the shared money-page conversion contract.

**Tech Stack:** Static HTML, shared CSS/JS, Node built-in test runner, Netlify deploy previews.

**Spec:** `organic-money-page-intent-to-order-coverage-v1`

## Global Constraints
- Preserve existing navigation, accepted content and existing canonical pages.
- Do not create a separate `AI automatisering mkb` page; canonicalize that sub-intent to `/ai-implementatie-mkb`.
- Reuse `/api-koppeling-laten-maken`, `/data-soevereiniteit` and `/ai-governance` instead of duplicating them.
- New commercial routes: `/ai-implementatie-mkb`, `/kennis-borgen-bedrijf`, `/microsoft-365-koppeling`, `/power-bi-implementatie-mkb`, `/bedrijf-overdraagbaar-maken`.
- Every route must load `/assets/stijl.js` and be registered in its money-page conversion map.
- No unsubstantiated customer names, guaranteed ROI or invented case metrics.

---

### Task 1: Regression gate
**Files:** Create `tests/missing-commercial-intents.test.mjs`.
- [ ] Assert all five HTML files exist.
- [ ] Assert each file contains exact canonical, H1, meta description, price/scope language, evidence, objection, ownership/no-lock-in and `/assets/stijl.js`.
- [ ] Assert `assets/stijl.js` registers all five routes.
- [ ] Assert no `/ai-automatisering-mkb` page is created.

### Task 2: Build five canonical money pages
**Files:** Create the five route HTML files.
- [ ] Use one clear buying question per page.
- [ ] Include problem, deliverable, method, evidence standard, price/scope, objections, ownership, FAQ and CTA.
- [ ] Link to relevant existing Bedrijfsgeheugen pages for proof/context.
- [ ] Load the shared site and conversion runtime.

### Task 3: Extend shared conversion contract
**Files:** Modify `assets/stijl.js`.
- [ ] Add intent-specific price/time/proof/objection/ownership/CTA metadata for all five routes.
- [ ] Keep existing routes unchanged.

### Task 4: Registry reconciliation
**System:** Notion money-page registry.
- [ ] Change API/data-sovereignty/AI-governance records from Build to Optimize and point to existing canonical URLs.
- [ ] Point `AI automatisering mkb` to `/ai-implementatie-mkb` and mark as Consolidate/Optimize rather than separate Build.
- [ ] Set the five new route URLs after production verification; keep verification gates false until live readback.

### Task 5: Release verification
- [ ] Run the regression test in CI.
- [ ] Require Netlify deploy preview `ready` and secret scan clean.
- [ ] Merge only the exact tested SHA.
- [ ] Verify production deploy commit equals merge SHA and all five live URLs return the expected canonical/H1/conversion runtime before marking Verified.