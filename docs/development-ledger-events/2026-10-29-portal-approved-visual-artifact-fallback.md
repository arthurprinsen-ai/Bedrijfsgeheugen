# Portal DOM Readback baseline incident — canonical activity ledger

- **Date:** 2026-10-29. **Fingerprint:** `powerhouse|portal|approved-visual-baseline-artifact-missing|20261029`.
- **Provider evidence:** GitHub workflow #40921310588 failed at `Resolve approved visual baseline`: `no valid artifacts found to download` after selecting an exact-head successful PR workflow run. The independent general production release workflow succeeded, but cannot substitute for visual pixel evidence.
- **Business context:** protected Portal #5140 merged `6487786733cd332edd777af3881e68aca806bf92`, Netlify production READY `6ae381b55f2b8b632681f6be`. Real paid-order outcomes unknown; no fabricated conversions.
- **Root cause:** provider workflow run success was treated as proof that an optional visual screenshot artifact exists.
- **Proposed fix:** query GitHub artifact existence, exact name and `expired=false`, then download only when real; otherwise existing exact-approved-source immutable visual capture and mandatory pixel comparison.
- **Prevention/test:** `tests/brain-portal-approved-visual-artifact-fallback-20261029.test.mjs`, existing screenshot/CI gate unchanged, no extra scheduler/paid preview.
- **Status:** SOURCE_CANDIDATE / NOT_YET_MERGED / PRODUCTION_VISUAL_NOT_VERIFIED. New exact-head Required/CodeQL and real visual readback required before learning promotion.
- **Human runbook:** `docs/changes/2026-10-29-portal-approved-visual-baseline-evidence-recovery.md`. Existing ONE BRAIN incident is canonical, no parallel register.
