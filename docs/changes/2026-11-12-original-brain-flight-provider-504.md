# 2026-11-12 — Exact PR-era BRAIN provider flight lookup survives GitHub 504

Original issue: https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/4198

## Real failure
Merged PR #5673 terminal closure run #43267333230 returned BRAIN_FLIGHT_PROVIDER_READ_UNVERIFIED after GitHub responded with HTTP 504 while the original workflow enumerated all historical main-branch workflow_dispatch runs. This failure was correctly held open; the protected merge and checks are not terminal consumer acceptance.

## One existing execution path
Use GitHub's immutable original PR `created_at` minus a ten-minute clock-skew margin as the lower bound for the original `unified-brain-delivery.yml` run lookup. Require exact original PR number, head and protected merge SHA and the existing verification_only flow. Search GitHub `created>=cutoff` with complete provider pagination and two guarded reads; refuse incomplete or duplicate pages, mismatched timestamps, 1000-result filtered-search cap and all HTTP failures. No new job, scheduler, credential, publisher, retrying a paid source, or unsupported success.

## Regression and approval
`tests/brain-terminal-canonical-verify-only-dispatch-20261102.test.mjs` covers the exact PR-time gate and 1000 cap, paginated source, duplicate/truncated/inconsistent provider windows and valid existing flight. Only exact-head Required/CodeQL, protected merge and a new real original terminal-closure provider readback may change terminal status. No false-green retroactive status.
