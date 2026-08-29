# Production Promotion Guardian — Design

## Status
Approved architecture, updated with explicit autonomous production ownership on 29 August 2026.

## Goal
Create one deterministic Powerhouse owner that does not merely observe production drift but autonomously carries every safe, verified change all the way to production.

The required chain is:

`candidate -> tests/preview green -> merge/promote -> current main -> production deploy -> exact SHA verification -> smoke/regression/protected metrics -> PRODUCTION_GREEN`

The Guardian may not stop at commit, PR, merge, CI success, Netlify `ready`, or a recommendation to deploy. If the change is safely promotable, it must execute the remaining steps itself.

## Highest invariant

- `NO SILENT FAILURE`
- `NO LOST OBLIGATION`
- `GREEN MEANS OUTCOME VERIFIED`
- `RED MEANS AGENTS KEEP WORKING`
- `GREEN CANDIDATE MEANS PROMOTE TO PRODUCTION`

For repository-backed product changes, an accepted candidate creates a production obligation. The obligation remains open until the exact intended SHA is verified in production or a valid hard boundary is reached.

## Decision
Create **Powerhouse Production Promotion Guardian** as the single release owner.

Netlify is the deployment executor, GitHub is source control, CI/QA provide evidence, but the Guardian owns the whole outcome:

1. determine the latest safe candidate;
2. ensure it has required tests/preview evidence;
3. merge/promote it to `main` when not already there;
4. re-fetch `main` immediately before production action;
5. ensure Netlify deploys the exact accepted `main` SHA;
6. trigger a deploy itself when automatic deployment is missing or stale;
7. verify exact `commit_ref` and deploy state;
8. run or consume smoke/regression/protected-metric evidence;
9. mark `PRODUCTION_GREEN` only with full evidence;
10. rollback to last-known-good when the new production artifact is red;
11. continue recovery until production is green again.

No other agent may treat a commit or merge as completed delivery.

## Scope
Initial scope:
- GitHub repository `arthurprinsen-ai/Bedrijfsgeheugen`;
- production branch `main`;
- Netlify production site `fd527056-493a-4d8a-8125-d00370104fa3`;
- GitHub/Netlify release evidence;
- Powerhouse shared outcome memory and development ledger.

The contract must be generic enough for future deploy targets.

## Autonomous production behavior

### Candidate not on main
If a candidate is green but not on `main`, the Guardian must:
- verify the exact candidate SHA and green evidence;
- rebase/reconcile against the latest `main` if required;
- never force-push over concurrent work;
- open/use a clean promotion PR when repository policy requires it;
- merge only the exact accepted candidate lineage;
- verify the resulting merge/main SHA;
- continue immediately into production deployment.

### Main ahead of production
If current accepted `main` is newer than production:
- treat this as `MISSED_OBLIGATION` after a bounded deployment grace period;
- first allow the normal Netlify auto-deploy path to complete;
- if missing/stale, trigger deployment itself;
- reconcile directly to the newest releasable `main` SHA rather than wastefully deploying obsolete intermediate SHAs.

### Production deploy ready
`ready` alone is insufficient. The Guardian must verify:
- `production.commit_ref == accepted_main_sha`;
- production context is correct;
- required functions/routes/headers/redirects are healthy where applicable;
- secret/security validation is not red;
- smoke/regression checks pass;
- protected metrics are not materially regressed.

Only then write `PRODUCTION_PROMOTION` and `PRODUCTION_GREEN`.

### Production red
If the exact newly promoted artifact is red:
- stop further exposure where possible;
- restore or retain the last-known-good artifact;
- verify last-known-good health;
- write `PRODUCTION_ROLLBACK`;
- keep the candidate recovery open;
- diagnose, repair, retest and re-promote automatically.

## Release obligation model
Each accepted candidate materializes an obligation similar to:

```json
{
  "id": "deploy:<repo>:<accepted_sha>",
  "domain": "deploy",
  "expected": true,
  "ownerAgent": "Powerhouse Production Promotion Guardian",
  "evidencePolicy": {
    "candidateTests": "pass",
    "preview": "green-or-equivalent-safe-evidence",
    "mainSha": "exact",
    "productionCommitRef": "exact-match",
    "deployState": "ready",
    "smoke": "pass",
    "regression": "pass",
    "protectedMetrics": "non-regressed"
  },
  "idempotencyKey": "production:<site_id>:<accepted_sha>",
  "recoveryPolicy": "promote-deploy-verify-or-rollback-until-green"
}
```

