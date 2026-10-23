# Fail-closed native merge-group identity and admission

Canonical owner: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661

## Root cause
`normalizeGitHubDeliveryEvent` previously assigned `github.run_id` as the `prNumber` on `merge_group`. Required preflight then could call `/pulls/<run-id>` despite synthetic merge groups not having a pull request identity. Merely clearing that number would select a static one-loop manifest scoped to an unrelated, historic PR.

## Implemented
- Require `github.event.merge_group.head_sha` to be a valid SHA identical to `github.sha`; reject mismatch.
- Keep `prNumber=null` for merge groups and never reinterpret run IDs as PR numbers.
- Explicitly forward event type to the existing delivery metadata authority; for merge groups reject absent provider-verified aggregate admission rather than allow static-manifest fallback.
- Cover historical replay, normal PR compatibility, immutable SHA mismatch, source wiring and negative admission in existing Brain evaluation.

This is **compatibility safety**, not native queue activation. Required CI and CodeQL still subscribe to `merge_group`; the current owner is a personal User and GitHub native queues require an organization-owned repository.

## Gate to a future live queue
An authorized transfer to a GitHub organization with independent GitHub Apps, Supabase and Netlify readback is required. Only after the same existing delivery controller has verified per-PR group membership, changed-path scope, writer leases and exact group SHA may the fail-closed guard be replaced by a provider-attested aggregate classifier. Pilot one PR per group, one concurrent build and squash, preserving all existing required/CodeQL/security/preview checks. No bypass or status forgery; establish measured p50/p95/runner usage and independent customer outcome before asserting improvement.

Regression: `node --test tests/delivery-github-event-context.test.mjs tests/brain-merge-group-admission-authority-v1.test.mjs`.
GitHub contract: https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-a-merge-queue
