---
name: github-ci-hygiene
description: Evidence-first GitHub repository cleanup, CI/CD performance analysis, and safe release triage for Bedrijfsgeheugen.
---

# GitHub CI hygiene — canonical operator contract

## Start with provider truth
Before changing GitHub state, read AGENTS.md, the canonical Powerhouse Continuity skill, the active Repository Janitor workflow and its last evidence artifact, open PRs, current main SHA, required checks and writer leases. Reuse the existing hourly Repository Janitor and recovery owner. No additional scheduler, workflow fanout, duplicate writer or unmanaged merge queue.

## Safe PR inventory and cleanup
Classify PRs by immutable obligation ID, candidate head, base SHA, supersession chain and actual merge status. Close only PRs explicitly marked RETIRED or demonstrably superseded when their successor is known and no active writer or unique delta remains. Never bulk-close uncertain PRs, delete branches with unmerged changes, force-push a protected head, alter main directly, or delete run evidence. Store closing reason and successor link. Keep active candidates and Dependabot updates separate.

## CI/CD throughput
Measure real job elapsed time, queue time and run fanout from provider timestamps via existing tools/delivery/ci-throughput-telemetry.mjs. A p95 needs >=20 valid jobs from >=5 runs, with complete observation and no provider-read failure. Compare like-for-like before/after windows and capture p50/p95, total runner minutes, failed-retry minutes, cache hit ratio when actually observed, and required-check completeness. Unknown data is UNKNOWN, not green. Optimize expensive steps only after identifying a measured bottleneck.

## Low-risk optimization order
1. Cancel superseded nonterminal PR runs using existing concurrency groups, never required active-head checks.
2. Deduplicate job setup and cache dependency installs with lockfile-keyed caches, avoiding poisoned or cross-trust cache reuse.
3. Apply change-based preflight selection only to advisory tests; all required security, RLS, CodeQL and full release gates continue running.
4. Eliminate duplicate dispatch and unneeded push/PR fanout without changing branch protection.
5. Preserve deterministic generated System Map artifacts in the same integration candidate and verify exact-head source hashes.
6. Keep runtime deploy independent of governance-only changes only where existing release contracts permit.

## Agent recovery and promotion
Every failed control maps to a single incident fingerprint and owner. Detect merge conflicts, outdated required-check names, stale system-map digest, missing tool capability, provider ghosts and drift before retrying. Apply bounded recovery only on the owned candidate; never mark a blocked step successful. Required/BRAIN/CodeQL must be verified against the exact candidate SHA, followed by protected merge to main, Netlify current-production commit readback and route-level proof for runtime changes. Report repository write, merged, deployed and LIVE_PROVEN as separate facts.

## Continuity
For each correction update the existing Brain incident evidence, skill projection and change ledger through the canonical owner; do not claim daily runtime behavior merely because this file exists. The existing hourly Janitor and daily Heartbeat are the only recurring execution paths.

## Deterministic prevention and recovery decision matrix (2026-10-25)
These are instructions to the existing Recovery Supervisor/Repository Janitor, **not claims that new automation is already deployed**.

| Trigger | Preflight proof | Bounded action | Exit proof |
| --- | --- | --- | --- |
| Unsupported merge-queue rule / provider 422 | Repository owner type, current rulesets, required-check names | For a personal-user owned repo, do not retry `merge_queue`; continue the supported protected squash/auto-merge path | Ruleset capability readback; actual protected merge |
| Workflow or skill added/changed | Candidate-tree workflow/skill inventory and generator versions | Ask the existing System Map writer to regenerate from that identical candidate tree, add both generated artifacts and sources to one commit | Recomputed explanation digest and map parity on final candidate SHA |
| Competing edits to AGENTS.md / shared classifier | Current main SHA, writer lease and overlap with active candidate paths | Hold non-owner write; let current owner integrate, or create a successor only after explicit supersession | No lost change; one active writer per obligation and shared file |
| Required-check stuck or renamed | Exact candidate SHA, required context names, mergeability and provider run/job readback | Reconcile missing/renamed context against ruleset; retry eligible transient job only with attempt cap | All required contexts green on final SHA; never infer success from checks on old head |
| Provider queued/zero-job ghost | Exact run ID, nonactive SHA, 24h stability, provider readback per canonical Janitor protocol | Quarantine classification and bounded provider retry; escalate persistent 403/409 | Actual terminal provider evidence, not inferred cleanup |
| Repeated identical incident | Canonical fingerprint, historical attempted action and results | Stop same-action retry after 2 ineffective tries; escalate with concrete missing capability and keep release blocked | Regression reproduced, fixed and rerun with independent readback |

### Two-stage admission and release evidence
1. On every proposed change, record an immutable candidate SHA, current main SHA, obligation ID, lease owner, impacted paths, generator inventory digest, and skill projection. Missing observations are `UNKNOWN`.
2. Run quick advisory preflight for local feedback (syntax, changed-path conflict, generated-file freshness, secret scan). This stage **never substitutes** for any required check.
3. Let one integration owner create the candidate, rerun deterministic generators, and refresh tests after the final source change. Any SHA change invalidates previous check proofs.
4. On the exact integration SHA, require successful Required, BRAIN and CodeQL and applicable preview/security/RLS checks; retain protected merge rules.
5. Read back merged main SHA and actual Netlify production deployment/route evidence where relevant. Distinguish `CANDIDATE_COMMITTED`, `CHECKS_GREEN`, `MERGED`, `DEPLOYED`, `LIVE_PROVEN`; never collapse them into one green claim.

### Continuous learning with cost control
Reuse the already scheduled Janitor and Heartbeat. For each fingerprint store provider evidence, likely root cause, repair attempts, new regression, skill projection, impact on p50/p95 and runner minutes, and whether the incident recurred. Only promote policy after a deterministic regression passes; escalate missing provider capability rather than inventing a successful action. Do not issue new schedules, paid runners, unsecured credentials, outreach or uncontrolled retries.