Historical intermediate main SHAs may be superseded by a newer releasable SHA, but their obligations may not disappear silently; they are closed with explicit supersession evidence.

## State machine

- `CANDIDATE_RED`
- `CANDIDATE_GREEN`
- `PROMOTING_TO_MAIN`
- `MAIN_ACCEPTED`
- `DEPLOY_PENDING`
- `DEPLOY_STALE`
- `DEPLOYING`
- `VERIFYING_PRODUCTION`
- `PRODUCTION_GREEN`
- `PRODUCTION_RED`
- `ROLLING_BACK`
- `ROLLED_BACK_GREEN`
- `BLOCKED_HARD_BOUNDARY`

All states except the three terminal outcomes remain active work.

## Deterministic evaluator
Add a pure release-state evaluator that consumes:
- candidate SHA and acceptance evidence;
- current main SHA;
- production commit ref/deploy state;
- production smoke/regression evidence;
- protected metrics;
- last-known-good SHA/deploy;
- retry/fingerprint state.

It emits one state plus exact reasons and next safe action. The evaluator has no side effects and is fully testable.

## Concurrency and commit storms
Many agents can commit close together. The Guardian must:
- serialize production ownership logically even when writers are concurrent;
- always re-fetch `main` immediately before merge/deploy acceptance;
- use immutable SHAs as release identity;
- never rely on mutable PR head names alone;
- avoid deploying obsolete intermediate SHAs when a newer green main already supersedes them;
- tolerate main moving during docs/status writebacks;
- never overwrite concurrent agent work.

## Cost control
Do not turn a burst of harmless commits into unnecessary deploy storms.

Policy:
- use Netlify auto-deploy first;
- apply a short bounded grace period;
- reconcile to newest releasable main;
- manually trigger only when expected auto-deploy is absent/stale;
- inspect latest state/deltas rather than full histories;
- documentation-only commits still need exact production convergence if they are on production main, but may be coalesced into the newest SHA.

## Hard boundaries
The Guardian may autonomously merge/promote/deploy/rollback safe repository changes. It must not autonomously:
- change credentials/OAuth/secrets;
- change permissions;
- weaken security controls;
- perform destructive/irreversible data operations;
- increase paid external resources;
- perform legal/financial commitments.

A green production promotion is explicitly not a hard boundary.

## Components

### `config/production-promotion.json`
Machine-readable policy containing repository, branch, site id, grace period, exact-SHA rule, required checks, retry limits and LKG requirements.

### `tools/evaluate-production-promotion.mjs`
Pure deterministic evaluator.

### `tests/production-promotion-guardian.test.mjs`
Regression suite proving at minimum:
- exact green candidate not on main requires promotion;
- exact accepted main behind production cannot happen silently;
- production behind main is not green;
- `ready` on wrong SHA is not green;
- `ready` without smoke evidence is not green;
- exact SHA + ready + required evidence is green;
- production regression requires rollback;
- superseded intermediate SHAs are explicitly reconciled;
- technical success without production outcome never terminates green.

### Guardian runtime
Use the existing Powerhouse control plane / Self Heal scheduling rather than introducing isolated truth. Runtime responsibilities:
- discover open release obligation;
- get exact GitHub state;
- get exact Netlify state;
- evaluate;
- execute safe promotion/deploy/rollback action;
- re-evaluate;
- write outcome evidence;
- continue until terminal.

### Shared memory and ledger
Material events include:
- `MISSED_OBLIGATION`
- `AUTO_REPAIR`
- `ERROR`
- `RECOVERY`
- `PRODUCTION_PROMOTION`
- `PRODUCTION_ROLLBACK`
- `CONTRACT_CHANGE`

## Ownership
Primary owner: **Powerhouse Production Promotion Guardian**.

Supporting roles:
- QA/Regression provides test evidence;
- Security Governor provides security gate;
- Cost/Performance Governor protects metrics;
- BG169 supports deterministic production authority;
- BG166/BG167/BG168 provide immutable learning/current projection/routing;
- Netlify executes deploys but never owns release correctness.

## Definition of Done
The subsystem is complete when:
- machine-readable policy exists;
- evaluator is regression-tested;
- CI enforces the contract;
- runtime reconciliation is active;
- a green candidate can be autonomously promoted to main and production;
- production exact-SHA evidence is verified;
- stale/missing deploy is self-healed;
- a production-red path keeps/restores LKG;
- shared memory/ledger receive release evidence;
- future agents inherit the same production obligation automatically.

For every future safe change, 'done' means production outcome, not commit outcome.