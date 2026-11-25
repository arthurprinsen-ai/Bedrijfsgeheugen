# PostgreSQL 17 fenced writer lease — bootstrap PR #4966

## Problem
The existing Recovery Supervisor serialized its own scheduled/manual branch reconciliation, but did not run a real PostgreSQL 17 lease/fencing concurrency replay for release candidates. Local Node unit tests did not prove the atomic database behavior.

## Implementation
The existing `.github/workflows/powerhouse-delivery-recovery-supervisor.yml` now has a **read-only** `pull_request` PostgreSQL 17 job checking out the exact PR head. The existing writable `supervise` job is excluded from PR events. No additional scheduler is installed. Backend lease DDL remains an unprivileged, explicit-grants-required candidate; it is not applied to Supabase production here.

The isolated `tests/postgres-lease-replay.sh` checks exclusive acquisition, wrong-owner rejection, renewal, release, increasing fencing generation, stale fencing invalidation and concurrent atomic acquisition by two independent PostgreSQL sessions.

## Test evidence and failures
- [Run 40322072979](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40322072979) exposed Bash syntax error in the race assertion. Fixed on the candidate branch.
- [Run 40322683206](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/actions/runs/40322683206) subsequently completed the PostgreSQL 17 replay with **success** on head `591e5b807ab85181a2d2d57023e4d77c9a4df6ca`.
- The original Required run rejected two newly introduced source paths as unclassified. Both now explicitly map to the backend delivery lane.
- A subsequent Required run identified missing semantic closure artifacts; this PR adds canonical Brain learning, append-only ledger and this human-readable change record instead of bypassing the policy.

## Release acceptance (not yet achieved)
The latest candidate must pass Required, BRAIN, CodeQL and Supabase Preview with verified exact-head contexts. The repository's exclusive writer owner must formally adopt any production integration. Branch protection must remain intact; merge and independent production readback are not claimed in this document. The new PostgreSQL job must not be configured as required until its exact check name, SHA and source application are verified.
