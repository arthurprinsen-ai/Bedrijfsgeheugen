# Driftless release policy

Status: **canonical release invariant**

Introduced live by PR #1231 on production SHA `82997fd6fda6a96ca2fdfedfa074f7bde0ddb8b9`.

## Purpose

Release work must not be rebuilt, rebased or replaced merely because `main` moves. A change remains a small immutable change; the delivery system continuously validates that change against the current target state.

## Hard invariants

1. **Feature/change head is immutable identity.**
   - The original change head identifies the intended diff.
   - Moving `main` does not create a successor branch and does not require routine branch synchronization.

2. **The current merge candidate is the executable test identity.**
   - Required classifies changed paths from `baseSha...changeHeadSha`.
   - Build/backend/portal/automation/static website checks execute against GitHub's current PR merge candidate / merge-group SHA.
   - A branch may be shown as `behind` in GitHub without becoming a release blocker.

3. **Preview identity remains exact.**
   - Netlify deploy-preview checks validate the exact feature/change head associated with that preview.
   - Runtime checks must not pretend a preview was built from a synthetic merge SHA when it was not.

4. **Main drift is evidence, not a rewrite instruction.**
   - Path or contract overlap may trigger revalidation of the current merge candidate.
   - It must not by itself trigger `SYNC_REQUIRED`, a successor branch, a rebase loop or scope growth.
   - Only a real Git merge conflict requires conflict resolution on the same change.

5. **No branch pollution.**
   - Unrelated files from moving `main` never become part of the feature diff.
   - Release scope remains the intentional changed files only.

6. **One authoritative runtime browser path.**
   - Runtime/visibility/browser verification is consolidated in the website browser lane.
   - Fragile `networkidle` waits are forbidden for live pages with analytics, long-polling or persistent network activity; deterministic DOM readiness/stability checks are used instead.

7. **Protected Required gate stays authoritative.**
   - Required `test` remains the protected merge context.
   - No release may bypass branch protection because of drift, queue pressure or a stale/legacy checker.

8. **Production truth is exact-SHA.**
   - Merge success is not completion.
   - Completion requires production deployment of the exact merge SHA plus a successful Production Release Readback.
   - Required production evidence includes: exact live release marker, connector readiness, affected-route browser verification and immutable production truth.

9. **Failures create recovery obligations, not silent exceptions.**
   - A failing gate must be classified as causal, transient/infrastructure or stale-contract failure.
   - Fix the root cause or the checker contract; never suppress a real causal failure.
   - A transient failure may be retried only through the governed retry path.

## Operational rule

For every new change:

`change head -> current merge candidate -> selected Required lanes -> protected test -> merge -> exact merge SHA -> production deploy -> production readback -> learning/regression`

There is no ordinary `sync branch with main` step in this path.

## Acceptance criteria

The driftless engine is working when all of the following are true:

- `main` can advance while a PR is open;
- the feature branch is not rebased or rebuilt merely for drift;
- changed-path classification still reflects only the intended change;
- the current synthetic merge candidate is what build/code lanes test;
- preview checks use the real preview head identity;
- BRAIN records drift/overlap without requiring branch rewrite;
- a true merge conflict is the only drift-related reason to edit the branch;
- production is only called live after exact-SHA readback succeeds.

## Reference implementation

The canonical implementation is carried by:

- `.github/workflows/required-test.yml`
- `.github/workflows/lane-website.yml`
- `tools/delivery-github-event-context.mjs`
- `tools/brain-delivery-system.mjs`
- `tools/site-shell/verify-targeted-website-routes.mjs`
- `tests/delivery-driftless-merge-candidate.test.mjs`
- `tests/delivery-github-event-context.test.mjs`
- `tests/brain-composable-release-control-plane.test.mjs`

Any future change to these components that reintroduces mandatory branch syncing for ordinary moving-main drift violates this policy.