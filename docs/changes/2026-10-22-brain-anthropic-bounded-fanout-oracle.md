# BRAIN Anthropic deadline oracle — current bounded per-channel generation

Date: 2026-10-22
Fingerprint: ci|brain|anthropic-content-loop-bounded-fanout-stale-singleton-oracle|20261022-v1
Obligation: ci-brain-anthropic-bounded-fanout-oracle-20261022
Parent P0: #3742; acceptance P0: #4215

## Actual failure and cause
Unified BRAIN verification-only run 39791707071 on PR #4641 reported 3,526 tests, 3,171 successful and 355 failed on that precise candidate. `tests/brain-anthropic-subcall-deadline-p0-4198.test.mjs` failed because it expects obsolete singleton `MAX_CHANNEL_GENERATIONS=1` and bootstrapAttempted symbols, not because that run proved provider generation timeout in production.

## Current invariant
Canonical orchestrator request timeout is 90 seconds under a 110-second supervisor budget. The supervisor caps pending channel rows to four, deduplicates channel identifiers, fans out one request per channel through the existing orchestrator, and declines to invoke a potentially still-running bootstrap again. Failed pending-generation read remains degraded. Preserve content identity, final-copy truth, authorization and publisher evidence.

## Isolated change and validation
Exactly one test source oracle is updated; the unchanged second identity/content test stays in place. Ten exact-source positive assertions were checked before changing the file. Historical replay, shadow and canary each refer to the original entire test file. No code changes to runtime, OAuth, provider, SQL, scheduler, RLS, production, or workflow gates.

## Release gates
Candidate is deliberately draft pending immutable-head Required CI + CodeQL and real historical/shadow/canary evaluator results. A complete combined Unified BRAIN run with zero failures is still required, plus supported clean-room Supabase parity #3742 and authenticated two-customer/tenant readback #4215. No reduction in 355 failures, passing checks, or deployment is asserted before the respective evidence.
