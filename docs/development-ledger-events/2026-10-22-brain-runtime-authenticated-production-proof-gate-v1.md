# Append-only development event — 2026-10-22
- Fingerprint: `delivery|brain|runtime-tenant-proof-skipped-on-backend-release|20261022-v1`, state CANDIDATE_UNVERIFIED.
- Evidence: protected PR #4699, Production Release Readback #39830412618, exact Netlify deploy 6ada53da8e99139b5e12e8e9; authenticated Portal production proof SKIPPED.
- Root cause: `portal_required=false` on backend-classified but tenant-impacting Brain runtime imports.
- Existing single-authority fix: same workflow + canonical applicability helper, run existing authenticated proof for these imports, fail closed, preserve normal portal behavior.
- Regression: `tests/brain-runtime-authenticated-production-readback-required-v1.test.mjs`, existing portal authority contract.
- Remaining: protected Required + CodeQL; exact-main release and authenticated two-tenant readback PENDING. No second scheduler/registry.
