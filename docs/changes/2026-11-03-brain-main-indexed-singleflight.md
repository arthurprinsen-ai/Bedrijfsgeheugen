# 2026-11-03 — preserve original BRAIN verification flight

Canonical incident [#5332](https://github.com/arthurprinsen-ai/Bedrijfsgeheugen/issues/5332). Original PR #5329 candidate `b6c2964d85aaaac7f037fd004463ed5d8d5525b5`; first original BRAIN run #41527548036 was in progress. An external read queried `workflow_dispatch?head_sha=<candidate>` although native dispatch on `main` has run SHA of **main**, and missed that first flight. Duplicate run #41527826859 with same PR/head started, and GitHub concurrency cancelled original in-progress run. Not a Janitor code-test failure, not customer data breach.

## Permanent original-owner correction
- The same trusted terminal workflow matches exact PR/head through original main-indexed workflow run title. It performs two provider reads and fails closed on malformed run-list responses before dispatch.
- The original Unified BRAIN workflow's `verification_only=true` concurrency becomes non-cancelling, so a redundant request does not terminate an active first flight. Normal PR source-update cancellation is retained.
- Agents may only observe/trigger through the same original terminal owner and writer lease. No parallel dispatchers, false green or reduced security gates.

## Verification
Source regression + historical replay: `tests/brain-terminal-canonical-verify-only-dispatch-20261102.test.mjs`. Required, CodeQL, full original BRAIN and protected main merge, then independent singleflight native run readback. Status CANDIDATE_NOT_DEPLOYED until proven. This does not resolve provider orphan records #4655, Janitor tag-403 #5333 or drift #5320.
