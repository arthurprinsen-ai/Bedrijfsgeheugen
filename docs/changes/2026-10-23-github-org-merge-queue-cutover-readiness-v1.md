# Organization-owned GitHub native Merge Queue: operator readiness and source hardening
Date: 2026-10-23
Canonical parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
Predecessor retired as duplicate: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4782
Already protected-merged identity authority: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/pull/4783
State: SOURCE CANDIDATE; no organization transfer, queue enablement, provider reconfiguration or production claim.

## What is verified now
GitHub main 9844fea635248f534d4e0fb8ad3b517f3ad653d5 contains #4783. The merge-group normalizer now refuses to treat an Actions run ID as a PR number. Critically, merge-group metadata authority currently fails closed with `MERGE_GROUP_ADMISSION_PROOF_REQUIRED` until real provider-attested aggregate PR membership and writer-lease/scoping exists. A synthetic composite diff and 40-file cap alone are NOT sufficient to attest group membership; do not remove the new guard. Required CI, hygiene/admission and CodeQL remain protected mandatory contexts; squash merge is enabled while merge/rebase commits are disabled. Merge group is already wired in Required and CodeQL.

## Narrow improvement in this successor
Powerhouse Delivery Hygiene now validates the merge-group provider HEAD against (a) `GITHUB_SHA` and (b) checked-out git HEAD before issuing a preflight receipt. Missing, invalid or mismatched group SHA yields `MERGE_GROUP_SHA_MISMATCH`, admitted=false and exit 78. This defense is additive; it does not substitute for the main #4783 aggregate-admission fail-closed rule. One regression under the existing Brain test namespace runs in historical replay / shadow / canary; no new workflow, agent, scheduler, incident store or CI fanout.

## Real provider baseline — observed 2026-10-23 UTC
- GitHub: personal owner `arthurprinsen-ai`; linked GitHub App installed only on the personal account; no organization membership returned.
- Netlify production `bedrijfsgeheugen`: provider-reported deployed/ready `6adb4d47bf7e1fa53fb6ae63` from `main`, exact commit `ad01555f2b5ef6ade8e7677d1e74b60140931074` at observation. This is a DIFFERENT release from this CI candidate and must be re-read at cutover.
- Supabase: one linked project reported ACTIVE_HEALTHY in EU-central-1 and 746 migration history entries at read time; latest observed migration `20261023070053`. No schema change performed.

## Approval-gated transfer checklist
1. Designate an authorized organization owner and a GitHub organization with native queue entitlement; inventory current repository ID/commit SHA and freeze owner-change and external production writes for the short cutover.
2. Snapshot exact GitHub App installations and permissions, webhook deliveries, branch/ruleset settings, required status context source App IDs, environments, deploy keys, external checks, release tags and active PRs. Record reference/identity only, never disclose token values.
3. Inventory Netlify production branch, build hook and GitHub installation, published `commit_ref`, aliases, build context and functions. Inventory Supabase GitHub integration, migration versions, environments, RLS/auth boundary and migration status. Confirm provider-authoritative independent customer proof.
4. Authorized admin transfers the EXISTING repository to the selected GitHub organization. Reauthorize apps, Netlify and Supabase repo connections, update webhook callback identities, local remotes and allowed origin/callback references; verify services using signed/read-only provider readback. Preserve secrets under their protected provider authority.
5. Re-read repository identity, `main`, branch safeguards, required `test`, `hygiene / admission`, `CodeQL javascript-typescript` from the expected GitHub App; preserve squash, reviews, security scanning, environments, Netlify deployed commit and Supabase migrations.
6. BEFORE enabling merge queue, implement and prove provider-attested aggregate PR membership, all per-PR scope/writer checks, exact merge-group SHA, no ambiguous status sources, end-to-end coverage under the existing delivery controller; only then remove the fail-closed `MERGE_GROUP_ADMISSION_PROOF_REQUIRED` blocker in a separately verified PR.
7. Authorized admin configures queue on exact `main` branch rule: one PR per group, max concurrent merge-group builds 1, squash, only non-failing PRs, short bounded pilot. Do NOT disable any security or production check.
8. Pilot one independently selected non-production/low-risk PR, inspect exact group HEAD required statuses, protected squash merge and main/provider readback. Stop admissions on any missing check, wrong SHA/app identity or regressions; restore prior protection settings through authorized admins.

## Evidence-based autonomous learning and promotion
Use existing Brain/Powerhouse/Heartbeat and Janitor cadence to compare pre/post immutable HEAD runs: queue wait, runner setup, Required retries, duplicate CI, provider ghost queue counts (raw and independently verified actionable), build-phase duration, failures, merge drift, CodeQL, Netlify/Supabase production check receipts and tenant-bound outcomes. A new technique may graduate only if tests, security, release evidence and independent production/customer readbacks all pass; source-only speed claims are never customer outcomes. Collect repeated real samples before reporting median/P95; never promise zero queue.
Rollback = stop new queue admission; do not force main, reverse production or skip checks. No additional Cron, GitHub App, token escalation or paid service is required by this source PR.
