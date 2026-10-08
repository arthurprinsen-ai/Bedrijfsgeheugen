# Provider-owned Supabase Preview diagnostics — 8 October 2026

## Observed provider failures
- PR #4114 originally failed on an actual migration replay dependency: SQLSTATE 42P01, `public.powerhouse_identity_graph_v1` absent on a fresh preview. This was repaired with an earlier, source-controlled baseline migration and the Supabase-managed preview succeeded before protected merge.
- PR #4115 has a distinct failure: the native Supabase Preview check concluded `skipped` with "This git branch is not associated with any Supabase Branch." Retrying the GitHub aggregate cannot create this missing provider association.
- Both failures previously surfaced to the Required workflow as generic `SUPABASE_PREVIEW_PROVIDER_NON_SUCCESS`.

## Scoped, no-duplicate-owner correction
The existing canonical Required workflow continues to query the native Supabase-owned check on the exact candidate SHA. Its inlined provider-check parser is replaced with the pure, regression-tested `tools/ci/supabase-preview-check-state.mjs`; no new scheduler, migration environment, secret, queue or authority is introduced.

When the check reports an unlinked PR branch, CI now prints actionable `SUPABASE_PREVIEW_BRANCH_NOT_ASSOCIATED` evidence. A fresh-environment missing relation reports `SUPABASE_PREVIEW_MIGRATION_DEPENDENCY`. All failures and skipped results remain non-success, the native provider remains the only migration-preview authority, and the latest check ID must be consistently successful before any protected merge. The existing bounded polling and merge protection remain unchanged.

## Recovery ownership
The Supabase GitHub integration must associate the exact PR Git branch with its managed preview branch. Only a new provider-owned exact-HEAD `success` can satisfy Required. An isolated manual SQL replay or manually-created Supabase project does not replace that check.

## Verification contract
- The regression covers provider identity spoofing, newest check selection, pending checks, unlinked skipped, ordinary skipped, SQLSTATE 42P01 and missing checks.
- The Required preflight executes the regression for every PR.
- Protected gates and exact-main production readback are required before live delivery claims.
- This corrective PR does not claim to repair the association of PR #4115 or guarantee that all other workflows are green.
