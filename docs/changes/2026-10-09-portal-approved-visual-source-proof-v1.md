# Exact-source visual proof when Netlify cancels unchanged preview

Canonical repair for [P0 #4198](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198), continuing the merged product [PR #4282](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4282).

## Observed defect
The product SHA `4fd9fb7a9ba7286395ee2b5b0f3f778dd618e8c5` is correctly published as ready Netlify deploy `6ac919ee56e40b0008dd9891`; exact production DOM, CSRD and mobile-shell Playwright steps succeeded. The visual acceptance step failed because the PR-head Netlify deploy preview `6ac91935c8300500081dc129` was canceled as "no content change" and its release identity was unavailable. The gate correctly failed rather than substituting screenshots.

## Preserved acceptance contract
The existing CI workflow uses a pinned Netlify exact-head PR screenshot when available. If unavailable after verifying trusted Netlify status and immutable URL, fetch the immutable head from GitHub's own merged PR ref and compare the fetched commit SHA to the approved head in the merged pull request metadata. Render the existing `portal-v2-production-visual-regression.spec.js` fixture in an isolated worktree served under the original demo route. It must create an actual screenshot; any error remains red. Compare that screenshot independently against the exact published immutable production deployment with the **unchanged 0.001 maxDiffPixelRatio**; no visual exemption, no artificial green, no unrelated source/revision.

## Verification and rollback
Protected required tests must pass. Re-run the existing readback workflow via `workflow_dispatch` with `approved_pr_number=4282` and `production_sha=4fd9fb7a9ba7286395ee2b5b0f3f778dd618e8c5` because this CI-only repair does not redeploy portal runtime. Review both production DOM/mobile result and captured visual artifact before marking visual acceptance green. A screenshot failure is *not* a release success. Roll back only the workflow change. The commercial result/learning loop under #4198 remains separately open.
