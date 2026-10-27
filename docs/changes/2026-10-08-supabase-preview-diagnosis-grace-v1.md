# Supabase Preview: bounded skip grace and root-cause feedback

## Evidence, 8 October 2026

A provider check initially returned `skipped` on PR #4114. Required failed immediately with only `SUPABASE_PREVIEW_PROVIDER_NON_SUCCESS:skipped`, while a later Supabase-owned check on the **same candidate HEAD** exposed the actual SQLSTATE 42P01 Identity Graph relation dependency. An additive baseline migration in PR #4114 then made the latest Supabase Preview successful; the protected PR has since merged. The preview provider is the only migration-replay authority; source lint and manual dry-runs are not substitutes.

A separate preview on PR #4115 is `skipped` because its Git branch is not associated with a Supabase Branch. This is a different failure class and must remain red.

## Minimal circuit correction

Keep the existing `Required test` and provider-owned `Supabase Preview`, with **no** new workflow or scheduler. For `skipped`, allow at most two additional five-second observations, so a subsequently emitted terminal provider check can supersede a transient placeholder. If the latest check remains skipped, fail closed. Missing/pending checks retain the existing bounded wait; completed SQL or authorization failures fail immediately.

Emit typed diagnostic evidence from the Supabase-owned check: `MIGRATION_MISSING_RELATION`, `PREVIEW_BRANCH_UNASSOCIATED`, `MIGRATION_HISTORY_DRIFT`, `PREVIEW_PROVIDER_AUTHORIZATION`, or `PREVIEW_PROVIDER_NON_SUCCESS`. Include the exact provider check ID and safe error summary. Keep exact-HEAD, provider app ownership, Protected Required and CodeQL intact.

## Acceptance and limitations

Unit tests cover the observed late SQL failure, unassociated preview branches, status semantics, fake provider checks and drift/authorization classifications. No production database or preview project is changed. Creating or restoring a provider-managed preview branch may still require provider-side integration recovery; this change makes that blocker explicit but does not claim to fix it. Terminal GREEN requires protected merge plus readback.
