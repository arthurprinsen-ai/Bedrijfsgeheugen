# P0 #4215 — fail-closed exact-head visual baseline recovery

## Verified production incident
Portal V2 exact-main production DOM #37908103412 failed at `Resolve approved visual baseline`, not at the DOM/browser assertions. PR #4236 head `6ae215e539a989aa32a38bccc8cf7e0982f38805` had protected Required/CodeQL success and merged main, but the auxiliary `portal-v2-live-preview` run did not produce a successful visual baseline artifact. GitHub workflow_run payloads may omit `pull_requests[]` metadata or cancel a preview; PR #4241 addressed a separate bug where the Netlify dashboard status URL had been treated as an asset host. Merely fixing the preview for future PRs does not retroactively create the missing approved screenshot for #4236.

## Bounded existing-state recovery
Keep the existing approved-artifact path unchanged and preferred. When the *same* merged PR head's successful `workflow_run` screenshot artifact cannot be resolved after a bounded wait:
1. Require GitHub's merged-PR provenance for exact production SHA.
2. Require successful `netlify/bedrijfsgeheugen/deploy-preview` status for the exact merged PR head.
3. Reuse the strict `tools/ci/netlify-immutable-preview-target.mjs` allowlist (Netlify provider origin/deploy-id only), rejecting arbitrary URLs.
4. Read the pinned immutable preview's `release.json`; match both `commit_ref` **and** `deploy_id` to the merged PR head and immutable host. Fail on missing/mismatch/provider errors.
5. Capture Canvassen screenshot **from that exact PR preview with Playwright**, preserving the required DOM/hydration/card checks.
6. Independently compare actual exact-current-main immutable Netlify production using the *same* Playwright visual regression, preserving the approved `maxDiffPixelRatio:0.001` threshold and no screenshot bypass.

CI checks that fallback remains confined to merged PR and immutable preview with exact source/deploy verification; the original artifact path stays preferred.

## Evidence semantics
A screenshot produced by this fallback is a verified exact-head *source* baseline after protected merge. The comparison must **still** run against actual production. This is not a claim that a human manually reviewed the image, a customer logged in, or tenant/Brain/CSRD acceptance completed.

## Run
`node --test tests/brain-p0-4215-approved-visual-baseline-recovery-v1.test.mjs`

This PR must not close parent #4215; true two-tenant persistence, full dynamic fields, large transactional batching and company-specific official legal applicability remain independent criteria.
