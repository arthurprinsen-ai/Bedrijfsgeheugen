# Main-drift release synchronization: native CAS, single writer
Date: 2026-10-23

## Defect and impact
The existing Powerhouse Delivery Recovery Supervisor attempted `POST /merges` after checking a leased PR head. That endpoint did not enforce an expected candidate head at write time. Strict protected `main` changes can repeatedly invalidate completed CI while independent agent writers work.

## Single-owner repair
- Retain **one** existing five-minute Recovery Supervisor; no extra scheduler, controller or error register.
- Use GitHub's native `PUT /pulls/{number}/update-branch` and `expected_head_sha`, so a changed candidate head fails closed instead of silently accepting an update.
- Revalidate branch/head/main and writer metadata immediately before the staged mutation; refuse intersecting paths and unknown merge base.
- Persist `Writer-Lease-Drift-Refreshes` in the same PR body, capped at two attempts. Retain the existing repository circuit breaker and one recovered PR per supervisor pass.
- Native update acceptance (202) is not completion: verify new HEAD is a descendant of both old HEAD and captured main. Hold `MAIN_SYNC` while asynchronous; reconcile on the same scheduler after proof, or restore lease after 10 minutes without inventing green.
- Do not relax protected Required, CodeQL, provider preview, merge policy, release attestation or portal production verification.

## Acceptance evidence
1. Existing `tests/delivery-powerhouse-supervisor.test.mjs` asserts native expected-head CAS and absence of the old unguarded merge, retry budget and asynchronous reconciliation.
2. Current exact-head Required and CodeQL must pass.
3. Protected merge required; production workflow `main` source readback required.
4. Report attempts per PR, repeated drift, stale CAS rejections, time-to-green and time-to-production. No improvement claim without before/after measurements.

## Provenance
- https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/blob/main/.github/workflows/powerhouse-delivery-recovery-supervisor.yml
- https://docs.github.com/en/rest/pulls/pulls#update-a-pull-request-branch

**Current status:** candidate only; not a verified production deployment.
