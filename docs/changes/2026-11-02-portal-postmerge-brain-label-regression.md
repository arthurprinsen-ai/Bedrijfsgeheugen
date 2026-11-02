# Postmerge BRAIN Portal label contract — 2 November 2026

Parent: #4439. Previous source release: protected #5282, merge 295c12ab94303af30b9b9fc30207d15ecf88db1e.
Immutable independent failure: GitHub Actions #41433667027, backend #125238718390, changed head ace7e4b37b23517c8f3ad55fb4696d93f28bc562. 5,400 tests: 5,397 passed, 1 failed, 2 skipped.

## Exact cause
Original `tests/brain-portal-latest-original-backend-observation-20261102.test.mjs` expected the obsolete literal `Laatste vastgelegde BRAIN-hertest`. The protected #5282 owner-only UI now rightly distinguishes `Laatste vastgelegde mislukte BRAIN-run` from `Geregistreerde latere BRAIN-herstelproef`, preserving the first-failure baseline and separate evidence links. This was a stale literal assertion after a correctly scoped semantic UI change, NOT permission to disable checks or declare business processes green.

## Source correction
Only update the same original BRAIN regression contract. Require both actual new labels, first historical failure label, strict software-recovery zero branch, rendered escaped original run URL, safe absolute anchor rel, original isPowerhouseAdmin and source fail-close checks. Preserve negative malformed-run tests. No runtime, Portal, CMS, SQL, provider, writer, scheduler or publication change.

## Acceptance
New exact-head Required and CodeQL; independently executed full original BRAIN with 0 failures (skip count explicitly retained); protected merge to current main; postmerge BRAIN replay. No new Netlify deploy is required for a test/docs-only change unless the existing release classifier says otherwise. Keep historical 1-fail evidence immutable and observe a later natural run before claiming recurrence prevention proven.

Owner: original ONE BRAIN/backend and Portal source contract owner; one protected writer lease. Existing agentskill: `.agents/skills/powerhouse-post-merge-codeql/SKILL.md`. No parallel executor.
