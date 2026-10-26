# P0 #4215 — verified visual backfill for a previously merged Portal V2 PR

## Why
Exact-main Portal V2 Production DOM run #37908103412 failed solely at retrieving an approved PR screenshot; the auxiliary `workflow_run` preview lacked its artifact. PR #4241 fixed a Netlify dashboard URL mix-up, and PR #4243 introduced an immutable-head baseline fallback. A follow-up issue remained: for the actual merged Portal V2 PR #4240, GitHub's successful Netlify status points to a **numbered PR alias**, not a provider dashboard URL. Also a new workflow-only merge would classify as having no visual changes, skipping verification of the earlier failed Portal V2 rollout.

## Scoped fix in the EXISTING workflow
- Existing `portal-v2-production-dom-readback.yml` now supports `workflow_dispatch.inputs.approved_pr_number`; a manual production readback cannot proceed without a numeric source PR.
- Verify PR was actually merged and that its **merge commit is identical to or an ancestor of the current production SHA** through GitHub's compare API. The PR cannot be an arbitrary or unrelated branch.
- Derive the baseline from that PR's exact head, not the workflow-only PR.
- First prefer a successful exact-head PR visual artifact; if absent, accept only the exact same PR's allowlisted deploy-preview alias or existing immutable provider dashboard target. For the alias, request `release.json`, insist on head SHA and a 24-character deploy ID, then pin the immutable Netlify host and independently require its release SHA and deploy ID to match.
- Capture the existing Canvassen screenshot from the pinned exact PR head with Playwright, then compare immutable current production at unchanged `maxDiffPixelRatio:0.001` and `threshold:0.2`. No snapshot invented, no baseline bypass and no statuses forced to green.
- Bound the search for an existing approved screenshot artifact to eight cycles before the strict immutable fallback to avoid waiting on a workflow known to be canceled.
- Add dedicated protected Required CI regression `tests/brain-p0-4215-production-visual-backfill-v1.test.mjs`.

## Live readback
A protected merge, exact-main Netlify publication and *new, successful workflow_dispatch production browser/visual readback* for the actual Portal V2 PR remain required. PR #4240 is the source used for the replay; a CI-only pass does not satisfy this operational requirement.

## Non-claim
No real customer tenants, Brain consumer ACK, CSRD/ESRS applicability, complete provider DOM field coverage or >750KB durable chunked outbox is proven by a screenshot.
