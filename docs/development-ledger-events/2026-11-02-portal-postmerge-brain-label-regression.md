# 2026-11-02 — One BRAIN test contract learning event

- Parent issue: #4439.
- Affected production source: protected original PR #5282 (already Netlify READY and Production DOM readback SUCCESS).
- Incident: GitHub Actions run 41433667027, backend job 125238718390; 5,400 total / 5,397 pass / 1 fail / 2 skipped; exact failing test #3050.
- Root: a historical test asserted a superseded UI caption after a valid semantic split between last failed run and later software recovery.
- Protected owner repair: adjust exact original test to require **all** three distinct software proof cards and independent fail-close checks. Do not touch runtime/UI source or fake revenue.
- Proof pending: new exact-head Required+CodeQL, full original BRAIN, protected merge and future natural run. Any success is software-test proof only.
- Human reference: docs/changes/2026-11-02-portal-postmerge-brain-label-regression.md.
