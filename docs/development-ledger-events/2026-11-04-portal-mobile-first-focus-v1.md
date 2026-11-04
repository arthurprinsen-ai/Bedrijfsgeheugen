# 2026-11-04 — Portal V2 entrepreneur-first mobile UX incident and release evidence

- Fingerprint: `portal|ux|technical-dashboard-before-entrepreneur-decision|20261104-v1`.
- User observation: existing V2 is difficult to understand and mobile interaction is not intuitive or of aspirational premium quality.
- Evidence: source review of original `portal-v2/index.html`, `app.js`, `entrepreneur-home.js`, `navigation.css`, existing registered pages and mobile CSS. No fabricated user-study score or production screenshot.
- Root cause: technical workflow and many navigation choices appear before one actionable, clearly evidenced next business decision; mobile lacked task-first affordances.
- Owner: original Portal V2 design/engineering route; no second Portal, Brain writer, publisher or scheduler.
- Source change: PR #5399, existing authorized entrepreneur home, collapsed desktop page groups, four route-based mobile tabs, stylesheet, tests, Portal skill.
- First observed Required run `41798968364`: `PR_MACHINE_METADATA_INVALID` before tests; source PR body then corrected with immutable base `feb1635b374ed93a5fdacdc498eeefc8b596eb26`, allowed `portal` lane and exact change scope. Rerun of same run still failed `INTEGRATION_BUNDLE_CLOSURE_INCOMPLETE: activity_ledger,brain_learning`.
- Recovery: this append-only ledger event plus `brain/learning/2026-11-04-portal-entrepreneur-first-mobile-v1.json` in the **same** candidate; extend PR declared Change-Scope with both paths. No CI bypass, no falsified live status.
- Historical / shadow / canary: `portal-v2/tests/entrepreneur-home.test.mjs`, `portal-v2/tests/entrepreneur-journey.test.mjs`, `portal-v2/tests/mobile-responsive-shell.test.mjs`, `portal-v2/tests/entrepreneur-focus-mobile.test.mjs`.
- Rollback: revert the protected UI-only commit without altering the backend source of truth, tenant state or external provider side-effects.
- Current terminal: `NOT_LIVE_VERIFIED`. Require exact-head Required/CodeQL, protected merge, Netlify deploy SHA + authenticated/mobile readback and actual first-time task test before promotion.

- Follow-up design defect: merely placing the primary action first did not reduce the still-visible five-step technical overview and processing flow. Existing `mountOverviewDepthDisclosure()` now wraps the original dashboard/steering DOM in a native optional details section. No duplicate source; regression in both existing root and Portal tests.
- Protection check on PR #5399 old source head `c4a058ee4361069f9c47c788bbfebf87f4cfc2af`: Required + CodeQL + preview passed, native merge returned HTTP405 '3 of 3 required status checks are expected'. The virtual merge SHA `164de529ddf31f0c9e802a6af48c971d34d0894f` had zero provider Check Runs/statuses when inspected. Effective required context names inaccessible via installed GitHub integration (HTTP403), so original #4929 owner must reconcile; no fabricated green or merge.
- Permanent agent direction added to `AGENTS.md` and original Portal skill. Source state remains PREVIEW/CANDIDATE, not production or independently user-tested.
