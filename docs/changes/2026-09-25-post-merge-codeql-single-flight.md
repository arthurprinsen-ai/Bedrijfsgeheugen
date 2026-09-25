# Post-merge CodeQL single-flight and terminal delivery

Date: 2026-09-25  
Fingerprint: `delivery|post-merge-codeql|single-flight-terminality|v1`

## Incident

A post-merge CodeQL run could still be active on the relevant SHA after the required borging and skill-projection controls were already green. That left agents able to report a pending security status instead of closing the delivery lineage.

## Root cause

There were two separate conditions:

1. `.github/workflows/codeql.yml` used `github.run_id` as the fallback concurrency identity. On `push`, every run therefore had a unique concurrency group, so `cancel-in-progress: true` could not supersede stale same-ref main runs.
2. `.github/workflows/powerhouse-codeql.yml` already used stable same-ref latest-wins concurrency, but an authoritative exact-SHA run can still legitimately be active. The terminal-delivery contract did not explicitly name this security-run state, which allowed agents to hand it back as a pending status.

## Permanent correction

- Both CodeQL workflows now follow the same stable latest-wins invariant.
- A newer run for the same ref supersedes stale work.
- The newest relevant exact-SHA security run is authoritative.
- A running authoritative security check is internal execution state, not a final user handoff.
- If CodeQL does not apply because path filters exclude the change, the state is explicitly NOT_APPLICABLE.
- Existing protected merge and exact-production readback requirements remain unchanged.

## Regression

`tests/brain-post-merge-codeql-single-flight.test.mjs` fails if Python CodeQL returns to run-id concurrency, if Powerhouse CodeQL loses same-ref latest-wins behavior, or if the durable Powerhouse terminality rules disappear.

## Central lesson ledger

The two active prevention rules are also registered as PROVEN lessons in `docs/brain/delivery-failure-lessons.json`, so prevention-rule completeness remains machine-verifiable. This file is part of the declared PR scope; a fresh head is required so Required test evaluates the corrected metadata snapshot.
