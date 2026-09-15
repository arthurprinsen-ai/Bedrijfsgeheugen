# Portal V2 demoAI dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `https://www.bedrijfsgeheugen.nl/klantportaal?klant=demoAI` render the approved Bedrijfsgeheugen management-cockpit design, using the existing Portal V2 and existing demo dashboard capability.

**Architecture:** Reuse Portal V2 and its existing `overview-demo.js` dashboard. Extend demo-route detection so the legacy `demoAI` query route receives canonical demo state, add a route-scoped visual theme that matches the supplied screenshot, and keep all existing Portal V2 page routing/data modules intact. No second portal, database, brain, or learning store is introduced.

**Tech Stack:** Static HTML/CSS, ES modules, Netlify redirects/deploy, Node built-in test runner, GitHub Actions.

**Spec:** User-supplied management-cockpit screenshot and the existing `/portal-v2/modules/overview-demo.js` implementation.

## Global Constraints

- EXISTING-STATE-FIRST / REUSE-FIRST / CANONICAL-INTEGRATION / CLOSED-LOOP.
- `/klantportaal?klant=demoAI` remains the public demo URL and continues to rewrite to Portal V2.
- Demo fixtures must never leak into authenticated non-demo customer routes.
- Existing Portal V2 navigation, page shell, Data & AI, compliance, CSRD and Powerhouse modules remain available.
- Production status is only `LIVE & BEWEZEN` after merge/deploy plus public URL readback.

---

### Task 1: Lock the demoAI route contract

**Files:**
- Create: `tests/portal-v2-demoai-route.test.mjs`
- Modify: `portal-v2/portal-state.js`

**Interfaces:**
- Consumes: `isPortalDemoRoute(pathname, search)` and `createPortalStateClient(...)`.
- Produces: demoAI query recognition and demo snapshots with `state.portal.klant === 'demo'`.

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { isPortalDemoRoute, createPortalStateClient } from '../portal-v2/portal-state.js';

test('legacy demoAI query is a demo route', () => {
  assert.equal(isPortalDemoRoute('/klantportaal', '?klant=demoAI'), true);
  assert.equal(isPortalDemoRoute('/klantportaal', '?klant=ijsselmonde'), false);
});

test('demo client publishes canonical demo marker', async () => {
  const client = createPortalStateClient({ demoMode: true, customerMode: false });
  const snap = await client.load();
  assert.equal(snap.mode, 'authenticated');
  assert.equal(snap.state.portal.klant, 'demo');
});
```

- [ ] **Step 2: Verify RED in CI**

Open the PR with only the test commit and confirm the relevant Node test/Required workflow fails because the current route function accepts only pathname and the demo state has no canonical `portal.klant` marker.

- [ ] **Step 3: Implement the minimal route/state change**

Update `isPortalDemoRoute` to recognize `/portaal/demo` and `/klantportaal?klant=demoAI` case-insensitively. Normalize cloned demo state through one helper that adds `portal.klant: 'demo'` before publish/write readback.

- [ ] **Step 4: Verify GREEN**

Confirm the route test and repository required checks pass.

### Task 2: Apply the approved screenshot design without duplicating the portal

**Files:**
- Create: `portal-v2/demoai-dashboard.css`
- Modify: `portal-v2/portal-state.js`

**Interfaces:**
- Consumes: the existing `.ovz*`, `.sidebar`, `.topbar`, `.main`, `.nav`, `.dashboard`, `.lower`, `.activities` DOM contracts.
- Produces: route-scoped class `portal-demo-ai` and stylesheet load only for the demoAI/demo route.

- [ ] **Step 1: Add acceptance assertions**

Extend the route test to read `demoai-dashboard.css` and assert it contains `.portal-demo-ai`, `.ovz`, `.sidebar`, `.topbar`, and responsive media rules.

- [ ] **Step 2: Verify RED**

Confirm CI fails because the stylesheet does not yet exist.

- [ ] **Step 3: Implement the stylesheet**

Create a dark navy 224px sidebar, light-grey cockpit canvas, compact white bordered cards, screenshot-like blue accent, dashboard grid, radar/donut/sparkline styling, right action rail, 1536px desktop density, and responsive collapse for tablet/mobile. Hide the old generic V2 dashboard blocks only on the demo route so the existing `overview-demo.js` cockpit becomes the single overview surface.

- [ ] **Step 4: Route-scope the stylesheet**

When the demo route is detected, add `portal-demo-ai` to `document.documentElement` and append `./demoai-dashboard.css` once. Do not affect normal customer routes.

- [ ] **Step 5: Verify GREEN**

Confirm CI and public preview contain the expected design markers and no JavaScript runtime failure.

### Task 3: Document and production-prove the change

**Files:**
- Create: `docs/powerhouse/portal-v2-demoai-dashboard-2026-09-15.md`

**Interfaces:**
- Consumes: merge SHA, Netlify deployment state, public URL readback.
- Produces: canonical implementation/evidence note for the Powerhouse documentation lineage.

- [ ] **Step 1: Document scope and authority**

Record the public route, Portal V2 authority, reused demo dashboard, changed files, isolation rule, rollback path, test contract, and acceptance criteria.

- [ ] **Step 2: Merge after required checks**

Merge the PR only when the relevant required checks are green.

- [ ] **Step 3: Verify Netlify production**

Read back `https://www.bedrijfsgeheugen.nl/klantportaal?klant=demoAI` after deploy and verify the cockpit title/content and route-specific assets are served.

- [ ] **Step 4: Powerhouse writeback**

Write the change/evidence to the existing Powerhouse learning/documentation authority when the connected Supabase/Notion schema supports it; otherwise keep the repository canonical evidence note and report the exact remaining writeback obligation.
