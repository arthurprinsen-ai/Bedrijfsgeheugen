# LinkedIn Revenue Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a protected, mobile-first LinkedIn Revenue Cockpit that shows at most 12 evidence-backed next actions from the existing Notion/Powerhouse commercial state.

**Architecture:** Put the UI under the existing `/intern/*` Netlify Edge authentication boundary. Keep all real CRM/DM data out of the public repository; a server-side Netlify function reads the four existing Notion data sources with the already configured `NOTION_TOKEN`, normalizes/ranks candidates through a pure module, and returns only authenticated `no-store` JSON. The UI remains human-in-the-loop for LinkedIn execution.

**Tech Stack:** static HTML/CSS/ES modules, Netlify Functions, Notion API, Node 22 contract/unit tests, GitHub Actions, existing BRAIN delivery gates.

**Spec:** `docs/superpowers/specs/2026-09-08-linkedin-revenue-cockpit-design.md`

## Global Constraints
- Existing Bedrijfsgeheugen architecture only; no parallel CRM.
- Max 12 priority actions.
- Real contact/DM data never committed to this public repo.
- Existing `/intern/*` Basic Auth plus independent function auth.
- LinkedIn actions remain human-executed.
- No scraping, auto-comments, auto-DMs or DOM overlays.
- `linkedin.com/feed/` is never a concrete evidence source.
- Fail closed on missing post/thread/person context.
- No secret or permission changes.

---

### Task 1: Release and runtime contract tests
**Files:** `tests/linkedin-revenue-cockpit.test.mjs`, create `tests/linkedin-revenue-runtime.test.mjs`, modify `.github/workflows/linkedin-revenue-cockpit-tests.yml`.

- [x] Add route/UI contract test and prove RED on PR #1186 before implementation.
- [ ] Add pure runtime tests for evidence gating, ranking cap and Basic Auth comparison.
- [ ] Run the PR workflow and verify the missing implementation keeps RED.

### Task 2: Decision engine
**Files:** Create `platform/linkedin-revenue-cockpit.mjs`.

**Interfaces:** exports `isConcreteLinkedInSource(url)`, `isSendReady(candidate)`, `scoreCandidate(candidate)`, `buildPriorityQueue(candidates,{limit})`, `basicAuthMatches(header,user,password)` and Notion property helpers.

- [ ] Implement only enough pure logic to satisfy Task 1 runtime tests.
- [ ] Confirm generic Radar copy and feed-only sources remain blocked.
- [ ] Confirm queue is deterministic and capped at 12.

### Task 3: Protected Notion runtime endpoint
**Files:** Create `netlify/functions/linkedin-revenue-cockpit.mjs`; modify `_redirects`.

- [ ] Validate the existing internal Basic Auth in the function as defense in depth.
- [ ] Query the four canonical Notion data sources through `/v1/data_sources/{id}/query` with `Notion-Version: 2025-09-03`.
- [ ] Normalize successful sources; retain per-source health on partial failure.
- [ ] Return 503 if all runtime sources are unavailable; never expose token/credentials.
- [ ] Add `/intern/api/linkedin-revenue` rewrite to the function so the existing Edge Function protects the friendly route too.

### Task 4: Cockpit UI
**Files:** Create `intern/linkedin-revenue/index.html`, `intern/linkedin-revenue/cockpit.js`; update the UI contract test to the protected route.

- [ ] Render Vandaag, Inbox & DM, Connecties, Posts, Follow-up and Revenue.
- [ ] Render `Context aanvullen` instead of send-ready text when evidence is insufficient.
- [ ] Render full concrete LinkedIn URLs and private Notion cockpit URL where applicable.
- [ ] Copy text only for grounded ready actions.
- [ ] Mobile and desktop use the same ordered action model.

### Task 5: Gates and production
- [ ] Get Chat Learning preflight, LinkedIn cockpit contract, Required tests and BRAIN delivery green on the same exact head.
- [ ] Repair relevant regressions without weakening any gate.
- [ ] Merge only the exact tested candidate through the existing production authority.
- [ ] Verify Netlify production deploy identity.
- [ ] Verify unauthenticated `/intern/linkedin-revenue/` returns 401.
- [ ] Verify authenticated cockpit/data readback without exposing credentials in logs.
- [ ] Record production outcome and prevention learning.
