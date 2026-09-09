# Superseded PR Production Truth — permanent team rule

## Purpose
Prevent false production-status reporting when an original PR is closed without merge but its intended fixes later reach production through a clean successor.

## Permanent invariant
A predecessor PR is never the production delivery identity when it was not merged.

Resolve status through the complete delivery chain:

`original/predecessor PR -> actual merged successor -> resulting main commit -> READY production deploy -> production readback`

## Required reporting rules
1. Never report a closed-unmerged predecessor as `live`, `merged`, `delivered`, or as the production release identity.
2. If the behavior described in the predecessor is live through a successor, say exactly that: **the fixes are live via the merged successor; the predecessor itself was not merged**.
3. Distinguish four identities whenever applicable: original PR, actual delivery PR, merge/main commit, production deploy ID.
4. Do not infer production truth from chronology, titles, or similar wording alone. Verify the actual merged successor and production lineage.
5. A later READY deploy proves the merged fix remains in production only when the merged successor is part of that production `main` lineage.
6. Production status is not complete until production readback has verified the intended behavior on the served site/runtime.

## Canonical regression case — 2026-09-09
- PR #1128 was closed without merge.
- Its intended repair set was delivered via clean successor PR #1250, which was merged.
- Therefore #1128 must never be reported as the live release.
- Correct wording: **“The #1128 fixes are live via #1250; #1128 itself was closed unmerged.”**

## Success criteria
- Closed-unmerged predecessor PRs reported as live delivery identities: **0**.
- Every superseded release status names the actual merged successor.
- Every `LIVE_VERIFIED` claim includes production deploy/readback evidence.

This rule is part of BRAIN shared release learning and must be inherited by future agents and release-status workflows.
