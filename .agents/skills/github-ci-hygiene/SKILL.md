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
