# Production Source Snapshot — no-cancel and live-drift reconciliation

Date: 2026-10-19. Obligation-ID: `netlify-release-live-gap-starvation-20261019`.

## What failed and why it matters
The protected [forced production deploy run 39221955351](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/39221955351) started at 08:19Z, waited at `Deploy exact source through authorized Netlify transport`, then was **CANCELLED** after a main push at 08:22Z. Netlify still reported the older release `d3a73d8816c384c6a745b68178b4691727d31000`. The single shared concurrency group had `cancel-in-progress:true`; the subsequent automatic snapshot showed SUCCESS but did not deploy because its own single-commit diff was judged not applicable. Neither 'success' nor 'cancelled' indicates live parity.

## Integrated correction
1. Change the existing workflow to `cancel-in-progress:false`. GitHub concurrency retains at most one running and one pending item; a newer pending main reconciliation replaces an older pending item while allowing the running authorized upload to finish.
2. Query the production `release.json` to retrieve the actually published commit; when an ancestor of current HEAD, compute `git diff --name-only published...HEAD`, not just `HEAD^...HEAD`. Feed the complete unpublished file set into the existing delivery applicability decision.
3. If production identity cannot be obtained or ancestry cannot be proven, force reconciliation rather than skipping based on a docs-only commit. A verified exact live HEAD returns no mutation requirement.
4. Keep all existing OIDC issuer, audience, authorized branch, security checks, Netlify transport, immutable source and authenticated release readback. Do not create another scheduler or loosen CI.

## Validation and non-goals
Run `node --test tests/brain-netlify-live-gap-cancel-starvation-v1.test.mjs`. Require exact-head Required CI, CodeQL, protected merge. Production acceptance also requires an uninterrupted GitHub deploy run and an independently matching Netlify commit_ref with authenticated portal/browser readback. This does not claim that CMS items are published or tenant financial forecasts exist. No old deployment receipts are deleted.
