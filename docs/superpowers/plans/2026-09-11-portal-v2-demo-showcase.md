# Portal V2 Demo Showcase Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish one safe, fully populated Portal V2 customer demo at `/portaal/demo` while preserving authenticated tenant isolation for real customer portals.

**Architecture:** Keep Portal V2 as the single shell. Add a local in-memory demo fixture selected only by the explicit demo route. The demo client never calls `/api/portal-state`; writes remain session-only and reset on reload. Add specific Netlify rewrites before the generic `/portaal` redirect. Real customer data continues to come only from the existing authenticated portal-state API.

**Tech Stack:** ES modules, Node test runner, Netlify redirects, existing Portal V2 domain-state/runtime.

**Spec:** `docs/superpowers/specs/2026-09-11-portal-v2-project-navigation-design.md`

## Global Constraints

- Never use the URL slug as authorization for real tenant data.
- Demo contains only fictional data.
- Demo must not call the authenticated state API.
- Demo mutations are ephemeral and reset on reload.
- Existing `?page=` / `?hub=` routing and Portal V2 navigation stay canonical.
- Merge only with required CI green; verify the production deployment and live demo URL after merge.

---

## Task 1: Demo state contract

- [ ] Add `portal-v2/demo-state.js` with a realistic fictional company, project, offer, financials, build items, integrations, tasks, documents, notes, team and activity.
- [ ] Add contract tests proving the fixture contains the project-cockpit data required by `project-overview.js` and contains no IJsselmonde identifier.
- [ ] Run the targeted Node test and confirm RED before implementation, then GREEN after implementation.

## Task 2: Isolated demo state client

- [ ] Add a failing unit test for explicit `/portaal/demo` detection, no network call on load/write, session-only writes, and normal API behavior outside demo mode.
- [ ] Update `portal-v2/portal-state.js` so the demo route returns the fixture through the existing state-client contract without authentication/network access.
- [ ] Keep normal authenticated state behavior unchanged.
- [ ] Run targeted tests GREEN.

## Task 3: Production routes

- [ ] Add failing redirect assertions for `/portaal/demo` → `/portal-v2/` as a 200 rewrite and `/portaal/ijsselmonde` → `/portal-v2/` as a 200 rewrite before generic `/portaal`.
- [ ] Update `_redirects` with exact routes; neither route may encode authorization.
- [ ] Run routing tests GREEN.

## Task 4: Regression and release

- [ ] Run the Portal V2/state/routing targeted test set.
- [ ] Push PR and require GitHub Actions `test` to pass on the exact head SHA.
- [ ] Squash merge to main with expected head SHA.
- [ ] Verify main points to the merge commit.
- [ ] Verify Netlify production deploy serves that commit.
- [ ] Read back `https://bedrijfsgeheugen.nl/portaal/demo` and confirm Portal V2 plus fictional demo branding/data.
- [ ] Verify `https://bedrijfsgeheugen.nl/portaal/ijsselmonde` does not expose demo data and still relies on authenticated server state.
