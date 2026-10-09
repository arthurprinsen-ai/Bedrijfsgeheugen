# P0 #4215 — scope-aware production DOM readback with exact published commit

## Verified root cause
PR #4240 modified Portal V2 runtime, protected-merged as `7048fa85accbae9305324d9c9aec40d1a0ab9ea9` and Netlify provider-confirmed production deploy `6ac8b3be1fb20d000895d64f` READY at exactly that revision. PR #4243 subsequently altered **only** GitHub workflow, CI tests and learning/docs, merging as `a5ea0678c9ebf11f55812c55efec407f4039ef6a`. There is no new website/runtime release required merely to run a corrected visual verification workflow; insisting on `GITHUB_SHA` parity on a workflow-only commit blocks a legitimate readback.

## Verified, bounded solution
The existing `.github/workflows/portal-v2-production-dom-readback.yml` accepts optional `workflow_dispatch.inputs.production_sha`. If omitted, the exact-head requirement remains **unchanged**. If supplied, require ALL:
- workflow_dispatch event on **main**, not PR or untrusted branch;
- 40-char hex commit, an **ancestor** of the executing main HEAD, full Git history checked out;
- **every** intervening changed path confined to the existing CI/evidence-only prefixes: `.github/workflows/`, `tests/`, `docs/`, `brain/learning/`, `tools/ci/`. Any portal, Netlify function/configuration, Supabase, website, backend, data or other unknown file path fails closed;
- live public Netlify release advertises **exactly** selected published SHA, with a pinned independently fetched immutable deploy returning the same SHA;
- merged PR provenance and visual-required classification are read from the **selected published commit**, not the newer verification-only workflow commit;
- original production DOM/mobile tests and unchanged strict Canvassen screenshot pixel threshold execute, using the protected PR artifact or the source-verified immutable preview fallback from PR #4243;
- evidence artifact is identified by the **tested production SHA**.

This preserves the actual production + visual release gate while respecting CI-only changes that do not require Netlify rebuild.

## Invocation
`workflow_dispatch` on main, input `production_sha=7048fa85accbae9305324d9c9aec40d1a0ab9ea9` **only while that is the provider-confirmed production revision and no intervening runtime file changed**. The workflow revalidates these conditions and cannot turn source-only CI tests into a false live frontend release.

## Regression
`node --test tests/brain-p0-4215-production-scoped-dom-readback-v1.test.mjs`

## Parent status
No test, deploy or screenshot is evidence for genuine authenticated customer A/B Brain→cards/roadmap persistent writeback, transactional >750KB split/ACK, full dynamic/connector fields, or legally reviewed company-specific CSRD/ESRS. P0 #4215 remains OPEN until separately verified.
