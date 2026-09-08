# LinkedIn Revenue Cockpit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a safe, mobile-first LinkedIn Revenue Cockpit inside portal-v2 that shows at most 12 evidence-backed next actions.

**Architecture:** Add a standalone portal-v2 page using the existing shell visual language. Data shown in the first production version is represented through an explicit action-contract JS file so the UI is deterministic and fail-closed; Powerhouse/Notion ingestion can populate the same contract without changing UI behavior. Generic feed URLs or missing evidence never become send-ready actions.

**Tech Stack:** static HTML/CSS/ES modules, Node contract tests, GitHub Actions, Netlify.

**Spec:** `docs/superpowers/specs/2026-09-08-linkedin-revenue-cockpit-design.md`

## Global Constraints
- Existing portal architecture only; no parallel CRM.
- Max 12 priority actions.
- Score 0–100 and explicit channel.
- LinkedIn actions remain human-executed.
- No scraping, auto-comments, auto-DMs or DOM overlays.
- Fail closed on missing post/thread/person context.

---

### Task 1: Release contract test
**Files:** Create `tests/linkedin-revenue-cockpit.test.mjs`.

- [ ] Write tests that require the new route, source contract, <=12 cards, fail-closed copy and portal navigation link.
- [ ] Commit tests before production implementation so CI demonstrates RED.

### Task 2: Cockpit data contract and page
**Files:** Create `portal-v2/linkedin-revenue-data.js`, `portal-v2/linkedin-revenue.html`, `portal-v2/linkedin-revenue.css`, `portal-v2/linkedin-revenue.js`; modify `portal-v2/index.html`.

**Interfaces:** `linkedin-revenue-data.js` exports `actions` and `normalizeAction(action)`; normalized actions are `ready` or `context_required`.

- [ ] Implement minimum page/data code needed for Task 1 tests to pass.
- [ ] Keep LinkedIn actions manual: Open LinkedIn, Kopieer tekst, Markeer uitgevoerd.
- [ ] Render context-required cards without send-ready copy.
- [ ] Verify mobile-first layout and keyboard-accessible controls.

### Task 3: Full gates and production
- [ ] Run required PR workflows on exact head.
- [ ] Repair any relevant regression without weakening gates.
- [ ] Squash merge exact tested head.
- [ ] Verify Netlify production deploy uses merge SHA.
- [ ] Read back `/portal-v2/linkedin-revenue.html` in production.
- [ ] Record production evidence and prevention learning.