# V18 Test Complete Route Reconstruction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Put V18 on a test-only branch, preserve existing production pages where V18 links to them, and create every missing V18-linked page so no visible navigation item is dead.

**Architecture:** The branch starts from current production main. V18-authored pages use one shared CSS/JS shell; existing production pages remain untouched unless an accepted V18 page supersedes them. The More directory is the route contract for company, knowledge, trust and support links. Route integrity is enforced by Node tests and an exact-head pull-request workflow.

**Tech Stack:** Static HTML/CSS/JavaScript, Node.js test runner, GitHub Actions, Netlify.

**Spec:** Approved in chat on 2026-08-29: V18 page wins when it exists; otherwise preserve the production page; if neither exists, write the missing page; Blog and other production content must remain.

## Global Constraints
- Test only; do not merge to production without explicit visual/business approval.
- Preserve the production Blog and all existing production-only routes.
- No credential, permission, secret or authentication mutations.
- No destructive or paid-resource changes.
- Every visible V18 link must resolve to a real page.

## Tasks
- [x] Create isolated branch from current main.
- [x] Add shared V18 test shell and homepage.
- [x] Restore V18 primary routes: Problemen, Oplossingen, Platform, Prijzen, Cases, Kennis, Over ons, Meer, Inloggen, Aanmelden.
- [x] Restore visible Meer links from accepted V18 evidence.
- [x] Write missing pages: Partners, Onderzoeken, Templates & tools, Security, Juridisch, Helpcentrum, Changelog.
- [x] Preserve production Blog and existing production routes.
- [x] Add Netlify redirects for new V18 routes.
- [x] Add route-integrity tests and exact-head PR workflow.
- [ ] Verify the exact PR head in GitHub Actions and Netlify deploy.
- [ ] Browser-smoke the public preview and repair any failed route.
- [ ] Keep the PR draft/test-only for visual approval; do not merge.
