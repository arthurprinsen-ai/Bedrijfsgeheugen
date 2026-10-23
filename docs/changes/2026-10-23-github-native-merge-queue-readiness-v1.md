# Native GitHub merge queue: exact-SHA readiness and organization cutover
Date: 2026-10-23
Parent: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4661
State: CANDIDATE — not transferred, merge queue not activated, no production promotion claimed.

## Verified starting point
- GitHub repository: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen (currently personal-account owned; native merge queue not available in this state).
- Main is protected and requires `test`, `hygiene / admission` and `CodeQL javascript-typescript`, from GitHub Actions.
- Squash merge allowed; normal merge commit and rebase merge disabled.
- Required and CodeQL already listen to `merge_group`; this candidate repairs event identity and exact SHA binding without a second PR-triggered workflow.

## Causal bug and prevention
The existing `normalizeGitHubDeliveryEvent` mapped `merge_group` to `prNumber = runId`. That incorrectly gave a workflow execution the authority of a pull request and sent it into PR-sensitive downstream evaluation. Queue events now have `prNumber=null`, must include a valid provider merge-group HEAD SHA, and must exactly match the GitHub Actions checkout SHA. Missing/mismatched identity blocks admission; the required gate never emits the literal `null` as a PR number. Queue candidates are classified from the merge-group base-to-head diff, not looked up as a fabricated PR. The existing PR admission / lease and check gates remain unchanged.

## Authorized organization migration: operator runbook (NOT automated)
1. Identify an approved GitHub organization with suitable feature entitlement; verify organization ownership/creation permissions and a migration change window. Record immutable main SHA, all open PR head SHAs, release/deployment aliases, commit-status provenance, active jobs and baseline results. Freeze repository owner changes and production writes for the short cutover. Do not force a branch update.
2. Inventory the GitHub Apps and installations, permissions, webhook deliveries, environment protection, repository secrets, deploy keys, external required checks, GitHub Actions caches and branch rules. Capture service identities without exporting secret values.
3. Inventory Netlify repository connection, site/build hooks, production branch, release aliases, deploy keys, redirect/configuration and published `commit_ref`; inventory Supabase GitHub integration, migration history, environments, connection strings/secret references, RLS and applied production revisions. Verify current independent customer outcomes and production readback separately.
4. Authorized GitHub administrator transfers the existing repository, rather than recreating it. Preserve PR/issues/releases/history. Reinstall/re-authorize every GitHub App and external integration against the new owner/repo, update callback/webhook allowlists, Git remotes, Netlify/Supabase repo identity and external service allowlists. Preserve redirects but do not rely on them for signed webhook verification.
5. Re-read exact repository ID, owner, main SHA, branch ruleset / required status source App IDs, security alerts, environment reviewers, GH secrets references, Netlify published deploy and Supabase migration history. Any difference from signed inventory blocks queue enablement and requires authorized reconciliation.
6. Only then configure native *Require merge queue* on an exact `main` branch rule (no wildcard): *squash*, max concurrent merge-group builds **1**, minimum/max PR merge group **1**, only merge non-failing PRs, retain required `test`, `hygiene / admission`, `CodeQL javascript-typescript`. Do not disable force-push/deletion safeguards, reviews, or applicable deployment gates.
7. Pilot **one** non-production/low-risk existing approved candidate. Check required GitHub Actions checks on the **exact merge-group HEAD SHA**, reject missing/ambiguous/wrong-App status, verify the resulting protected squash merge and updated main. Continue with canonical Netlify/Supabase production release + tenant/customer readback only for applicable material changes.
8. Record before/after on *independent* runs in the existing Janitor/Brain telemetry: wait-to-start, runner setup, Required repetition per immutable SHA, queue occupancy (raw/actionable/provider ghosts separately), wall-clock runtime, failures, security/release evidence and independently verified customer outcomes. No P95 claim from one run; promotion requires statistically defensible samples and no regression.

## Rollback and hard boundaries
- Before transfer: keep current personal owner and existing protected PR gate. Native queue remains OFF.
- After transfer, before pilot: if checks or providers differ, do not enable queue. Repair app/Netlify/Supabase authority using the existing owners, without duplicating schedulers, incidents or agents.
- Pilot fail: stop new queue admissions; inspect real failed SHA/run and restore prior protected merge settings via authorized administration. Never relax CodeQL, Required, admission, reviews or production verification to force green.
- Rollback a production release only through existing audited release/recovery procedures; avoid unplanned reverse ownership transfer.
- Human GitHub organization selection and repository transfer, external integration consents, and branch protection updates require authorized administrators. This connector cannot perform those actions. Only source-level candidate readiness is implemented here.

## Evidence-only AI optimization
ONE BRAIN, POWERHOUSE and HEARTBEAT consume existing independent CI / deployment / customer proofs, deduplicate failure fingerprints into the canonical registry, and test one bounded change at a time. Reuse existing Janitor cadence. Reject changes with unproven outcomes, incomplete tests, uncertain supply-chain provenance, stale supplier evaluations or missing terminal production readback. No invented speed improvements, new agent fleet or extra scheduler.

## Composite merge-group scope (source policy)
A GitHub merge-group is a synthetic combined ref: it does not carry a PR body and cannot be admitted under the unrelated static `config/powerhouse-one-loop-v1.json` candidate manifest. On a native merge-group the existing Required preflight evaluates the independently computed provider base-to-HEAD diff with a fail-closed maximum of 40 non-verification files, no `scope-broad-approved` label bypass and all original protected suites. Each individual PR still has its normal machine-readable PR scope, writer lease and per-PR scope budget before being eligible for the queue. A group with 41 material files is blocked and must be explicitly decomposed; this pilot does not create or bypass a new release authority. Null event labels are normalized to an empty list to avoid false crashes.
