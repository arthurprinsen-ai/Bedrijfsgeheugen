# Delivery latency hardening v1 — 2026-10-06

## Problem
Delivery admission fetched complete Git history and all remote refs before classifying a PR. Repository-writer verification could then occupy a runner for up to six minutes while polling for a generated candidate PR.

## Structural fix
- Powerhouse Delivery Hygiene now uses a shallow candidate checkout.
- Current main identity, merge-base, PR file scope and patch evidence come from GitHub API authority instead of a repository-wide fetch.
- Exact-head, branch hygiene, static security, obligation and writer-lease checks remain fail-closed.
- Repository Writer Operational Verification polls for at most 30 seconds.
- If a writer candidate has not materialized, it emits `WAITING_EXTERNAL:WRITER_PR_NOT_MATERIALIZED` tied to the exact verify SHA and yields for later recovery.

Regression: `tests/delivery-latency-hardening-v1.test.mjs`.
