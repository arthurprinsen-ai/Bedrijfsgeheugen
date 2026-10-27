# P0 #4215 — safely replay approved visual baseline against deployed Portal V2 revision

## Root cause
A genuine Portal V2 runtime merge, PR #4240 at `7048fa85accbae9305324d9c9aec40d1a0ab9ea9`, was Netlify provider-published. Later PR #4243 and #4246 changed only CI workflows, tests, learning and docs; Netlify need not rebuild runtime files for a verification-only commit. The existing DOM workflow insisted on comparing `GITHUB_SHA` to production; manually selecting an approved PR in PR #4246 did not solve this CI-only SHA drift.

## Scope-aware, existing-state correction
The existing `.github/workflows/portal-v2-production-dom-readback.yml` now requires, for manual replay, an explicit `approved_pr_number` and optionally accepts `production_sha`. With no production_sha it retains exact-main behavior. With production_sha the workflow:
- accepts only `workflow_dispatch` from `refs/heads/main`;
- requires exact 40-hex commit SHA that is an ancestor of the verifying main HEAD;
- downloads full Git history and fail-closed examines **every** intervening path. Only `.github/workflows/**`, `tests/**`, `docs/**`, `brain/learning/**` and `tools/ci/**` are permitted. Any runtime, portal, backend, Supabase or unknown path requires a new actual Netlify deployment;
- verifies that explicitly selected source PR was merged and that its merge SHA is `identical` to or an ancestor of **the selected published production SHA** (not merely a later GitHub workflow commit);
- independently checks live public `release.json` and immutable Netlify deploy `release.json` for that exact published SHA;
- retains PR #4246's strict numbered preview alias and immutable source SHA/deploy ID checks, actual DOM/mobile browser verification and **unchanged pixel comparison** against the protected-merged source PR head;
- names browser evidence after tested published commit to avoid falsely associating an ancestor website release with a newer CI-only main commit.

## Safe manual invocation
On GitHub main, dispatch `portal-v2-production-dom-readback.yml` with `approved_pr_number=4240` and `production_sha=7048fa85accbae9305324d9c9aec40d1a0ab9ea9` **only while the provider's published commit equals that SHA and the intervening diff is CI/evidence-only**. Otherwise select the newest provider-published portal-bearing PR and SHA. The workflow rechecks both conditions.

## Regression
`node --test tests/brain-p0-4215-production-visual-backfill-v1.test.mjs tests/brain-p0-4215-scoped-production-visual-replay-v2.test.mjs`

## Acceptance separation
This verifies software visual delivery, **not** authenticated customer A/B persistence, Brain consumer ACK, complete connector field inventory, >750KB durable batching, or authoritative customer-specific CSRD/ESRS applicability. Parent P0 #4215 stays OPEN.
